/**
 * gameserver — 统一 WebSocket 服务端
 *
 * 监听 3001 端口，接收 WebSocket 连接。根据客户端首条消息的 JSON
 * 内容自动路由到对应的 app 动态库（.so）：
 *   - 包含 "app"   字段 → 使用指定 app 名称
 *   - 包含 "text"  字段 → 路由到 chat
 *   - 包含 "game"  字段 → 路由到对应游戏
 *   - 其它            → 路由到 snake
 *
 * 每个连接在独立线程中运行，通过 C ABI（app_create / app_process
 * / app_is_done）与 app 通信。
 */

#include <iostream>
#include <string>
#include <thread>
#include <memory>

#include <boost/asio.hpp>
#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/json.hpp>

#include "app_mod.hpp"

namespace asio  = boost::asio;
namespace beast = boost::beast;
namespace http  = beast::http;
namespace websocket = beast::websocket;
using tcp = asio::ip::tcp;

// ============================================================
//  App 消息循环
//  - 处理首条消息后进入轮询循环
//  - 从 WebSocket 读取客户端消息，交给 app_process 处理
//  - app_process 返回 JSON 数组，逐条发送回客户端
//  - 当 app_is_done() 返回 true 时退出循环，关闭连接
// ============================================================

static void handleApp(websocket::stream<beast::tcp_stream>& ws,
                      const std::string& first_msg,
                      AppModule& mod, void* app)
{
    // 处理首条消息（创建 app 时传入的 config / 命令）
    char* out = mod.app_process(app, first_msg.c_str());
    if (out)
    {
        try {
            // 返回值为 JSON 数组，逐元素分帧发送
            auto arr = boost::json::parse(out).as_array();
            for (auto& item : arr)
                ws.write(asio::buffer(boost::json::serialize(item)));
        } catch (...) {}
        mod.app_free_string(out);
    }

    // 循环处理后续消息（包括聊天轮询、终端输入、游戏操作等）
    beast::flat_buffer buf;
    while (!mod.app_is_done(app))
    {
        buf.clear();
        ws.read(buf);
        std::string msg = beast::buffers_to_string(buf.data());

        out = mod.app_process(app, msg.c_str());
        if (out)
        {
            try {
                auto arr = boost::json::parse(out).as_array();
                for (auto& item : arr)
                    ws.write(asio::buffer(boost::json::serialize(item)));
            } catch (...) {}
            mod.app_free_string(out);
        }
    }
}

// ============================================================
//  客户端连接处理（路由 + 生命周期）
//  1. HTTP Upgrade → WebSocket
//  2. 读取首条 JSON 消息，路由到对应 app
//  3. 加载 .so → 创建 app 实例 → 进入消息循环
// ============================================================

static void handleClient(tcp::socket socket)
{
    try
    {
        // --- HTTP Upgrade 到 WebSocket ---
        beast::tcp_stream stream(std::move(socket));
        beast::flat_buffer buf;
        http::request<http::string_body> req;
        http::read(stream, buf, req);

        websocket::stream<beast::tcp_stream> ws(std::move(stream));
        ws.accept(req);

        // --- 读取首条消息，用于路由 ---
        buf.clear();
        ws.read(buf);
        std::string first_msg = beast::buffers_to_string(buf.data());

        // --- 根据 JSON 字段选择 app ---
        std::string app_name;
        try {
            auto val = boost::json::parse(first_msg);
            if (!val.is_object()) { ws.write(asio::buffer("[]")); return; }
            auto& obj = val.as_object();

            auto it = obj.find("app");
            if (it != obj.end() && it->value().is_string()) {
                // {"app":"terminal"} → 显式指定
                app_name = std::string(it->value().as_string());
            } else if ((it = obj.find("text")) != obj.end() && it->value().is_string()) {
                // {"text":"你好"} → 聊天
                app_name = "chat";
            } else if ((it = obj.find("game")) != obj.end() && it->value().is_string()) {
                // {"game":"snake"} → 游戏
                app_name = std::string(it->value().as_string());
            } else {
                // 默认 snake
                app_name = "snake";
            }
        } catch (...) {
            ws.write(asio::buffer("[]"));
            return;
        }

        // --- 加载 app 动态库（带缓存，只加载一次） ---
        static AppModuleCache cache;
        AppModule mod = cache.load(app_name);
        if (!mod)
        {
            boost::json::object err;
            err["type"] = "error";
            err["msg"]  = "failed to load " + app_name;
            ws.write(asio::buffer(boost::json::serialize(err)));
            return;
        }

        // --- 创建 app 实例，传入首条消息作为配置 ---
        AppPtr app = mod.create(first_msg);
        if (!app)
        {
            boost::json::object err;
            err["type"] = "error";
            err["msg"]  = "failed to create " + app_name + " instance";
            ws.write(asio::buffer(boost::json::serialize(err)));
            return;
        }

        // --- 进入消息循环 ---
        handleApp(ws, first_msg, mod, app.get());
    }
    catch (const boost::system::system_error&)
    {
        // 连接异常断开（客户端关闭、网络中断等），静默处理
    }
}

// ============================================================
//  主函数 — 监听端口，每个连接启新线程
// ============================================================

int main()
{
    try
    {
        asio::io_context io;
        tcp::acceptor acceptor(io, tcp::endpoint(tcp::v4(), 3001));
        std::cout << "Game server listening on port 3001" << std::endl;

        while (true)
        {
            tcp::socket socket(io);
            acceptor.accept(socket);
            // 每个客户端连接在新线程中运行，立即 detach 不等待结束
            std::thread(handleClient, std::move(socket)).detach();
        }
    }
    catch (const std::exception& e)
    {
        std::cerr << e.what() << std::endl;
        return 1;
    }
}

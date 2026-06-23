# chat/frontend/ —— 聊天前端页面

## 文件说明

| 文件 | 说明 |
|------|------|
| `ChatPage.vue` | 聊天室页面，气泡式对话界面，支持发送和接收消息 |
| `config.js` | 应用配置：名称、样式、布局元信息（标记为 `chat: true`） |

## 实现

通过 WebSocket 连接后端聊天服务器（`/chat` 路径）。使用 `marked` 库渲染 Markdown 消息内容。输入框回车发送，消息实时显示。

## 相关链接

- [后端 README](../backend/README.md) — C++ 聊天模块说明

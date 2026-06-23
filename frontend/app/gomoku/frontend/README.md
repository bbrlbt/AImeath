# gomoku/frontend/ —— 五子棋前端页面

## 文件说明

| 文件 | 说明 |
|------|------|
| `GamePage.vue` | 五子棋游戏页面，渲染棋盘，响应点击落子 |
| `config.js` | 应用配置：名称、样式、布局元信息 |

## 实现

使用 `useGame('gomoku')` 组合式函数（`frontend/src/composables/useGame.js`）管理 WebSocket 连接和游戏状态。点击棋盘交叉点落子，五子连珠获胜。

## 相关链接

- [后端 README](../backend/README.md) — C++ 游戏模块说明

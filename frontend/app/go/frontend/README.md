# go/frontend/ —— 围棋前端页面

## 文件说明

| 文件 | 说明 |
|------|------|
| `GamePage.vue` | 围棋游戏页面，渲染 19×19 棋盘，支持落子、提子、虚着、认输 |
| `config.js` | 应用配置：名称、样式、布局元信息 |

## 实现

使用 `useGame('go')` 组合式函数（`frontend/src/composables/useGame.js`）管理 WebSocket 连接和游戏状态。点击棋盘交叉点落子，支持 Pass/Resign 按钮。

## 相关链接

- [后端 README](../backend/README.md) — C++ 游戏模块说明

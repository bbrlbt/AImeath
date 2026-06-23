# pacman/frontend/ —— 吃豆豆前端页面

## 文件说明

| 文件 | 说明 |
|------|------|
| `GamePage.vue` | 吃豆豆游戏页面，渲染网格、豆子、玩家，响应键盘方向键 |
| `config.js` | 应用配置：名称、样式、布局元信息 |

## 实现

使用 `useGame('pacman')` 组合式函数（`frontend/src/composables/useGame.js`）管理 WebSocket 连接和游戏状态。方向键控制移动，吃掉所有豆子获胜。

## 相关链接

- [后端 README](../backend/README.md) — C++ 游戏模块说明

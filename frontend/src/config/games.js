import SnakePage from '@apps/snake/frontend/GamePage.vue'
import PacmanPage from '@apps/pacman/frontend/GamePage.vue'
import GomokuPage from '@apps/gomoku/frontend/GamePage.vue'
import GoPage from '@apps/go/frontend/GamePage.vue'
import ChatPage from '@apps/chat/frontend/ChatPage.vue'

import { info as snakeInfo, styles as snakeStyles, meta as snakeMeta } from '@apps/snake/frontend/config.js'
import { info as pacmanInfo, styles as pacmanStyles, meta as pacmanMeta } from '@apps/pacman/frontend/config.js'
import { info as gomokuInfo, styles as gomokuStyles, meta as gomokuMeta } from '@apps/gomoku/frontend/config.js'
import { info as goInfo, styles as goStyles, meta as goMeta } from '@apps/go/frontend/config.js'
import { info as chatInfo, styles as chatStyles, meta as chatMeta } from '@apps/chat/frontend/config.js'

export const APPS = {
  snake:   { info: snakeInfo, styles: snakeStyles, meta: snakeMeta, page: SnakePage },
  pacman:  { info: pacmanInfo, styles: pacmanStyles, meta: pacmanMeta, page: PacmanPage },
  gomoku:  { info: gomokuInfo, styles: gomokuStyles, meta: gomokuMeta, page: GomokuPage },
  go:      { info: goInfo, styles: goStyles, meta: goMeta, page: GoPage },
  chat:    { info: chatInfo, styles: chatStyles, meta: chatMeta, page: ChatPage },
}

export const INFO = Object.fromEntries(
  Object.entries(APPS).map(([k, v]) => [k, v.info])
)

export const STYLES = Object.fromEntries(
  Object.entries(APPS).map(([k, v]) => [k, v.styles])
)

export const META = Object.fromEntries(
  Object.entries(APPS).map(([k, v]) => [k, v.meta])
)

export const GO_ACTIONS = {
  PASS: -1, RESIGN: -2, CLEAR_DEAD: -3, CONFIRM_DEAD: -4,
}

export const KEY_MAP = {
  ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3,
  w: 0, W: 0, s: 1, S: 1, a: 2, A: 2, d: 3, D: 3,
  Up: 0, Down: 1, Left: 2, Right: 3,
}

export const STATE_FIELDS = ['grid', 'w', 'h', 'score', 'over', 'winner', 'turn', 'passes', 'capsB', 'capsW', 'komi', 'marking', 'deadMask']

export const FIELD_MAP = { over: 'gameOver' }

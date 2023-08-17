import { install } from 'esinstall'

await install([
  '@boardgame.io/p2p',
  'boardgame.io'
], { polyfillNode: true })

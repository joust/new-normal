import { Client } from 'boardgame.io/client'
import { P2P } from '@boardgame.io/p2p'
import { Uno } from './uno'      

export async function startGame(lang, isHost, playerID, matchID) {
  await Uno.init(lang)
  const client = Client({ game: Uno, matchID, playerID, multiplayer: P2P({ isHost }) })
}

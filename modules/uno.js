import { prompt } from '../components/message-box.js' 
import { element, elements } from './common.js'
import { language, territory, locales, loadSources, loadContent, extractContent, getMessage } from './content.js'
import { startLocal, startClient, getAlternatives, canBePlayedOn, isIdiot, allowedToPlay, allPossibleMoves, isArgument, isWildcard, isFallacy } from './uno-bg.js'
       
function setupTable() {
  if (!element('game'))
    element('uno').insertAdjacentHTML('afterBegin', `
      <div id="game">
        <div id="players">
        </div>
        <centered-cards id="piles" onclick="toggleZoomPiles()">
          <card-pile id="draw-pile" top="I" draggable></card-pile>
          <card-pile id="pile" droppable></card-pile>
        </centered-cards>
      </div>`)
}

window.toggleZoomPiles = function() {
  element('game').classList.toggle('zoomed')
}

function cleanupTable() {
  element('stop').classList.add('hidden')
  element('uno').classList.add('hidden')
  element('pyro').classList.add('hidden')
  if (element('game')) element('uno').removeChild(element('game'))
  if (element('hand')) element('uno').removeChild(element('hand'))
  show('start')
}

let setNameRequestSent = false
async function sendSetNameRequest(client, playerID) {
  setNameRequestSent = true
  const message = getMessage('player.name.prompt').replace('PLAYERID', playerID)
  const name = await prompt(message, '')
  client.sendChatMessage({ message: 'setName', name })
}

function addOpponentHand(nr, name) {
  element('players').insertAdjacentHTML('beforeEnd', `<opponent-hand cards="8" nr="${nr}" ${name ? `name="${name}"` : ''}></opponent-hand>`)
}

function cardsString(hand, decks, content, top, current, idiot) {
  // JSON array of id+alternative elements in format { id: '...', alt: ['...', '...'], playable }
  return JSON.stringify(hand.map(card => (
    { card,
      alt: getAlternatives(card, decks, content),
      playable: current && canBePlayedOn(top, card, idiot)
    })))
}

function updateTable(client, state) { // TODO move to uno/game-table.js component
  const top = state.G.pile[state.G.pile.length-1]
  element('draw-pile').setAttribute('top', '')
  element('pile').setAttribute('top', top)
  const opponentIds = [...Array(state.ctx.numPlayers).keys()].map(String).filter(id => id!==client.playerID)
  const name = state.G.names[client.playerID]
  const hand = state.G.hands[client.playerID]
  const idiot = !!(client.playerID%2)
  const deck = idiot ? state.G.decks.idiot : state.G.decks.sheep
  const current = client.playerID===state.ctx.currentPlayer
  element('draw-pile').setAttribute('top', idiot ? 'I' : 'S')
  element('hand').setAttribute('cards', cardsString(hand, state.G.decks, client.game.content, top, current, idiot))
  element('hand').setAttribute('nr', client.playerID)
  element('hand').setAttribute('name', state.G.names[client.playerID])
  element('hand').classList.toggle('current', state.ctx.currentPlayer===client.playerID)
  if (name) element('hand').setAttribute('name', name)
  Array.from(element('players').children).forEach((hand, index) => {
    hand.setAttribute('nr', opponentIds[index])
    hand.classList.toggle('current', state.ctx.currentPlayer===opponentIds[index])
    if (state.G.names[opponentIds[index]]) 
      hand.setAttribute('name', state.G.names[opponentIds[index]])
    hand.setAttribute('cards', state.G.hands[opponentIds[index]].length)
  })
  element('pyro').classList.toggle('hidden', !(state.ctx.gameover && state.ctx.gameover.winner))
}

function makeBotMove(client, state) {
  const strategicallyChooseMove = (hand, possibleMoves) => {
    const wildcard = possibleMoves.findIndex(move => move.move==='playCard' && isWildcard(hand[move.args[0]]))
    if (wildcard>=0) return wildcard
    const argument = possibleMoves.findIndex(move => move.move==='playCard' && isArgument(hand[move.args[0]]))
    if (argument>=0) return argument
    const fallacy = possibleMoves.findIndex(move => move.move==='playCard' && isFallacy(hand[move.args[0]]))
    if (fallacy>=0) return fallacy 
    return Math.floor(Math.random()*possibleMoves.length) // random index
  }
  const botID = client.playerID
  const top = state.G.pile.length ? state.G.pile[state.G.pile.length-1] : undefined
  const idiot = isIdiot(botID)
  if (botID == state.ctx.currentPlayer && allowedToPlay(top, idiot)) {
    const hand = state.G.hands[botID]
    const possibleMoves = allPossibleMoves(hand, idiot, top)
    const index = strategicallyChooseMove(hand, possibleMoves)
    const move = possibleMoves[index]
    setTimeout(() => client.moves[move.move](...move.args), 500)
  }
}

function activateDrag(client) {
  element('hand').addEventListener('dropped', event => event.detail.draw && client.moves.drawCard())
  element('pile').addEventListener('dropped', event => event.detail.card && client.moves.playCard(event.detail.index, event.detail.card))
}

window.unoWithBots = async function(bots) {
  const numPlayers = 1+bots
  const idiot = element('idiot').checked
  const playerID = idiot ? '1' : '0'
  const botPlayerIds = [...Array(numPlayers).keys()].map(String).filter(id => id!==playerID)
  await loadSources()
  await loadContent()
  setupTable()
  element('uno').insertAdjacentHTML('beforeEnd', `<player-hand id="hand" nr="${playerID}" cards="[]" name="Me" droppable></player-hand>`)
  showUno()
  element('players').classList.add(`p${numPlayers}`)
  const content = extractContent()
  // extractUnassigned()
  const locale = `${language}-${territory}`
  const clients = await startLocal(locale, content, numPlayers, playerID)
  botPlayerIds.forEach(botID => addOpponentHand(botID, `CPU${botID}`))
  botPlayerIds.forEach(botID => clients[playerID].moves.setName(botID, `CPU${botID}`))
  clients[playerID].moves.setName(playerID, 'Me')
  activateDrag(clients[playerID])
  clients[playerID].subscribe(state => updateTable(clients[playerID], state))
  botPlayerIds.forEach(botID => clients[botID].subscribe(state => makeBotMove(clients[botID], state)))

  element('stop').onclick = () => {
    clients.forEach(client => client.stop())
    cleanupTable()
  }
}

window.uno = async function(isHost, numPlayers) {
  const idiot = element('idiot').checked
  const hostPlayerID = idiot ? '1' : '0'
  const playerID = isHost ? hostPlayerID : undefined
  const matchID = element('matchID').value
  await loadSources()
  await loadContent()
  setupTable()
  showUno()
  element('players').classList.add(`p${numPlayers}`)
  const content = extractContent()
  const locale = `${language}-${territory}`
  const client = await startClient(locale, content, isHost, numPlayers, playerID, matchID)
  if (isHost) {
    element('uno').insertAdjacentHTML('beforeEnd', '<player-hand id="hand" nr="0" cards="[]" droppable></player-hand>')
    const message = getMessage('host-player.name.prompt').replace('PLAYERID', playerID)
    const name = await prompt(message, '')
    client.moves.setName(playerID, name)
    activateDrag(client)
    const opponentPlayerIds = [...Array(numPlayers).keys()].map(String).filter(id => id!==playerID)
    opponentPlayerIds.forEach(id => addOpponentHand(id, '?'))
  }

  const setNameRequest = msg => msg.payload.message==='setName'
  let unsubscribe
  const stateHandler = async state => {
    if (state) {
      if (client.playerID) {
        if (!isHost && !setNameRequestSent && state.ctx.currentPlayer===hostPlayerID) { // first call after guest select
          await sendSetNameRequest(client, client.playerID)
        }
        updateTable(client, state)
        if (isHost && state.ctx.currentPlayer===hostPlayerID) {
          client.chatMessages.filter(setNameRequest).forEach(msg => {
            if (state.G.names[msg.sender]!=msg.payload.name) {
              client.moves.setName(msg.sender, msg.payload.name)
            }
          }
          )
        }
      } else {
        const hostPlayerID = state.G.host
        const hostPlayerName = state.G.names[state.G.host]
        const takeSeat = (client, playerID) => { 
          elements('opponent-hand').forEach(child => child.classList.remove('selectable'))
          client.updatePlayerID(playerID)
          updateTable(client, state)              
          activateDrag(client)
        }

        if (!element('players').children.length) { // first call in a guest (no playerID set)
          element('players').classList.add(`p${state.ctx.numPlayers}`)
          await takeoverHostLocale(state.G.locale)
          
          element('uno').insertAdjacentHTML('beforeEnd', `<player-hand id="hand"></player-hand>`)
          if (state.ctx.numPlayers===2) {
            addOpponentHand(hostPlayerID, state.G.names[hostPlayerID])
            takeSeat(client, hostPlayerID==='0' ? '1' : '0')
          } else {
            const selectablePlayerIds = state.ctx.playOrder.filter(id => id!==hostPlayerID)
            selectablePlayerIds.forEach(id => addOpponentHand(id, state.G.names[id]))
            elements('opponent-hand').forEach(child => child.classList.add('selectable'))
            elements('opponent-hand').forEach((child, index) => child.onclick = async event => takeSeat(client, selectablePlayerIds[index]))
          }
        }
      }
    }
  }

  unsubscribe = client.subscribe(stateHandler)
  element('stop').onclick = () => {
    client.stop()
    cleanupTable()
  }
}

/**
 * takeover host locale
 *
 * @param {string} locale optional locale string like 'de-de'.
 */
async function takeoverHostLocale(locale) {
  const [language] = locale.split('-')
  document.body.lang = locales.includes(locale) ? locale : language
  await loadSources()
  await loadContent()
}

function extractUnassigned() {
  // TODO: unassigned args => Move to maintenance section in future
  const getTitle = id => document.querySelector(`#content a[id=${id}] h2`).innerHTML
  const toHTML = id => `<a id="${id.substring(1)}"><!--${getTitle(id.substring(1))}--></a>`
  console.log(content.idiot.args.filter(id => id.startsWith(':')).map(toHTML).join('\n'))
  console.log(content.sheep.args.filter(id => id.startsWith(':')).map(toHTML).join('\n'))
}

/**
 * show game cards in a hand, corresponding to the id(s) given in the hash
 *
 * @param {string} hash with comma separated ids of argument(s) to show
 * @return {boolean} true if success false otherwise
 */
export async function displayHashAsHand(cards) {
  await loadContent()
  await loadSources()
  const cardsString = JSON.stringify(cards.map(card => ({ card, playable: false })))
  element('uno').insertAdjacentHTML('beforeEnd', 
                                    `<player-hand id="hand" nr="0" cards="[]"></player-hand>`)
  element('hand').setAttribute('cards', cardsString)
  element('stop').onclick = () => cleanupTable()
  showUno()
  return true
}

function showUno() {
  element('stop').classList.toggle('hidden', false)
  setTimeout(() => element('uno').classList.toggle('hidden', false), 50)
}

function hideUno() {
  element('stop').classList.toggle('hidden', true)
  element('uno').classList.toggle('hidden', true)
  showPage('start')
}
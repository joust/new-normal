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

function toggleZoomPiles() {
  element('game').classList.toggle('zoomed')
}

function cleanupTable() {
  element('stop').classList.add('hidden')
  element('uno').classList.add('hidden')
  element('pyro').classList.add('hidden')
  element('uno').removeChild(element('game'))
  element('uno').removeChild(element('hand'))
  show('start')
}

let setNameRequestSent = false
async function sendSetNameRequest(client, playerID) {
  setNameRequestSent = true
  const name = await prompt(`Name for Player ${playerID}?`, '')
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
  const opponentIds = [...Array(state.ctx.numPlayers).keys()].filter(id => id!=client.playerID) // number!=string
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

function makeBotMove(client, botID, state) {
  const strategicallyChooseMove = (hand, possibleMoves) => {
    const wildcard = possibleMoves.findIndex(move => move.move==='playCard' && isWildcard(hand[move.args[0]]))
    if (wildcard>=0) return wildcard
    const argument = possibleMoves.findIndex(move => move.move==='playCard' && isArgument(hand[move.args[0]]))
    if (argument>=0) return argument
    const fallacy = possibleMoves.findIndex(move => move.move==='playCard' && isFallacy(hand[move.args[0]]))
    if (fallacy>=0) return fallacy 
    return Math.floor(Math.random()*possibleMoves.length) // random index
  }
  if (state.ctx.currentPlayer===botID) {
    const idiot = isIdiot(botID)
    const hand = state.G.hands[botID]
    const top = state.G.pile.length ? state.G.pile[state.G.pile.length-1] : undefined
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

async function unoWithBot() {
  const idiot = element('idiot').checked
  const playerID = idiot ? '1' : '0'
  const botID = idiot ? '0' : '1'
  await loadSources()
  await loadContent(lang, terr)
  setupTable()
  element('uno').insertAdjacentHTML('beforeEnd', `<player-hand id="hand" nr="${playerID}" cards="[]" droppable></player-hand>`)
  element('stop').classList.toggle('hidden', false)
  element('uno').classList.toggle('hidden', false)
  const content = extractContent(lang, terr)
  /* TODO: unassigned args => Move to maintenance section in future
  const getTitle = id => document.querySelector(`#content a[id=${id}] h2`).innerHTML
  const toHTML = id => `<a id="${id.substring(1)}"><!--${getTitle(id.substring(1))}--></a>`
  console.log(content.idiot.args.filter(id => id.startsWith(':')).map(toHTML).join('\n'))
  console.log(content.sheep.args.filter(id => id.startsWith(':')).map(toHTML).join('\n'))*/
  const locale = `${lang}-${terr}`
  const clients = await startLocal(locale, content, playerID)
  addOpponentHand(botID, 'CPU')
  clients[playerID].moves.setName(playerID, 'Me')
  clients[playerID].moves.setName(botID, 'CPU')
  activateDrag(clients[playerID])
  clients[playerID].subscribe(state => updateTable(clients[playerID], state))
  clients[botID].subscribe(state => makeBotMove(clients[botID], botID, state))

  element('stop').onclick = () => {
    clients[0].stop()
    clients[1].stop()
    cleanupTable()
  }
}

async function uno(isHost, numPlayers) {
  const idiot = element('idiot').checked
  const hostPlayerID = idiot ? '1' : '0'
  const playerID = isHost ? hostPlayerID : undefined
  const matchID = element('matchID').value
  await loadSources()
  await loadContent(lang, terr)
  setupTable()
  element('stop').classList.toggle('hidden', false)
  element('uno').classList.toggle('hidden', false)
  element('players').classList.add(`p${numPlayers}`)
  const content = extractContent(lang, terr)
  const locale = `${lang}-${terr}`
  const client = await startClient(locale, content, isHost, numPlayers, playerID, matchID)
  if (isHost) {
    element('uno').insertAdjacentHTML('beforeEnd', '<player-hand id="hand" nr="0" cards="[]" droppable></player-hand>')
    client.moves.setName(playerID, await prompt(`Name for Host Player?`, ''))
    activateDrag(client)
    const opponentPlayerIds = [...Array(numPlayers).keys()].filter(id => id!=playerID)
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
          activateDrag(cient)
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
  [lang, terr] = locale.split('-')
  document.body.lang = locales.includes(locale) ? locale : lang
  await loadSources()
  await loadContent(lang, terr)
}

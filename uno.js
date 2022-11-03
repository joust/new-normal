function element(id) {
  return document.getElementById(id)
}
function elements(tag) {
  return Array.from(document.getElementsByTagName(tag))
}

function randomMatchId() {
  element('matchID').value = Math.floor(1000+Math.random()*9000)
}

async function load(locale) {
  FastClick.attach(document.body)
  if (locale) [lang, terr] = locale.split('-'); else [lang, terr] = browserLocale()
  if (!supported.includes(lang)) [lang, terr] = ['en', 'us']
  document.querySelector('#location').value = `${lang}-${terr}`
  document.body.lang = lang
  await loadSources()
  await loadContent(lang)
  element('instructions').innerHTML = await fetchSilent(`${lang}/uno.html`)
  if (!element('game'))
    element('uno').insertAdjacentHTML('afterBegin', `
      <div id="game">
        <div id="players">
        </div>
        <div id="piles">
          <card-pile id="draw-pile" top="I"></card-pile>
          <card-pile id="pile"></card-pile>
        </div>
      </div>`)
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
}

function makeBotMove(client, botID, state) {
  if (state.ctx.currentPlayer===botID) {
    const idiot = isIdiot(botID)
    const hand = state.G.hands[botID]
    const top = state.G.pile.length ? state.G.pile[state.G.pile.length-1] : undefined
    const possibleMoves = allPossibleMoves(hand, idiot, top)
    const randomMoveIndex = Math.floor(Math.random()*possibleMoves.length)
    const move = possibleMoves[randomMoveIndex]
    setTimeout(() => client.moves[move.move](...move.args), 500)
  }
}

async function playWithBot(idiot) {
  const lang = document.body.lang
  const playerID = idiot ? '1' : '0'
  const botID = idiot ? '0' : '1'
  element('uno').classList.toggle('hidden', false)
  element('config').classList.toggle('hidden', true)
  const clients = await startLocal(lang, playerID)
  await loadSources()
  await loadContent(lang)
  element('uno').insertAdjacentHTML('beforeEnd', `<player-hand id="hand" nr="${playerID}" cards="[]"></player-hand>`)
  addOpponentHand(botID, 'CPU')
  clients[playerID].moves.setName(playerID, 'Me')
  clients[playerID].moves.setName(botID, 'CPU')
  element('draw-pile').onclick = event => clients[playerID].moves.drawCard()
  element('hand').onplay = event => clients[playerID].moves.playCard(event.detail.index, event.detail.card)
  clients[playerID].subscribe(state => updateTable(clients[playerID], state))
  clients[botID].subscribe(state => makeBotMove(clients[botID], botID, state))
}

async function play(isHost, numPlayers) {
  const lang = document.body.lang
  const idiot = element('idiot').checked
  const hostPlayerID = idiot ? '1' : '0'
  const playerID = isHost ? hostPlayerID : undefined
  const matchID = element('matchID').value
  element('uno').classList.toggle('hidden', false)
  element('config').classList.toggle('hidden', true)
  element('players').classList.add(`p${numPlayers}`)
  let client = await startClient(lang, isHost, numPlayers, playerID, matchID)
  if (isHost) {
    element('uno').insertAdjacentHTML('beforeEnd', '<player-hand id="hand" nr="0" cards="[]"></player-hand>')
    client.moves.setName(playerID, await prompt(`Name for Host Player?`, ''))
    element('draw-pile').onclick = event => client.moves.drawCard()
    element('hand').onplay = event => client.moves.playCard(event.detail.index, event.detail.card)
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
          element('draw-pile').onclick = event => client.moves.drawCard()
          element('hand').onplay = event => client.moves.playCard(event.detail.index, event.detail.card)
        }

        if (!element('players').children.length) { // first call in a guest (no playerID set)
          element('players').classList.add(`p${state.ctx.numPlayers}`)
          await load(document.body.lang = state.G.lang)
          element('uno').insertAdjacentHTML('beforeEnd', `<player-hand id="hand"></opponent-hand>`)
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
}

function flagcheck() {
  if (navigator.userAgent.indexOf('Windows') > 0)
    document.head.innerHTML += '<link rel="stylesheet" href="noto.css">'
}

async function loadSources() {
  const loaded = document.querySelector('#content > .sources')
  if (!loaded) {
    const sources = elementWithKids('div', null, { 'class': 'sources' })
    document.querySelector('#content').appendChild(sources)
    sources.innerHTML = await fetchSilent(`sources.html`)
    Array.from(sources.querySelectorAll('a')).forEach(link => link.target = '_blank')
  }
}

async function loadContent(lang) {
  const loaded = document.querySelector(`#content > #${lang}`)
  if (!loaded) {
    const root = elementWithKids('div', [
      elementWithKids('div', null, { 'class': 'idiot' }),
      elementWithKids('div', null, { 'class': 'sheep' }),
      elementWithKids('div', null, { 'class': 'labels' }),
      elementWithKids('div', null, { 'class': 'appeal-tos' }),
      elementWithKids('div', null, { 'class': 'fallacies' }),
      elementWithKids('div', null, { 'class': 'topics' })
    ], { id: lang })
    document.querySelector('#content').appendChild(root)
    const [idiot, sheep, labels, appealTos, fallacies, topics, sources] = await Promise.all([
      fetchSilent(`${lang}/idiot.html`),
      fetchSilent(`${lang}/sheep.html`),
      fetchSilent(`${lang}/labels.html`),
      fetchSilent(`${lang}/appeal-tos.html`),
      fetchSilent(`${lang}/fallacies.html`),
      fetchSilent(`${lang}/topics.html`)
    ])
    root.querySelector('.idiot').innerHTML =  replaceStatement(lang, idiot)
    root.querySelector('.sheep').innerHTML = replaceStatement(lang, sheep)
    root.querySelector('.labels').innerHTML = labels
    root.querySelector('.appeal-tos').innerHTML = appealTos
    root.querySelector('.fallacies').innerHTML = fallacies
    root.querySelector('.topics').innerHTML = topics
    return root
  }
  return loaded
}

function replaceStatement(lang, content) {
  const from1 = {
    de: 'Die sagen<i> doch allen Ernstes</i>',
    en: 'They say<i> in all seriousness</i>',
    fr: 'Ils disent<i> en toute sincérité</i>',
    es: 'Dicen<i> con toda seriedad</i>',
    it: 'Dicono<i> in tutta serietà</i>',
    da: 'De siger<i> med al alvor</i>',
    pl: 'Twierdzą<i> z całą powagą</i>',
    pt: 'Dizem<i> com toda a seriedade</i>',
    'pt-br': 'Dizem<i> com toda a seriedade</i>'
  }
  const to1 = {
    de: 'Ich bin bei denen, die sagen',
    en: 'I am with those who say',
    fr: 'Je suis avec ceux qui disent',
    es: 'Estoy con quienes dicen',
    it: 'Sono d\'accordo con chi dice',
    da: 'Jeg er enig med dem, der siger',
    pl: 'Jestem z tymi, którzy twierdzą',
    pt: 'Estou com aqueles que dizem',
    'pt-br': 'Estou com aqueles que dizem'
  }
  const from2 = {
    de: 'Die fragen<i> doch allen Ernstes</i>',
    en: 'They ask<i> in all seriousness</i>',
    fr: 'Ils demandent<i> en toute sincérité</i>',
    es: 'Preguntan<i> con toda seriedad</i>',
    it: 'Chiedono<i> in tutta serietà</i>',
    da: 'De spørger<i> med al alvor</i>',
    pl: 'Pytają<i> z całą powagą</i>',
    pt: 'Pergunta<i> com toda a seriedade</i>',
    'pt-br': 'Pergunta<i> com toda a seriedade</i>'

  }
  const to2 = {
    de: 'Ich bin bei denen, die fragen',
    en: 'I am with those who ask',
    fr: 'Je suis avec ceux qui demandent',
    es: 'Estoy con quienes preguntan',
    it: 'Sono d\'accordo con chi chiedono',
    da: 'Jeg er enig med dem, der spørger',
    pl: 'Jestem z tymi, którzy pytają',
    pt: 'Estou com aqueles que perguntam',
    'pt-br': 'Estou com aqueles que perguntam'
  }
  return content.replaceAll(from1[lang], to1[lang]).replaceAll(from2[lang], to2[lang])
}

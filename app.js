const { Client } = require('boardgame.io/client')
const { Local } = require('boardgame.io/multiplayer')
const { P2P } = require('@boardgame.io/p2p')

async function startLocal(lang, playerID) {
  const game = await Uno(lang, playerID)
  const player = Client({ game, numPlayers: 2, playerID, multiplayer: Local() })
  const bot = Client({ game, numPlayers: 2, playerID: playerID==='0' ? '1' : '0', multiplayer: Local() })
  player.start()
  bot.start()
  return playerID==='0' ? [player, bot] : [bot, player]
}

async function startClient(lang, isHost, numPlayers, playerID, matchID) {
  const game = await Uno(lang, isHost ? playerID : undefined)
  const client = Client({
    game,
    numPlayers,
    matchID,
    playerID,
    multiplayer: P2P({
      isHost,
      onError: e => { console.log('P2P error', e) }
    })
  })
  client.start()
  return client
}


function flagcheck() {
  if (navigator.userAgent.indexOf('Windows') > 0)
    document.head.innerHTML += '<link rel="stylesheet" href="noto.css">'
}

function uno(locale) {
  if (locale) [lang, terr] = locale.split('-'); else [lang, terr] = browserLocale()
  if (!supported.includes(lang)) [lang, terr] = ['en', 'us']
  document.body.lang = document.querySelector('#location').value = `${lang}-${terr}`
}

function fixAnchors(html) {
  return html.replaceAll('</h2></a>', '</h2>').replaceAll('</p>', '</p></a>')
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
    const [idiot, sheep, labels, appealTos, fallacies, topics] = await Promise.all([
      fetchSilent(`${lang}/idiot.html`),
      fetchSilent(`${lang}/sheep.html`),
      fetchSilent(`${lang}/labels.html`),
      fetchSilent(`${lang}/appeal-tos.html`),
      fetchSilent(`${lang}/fallacies.html`),
      fetchSilent(`${lang}/topics.html`)
    ])
    root.querySelector('.idiot').innerHTML =  fixAnchors(idiot)
    root.querySelector('.sheep').innerHTML = fixAnchors(sheep)
    root.querySelector('.labels').innerHTML = labels
    root.querySelector('.appeal-tos').innerHTML = appealTos
    root.querySelector('.fallacies').innerHTML = fallacies
    root.querySelector('.topics').innerHTML = topics
  }
}

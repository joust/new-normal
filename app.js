const { Client } = require('boardgame.io/client')
const { Local } = require('boardgame.io/multiplayer')
const { P2P } = require('@boardgame.io/p2p')

async function startLocalClient(lang, playerID) {
  await Uno.init(lang)
  const client = Client({
    game: Uno,
    numPlayers: 2,
    playerID,
    multiplayer: Local(),
  })
  client.start()
  return client
}

async function startClient(lang, isHost, numPlayers, playerID, matchID) {
  await Uno.init(lang)
  const client = Client({
    game: Uno,
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
    root.querySelector('.idiot').innerHTML =  fixAnchors(await fetchSilent(`${lang}/idiot.html`))
    root.querySelector('.sheep').innerHTML = fixAnchors(await fetchSilent(`${lang}/sheep.html`))
    root.querySelector('.labels').innerHTML = await fetchSilent(`${lang}/labels.html`)
    root.querySelector('.appeal-tos').innerHTML = await fetchSilent(`${lang}/appeal-tos.html`)
    root.querySelector('.fallacies').innerHTML = await fetchSilent(`${lang}/fallacies.html`)
    root.querySelector('.topics').innerHTML = await fetchSilent(`${lang}/topics.html`)
  }
}

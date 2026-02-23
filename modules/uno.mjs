import { element, randomElement } from './common.mjs'
import {
  language,
  territory,
  setTheme,
  loadSources,
  loadContent,
  extractContent,
  getLabels
} from './content.mjs'

window.unoWithBots = async function (bots) {
  const idiot = element('idiot').checked
  const playerID = idiot ? '1' : '0'
  await loadSources()
  await loadContent()
  const content = extractContent()
  const locale = `${language}-${territory}`
  const labels = [false, true].map(idiot => getLabels(idiot).map(label => label.innerHTML))

  const game = element('uno')
  await game.startWithBots(bots, { playerID, content, locale, labels, randomElement })
  showUno()

  element('stop').onclick = () => {
    game.stop()
    cleanupUno()
  }
  element('theme').onchange = setTheme
}

window.uno = async function (isHost, numPlayers) {
  const idiot = element('idiot').checked
  const playerID = isHost ? (idiot ? '1' : '0') : undefined
  const matchID = element('matchID').value
  await loadSources()
  await loadContent()
  const content = extractContent()
  const locale = `${language}-${territory}`
  const labels = [false, true].map(idiot => getLabels(idiot).map(label => label.innerHTML))

  const game = element('uno')
  await game.startNetworked(isHost, numPlayers, { playerID, matchID, content, locale, labels })
  showUno()

  element('stop').onclick = () => {
    game.stop()
    cleanupUno()
  }
  element('theme').onchange = setTheme
}

export async function displayHashAsHand (cards) {
  await loadContent()
  await loadSources()
  const game = element('uno')
  game.startFromHash(cards)
  element('stop').onclick = () => {
    game.stop()
    cleanupUno()
  }
  element('theme').onchange = setTheme
  showUno()
  return true
}

function showUno () {
  element('stop').classList.toggle('hidden', false)
  element('theme').classList.toggle('hidden', false)
  setTimeout(() => element('uno').classList.toggle('hidden', false), 50)
}

function cleanupUno () {
  element('stop').classList.add('hidden')
  element('theme').classList.add('hidden')
  element('uno').classList.add('hidden')
  show('start')
}

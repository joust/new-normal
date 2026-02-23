import { language, territory, setTheme, setLocale, loadSources, loadContent, getSources, getTopicsData, labelSelect } from './content.mjs'
import { element, randomElement } from './common.mjs'
import { attitude, saveAttitude } from './main.mjs'

window.bingo = async function (one, two) {
  await loadContent()
  await loadSources()
  const game = element('bingo')
  game.start(one, two, {
    topics: getTopicsData(), language, territory, attitude,
    sources: getSources(), labelSelect, randomElement
  })
  showBingo()
}

function stopBingo () {
  element('bingo').stop()
  hideBingo()
  show('start')
}

function showBingo () {
  element('theme').onchange = setTheme
  element('stop').onclick = stopBingo
  element('theme').classList.remove('hidden')
  element('stop').classList.remove('hidden')
  element('bingo').classList.remove('hidden')
  element('menu').classList.add('hidden')
}

function hideBingo () {
  element('stop').classList.add('hidden')
  element('theme').classList.add('hidden')
  element('bingo').classList.add('hidden')
}

export async function displayHashAsCard (ids) {
  const idiotIds = ids.filter(v => v.startsWith('I'))
  const sheepIds = ids.filter(v => v.startsWith('S'))
  if (!idiotIds.length && !sheepIds.length) return false

  await loadContent()
  await loadSources()
  const game = element('bingo')
  game.startFromHash(ids, {
    topics: getTopicsData(), language, territory, attitude,
    sources: getSources(), labelSelect, randomElement
  })
  showBingo()
  return true
}

export function handleCorrection (event) {
}

// Wire up component events to global concerns
document.addEventListener('DOMContentLoaded', () => {
  const game = element('bingo')
  if (!game) return

  game.addEventListener('locale-change', async event => {
    setLocale(event.detail.locale)
    await loadContent()
    const topics = getTopicsData()
    game.refresh(topics, language, territory)
    const locationSelect = document.querySelector('.location')
    if (locationSelect) locationSelect.value = `${language}-${territory}`
  })

  game.addEventListener('exclusion-change', event => {
    saveAttitude('exclusions', event.detail.exclusions)
  })
})

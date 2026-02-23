import { element } from './common.mjs'
import { language, territory, loadSources, loadContent, extractContent, getTopicsData, labelSelect } from './content.mjs'
import { isArgument } from './uno-bg.mjs'

window.test = async function (cycles) {
  await loadSources()
  await loadContent()
  const game = element('test')
  game.start(cycles, {
    content: extractContent(), language, territory,
    topics: getTopicsData(), labelSelect
  })
  showTest()
}

function showTest () {
  element('stop').onclick = hideTest
  element('stop').classList.remove('hidden')
  setTimeout(() => element('test').classList.remove('hidden'), 50)
  element('menu').classList.add('hidden')
}

async function hideTest () {
  element('stop').classList.add('hidden')
  element('test').classList.add('hidden')
  element('test').stop()
  await window.show('start')
}

export async function displayHashAsTest (ids) {
  const cards = ids.filter(card => isArgument(card))
  if (cards.length) {
    await loadContent()
    await loadSources()
    const game = element('test')
    game.startFromHash(cards, {
      language, territory,
      topics: getTopicsData(), labelSelect
    })
    showTest()
    return true
  }
  return false
}

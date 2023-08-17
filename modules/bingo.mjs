import { language, territory, setTheme, setLocale, loadSources, loadContent, getLocalizedContent, getSources, getTopic, getTopicsData, getArgument, getMessage, labelSelect } from './content.mjs'
import { close, open, flipClose, flipOpen } from './flipside.mjs'
import { element, elementWithKids, mirrorNode, uniqueWord, randomElement, safariFix, debounce } from './common.mjs'
import { attitude, saveAttitude } from './main.mjs'

/**
 * create one or two idiot or sheep cards and start the game
 *
 * @param {boolean} one create an idiot card if true, otherwise a sheep card
 * @param {?boolean} two create a second card, idiot if true, sheep if false
 */
window.bingo = async function (one, two) {
  await loadContent()
  await loadSources()
  loadCard('#wrapper-1', one)
  if (two !== undefined) {
    showWrapperTwo()
    loadCard('#wrapper-2', two)
  } else { hideWrapperTwo() }

  showBingo()
}

/**
 * load a card by fetching the needed content (idiot/sheep + local) from the server
 *
 * @param {HTMLElement|string} wrapper wrapper element to load the card into
 * @param {boolean} idiot load idiot content if true, otherwise sheep content
 * @param {boolean} update true if to update the card with a different locale
 */
function loadCard (wrapper, idiot, update = false) {
  if (typeof wrapper === 'string') wrapper = document.querySelector(wrapper)
  wrapper.querySelector('.content').innerHTML = getLocalized(idiot)
  addStatements(wrapper)
  wrapper.querySelector('.detail').onclick = event => handleClick(event)
  addIdTags(wrapper)
  addSources(wrapper)
  if (attitude.friendly) { wrapper.querySelectorAll('i, .content button').forEach(e => e.remove()) }

  applyExclusions(wrapper)
  addCheckboxes(wrapper)
  addNavigationToCard(wrapper)
  const topics = getTopicsData()
  ;(update ? updateCard : prepareCard)(wrapper, topics, idiot)
  prepareCardTitle(wrapper, idiot)
  copyLogoToCard(wrapper, idiot)
}

function addStatements (wrapper) {
  const statement = getMessage('bingo.phrase.statement')
  const question = getMessage('bingo.phrase.question')
  wrapper.querySelectorAll('a[id] p').forEach(p => {
    const hasQmark = p.innerHTML.includes('?')
    p.insertAdjacentHTML('afterbegin', `<i>${hasQmark ? question : statement} </i>`)
  })
}

/**
 * add id tags to the details side of the card wrapper
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 */
function addIdTags (wrapper) {
  wrapper.querySelectorAll('a[id]').forEach(a => {
    const idtag = elementWithKids('span', a.id)
    idtag.onclick = event => toggleDetails(wrapper, event, [a.id])
    a.prepend(idtag)
  })
}

/**
 * add exclusion checkboxes to topics in the details side of the card wrapper
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 */
function addCheckboxes (wrapper) {
  wrapper.querySelectorAll('a[id^=T]').forEach(a => {
    const checkbox = elementWithKids('input')
    checkbox.checked = !a.classList.contains('excluded')
    checkbox.type = 'checkbox'
    checkbox.onclick = event => toggleExclusions(a.id, event)
    a.prepend(checkbox)
  })
}

/**
 * copy the logo to the top of the details side of the card wrapper
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 * @param {boolean} idiot idiot content if true, otherwise sheep content
 */
function copyLogoToCard (wrapper, idiot) {
  wrapper.querySelector('.content').prepend(
    document.querySelector('.logo').cloneNode(true))
  wrapper.querySelector('.logo select').value = `${language}-${territory}`
  wrapper.querySelector('.logo select').onchange =
    event => update(wrapper, idiot, event.target.value)
}

/**
 * prepare a random argument card on the front side of the card wrapper
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 * @param {Array} topics list of topics
 * @param {boolean} idiot idiot content if true, otherwise sheep content
 */
function prepareCard (wrapper, topics, idiot) {
  makeCard(wrapper, topics, 5, idiot)
  wrapper.classList.toggle('idiot', idiot)
  wrapper.classList.toggle('sheep', !idiot)
  wrapper.querySelector('.reload').onclick = () => makeCard(wrapper, topics, 5, idiot)
}

/**
 * update an argument card with a different language
 *
 * @param {HTMLElement} wrapper wrapper element of the card
 * @param {boolean} idiot if idiot card
 * @param {string} locale the new locale to switch to
 */
async function update (wrapper, idiot, locale) {
  setLocale(locale)
  const nav = wrapper.querySelector('.navigation')
  const ids = Array.from(nav.querySelectorAll('span')).map(span => span.innerHTML)
  const id = nav.querySelector('span.selected').innerHTML
  await loadContent()
  await loadCard(wrapper, idiot, true)
  if (ids.length) singleDetails(wrapper, nav.id, ids, id)
  wrapper.querySelector('.location').value = `${language}-${territory}`
  document.querySelector('.location').value = `${language}-${territory}`
}

/**
 * prepare the card title for the front side of the card wrapper
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 * @param {boolean} idiot idiot or sheep content
 */
function prepareCardTitle (wrapper, idiot) {
  // prepare card title
  const title = wrapper.querySelector('.title')
  while (title.firstChild) title.removeChild(title.firstChild)
  const select = labelSelect(idiot)
  const options = Array.from(select.querySelectorAll('option'))
  if (!attitude.fair && options.length) { randomElement(options).selected = true } else { select.value = '' }
  title.appendChild(select)
  const label = wrapper.querySelector('.detail label')
  if (label) {
    title.appendChild(label)
    title.querySelector('label').classList.toggle('hidden', !attitude.correct)
  }
}

/**
 * handle a click on the details window
 * @param {MouseEvent} event the click event
 */
function handleClick (event) {
  switch (event.target.tagName.toLowerCase()) {
    case 'span':
    case 'input':
    case 'select':
      break
    case 'q':
      showSources(event, false)
      break
    case 'a':
      if (event.target.classList.contains('correct')) break
      showSources(event)
      break
    case 'i':
    case 'p':
    case 'h2':
      if (event.target.hasAttribute('contenteditable')) break
      // fall thru
    default:
      showSources(event, false)
      flipCloseDetails(event)
  }
}

/**
 * open the detail window, adding the CSS 'single' classes to the given id details
 * @param {MouseEvent} event the event that triggered the open action
 * @param {string} topicId id of the topic to open
 * @param {string[]} args argument ids to show
 */
function openDetails (event, topicId, args) {
  const wrapper = event.target.closest('.card-wrapper')
  singleDetails(wrapper, topicId, args, args[0])
  flipOpen(event)
}

/**
 * flip close the detail window, removing the CSS 'single' classes
 * @param {MouseEvent} event - the event that triggered the close action
 */
function flipCloseDetails (event) {
  flipClose(event)
  closeDetails(event.target.closest('.card-wrapper'))
}

/**
 * close the detail window, removing the CSS 'single' classes
 * @param {HTMLElement|string} wrapper - the wrapper to close (string or element)
 * @param {boolean} flip - also flip the card
 */
function closeDetails (wrapper, flip = false) {
  if (typeof wrapper === 'string') wrapper = document.querySelector(wrapper)
  if (flip) close(wrapper)
  const detail = wrapper.querySelector('.detail')
  detail.classList.remove('single')
  detail.querySelectorAll('a[id]').forEach(e => e.classList.remove('single'))
  setPermalink(wrapper, [wrapper.classList.contains('idiot') ? 'I' : 'S'])
}

/**
 * open other wrapper showing the counterarguments to current topic
 * @param {MouseEvent} event - the triggering event to show counterarguments
 */
async function showCounterArguments (event) {
  const wrapper = event.target.closest('.card-wrapper')
  const nav = wrapper.querySelector('.navigation')
  const idiot = !wrapper.classList.contains('idiot')
  const type = idiot ? 'idiot' : 'sheep'
  const otherWrapper = document.querySelector(`.card-wrapper.${type}`) || document.querySelector('.card-wrapper.hidden')
  if (otherWrapper) {
    if (otherWrapper.classList.contains('hidden')) {
      showWrapperTwo()
      await loadCard('#wrapper-2', idiot)
    }

    if (otherWrapper.classList.contains(type)) {
      const topic = getTopicsData().find(t => t.id === nav.id)
      singleDetails(otherWrapper, nav.id, topic[type])
      open(otherWrapper)
    }
  }
}

/**
 * apply the exclusions stored in the attitudes of the user to all arguments
 *
 * @param {HTMLElement} detail content DOM node containing the arguments
 */
function applyExclusions (detail) {
  attitude.exclusions.split(',').forEach(e =>
    detail.querySelector(`a[id="${e}"]`) && detail.querySelector(`a[id="${e}"]`).classList.add('excluded'))
}

/**
 * toggle the exclusions stored in the attitudes of the user to all arguments
 *
 * @param {string} id id to toggle inside the exclusions list in attitude
 * @param {MouseEvent} event event that triggered the toggleExclusions
 */
function toggleExclusions (id, event) {
  const exclude = !event.target.parentElement.classList.contains('excluded')
  event.target.parentElement.classList.toggle('excluded', exclude)
  const set = new Set(attitude.exclusions.split(','))
  if (exclude) set.add(id); else set.delete(id)
  saveAttitude('exclusions', Array.from(set).join(','))
}

/**
 * toggle the argument details / all arguments views
 *
 * @param {HTMLElement|string} wrapper - the wrapper to close (string or element)
 * @param {MouseEvent} event - event that triggered the toggleDetails
 * @param {string[]} ids - ids
 */
function toggleDetails (wrapper, event, ids) {
  const single = event.target.parentElement.classList.contains('single')
  if (single) {
    closeDetails(wrapper)
    wrapper.querySelector(`a[id=${ids[0]}]`).scrollIntoView()
  } else { singleDetails(wrapper, null, ids) }
}

/**
 * generate a BINGO card as an HTML table with the given parent and size size
 *
 * @param {HTMLElement} wrapper - parent element to generate the table into
 * @param {Array} topics - Array of topics with data for the card
 * @param {number} size - side length for the card to generate (e.g. 3, 5, 7...)
 * @param {boolean} idiot - idiot or sheep content
 */
function makeCard (wrapper, topics, size, idiot) {
  const div = wrapper.querySelector('.bingo')
  const center = idiot ? ['🤪', '👻'] : ['🐑', '😷']
  const rows = []
  if (div.firstChild) div.removeChild(div.firstChild)
  topics = topics.slice()
  for (let y = 0; y < size; y++) {
    const cells = []
    for (let x = 0; x < size; x++) {
      const wordnode = elementWithKids('td')
      if (Math.floor(size / 2) === x && Math.floor(size / 2) === y) {
        wordnode.innerHTML = randomElement(center)
        wordnode.classList.add('center')
        wordnode.classList.add('set')
        wordnode.onclick = event => flipOpen(event)
      } else {
        const topic = uniqueWord(topics)
        wordnode.id = topic.id
        wordnode.innerHTML = idiot ? topic.idiotTitle : topic.sheepTitle
        wordnode.title = getArgumentsForTopic(topic.id, idiot)

        wordnode.onclick = event => {
          const args = idiot ? topic.idiot : topic.sheep
          const set = event.target.closest('td').classList.toggle('set')
          element('pyro').classList.toggle('hidden',
            !checkCard(event.target.closest('table'), size))
          if (set && attitude.curious) openDetails(event, topic.id, args)
        }
      }
      cells.push(wordnode)
    }
    rows.push(elementWithKids('tr', cells))
  }
  const table = elementWithKids('table', elementWithKids('tbody', rows), { lang: language })
  div.appendChild(table)
  safariFix(div)
}

/**
 * check a card table for fully selected rows, colums or diagonals
 * side effect: set the CSS class 'complete' for all elements that are part of a row
 *
 * @param {HTMLElement} table - table element representing the card
 * @param {number} size - side length of the card (e.g. 3, 5, 7...)
 *
 * @return {boolean} True if the card contains at least one full row
 */
function checkCard (table, size) {
  const base = Array.from({ length: size }, (_, i) => i + 1)
  const allSet = nodes => nodes.reduce((set, node) => set && node.classList.contains('set'), true)
  const rows = base.map(n => Array.from(table.querySelectorAll(`tr:nth-of-type(${n}) td`)))
  const columns = base.map(n => Array.from(table.querySelectorAll(`td:nth-of-type(${n})`)))
  const diagonals = [
    base.map(n => table.querySelector(`tr:nth-of-type(${n}) td:nth-of-type(${n})`)), base.map(n => table.querySelector(`tr:nth-of-type(${n}) td:nth-of-type(${size - n + 1})`))
  ]
  const complete = rows.concat(columns, diagonals).filter(allSet)
  table.querySelectorAll('td').forEach(node => node.classList.remove('complete'))
  complete.forEach(row => row.forEach(node => node.classList.add('complete')))
  return complete.length > 0
}

/**
 * get localized arguments with edit wrapper
 *
 * @param {boolean} idiot whether to load the idiot or sheep arguments
 */
function getLocalized (idiot) {
  const content = getLocalizedContent(idiot)
  return `<div lang="${language}" class="tr">${content}</div>`
}

/**
 * Hide second card wrapper to play with only one
 */
function hideWrapperTwo () {
  element('wrapper-2').classList.add('hidden')
  element('bingo').classList.add('one')
}

/**
 * Show second card wrapper to play with two
 */
function showWrapperTwo () {
  element('wrapper-2').classList.remove('hidden')
  element('bingo').classList.remove('one')
}

/**
 * handle change of the search input text
 * @param {MouseEvent} event - the input event
 */
window.search = function (event) {
  const wrapper = event.target.closest('.card-wrapper')
  const input = event.target.value.toLowerCase()
  const args = Array.from(wrapper.querySelectorAll('a[id]'))
  args.forEach(a => a.classList.remove('not-matching'))
  const notMatching = input.length ? args.filter(a => !a.textContent.replace(/\u00ad/gi, '').toLowerCase().includes(input)) : []
  notMatching.forEach(a => a.classList.add('not-matching'))
}

/**
 * stop the game: flipping cards, hiding the # element and showing the #menu element
 */
function stopBingo () {
  closeDetails('#wrapper-1', true)
  closeDetails('#wrapper-2', true)

  hideBingo()
  show('start')
}

/**
 * Show the game panel and stop button, hide the menu
 */
function showBingo () {
  element('theme').onchange = setTheme
  element('stop').onclick = stopBingo
  element('theme').classList.remove('hidden')
  element('stop').classList.remove('hidden')
  element('bingo').classList.remove('hidden')
  element('menu').classList.add('hidden')
}

/**
 * Hide the game panel and stop button
 */
function hideBingo () {
  element('stop').classList.add('hidden')
  element('theme').classList.add('hidden')
  element('bingo').classList.add('hidden')
  element('pyro').classList.add('hidden')
}

/**
 * extract idiot/sheep arguments for a given topic for showing a tooltip
 *
 * @param {string} topicId - the topic id
 * @param {boolean} idiot - idiot or sheep
 * @return {string} the extracted arguments
 */
function getArgumentsForTopic (topicId, idiot) {
  const topic = getTopic(topicId)
  const argsIds = Array.from(topic.querySelectorAll(idiot ? 'a[id^=I]' : 'a[id^=S]')).map(a => a.id)
  return argsIds.map(argId => {
    const arg = getArgument(argId).querySelector('h2')
    if (!arg) console.log(`no arg for id ${argId}`)
    return arg ? arg.innerHTML : ''
  }).join('\n')
}

/**
 * extend the arguments in detail with sources from sources if available
 *
 * @param {HTMLElement} detail content DOM node containing the arguments
 */
function addSources (detail) {
  const sources = getSources()
  Array.from(detail.querySelectorAll('a[id]')).forEach(a => {
    const links = sources.querySelectorAll(`a.${a.id}`)
    links.forEach(link => (link.target = '_blank'))
    if (links.length > 0) {
      const q = elementWithKids('q', [
        a.querySelector('h2').cloneNode(true),
        elementWithKids('ul', Array.from(links).map(
          s => elementWithKids('li', [
            s.cloneNode(true), ' (', mirrorNode(s), ')'
          ])))
      ])
      q.classList.add('hidden')
      a.nextElementSibling.appendChild(q)
    }
  })
}

/**
 * Set the permalink for the details side of the given card wrapper
 *
 * @param {HTMLElement} wrapper the card wrapper
 * @param {string[]} ids list of ids to include in the permalink
 */
function setPermalink (wrapper, ids) {
  const permalink = wrapper.querySelector('.permalink')
  if (ids) {
    permalink.classList.remove('hidden')
    permalink.href = `${window.location.origin}/#${ids.join('&')}`
  } else { permalink.classList.add('hidden') }
}

/**
 * add an empty navigation element to the card
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 */
function addNavigationToCard (wrapper) {
  const navigation = elementWithKids('p')
  navigation.classList.add('navigation')
  wrapper.querySelector('.content').prepend(navigation)
}

/**
 * Setup argument navigation by id and selected
 *
 * @param {HTMLElement} wrapper the card wrapper
 * @param {string} topicId id of topic to save as navigation id
 * @param {string[]} ids list of ids to include in the navigation
 * @param {string} selected the id to select
 * @param {boolean} bingo if to show a permalink and counter navigation
 */
function setNavigation (wrapper, topicId, ids, selected, bingo) {
  const content = wrapper.querySelector('.content')
  const navigation = elementWithKids('p', ids.flatMap(id => {
    const idtag = elementWithKids('span', id)
    idtag.onclick = () => singleDetails(wrapper, topicId, ids, id, bingo)
    if (id === selected) idtag.classList.add('selected')
    return ['\u00ad', idtag]
  }))
  navigation.id = topicId || 'nav'
  navigation.classList.add('navigation')
  if (bingo && topicId) {
    const countertag = elementWithKids('span', '►')
    countertag.classList.add('counter')
    countertag.onclick = event => showCounterArguments(event)
    navigation.appendChild(countertag)
  }
  content.replaceChild(navigation, content.querySelector('.navigation'))
}

/**
 * show selected details, add the CSS 'single' classes if only one is shown
 * @param {HTMLElement|string} wrapper the event that triggered the open action
 * @param {string|null} topicId id of topic to save as navigation id
 * @param {string[]} ids list of ids to show
 * @param {string} selected id to select
 * @param {boolean} permalink if to show a permalink
 */
function singleDetails (wrapper, topicId, ids, selected = undefined, permalink = true) {
  if (typeof wrapper === 'string') wrapper = document.querySelector(wrapper)
  selected = selected || ids[0]
  setNavigation(wrapper, topicId, ids, selected, permalink)
  const detail = wrapper.querySelector('.detail')
  detail.classList.add('single')
  detail.querySelectorAll('a[id]').forEach(e => e.classList.remove('single'))
  const anchor = wrapper.querySelector(`a[id=${selected}]`)
  if (anchor) {
    anchor.classList.add('single')
    detail.querySelectorAll('a[href=""]').forEach(e => e.classList.toggle('hidden',
      !anchor.querySelector('q')))
  }
  setPermalink(wrapper, permalink ? ids : false)
}

/**
 * show/hide all sources boxes if available
 *
 * @param {MouseEvent} event the Event triggering the action
 * @param {boolean} show true if the sources should be made visible false otherwise
 */
function showSources (event, show = true) {
  const wrapper = event.target.closest('.card-wrapper')
  wrapper.querySelectorAll('q').forEach(q => q.classList.toggle('hidden', !show))
}

/**
 * update a topics based bingo card with a different language
 * @param {Array} topics true if the sources should be made visible false otherwise
 * @param {boolean} idiot true if idiot content
 * @param {HTMLElement} wrapper wrapper element of the card
 */
function updateCard (wrapper, topics, idiot = undefined) {
  wrapper.querySelectorAll('td[id]').forEach(td => {
    const topic = topics.find(t => t.id === td.id)
    if (topic) {
      td.innerHTML = idiot === true ? topic.idiotTitle : idiot === false ? topic.sheepTitle : topic.title
      td.title = getArgumentsForTopic(topic.id, idiot)
    }
  })
}

/**
 * show idiot or sheep cards corresponding to the id(s) given in the hash
 *
 * @param {string[]} ids Array of ids of argument(s) to show
 * @return {boolean} true if success false otherwise
 */
export async function displayHashAsCard (ids) {
  const idiot = ids.filter(v => v.startsWith('I'))
  const sheep = ids.filter(v => v.startsWith('S'))
  const wrapper1 = element('wrapper-1')
  const wrapper2 = element('wrapper-2')
  await loadContent()
  await loadSources()
  if (!idiot.length && !sheep.length) return false // nothing to evaluate
  const one = idiot.length > 0
  const two = (one ? sheep : idiot).length > 0 ? !one : undefined
  await loadCard(wrapper1, one)
  singleDetails(wrapper1, null, one ? idiot : sheep)
  open(wrapper1)
  if (two !== undefined) {
    await loadCard(wrapper2, two)
    singleDetails(wrapper2, null, two ? idiot : sheep)
    open(wrapper2)
    showWrapperTwo()
  } else { hideWrapperTwo() }
  showBingo()
  return true
}

/**
 * update patch file and html formatted representing the users text corrections for wrapper
 *
 * @param {Event} event wrapper
 */
export function handleCorrection (event) {
  const wrapper = event.target.closest('.card-wrapper')
  const lang = wrapper.querySelector('.location').value.split('-')[0] // ${lang}-${terr}
  const idiot = !wrapper.classList.contains('idiot')
  const type = idiot ? 'idiot' : 'sheep'
  const edited = wrapper.querySelector('.tr').innerHTML
  /*
  const base = patchFiles[lang][type].base
  const diff = getDiff(base, edited)
  patchFiles[lang][type].file = patchFile(base, edited, diff)
  patchFiles[lang][type].html = htmlFormatted(diff)
  console.log(patchFiles)
  */
}

/**
 * toggle correct mode for current card
 *
 * @param {HTMLElement} wrapper wrapper
 */
window.toggleCorrectMode = function (wrapper) {
  if (typeof wrapper === 'string') wrapper = document.querySelector(wrapper)
  const currentMode = wrapper.querySelector('.correct').classList.contains('active')
  wrapper.querySelectorAll('a[id] p, a[id] h2').forEach(e => {
    if (!currentMode) { e.setAttribute('contenteditable', 'plaintext-only') } else { e.removeAttribute('contenteditable') }
    e.oninput = debounce(handleCorrection, 1000)
  })
  wrapper.querySelector('.correct').classList.toggle('active', !currentMode)
}

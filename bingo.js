/**
 * create one or two idiot or sheep cards and start the game
 *
 * @param {boolean} one create an idiot card if true, otherwise a sheep card
 * @param {?boolean} two create a second card, idiot if true, sheep if false
 */
async function play(one, two) {
  await loadContent(lang, terr)
  await loadSources()
  loadCard('#wrapper-1', one)
  if (two !== undefined) {
    showWrapperTwo()
    loadCard('#wrapper-2', two)
  } else
    hideWrapperTwo()

  showGame()
}

/**
 * load a card by fetching the needed content (idiot/sheep + local) from the server
 *
 * @param {HTMLElement|string} wrapper wrapper element to load the card into
 * @param {boolean} idiot load idiot content if true, otherwise sheep content
 * @param {boolean} update true if to update the card with a different locale
 */
function loadCard(wrapper, idiot, update = false) {
  if (typeof wrapper === 'string') wrapper = document.querySelector(wrapper)
  wrapper.querySelector('.content').innerHTML = getLocalized(idiot)
  wrapper.querySelector('.detail').onclick = event => handleClick(event)
  addIdTags(wrapper)
  addSources(wrapper)
  if (attitude.friendly)
    wrapper.querySelectorAll('i, .content button').forEach(e => e.remove())

  wrapper.querySelector('.buttons.test').remove()

  applyExclusions(wrapper)
  addCheckboxes(wrapper)
  addNavigationToCard(wrapper)
  const topics = getTopicsData()
  ;(update ? updateCard : prepareCard)(wrapper, topics, idiot)
  prepareCardTitle(wrapper, idiot)
  copyLogoToCard(wrapper, idiot)
}

/**
 * add id tags to the details side of the card wrapper
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 */
function addIdTags(wrapper) {
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
function addCheckboxes(wrapper) {
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
function copyLogoToCard(wrapper, idiot) {
  wrapper.querySelector('.content').prepend(
    document.querySelector('.logo').cloneNode(true))
  wrapper.querySelector('.logo select').value = `${lang}-${terr}`
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
function prepareCard(wrapper, topics, idiot) {
  makeCard(wrapper, topics, 5, idiot)
  wrapper.classList.remove('test')
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
async function update(wrapper, idiot, locale) {
  [lang, terr] = locale.split('-')
  const nav = wrapper.querySelector('.navigation')
  const ids = Array.from(nav.querySelectorAll('span')).map(span => span.innerHTML)
  const id = nav.querySelector('span.selected').innerHTML
  await loadContent(lang, terr)
  await loadCard(wrapper, idiot, true)
  if (ids.length) singleDetails(wrapper, nav.id, ids, id)
  wrapper.querySelector('.location').value = `${lang}-${terr}`
  document.querySelector('.location').value = `${lang}-${terr}`
}

/**
 * prepare the card title for the front side of the card wrapper
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 * @param {boolean} idiot idiot or sheep content
 */
function prepareCardTitle(wrapper, idiot) {
  // prepare card title
  const title = wrapper.querySelector('.title')
  while (title.firstChild) title.removeChild(title.firstChild)
  const select = labelSelect(idiot)
  const options = Array.from(select.querySelectorAll('option'))
  if (!attitude.fair && options.length)
    randomElement(options).selected = true
  else
    select.value = ''
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
function handleClick(event) {
  switch (event.target.tagName.toLowerCase()) {
    case 'span':
    case 'input':
    case 'select':
      break;
    case 'q':
      showSources(event, false)
      break;
    case 'a':
      if (event.target.classList.contains('correct')) break
      showSources(event)
      break;
    case 'i':
    case 'p':
    case 'h2':
      if (event.target.hasAttribute('contenteditable')) break;
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
 * @param {string[]} arguments argument ids to show
 */
function openDetails(event, topicId, arguments) {
  const wrapper = event.target.closest('.card-wrapper')
  singleDetails(wrapper, topicId, arguments, arguments[0])
  flipOpen(event)
}

/**
 * flip close the detail window, removing the CSS 'single' classes
 * @param {MouseEvent} event - the event that triggered the close action
 */
function flipCloseDetails(event) {
  flipClose(event)
  closeDetails(event.target.closest('.card-wrapper'))
}

/**
 * close the detail window, removing the CSS 'single' classes
 * @param {HTMLElement|string} wrapper - the wrapper to close (string or element)
 * @param {boolean} flip - also flip the card
 */
function closeDetails(wrapper, flip = false) {
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
async function showCounterArguments(event) {
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
      const topic = otherWrapper.querySelector(`a[id="${nav.id}"]`)
      const counterIds = topic ? topic.dataset[type].split(' ') : []
      singleDetails(otherWrapper, nav.id, counterIds)
      open(otherWrapper)
    }
  }
}

/**
 * apply the exclusions stored in the attitudes of the user to all arguments
 *
 * @param {HTMLElement} detail content DOM node containing the arguments
 */
function applyExclusions(detail) {
  attitude.exclusions.split(',').forEach(e =>
    detail.querySelector(`a[id="${e}"]`) && detail.querySelector(`a[id="${e}"]`).classList.add('excluded'))
}

/**
 * toggle the exclusions stored in the attitudes of the user to all arguments
 *
 * @param {string} id id to toggle inside the exclusions list in attitude
 * @param {MouseEvent} event event that triggered the toggleExclusions
 */
function toggleExclusions(id, event) {
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
function toggleDetails(wrapper, event, ids) {
  const single = event.target.parentElement.classList.contains('single')
  if (single) {
    closeDetails(wrapper)
    wrapper.querySelector(`a[id=${ids[0]}]`).scrollIntoView()
  } else
    singleDetails(wrapper, null, ids)
}

/**
 * generate a BINGO card as an HTML table with the given parent and size size
 *
 * @param {HTMLElement} wrapper - parent element to generate the table into
 * @param {Array} topics - Array of topics with data for the card
 * @param {number} size - side length for the card to generate (e.g. 3, 5, 7...)
 * @param {boolean} idiot - idiot or sheep content
 */
function makeCard(wrapper, topics, size, idiot) {
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
          const arguments = idiot ? topic.idiot : topic.sheep
          const set = event.target.closest('td').classList.toggle('set')
          document.querySelector('#pyro').classList.toggle('hidden',
            !checkCard(event.target.closest('table'), size))
          if (set && attitude.curious) openDetails(event, topic.id, arguments)
        }
      }
      cells.push(wordnode)
    }
    rows.push(elementWithKids('tr', cells))
  }
  const table = elementWithKids('table', elementWithKids('tbody', rows), { lang })
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
function checkCard(table, size) {
  const base = Array.from({length: size}, (_, i) => i+1)
  const allSet = nodes => nodes.reduce((set, node) => set && node.classList.contains('set'), true)
  const rows = base.map(n => Array.from(table.querySelectorAll(`tr:nth-of-type(${n}) td`)))
  const columns = base.map(n => Array.from(table.querySelectorAll(`td:nth-of-type(${n})`)))
  const diagonals = [
    base.map(n => table.querySelector(`tr:nth-of-type(${n}) td:nth-of-type(${n})`)), base.map(n => table.querySelector(`tr:nth-of-type(${n}) td:nth-of-type(${size-n+1})`))
  ]
  const complete = rows.concat(columns, diagonals).filter(allSet)
  table.querySelectorAll('td').forEach(node => node.classList.remove('complete'))
  complete.forEach(row => row.forEach(node => node.classList.add('complete')))
  return complete.length > 0
}


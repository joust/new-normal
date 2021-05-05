
/**
 * create one or two idiot or sheep cards and start the game
 *
 * @param {boolean} one create a idiot card if true, otherwise a sheep card
 * @param {?boolean} two create a second card, idiot if true, sheep if false
 */
async function play(one, two) {
  await loadCard('#wrapper-1', one)
  if (two !== undefined) {
    showWrapperTwo()
    await loadCard('#wrapper-2', two)
  } else
    hideWrapperTwo()

  showGame()
}

/**
 * load a card by fetching the needed content (idiot/sheep + local) from the server
 *
 * @param {HTMLElement|string} wrapper wrapper element to load the card into
 * @param {boolean} idiot load idiot content if true, otherwise sheep content
 * @param {string[]} show list of ids to show instead of initializing a game
 * @param {boolean} update true if to update the card with a different locale
 */
async function loadCard(wrapper, idiot, show, update) {
  const content = await fetchSilent(lang + (idiot ? '/idiot.html' : '/sheep.html'))
  let local = await fetchSilent(terr + (idiot ? '/idiot-local.html' : '/sheep-local.html'))
  if (!local.length)
    local = await fetchSilent(lang + (idiot ? '/idiot-local.html' : '/sheep-local.html'))
  if (typeof wrapper === 'string') wrapper = document.querySelector(wrapper)
  wrapper.querySelector('.content').innerHTML = content + local
  wrapper.querySelector('.detail').onclick = event => handleClick(event)
  addIdTags(wrapper)
  await addSources(wrapper)
  if (attitude.friendly)
    wrapper.querySelectorAll('i, .content button').forEach(e => e.remove())

  wrapper.querySelector('.buttons.test').remove()

  applyExclusions(wrapper)
  addCheckboxes(wrapper)
  if (show) {
    if (show.length > 1 || show[0].length > 1) singleDetails(wrapper, show)
    open(wrapper)
    setPermalink(wrapper, show)
  } else
    setPermalink(wrapper, [idiot? 'I' : 'S'])
  if (update) updateCard(wrapper); else prepareCard(wrapper, idiot)
  prepareCardTitle(wrapper)
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
 * add exclusion checkboxes to the details side of the card wrapper
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 */
function addCheckboxes(wrapper) {
  wrapper.querySelectorAll('a[id]').forEach(a => {
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
 */
function prepareCard(wrapper, idiot) {
  const emojis = idiot ? '🤪,👻' : '🐑,😷' 
  const set = getArguments(wrapper.querySelector('.detail'))
  if (!set.length) 
    alert('No arguments found!');
  else {   
    makeCard(wrapper, set, 5, emojis)
    wrapper.classList.remove('test')
    wrapper.classList.toggle('idiot', idiot)
    wrapper.classList.toggle('sheep', !idiot)
    wrapper.querySelector('.reload').onclick = () => makeCard(wrapper, set, 5, emojis)
  }
}

/**
 * update an argument card with a different language
 *
 * @param {HTMLElement} wrapper wrapper element of the card
 */
async function update(wrapper, idiot, locale) {
  [lang, terr] = locale.split('-')
  const ids = Array.from(wrapper.querySelectorAll('a.single')).map(a => a.id)
  await loadCard(wrapper, idiot, null, true)
  if (ids.length) singleDetails(wrapper, ids)
  wrapper.querySelector('.location').value = `${lang}-${terr}`
  document.querySelector('.location').value = `${lang}-${terr}`
}

/**
 * prepare the card title for the front side of the card wrapper
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 */
function prepareCardTitle(wrapper) {
  // prepare card title
  const title = wrapper.querySelector('.title')
  while (title.firstChild) title.removeChild(title.firstChild)
  const select = wrapper.querySelector('.detail select')
  if (!attitude.fair)
    randomElement(select.querySelectorAll('option'), 1).selected = true
  title.appendChild(select)
  const label = wrapper.querySelector('.detail label')
  if (label) {
    title.appendChild(label)
    title.querySelector('label').classList.toggle('hidden', !attitude.correct)
  }
}

/**
 * handle a click on the details window
 * @param {Event} event the click event
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
      showSources(event)
      break;
    default:
      showSources(event, false)
      flipCloseDetails(event)
  }
}

/**
 * open the detail window, adding the CSS 'single' classes to the given id details
 * @param {Event} event the event that triggered the open action
 */
function openDetails(event) {
  const wrapper = event.target.closest('.card-wrapper')
  singleDetails(wrapper, [event.target.id])
  flipOpen(event)
}

/**
 * flip close the detail window, removing the CSS 'single' classes
 * @param {Event} event - the event that triggered the close action
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
 * open another detail window showing the listed counter arguments
 * @param {string[]} ids - the ids to show
 */
function showCounterArguments(ids) {
  const idiot = ids[0].startsWith('I')
  const type = idiot ? 'idiot' : 'sheep'
  const wrapper = document.querySelector(`.card-wrapper.${type}`) || document.querySelector('.card-wrapper.hidden')
  if (wrapper) {
    if (wrapper.classList.contains('hidden')) {
      showWrapperTwo()
      loadCard('#wrapper-2', idiot, ids)
    } else {
      singleDetails(wrapper, ids)
      open(wrapper)
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
 * @param {Event} event event that triggered the toggleExclusions
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
 * @param {Event} event - event that triggered the toggleDetails
 * @param {string[]} ids - ids 
 */
function toggleDetails(wrapper, event, ids) {
  const single = event.target.parentElement.classList.contains('single')
  if (single) {
    closeDetails(wrapper)
    wrapper.querySelector(`a[id=${ids[0]}]`).scrollIntoView()
  } else
    singleDetails(wrapper, ids)
}

/**
 * generate a BINGO card as an HTML table with the given parent and size size
 *
 * @param {HTMLElement} wrapper - parent element to generate the table into
 * @param {{id: string, word: string}[]} wordset - Array of (id, word) tuples with data for the card
 * @param {number} size - side length for the card to generate (e.g. 3, 5, 7...)
 * @param {string} center - string with comma seperated text alternatives for the center
 */
function makeCard(wrapper, wordset, size, center) {
  const div = wrapper.querySelector('.bingo')
  const rows = []
  if (div.firstChild) div.removeChild(div.firstChild)
  wordset = wordset.slice()
  center = center.split(',')
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
        const set = uniqueWord(wordset)
        wordnode.id = set.id
        wordnode.innerHTML = set.word
        wordnode.title = set.content
        wordnode.onclick = event => {
          const set = event.target.closest('td').classList.toggle('set')
          document.querySelector('#pyro').classList.toggle('hidden',
            !checkCard(event.target.closest('table'), size))
          if (set && attitude.curious) openDetails(event)
        }
      }
      cells.push(wordnode)
    }
    rows.push(elementWithKids('tr', cells))
  }
  const table = elementWithKids('table', elementWithKids('tbody', rows))
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


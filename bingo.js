// New Normal needs a browser with at least fetch support
if (!('fetch' in window)) alert('Please user a modern Browser to play New Normal!')

// ServiceWorker is a progressive technology. Ignore unsupported browsers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
}

const attitude = { hasty: false, curious: true, open: false, fair: false, correct: false, friendly: false, exclusions: '' }
let lang, terr

/**
 * start the app with the given locale and start the matching intro
 *
 * @param {?string} locale optional locale string like 'de-de'. if not present, browser locale is used
 */
function load(locale) {
  FastClick.attach(document.body)
  loadAttitude()
  if (locale) [lang, terr] = locale.split('-'); else [lang, terr] = browserLocale()
  if (!['de', 'da', 'en', 'es', 'pl'].includes(lang)) [lang, terr] = ['en', 'us']
  document.querySelector('.location').value = `${lang}-${terr}`

  if (!window.location.hash || !displayHash(window.location.hash.substring(1)))
    if (attitude.hasty) show('start'); else runIntro()
}

/**
 * load and show the given page by patching innerHTML of element '#menu content'
 *
 * @param {string} page name of the page to load
 */
async function show(page) {
  document.querySelector('.logo').style.display = page === 'intro' ? 'none' : 'block'
  document.querySelector('#menu').classList.add('hidden')
  document.querySelector('#menu .content').innerHTML = await fetchSilent(lang +'/'+page+'.html')
  document.querySelector('#menu').scrollTop = 0
  if (page==='attitude') initAttitude()
  setTimeout(() => document.querySelector('#menu').classList.remove('hidden'), 50)
}

/**
 * run intro by a timed display of its frames. can be skipped with skipIntro()
 */
let timer = null
async function runIntro() {
  await show('intro')
  document.querySelector('#menu').classList.add('intro')
  let frame = document.querySelector('#menu .frame')
  const nextFrame = () => {
    frame.classList.toggle('show')
    frame = frame.nextElementSibling
    if (frame) {
      frame.classList.toggle('show')
      timer = setTimeout(nextFrame, 60 * frame.textContent.length)
    } else {
      timer = null
      document.querySelector('#menu').classList.remove('intro')
      show('start')
    }
  }
  frame.classList.toggle('show')
  timer = setTimeout(nextFrame, 60 * frame.textContent.length)
}

/**
 * skip intro by stopping its timer and show the start menu
 */
function skipIntro() {
  if (timer) clearTimeout(timer)
  saveAttitude('hasty', true)
  document.querySelector('#menu').classList.remove('intro')
  show('start')
}

/**
 * stop the pyro effect by setting CSS 'hidden' class
 */
function stopPyro() {
  document.querySelector('#pyro').classList.add('hidden')
}

/**
 * transfer the current attitude to the attitude page for editing
 */
function initAttitude() {
  for (let a in attitude)
    if (a !== 'exclusions')
      document.querySelector(`#menu #${a}`).checked = attitude[a]
}

/**
 * save a single attitude locally and to local storage if available
 */
function saveAttitude(a, value) {
  attitude[a] = value
  if (localStorage)
    localStorage.setItem(a, a==='exclusions' ? value : value ? 'true' : 'false')
}

/**
 * load all attitudes from local storage if available
 */
function loadAttitude() {
  if (localStorage)
    for (let a in attitude) {
      if (localStorage.getItem(a) !== null)
        attitude[a] = a === 'exclusions' ? localStorage.getItem(a) : localStorage.getItem(a)==='true'
    }
}

/**
 * show idiot and/or sheep cards corresponding to the id(s) given in the hash
 *
 * @param {string} hash with ids of argument(s) to show
 * @return {boolean} true if success false otherwise
 */
function displayHash(hash) {
  hash = hash.toUpperCase().split('&').map(v => v.split('=')[0])
  const idiot = hash.filter(v => v.startsWith('I'))
  const sheep = hash.filter(v => v.startsWith('S'))
  if (!idiot.length && !sheep.length) return false // nothing to evaluate
  const one = idiot.length
  const two = (one ? sheep : idiot).length ? !one : undefined
  loadCard('#wrapper-1', one, one ? idiot : sheep)
  if (two !== undefined) {
    showWrapperTwo()
    loadCard('#wrapper-2', two, two ? idiot : sheep)
  } else
    hideWrapperTwo()

  showGame()
  return true
}

/**
 * create one or two idiot or sheep cards and start the game
 *
 * @param {boolean} one create a idiot card if true, otherwise a sheep card
 * @param {?boolean} two create a second card, idiot if true, sheep if false
 */
function play(one, two) {
  loadCard('#wrapper-1', one)
  if (two !== undefined) {
    showWrapperTwo()
    loadCard('#wrapper-2', two)
  } else
    hideWrapperTwo()

  showGame()
}

/**
 * Hide second card wrapper to play with only one
 */
function hideWrapperTwo() {
  document.querySelector('#wrapper-2').classList.add('hidden')
  document.querySelector('#game').classList.add('one')
}

/**
 * Show second card wrapper to play with two
 */
function showWrapperTwo() {
  document.querySelector('#wrapper-2').classList.remove('hidden')
  document.querySelector('#game').classList.remove('one')
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
  addIdTags(wrapper)
  await addSources(wrapper)
  if (attitude.open)
    wrapper.querySelectorAll('.content button, .content button + a').forEach(e => e.remove())
  if (attitude.friendly)
    wrapper.querySelectorAll('i, .content button').forEach(e => e.remove())

  applyExclusions(wrapper)
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
  wrapper.querySelectorAll('a[id]').forEach(a => { // add id tags
    const idtag = elementWithKids('span', a.id)
    idtag.onclick = event => toggleExclusions(a.id, event)
    a.prepend(idtag)
  })
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
 * update an argument card with a different language
 *
 * @param {HTMLElement} wrapper wrapper element of the card
 */
function updateCard(wrapper) {
  const set = getArguments(wrapper.querySelector('.detail'))
  wrapper.querySelectorAll('td[id]').forEach(td => {
    const argument = set.find(arg => arg.id === td.id)
    if (argument) {
      td.innerHTML = argument.word
      td.title = argument.content
    }
  })
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
 * handle change of the search input text
 * @param {Event} event - the input event
 */
function search(event) {
  const wrapper = event.target.closest('.card-wrapper')
  const input = event.target.value.toLowerCase()
  const args = Array.from(wrapper.querySelectorAll('a[id]'))
  args.forEach(a => a.classList.remove('not-matching'))
  const notMatching = input.length ? args.filter(a => !a.textContent.replace(/\u00ad/gi, '').toLowerCase().includes(input) && !a.nextElementSibling.textContent.replace(/\u00ad/gi, '').toLowerCase().includes(input)) : []
  notMatching.forEach(a => a.classList.add('not-matching'))  
}

/**
 * stop the game: flipping cards, hiding the #game element and showing the #menu element
 */
function stop() {
  closeDetails('#wrapper-1')
  closeDetails('#wrapper-2')

  hideGame()
  show('start')
}

/**
 * Show the game panel and stop button, hide the menu
 */
function showGame() {
  document.querySelector('#stop').classList.remove('hidden')
  document.querySelector('#game').classList.remove('hidden')
  document.querySelector('#menu').classList.add('hidden')
}

/**
 * Hide the game panel and stop button
 */
function hideGame() {
  document.querySelector('#stop').classList.add('hidden')
  document.querySelector('#game').classList.add('hidden')
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
 * Set the permalink for the details side of the given card wrapper
 *
 * @param {HTMLElement} wrapper the card wrapper
 * @param {string[]} ids list of ids to include in the permalink
 */
function setPermalink(wrapper, ids) {
  wrapper.querySelector('.permalink').href = `${window.location.origin}/#${ids.join('&')}` 
}

/**
 * show selected details, add the CSS 'single' classes if only one is shown
 * @param {HTMLElement} wrapper the event that triggered the open action
 * @param {string[]} ids list of ids to show
 */
function singleDetails(wrapper, ids) {
  const detail = wrapper.querySelector('.detail')
  if (ids.length === 1) detail.classList.add('single')
  detail.querySelectorAll('a[id]').forEach(e => e.classList.remove('single'))
  ids.forEach(id => {
    const anchor = wrapper.querySelector(`a[id=${id}]`)
    if (anchor) {
      anchor.classList.add('single')
      detail.querySelectorAll('a[href=""]').forEach(e => e.classList.toggle('hidden',
        !anchor.nextElementSibling.querySelector('q')))
    }
  })
  detail.querySelectorAll('button').forEach(e => e.classList.toggle('hidden', attitude.open))
  setPermalink(wrapper, ids)
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
 */
function closeDetails(wrapper) {
  if (typeof wrapper === 'string') wrapper = document.querySelector(wrapper)
  close(wrapper)
  const detail = wrapper.querySelector('.detail')
  detail.classList.remove('single')
  detail.querySelectorAll('a[id]').forEach(e => e.classList.remove('single'))
  setPermalink(wrapper, [wrapper.classList.contains('idiot') ? 'I' : 'S'])
}

/**
 * open another detail window showing the listed counter arguments
 * @param {string[]} ids - the ids to show
 * @param {Event} event - the event that triggered the show action
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
 * extract the argument ids and texts from HTML content
 *
 * @param {HTMLElement} detail - content DOM node containing the arguments
 * @return {{id: string, word: string}[]} the extracted arguments
 */
function getArguments(detail) {
  return Array.from(detail.querySelectorAll('a[id]:not(.excluded)')).map(
    a => ({id: a.id, 
           word: a.querySelector('h2').innerHTML, 
           content: a.nextElementSibling.innerText}))
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
 * show/hide all sources boxes if available
 *
 * @param {Event} event the Event triggering the action
 * @param {boolean} show true if the sources should be made visible false otherwise
 */
function showSources(event, show = true) {
  const detail = event.target.closest('.card-wrapper').querySelector('.detail')
  if (!attitude.open)
    detail.querySelectorAll('q').forEach(q => q.classList.toggle('hidden', !show))
  detail.querySelectorAll('button, a[href=""]').forEach(e => e.classList.add('hidden'))
}

/**
 * extend the arguments in detail with sources from sources if available
 *
 * @param {HTMLElement} detail content DOM node containing the arguments
 */
async function addSources(detail) {
  const sources = elementWithKids('div')
  sources.innerHTML =  await fetchSilent('sources.html')
  Array.from(detail.querySelectorAll('a[id]')).forEach(a => {
    const links = sources.querySelectorAll(`a.${a.id}`)
    const counter = Array.from(sources.querySelectorAll(`q.${a.id}`)).map(q => q.innerText)
    links.forEach(link => link.target = '_blank')
    if (links.length > 0) {
      const q = elementWithKids('q', elementWithKids('ul', Array.from(links).map(
        s => elementWithKids('li', [s.cloneNode(true), ' (', mirrorNode(s), ')']))))
      if (!attitude.open) q.classList.add('hidden')
      a.nextElementSibling.appendChild(q)
    }
    if (counter.length > 0) {
      const c = elementWithKids('p', [ '⇔', ...counter.flatMap(counterid => {
        const idtag = elementWithKids('span', counterid)
        idtag.onclick = () => showCounterArguments([counterid])
        return ['\u00ad', idtag]
      })])
      c.classList.add('counter')
      a.nextElementSibling.appendChild(c)
    }
  })
}

/**
 * generates an archive.is mirror anchor node for the given node 
 *
 * @param {HTMLElement} a the anchor node to mirror
 */
function mirrorNode(a) {
  const mirror = a.cloneNode(true)
  mirror.href = `https://archive.is/${a.href}` 
  mirror.firstChild.textContent = 'Mirror'
  return mirror
}

/**
 * get browser two-character-codes for language and territory in lower case
 *
 * @return {string[]} an 2-entry-array with the browser language and territory
 */
function browserLocale() {
  let [language, territory] = navigator.language.split('-')
  territory = territory ? territory.toLowerCase() : language
  return [language, territory]
}

/**
 * create a DOM Element, optionally with children.
 * Any string given as kids will be converted in a HTML text node
 *
 * @param {string} tag - tag name for the element to create
 * @param {(string|HTMLElement)|(string|HTMLElement)[]} kids - a element or string, or an array of elements or strings
 * @return {HTMLElement} The created element
 */
function elementWithKids(tag, kids) {
  const node = document.createElement(tag)
  if (kids) {
    if (!(kids instanceof Array)) kids = [kids]
    kids.forEach(kid => {
      if (!(kid instanceof HTMLElement)) kid = document.createTextNode(kid)
      node.appendChild(kid)
    })
  }
  return node
}

/**
 * select an unique random element from an array
 * side effect: The element is removed from from the array to achieve the uniqueness!
 *
 * @param {Array} wordset - Array to choose a random element from
 * @return {any} The random element selected
 */
function uniqueWord(wordset) {
  const index = Math.floor((Math.random() * wordset.length))
  return wordset.splice(index, 1)[0]
}

/**
 * return a random element from an array, starting from element start
 *
 * @param {Array} array - Array to choose a random element from
 * @param {number} start - Element to start with (default 0)
 * @return {any} The random element selected
 */
function randomElement(array, start = 0) {
  return array[start + Math.floor((Math.random() * (array.length-start)))]
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
  // safari fix to force flex relayout
  div.parentElement.style.display = 'none'
  div.parentElement.offsetHeight
  div.parentElement.style.display = ''
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

/**
 * fetch a file from server, suppressing all errors
 *
 * @param {string} url - the url to fetch
 * @return {Promise<string>} the files content or '' on error
 */
function fetchSilent(url) {
  return fetch(url).then(async response => response.status >= 400 && response.status < 600 ? '' : await response.text()).catch(error => '')  
}

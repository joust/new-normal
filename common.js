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
 * show idiot, sheep or test cards corresponding to the id(s) given in the hash
 *
 * @param {string} hash with ids of argument(s) to show
 * @return {boolean} true if success false otherwise
 */
async function displayHash(hash) {
  hash = hash.toUpperCase().split('&').map(v => v.split('=')[0])
  const idiot = hash.filter(v => v.startsWith('I'))
  const sheep = hash.filter(v => v.startsWith('S'))
  const test = hash.filter(v => v.startsWith('T'))
  if (test.length) {
    await loadTestCard('#wrapper-1', true, 0, 5)
    await loadTestCard('#wrapper-2', false, 25, 5)
    initTestStats(5, 5)
    const td = document.querySelector(`td[id="${test[0]}"]`)
    if (td) td.click(); else console.error('no element', test[0])
  } else {
  if (!idiot.length && !sheep.length) return false // nothing to evaluate
    const one = idiot.length
    const two = (one ? sheep : idiot).length ? !one : undefined
    await loadCard('#wrapper-1', one, one ? idiot : sheep)
    if (two !== undefined) {
      await loadCard('#wrapper-2', two, two ? idiot : sheep)
      showWrapperTwo()
    } else
      hideWrapperTwo()
  }
  showGame()
  return true
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
  closeDetails('#wrapper-1', true)
  closeDetails('#wrapper-2', true)

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
  document.querySelector('#result').classList.add('hidden')
  document.querySelector('#pyro').classList.add('hidden')
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
 * extend the arguments in detail with sources from sources if available
 *
 * @param {HTMLElement} detail content DOM node containing the arguments
 */
async function addSources(detail, counters = true) {
  const sources = elementWithKids('div')
  sources.innerHTML =  await fetchSilent('sources.html')
  Array.from(detail.querySelectorAll('a[id]')).forEach(a => {
    const links = sources.querySelectorAll(`a.${a.id}`)
    const counter = Array.from(sources.querySelectorAll(`q.${a.id}`)).map(q => q.innerText)
    links.forEach(link => link.target = '_blank')
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
    if (counters && counter.length > 0) {
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
 * Set the permalink for the details side of the given card wrapper
 *
 * @param {HTMLElement} wrapper the card wrapper
 * @param {string[]} ids list of ids to include in the permalink
 */
function setPermalink(wrapper, ids) {
  const permalink = wrapper.querySelector('.permalink')
  if (ids) {
    permalink.classList.remove('hidden')
    permalink.href = `${window.location.origin}/#${ids.join('&')}`
  } else
    permalink.classList.add('hidden')
}

/**
 * show selected details, add the CSS 'single' classes if only one is shown
 * @param {HTMLElement} wrapper the event that triggered the open action
 * @param {string[]} ids list of ids to show
 */
function singleDetails(wrapper, ids, permalink = true) {
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
  setPermalink(wrapper, permalink ? ids : false)
}

/**
 * show/hide all sources boxes if available
 *
 * @param {Event} event the Event triggering the action
 * @param {boolean} show true if the sources should be made visible false otherwise
 */
function showSources(event, show = true) {
  const wrapper = event.target.closest('.card-wrapper')
  wrapper.querySelectorAll('q').forEach(q => q.classList.toggle('hidden', !show))
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


/** Apply safari fix to force flex relayout on given div
 */
function safariFix(div) {
  div.parentElement.style.display = 'none'
  div.parentElement.offsetHeight
  div.parentElement.style.display = ''
}


/**
 * fetch a file from server, suppressing all errors, showing a spinner
 *
 * @param {string} url - the url to fetch
 * @return {Promise<string>} the files content or '' on error
 */
function fetchSilent(url) {
  document.querySelector('#loader').classList.remove('hidden')
  return fetchSilentNoSpinner(url).finally(() =>  document.querySelector('#loader').classList.add('hidden'))
}


/**
 * fetch a file from server, suppressing all errors, no spinner
 *
 * @param {string} url - the url to fetch
 * @return {Promise<string>} the files content or '' on error
 */
function fetchSilentNoSpinner(url) {
  return fetch(url).then(async response => response.status >= 400 && response.status < 600 ? '' : await response.text()).catch(error => '')  
}

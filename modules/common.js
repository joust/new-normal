// New Normal needs a browser with at least fetch support
if (!('fetch' in window)) alert('Please user a modern Browser to play New Normal!')

// ServiceWorker is a progressive technology. Ignore unsupported browsers
if ('serviceWorker' in navigator)
  navigator.serviceWorker.register('../sw.js').then(registration => registration.update())      

export const supported = ['de', 'da', 'en', 'es', 'pl', 'it', 'pt', 'fr', 'nl']
export const locales = ['de-de', 'de-ch', 'de-at', 'en-us', 'es-gb', 'pt-br']
const localDirs = [ 'de/de', 'de/ch', 'de/at', 'en/us', 'es/gb', 'pt/br']
export const attitude = { hasty: false, curious: true, open: false, fair: false, correct: false, friendly: false, exclusions: '' }
export let language, territory

export function setLocale(locale) {
  [language, territory] = locale.split('-').map(s => s.toLowerCase())
}

/**
 * start the app with the given locale and start the matching intro
 *
 * @param {?string} locale optional locale string like 'de-de'. if not present, browser locale is used
 */
window.load = function(locale) {
  loadAttitude()
  if (locale) {
    [language, territory] = locale.split('-')
  } else {
    [language, territory] = browserLocale()
    if (!supported.includes(language)) [language, territory] = ['en', 'us']
    locale = `${language}-${territory}`
  }
  document.querySelector('.location').value = locale
  document.body.lang = locales.includes(locale) ? locale : language

  if (!window.location.hash || !displayHash(window.location.hash.substring(1)))
    if (attitude.hasty) show('start'); else runIntro()
}

/**
 * load and show the given page by patching innerHTML of element '#menu content'
 *
 * @param {string} page name of the page to load
 */
window.show = async function(page) {
  document.querySelector('.logo').style.display = page === 'intro' ? 'none' : 'block'
  element('menu').classList.add('hidden')
  const locale = `${language}/${territory}`
  let content = ''
  if (localDirs.includes(locale)) content = await fetchSilent(`content/${locale}/${page}.html`)
  if (content === '') content = await fetchSilent(`content/${language}/${page}.html`)
  if (page === 'intro') content = content.replace('NN_YEAR', `<b>${getNNYear()}</b>`)
  document.querySelector('#menu .content').innerHTML = content
  document.querySelector('#menu .content').setAttribute('class', `content ${page}`)
  element('menu').scrollTop = 0
  if (page==='attitude') initAttitude()
  setTimeout(() => element('menu').classList.remove('hidden'), 50)
}

/**
 * run intro by a timed display of its frames. can be skipped with skipIntro()
 */
let timer = null
async function runIntro() {
  await show('intro')
  element('menu').classList.add('intro-mod')
  let frame = document.querySelector('#menu .frame')
  const nextFrame = () => {
    frame.classList.toggle('show')
    frame = frame.nextElementSibling
    if (frame) {
      frame.classList.toggle('show')
      timer = setTimeout(nextFrame, 60 * frame.textContent.length)
    } else {
      timer = null
      element('menu').classList.remove('intro')
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
  element('menu').classList.remove('intro-mod')
  show('start')
}

/**
 * stop the pyro effect by setting CSS 'hidden' class
 */
function stopPyro() {
  element('pyro').classList.add('hidden')
}

function getNNYear() {
  return Math.ceil((Date.now() - new Date(2020, 2, 20).getTime()) / (365*24*60*60*1000))
}

/**
 * transfer the current attitude to the attitude page for editing
 */
export function initAttitude() {
  for (let a in attitude)
    if (a !== 'exclusions')
      document.querySelector(`#menu #${a}`).checked = attitude[a]
}

/**
 * save a single attitude locally and to local storage if available
 */
export function saveAttitude(a, value) {
  attitude[a] = value
  if (localStorage)
    localStorage.setItem(a, a==='exclusions' ? value : value ? 'true' : 'false')
}


/**
 * load all attitudes from local storage if available
 */
export function loadAttitude() {
  if (localStorage)
    for (let a in attitude) {
      if (localStorage.getItem(a) !== null)
        attitude[a] = a === 'exclusions' ? localStorage.getItem(a) : localStorage.getItem(a)==='true'
    }
}

/**
 * generates an archive.is mirror anchor node for the given node
 *
 * @param {HTMLElement} a the anchor node to mirror
 */
export function mirrorNode(a) {
  const mirror = a.cloneNode(true)
  mirror.href = `https://archive.is/${a.href}`
  mirror.firstChild.textContent = 'Mirror'
  return mirror
}

/**
 * get browser two-character-codes for languageuage and territoryitory in lower case
 *
 * @return {string[]} an 2-entry-array with the browser languageuage and territoryitory
 */
function browserLocale() {
  let [language, territory] = navigator.language.split('-')
  territory = territory ? territory.toLowerCase() : language
  return [language, territory]
}

/**
 * create a DOM Element, optionally with children and attributes.
 * Any string given as kids will be converted in an HTML text node
 *
 * @param {string} tag - tag name for the element to create
 * @param {(string|HTMLElement)|(string|HTMLElement)[]} kids - an element or string, or an array of elements or strings
 * @param {Object} attrs - optional attributes to set
 * @return {HTMLElement} The created element
 */
export function elementWithKids(tag, kids = undefined, attrs = undefined) {
  const node = document.createElement(tag)
  if (attrs) for (const attr in attrs) node.setAttribute(attr, attrs[attr])
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
 * @param {String} HTML representing a single element
 * @return {Element}
 */
export function htmlToElement(html) {
  var template = document.createElement('template')
  template.innerHTML = html
  return template.content.firstChild
}

export function element(id) {
  return document.getElementById(id)
}

export function elements(tag) {
  return Array.from(document.getElementsByTagName(tag))
}

/**
 * select a unique random element from an array
 * side effect: The element is removed from from the array to achieve the uniqueness!
 *
 * @param {Array} wordset - Array to choose a random element from
 * @return {any} The random element selected
 */
export function uniqueWord(wordset) {
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
export function randomElement(array, start = 0) {
  return array[start + Math.floor((Math.random() * (array.length-start)))]
}

/**
 * Shuffles array in place (side effect).
 * @param {Array} array An array containing the items.
 * @return {Array} the shuffled array
 */
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * selects n elements from a list (which can be longer or shorter than n)
 * if list has no entries, an empty array is returned
 * @param {number} n number of cards to select.
 * @param {Array} list the list to select from.
 * @return {any} The selected elements
 */
export function elementsFrom(n, list) {
  const selection = []
  if (!list.length) return selection
  while (n >= list.length) {
    selection.push(...list)
    n -= list.length
  }
  const rest = shuffle([...list])
  selection.push(...rest.slice(0, n))
  return selection
}

/** Apply safari fix to force flex relayout on given div
 */
export function safariFix(div) {
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
export function fetchSilent(url) {
  element('loader').classList.remove('hidden')
  return fetchSilentNoSpinner(url).finally(() =>  element('loader').classList.add('hidden'))
}

/**
 * fetch a file from server, suppressing all errors, no spinner
 *
 * @param {string} url - the url to fetch
 * @return {Promise<string>} the files content or '' on error
 */
export function fetchSilentNoSpinner(url) {
  return fetch(url).then(async response => response.status >= 400 && response.status < 600 ? '' : await response.text()).catch(() => '')
}

export function debounce(callback, wait) {
  let timeoutId = null
  return (...args) => {
    window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args)
    }, wait)
  }
}
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
export function browserLocale() {
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
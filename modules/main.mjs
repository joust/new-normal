import { element } from './common.mjs'
import { setLocale, getPage, loadContent } from './content.mjs'
import DragDropWithTouchSupportShim from '../libs/html5-dragdroptouch-shim.mjs'

import { displayHashAsCard } from './bingo.mjs'
import { displayHashAsHand } from './uno.mjs'
import { displayHashAsTest } from './test.mjs'

// New Normal needs a browser with at least fetch support
if (!('fetch' in window)) alert('Please user a modern Browser to play New Normal!')

// ServiceWorker is a progressive technology. Ignore unsupported browsers
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('../sw.js').then(registration => registration.update()) }

export const attitude = { hasty: false, curious: true, open: false, fair: false, correct: false, friendly: false, exclusions: '' }

window.flagcheck = function () {
  if (navigator.userAgent.indexOf('Windows') > 0) { document.head.innerHTML += '<link rel="stylesheet" href="noto.css">' }
}

window.dragdrop = function () {
  if ('ontouchstart' in document) new DragDropWithTouchSupportShim()
}

// prevent dblclick zoom
document.addEventListener('dblclick', event => {
  event.preventDefault()
}, { passive: false })

/**
 * start the app with the given locale and start the matching intro
 *
 * @param {?string} locale optional locale string like 'de-de'. if not present, browser locale is used
 */
window.load = function (locale) {
  loadAttitude()
  setLocale(locale)
  window.show('start')
}

/**
 * load and show the given page by patching innerHTML of element '#menu content'
 *
 * @param {string} page name of the page to load
 */
window.show = async function (page) {
  element('menu').classList.add('hidden')
  if (page === 'uno') await loadContent()
  const content = await getPage(page)
  document.querySelector('#menu .content').innerHTML = content
  document.querySelector('#menu .content').setAttribute('class', `content ${page}`)
  element('menu').scrollTop = 0
  if (page === 'attitude') initAttitude()
  setTimeout(() => element('menu').classList.remove('hidden'), 50)
}

/**
 * stop the pyro effect by setting CSS 'hidden' class
 */
window.stopPyro = function () {
  element('pyro').classList.add('hidden')
}

/**
 * transfer the current attitude to the attitude page for editing
 */
export function initAttitude () {
  for (const a in attitude) {
    if (a !== 'exclusions') { document.querySelector(`#menu #${a}`).checked = attitude[a] }
  }
}

/**
 * save a single attitude locally and to local storage if available
 */
export function saveAttitude (a, value) {
  attitude[a] = value
  if (window.localStorage) { window.localStorage.setItem(a, a === 'exclusions' ? value : value ? 'true' : 'false') }
}

/**
 * load all attitudes from local storage if available
 */
export function loadAttitude () {
  if (window.localStorage) {
    for (const a in attitude) {
      if (window.localStorage.getItem(a) !== null) { attitude[a] = a === 'exclusions' ? window.localStorage.getItem(a) : window.localStorage.getItem(a) === 'true' }
    }
  }
}

function displayHash (hash) {
  const first = hash.toLowerCase().split('&')[0]
  const rest = hash.toUpperCase().split('&').map(v => v.split('=')[0]).slice(1)
  switch (first) {
    case 'test': return displayHashAsTest(rest)
    case 'card':
    case 'uno':
    case 'hand': return displayHashAsHand(rest)
    case 'bingo': return displayHashAsCard(rest)
    default: return displayHashAsCard([first, ...rest]) // backward compatibility
  }
}

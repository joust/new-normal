import { element } from './common.mjs'
import { setLocale, getPage, loadContent } from './content.mjs'
import DragDropWithTouchSupportShim from '../libs/html5-dragdroptouch-shim.mjs'

import { displayHashAsCard } from './bingo.mjs'
import { displayHashAsHand } from './uno.mjs'
import { displayHashAsTest } from './test.mjs'

// New Normal needs a browser with at least fetch support
if (!('fetch' in window)) alert('Please user a modern Browser to play New Normal!')

// ServiceWorker is a progressive technology. Ignore unsupported browsers
if ('serviceWorker' in navigator)
  navigator.serviceWorker.register('../sw.js').then(registration => registration.update())

export const attitude = { hasty: false, curious: true, open: false, fair: false, correct: false, friendly: false, exclusions: '' }

window.flagcheck = function() {
  if (navigator.userAgent.indexOf('Windows') > 0)
    document.head.innerHTML += '<link rel="stylesheet" href="noto.css">'
}

window.dragdrop = function() {
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
window.load = function(locale) {
  loadAttitude()
  setLocale(locale)
  if (!window.location.hash || !displayHash(window.location.hash.substring(1)))
    if (attitude.hasty) window.show('start'); else runIntro()
}

/**
 * load and show the given page by patching innerHTML of element '#menu content'
 *
 * @param {string} page name of the page to load
 */
window.show = async function(page) {
  document.querySelector('.logo').style.display = page === 'intro' ? 'none' : 'block'
  element('menu').classList.add('hidden')
  if (page==='uno') await loadContent()
  const content = (page === 'intro') ? await getPage(page) : (await getPage(page)).replace('NN_YEAR', `<b>${getNNYear()}</b>`)
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
      element('menu').classList.remove('intro-mod')
      show('start')
    }
  }
  frame.classList.toggle('show')
  timer = setTimeout(nextFrame, 60 * frame.textContent.length)
}

/**
 * skip intro by stopping its timer and show the start menu
 */
window.skipIntro = function() {
  if (timer) clearTimeout(timer)
  saveAttitude('hasty', true)
  element('menu').classList.remove('intro-mod')
  show('start')
}

/**
 * stop the pyro effect by setting CSS 'hidden' class
 */
window.stopPyro = function() {
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

function displayHash(hash) {
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

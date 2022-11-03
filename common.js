// New Normal needs a browser with at least fetch support
if (!('fetch' in window)) alert('Please user a modern Browser to play New Normal!')

// ServiceWorker is a progressive technology. Ignore unsupported browsers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
}

const supported = ['de', 'da', 'en', 'es', 'pl', 'it', 'pt', 'fr']
const locals = [ 'de/de', 'de/ch', 'de/at', 'en/us', 'es/gb', 'pt/br']
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
  if (!supported.includes(lang)) [lang, terr] = ['en', 'us']
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
  const local = `${lang}/${terr}`
  let content = ''
  if (locals.includes(local)) content = await fetchSilent(`${local}/${page}.html`)
  if (content === '') content = await fetchSilent(`${lang}/${page}.html`)
  if (page === 'intro') content = content.replace('NN_YEAR', ''+getNNYear())
  document.querySelector('#menu .content').innerHTML = content
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
 * get localized content (topics + arguments)
 *
 * @param {boolean} idiot whether to load the idiot or sheep arguments
 */
async function getLocalizedContent(idiot) {
  const file = idiot ? 'idiot.html' : 'sheep.html'
  let content = await fetchSilent(`${lang}/${file}`)
  setBaseContent(content, lang, idiot)
  const local = `${lang}/${terr}`
  if (locals.includes(local))
    content = mergeContent(content, await fetchSilent(`${local}/${file}`))

  return `<div lang="${lang}" class="tr">${content}</div>${(await getLocalizedTopics(content + local, idiot))}`
}

/**
 * merge territory local content into language specific content
 * replacing redefined arguments, adding unique local arguments
 *
 * @param {string} content language specific argument content
 * @param {string} local territory local argument content
 */
function mergeContent(content, local) {
  const args = elementWithKids('div'), largs = elementWithKids('div')
  args.innerHTML = content
  largs.innerHTML = local
  const last = args.querySelector('a:last-of-type')
  const lh1 = largs.querySelector('h1.local')
  Array.from(largs.querySelectorAll('a[id]')).reverse().forEach(la => {
    const a = args.querySelector(`a[id="${la.id}"]`)
    if (a) {
      args.replaceChild(la, a)
    } else {
      last.after(la)
    }
  })
  if (lh1) last.after(lh1);

  ['select', 'label', 'input', 'h1:not(.local)', 'center.bingo', 'center.test'].forEach(s => {
    const replacement = largs.querySelector(s)
    if (replacement) args.replaceChild(replacement, args.querySelector(s))
  })

  return args.innerHTML
}

/**
 * get topics data with localized topics, arguments, titles and labels
 */
async function getLocalizedTopics(localizedArgs, idiot) {
  const args = elementWithKids('div')
  args.innerHTML = localizedArgs
  const topics = elementWithKids('div')
  const localTopics = elementWithKids('div')
  topics.innerHTML = await fetchSilent('topics.html')
  localTopics.innerHTML = await fetchSilent(`${lang}/topics.html`)
  Array.from(localTopics.querySelectorAll('a')).forEach(la => {
    const a = topics.querySelector(`#${la.id}`)
    if (a) {
      la.dataset.idiot = a.dataset.idiot + (la.dataset.idiot ? ` ${la.dataset.idiot}` : '')
      la.dataset.sheep = a.dataset.sheep + (la.dataset.sheep ? ` ${la.dataset.sheep}` : '')
    }
    const ul = elementWithKids('ul')
    const targs = idiot ? la.dataset.idiot : la.dataset.sheep
    for (const targ of targs.split(' ')) if (targ.length) {
      const title = args.querySelector(`#${targ}`)
      title && ul.appendChild(elementWithKids('li', [elementWithKids('span', targ), elementWithKids('h3', [elementWithKids('a', title.innerText, { href: `#${targ}` })])]))
    }
    la.after(ul)
  })
  return localTopics.innerHTML
}

function getNNYear() {
  return Math.ceil((Date.now() - new Date(2020, 2, 20).getTime()) / (365*24*60*60*1000))
}

/**
 * show idiot, sheep or test cards corresponding to the id(s) given in the hash
 *
 * @param {string} hash with comma separated ids of argument(s) to show
 * @return {boolean} true if success false otherwise
 */
async function displayHash(hash) {
  const ids = hash.toUpperCase().split('&').map(v => v.split('=')[0])
  const idiot = ids.filter(v => v.startsWith('I'))
  const sheep = ids.filter(v => v.startsWith('S'))
  const test = ids.filter(v => v.startsWith('T'))
  const wrapper1 = document.querySelector('#wrapper-1')
  const wrapper2 = document.querySelector('#wrapper-2')
  if (test.length) {
    await loadTestCard(wrapper1, true, 0, 5)
    await loadTestCard(wrapper2, false, 25, 5)
    initTestStats(5, 5)
    const td = document.querySelector(`td[id="${test[0]}"]`)
    if (td) td.click(); else console.error('no element', test[0])
  } else {
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
 * @param {MouseEvent} event - the input event
 */
function search(event) {
  const wrapper = event.target.closest('.card-wrapper')
  const input = event.target.value.toLowerCase()
  const args = Array.from(wrapper.querySelectorAll('a[id]'))
  args.forEach(a => a.classList.remove('not-matching'))
  const notMatching = input.length ? args.filter(a => !a.textContent.replace(/\u00ad/gi, '').toLowerCase().includes(input)) : []
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
 * extract topics from HTML content
 *
 * @param {HTMLElement} detail - content DOM node containing the arguments
 * @return {Array} the extracted topics
 */
function getTopics(detail) {
  return Array.from(detail.querySelectorAll('a[id^=T]:not(.excluded)')).map(a => ({
    id: a.id,
    idiot: a.dataset.idiot.split(' '),
    sheep: a.dataset.sheep.split(' '),
    idiotLabel: a.dataset.idiotLabel,
    sheepLabel: a.dataset.sheepLabel,
    idiotTitle: a.dataset.idiotTitle,
    sheepTitle: a.dataset.sheepTitle,
    title: a.querySelector('h2').innerHTML
    })
  )
}

/**
 * extract idiot/sheep arguments for a given topic for showing a tooltip
 *
 * @param {HTMLElement} detail - content DOM node containing the arguments
 * @param {string} topicId - the topic id
 * @param {boolean} idiot - idiot or sheep
 * @return {string} the extracted arguments
 */
function getArgumentsForTopic(detail, topicId, idiot) {
  const topic = detail.querySelector(`a[id="${topicId}"]`)
  const args = topic ? topic.dataset[idiot ? 'idiot' : 'sheep'].split(' ') : []
  return args.map(argId => {
    const arg = detail.querySelector(`a[id="${argId}"] h2`)
    if (!arg) console.log(`no arg for id ${argId}`)
    return arg ? arg.innerHTML : ''
  }).join('\n')
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
 * add an empty navigation element to the card
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 */
function addNavigationToCard(wrapper) {
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
function setNavigation(wrapper, topicId, ids, selected, bingo) {
  const content = wrapper.querySelector('.content')
  const navigation = elementWithKids('p', ids.flatMap(id => {
    const idtag = elementWithKids('span', id)
    idtag.onclick = () => singleDetails(wrapper, topicId, ids, id, bingo)
    if (id === selected) idtag.classList.add('selected')
    return ['\u00ad', idtag]
  }))
  navigation.id = topicId ? topicId : 'nav'
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
function singleDetails(wrapper, topicId, ids, selected = undefined, permalink = true) {
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
function showSources(event, show = true) {
  const wrapper = event.target.closest('.card-wrapper')
  wrapper.querySelectorAll('q').forEach(q => q.classList.toggle('hidden', !show))
}

/**
 * update a topics based (test/bingo) card with a different language
 * @param {Array} topics true if the sources should be made visible false otherwise
 * @param {boolean} idiot true if idiot content
 * @param {HTMLElement} wrapper wrapper element of the card
 */
function updateCard(wrapper, topics, idiot = undefined) {
  wrapper.querySelectorAll('td[id]').forEach(td => {
    const topic = topics.find(t => t.id === td.id)
    if (topic) {
      td.innerHTML = idiot === true ? topic.idiotTitle : idiot === false ? topic.sheepTitle : topic.title
      td.title = getArgumentsForTopic(wrapper, topic.id, idiot)
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
 * create a DOM Element, optionally with children and attributes.
 * Any string given as kids will be converted in an HTML text node
 *
 * @param {string} tag - tag name for the element to create
 * @param {(string|HTMLElement)|(string|HTMLElement)[]} kids - an element or string, or an array of elements or strings
 * @param {Object} attrs - optional attributes to set
 * @return {HTMLElement} The created element
 */
function elementWithKids(tag, kids = undefined, attrs = undefined) {
  const node = document.createElement(tag)
  if (attrs) for (attr in attrs) node.setAttribute(attr, attrs[attr])
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
 * select a unique random element from an array
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
  return fetch(url).then(async response => response.status >= 400 && response.status < 600 ? '' : await response.text()).catch(() => '')
}

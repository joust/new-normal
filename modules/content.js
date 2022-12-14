import { elementWithKids, htmlToElement, fetchSilent, browserLocale } from './common.js' 

export const supported = ['de', 'da', 'en', 'es', 'pl', 'it', 'pt', 'fr', 'nl']
export const locales = ['de-de', 'de-ch', 'de-at', 'en-us', 'es-gb', 'pt-br']
export const localDirs = [ 'de/de', 'de/ch', 'de/at', 'en/us', 'es/gb', 'pt/br']
export let language, territory

const path = 'content/pandemic'

export function setLocale(locale) {
  if (locale) {
    [language, territory] = locale.split('-').map(s => s.toLowerCase())
  } else {
    [language, territory] = browserLocale()
    if (!supported.includes(language)) [language, territory] = ['en', 'us']
    locale = `${language}-${territory}`
  }
  if (document.querySelector('.location')) document.querySelector('.location').value = locale
  document.body.lang = locales.includes(locale) ? locale : language
}

export async function getPage(page) {
  const locale = `${language}/${territory}`
  let content = ''
  if (localDirs.includes(locale)) content = await fetchSilent(`${path}/${locale}/${page}.html`)
  if (content === '') content = await fetchSilent(`${path}/${language}/${page}.html`)
  return content
}

/**
 * load all sources
 */
export async function loadSources(fetch = fetchSilent) {
  const loaded = document.querySelector('#content > .sources')
  if (!loaded) {
    const sources = elementWithKids('div', null, { 'class': 'sources' })
    document.querySelector('#content').appendChild(sources)
    sources.innerHTML = await fetch(`${path}/sources.html`)
    Array.from(sources.querySelectorAll('a')).forEach(link => link.target = '_blank')
  }
}

export async function saveSources(save) {
  const sources = document.querySelector('#content > .sources')
  Array.from(sources.querySelectorAll('a')).forEach(link => link.removeAttribute('target'))
  await save(`${path}/sources.html`, sources.innerHTML)
  Array.from(sources.querySelectorAll('a')).forEach(link => link.target = '_blank')
}

export function localeBlock() {
  const locale = `${language}-${territory}`
  const id = locales.includes(locale) ? locale : language
  return document.querySelector(`#content > #${id}`)
}

export function getSources() {
  return document.querySelector('#content .sources')
}

export function getTopics() {
  return localeBlock().querySelector('.topics')
}

export function getTopic(topicId) {
  return getTopics().querySelector(`section[id="${topicId}"]`)
}

export function getArgument(id) {
  return localeBlock().querySelector(`a[id="${id}"]`)
}

export function getLabels(idiot) {
  const filter = idiot ? 'a[id^=LI]' : 'a[id^=LS]'
  return Array.from(localeBlock().querySelectorAll(`.labels > ${filter} h2`))
}

export function getLocalizedContent(idiot) {
  const type = idiot ? 'idiot' : 'sheep'
  const content = localeBlock().querySelector(`.${type}`)
  return content.innerHTML
}

/**
 * merge territory local content into language specific content
 * replacing redefined arguments, adding unique local arguments
 *
 * @param {string} content language specific argument content
 * @param {string} local territory local argument content
 */
function mergeContent(content, local) {
  const args = elementWithKids('div'),
    largs = elementWithKids('div')
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
  if (lh1) last.after(lh1)

  ;
  ['label', 'input', 'h1:not(.local)', 'center.bingo'].forEach(s => {
    const replacement = largs.querySelector(s)
    if (replacement) args.replaceChild(replacement, args.querySelector(s))
  })

  return args.innerHTML
}

// public
export async function loadContent(fetch = fetchSilent) {
  const loaded = localeBlock()
  if (!loaded) {
    const locale = `${language}-${territory}`
    const id = locales.includes(locale) ? locale : language
    const root = elementWithKids('div', [
      elementWithKids('div', null, { 'class': 'idiot' }),
      elementWithKids('div', null, { 'class': 'sheep' }),
      elementWithKids('div', null, { 'class': 'labels' }),
      elementWithKids('div', null, { 'class': 'cancels' }),
      elementWithKids('div', null, { 'class': 'appeal-tos' }),
      elementWithKids('div', null, { 'class': 'fallacies' }),
      elementWithKids('div', null, { 'class': 'topics' }),
      elementWithKids('div', null, { 'class': 'messages' })
    ], { id })
    document.querySelector('#content').appendChild(root)
    const [idiot, sheep, labels, cancels, appealTos, fallacies, topics, messages] = await Promise.all([
      fetchLocalizedContent(fetch, true),
      fetchLocalizedContent(fetch, false),
      fetch(`${path}/${language}/labels.html`),
      fetch(`${path}/${language}/cancels.html`),
      fetch(`${path}/${language}/appeal-tos.html`),
      fetch(`${path}/${language}/fallacies.html`),
      fetchLocalizedTopics(fetch),
      fetch(`${path}/${language}/messages.html`),
    ])
    root.querySelector('.idiot').innerHTML = idiot
    root.querySelector('.sheep').innerHTML = sheep
    root.querySelector('.labels').innerHTML = labels
    root.querySelector('.cancels').innerHTML = cancels
    root.querySelector('.appeal-tos').innerHTML = appealTos
    root.querySelector('.fallacies').innerHTML = fallacies
    root.querySelector('.topics').innerHTML = topics
    root.querySelector('.messages').innerHTML = messages
    return root
  }
  return loaded
}

/**
 * get localized content arguments
 *
 * @param {boolean} idiot whether to load the idiot or sheep arguments
 */
async function fetchLocalizedContent(fetch = fetchSilent, idiot) {
  const file = idiot ? 'idiot.html' : 'sheep.html'
  let content = await fetch(`${path}/${language}/${file}`)
  const locale = `${language}-${territory}`
  if (locales.includes(locale))
    content = mergeContent(content, await fetch(`${path}/${language}/${territory}/${file}`))

  return content
}

/**
 * get topics data with localized topics, arguments, titles and labels
 */
async function fetchLocalizedTopics(fetch = fetchSilent) {
  const locale = `${language}-${territory}`
  const id = locales.includes(locale) ? locale : language
  const topics = elementWithKids('div')
  const localTopics = elementWithKids('div')
  topics.innerHTML = await fetch(`${path}/topics.html`)
  let localHTML = await fetch(`${path}/${id}/topics.html`)
  if (!localHTML.length && id !== language) localHTML = await fetch(`${path}/${language}/topics.html`)
  localTopics.innerHTML = localHTML
  Array.from(localTopics.querySelectorAll('section')).forEach(localSection => {
    const section = topics.querySelector(`#${localSection.id}`)
    if (section)
      Array.from(section.querySelectorAll('a[id]')).forEach(a => localSection.appendChild(a))
  })
  return localTopics.innerHTML
}


function htmlFix(content) {
  const shy = s => s.replace(/\xad/g, '&shy;')
  const rsquo = s => s.replace(/’/g, '&rsquo;')
  const lsquo = s => s.replace(/‘/g, '&lsquo;')
  return shy(rsquo(lsquo(content)))
}

export async function saveContent(save, type) {
  const content = localeBlock().querySelector(`.${type}`)
  const locale = `${language}-${territory}`
  const localFile = locales.includes(locale) ? `${path}/${language}/${territory}/${type}.html` : undefined
  const globalFile = type==='topics' ? `${path}/${type}.html` : `${path}/${language}/${type}.html`
  if (content) {
    switch (type) {
      case 'idiot':
      case 'sheep': {
        const global = content.cloneNode(true)
        Array.from(global.querySelectorAll('a[id]')).filter(e => RegExp(/[IS][A-Z][A-Z][0-9]*/).test(e.id)).forEach(e => e.parentElement.removeChild(e))
        await save(globalFile, htmlFix(global.innerHTML))
        if (localFile) {
          const local = content.cloneNode(true)
          Array.from(local.querySelectorAll('a[id]')).filter(e => RegExp(/[IS][0-9]*/).test(e.id)).forEach(e => e.parentElement.removeChild(e))
          await save(localFile, htmlFix(local.innerHTML))
        }
        break
      }
      case 'topics': {
        const global = content.cloneNode(true)
        Array.from(global.querySelectorAll('section[id], a[id]')).filter(e => RegExp(/[IS][A-Z][A-Z][0-9]*/).test(e.id)).forEach(e => e.parentElement.removeChild(e))
        Array.from(global.querySelectorAll('section[id]'))
          .forEach(e => ['title', 'data-idiot-title', 'data-sheep-title', 'data-idiot-label', 'data-sheep-label'].forEach(attr => e.removeAttribute(attr)))
        await save(globalFile, htmlFix(global.innerHTML))
        if (localFile) {
          const local = content.cloneNode(true)
          Array.from(local.querySelectorAll('a[id]')).filter(e => RegExp(/[IS][0-9]*/).test(e.id)).forEach(e => e.parentElement.removeChild(e))
          await save(localFile, htmlFix(local.innerHTML))
        }
        break
      }
      case 'fallacies':
      case 'appeal-tos':
      case 'labels':
      case 'messages':
      case 'cancels':
        await save(globalFile, htmlFix(content.innerHTML))
    }
  }
}

/** Extract all topics and arguments into a topics array and both a topics array and hash
 * @return {Array} The topic id array and a hash argumentId => [topicId]
 */
export function extractTopics(content) {
  const topicIds = Array.from(content.querySelectorAll('section')).map(topic => topic.id)
  const map = {}
  for (const id of topicIds) {
    const argIds = Array.from(content.querySelectorAll(`section[id="${id}"] a[id]`)).map(arg => arg.id)
    for (const argId of argIds) if (map[argId]) map[argId].push(id); else map[argId] = [id]
  }
  return [topicIds, map]
}

/**
 * extract topics meta data
 *
 * @return {Array} the extracted topics meta data
 */
export function getTopicsData() {
  const topics = getTopics()
  return Array.from(topics.querySelectorAll('section')).map(topic => ({
      id: topic.id,
      idiot: Array.from(topic.querySelectorAll('a[id^=I]')).map(a => a.id),
      sheep: Array.from(topic.querySelectorAll('a[id^=S]')).map(a => a.id),
      idiotLabel: topic.dataset.idiotLabel,
      sheepLabel: topic.dataset.sheepLabel,
      idiotTitle: topic.dataset.idiotTitle,
      sheepTitle: topic.dataset.sheepTitle,
      title: topic.title
    })
  )
}

/**
 * Fetch ids from given content file, optionally filter by substring.
 * @param {string} file The filename (without suffix).
 * @param {string} filter An optional string filter.
 * @return {Array} The content ids
 */
function extractContentIds(content, section, filter = undefined) {
  filter = filter ? `^=${filter}` : ''
  return Array.from(content.querySelectorAll(`.${section} a[id${filter}]`)).map(a => a.id)
}

/**
 * helper for init, loading one side of the arguments
 * @return {any} A content structure
 */
function extractContentForSide(content, topics, map, idiot) {
  const topicMapped = id => map[id] ? map[id].map(topicId => `${topicId}:${id}`) : [`:${id}`]
  const args = extractContentIds(content, idiot ? 'idiot' : 'sheep').flatMap(topicMapped)
  const labels = extractContentIds(content, 'labels', idiot ? 'LI' : 'LS')
  const cancels = extractContentIds(content, 'cancels', idiot ? 'CI' : 'CS')
  const fallacies = extractContentIds(content, 'fallacies', idiot ? 'FI' : 'FS')
  const appealTos = extractContentIds(content, 'appeal-tos', idiot ? 'AI' : 'AS')
  const discusses = topics.map(topic => `${topic}:${idiot ? 'DI' : 'DS'}`)
  return { args, labels, cancels, fallacies, appealTos, discusses }
}

/**
 * perform initialization by extracting all needed files so the game engine can run sync
 * @return {any} A content structure
 */
export function extractContent() {
  const content = localeBlock()
  const [topics, map] = extractTopics(content)
  const idiot = extractContentForSide(content, topics, map, true)
  const sheep = extractContentForSide(content, topics, map, false)
  return {idiot, sheep}
}

/**
 * query string content for a translation key (classes list)
 * @param {string} key the content key, e.g. 'prompt.info'.
 * @param {string} fallback the fallback string
 * @return {any} A content structure
 */
export function getMessage(key, fallback = '???') {
  const node = localeBlock().querySelector(`.messages a.${key}`)
  return node ? node.innerHTML : fallback
}

/**
 * Generate label select
 * @param {boolean} idiot use idiot or sheep labels
 * @return {string} select HTML
 */
export function labelSelect(idiot) {
  const labels = getLabels(idiot).map(label => `<option>${label.innerHTML}</option>`)
  return htmlToElement(`<select id="label">${labels}</select>`)
}


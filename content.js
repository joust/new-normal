const locales = ['de-de', 'de-ch', 'de-at', 'en-us', 'es-gb', 'pt-br']

/**
 * load all sources
 */
async function loadSources() {
  const loaded = document.querySelector('#content > .sources')
  if (!loaded) {
    const sources = elementWithKids('div', null, {
      'class': 'sources'
    })
    document.querySelector('#content').appendChild(sources)
    sources.innerHTML = await fetchSilent(`content/sources.html`)
    Array.from(sources.querySelectorAll('a')).forEach(link => link.target = '_blank')
  }
}

function langBlock(lang, terr) {
  const locale = `${lang}-${terr}`
  const id = locales.includes(locale) ? locale : lang
  return document.querySelector(`#content > #${id}`)
}

// public
function getSources() {
  return document.querySelector('#content .sources')
}

// public
function getTopics(lang, terr) {
  return langBlock(lang, terr).querySelector('.topics')
}

// public
function getTopic(lang, terr, topicId) {
  return getTopics(lang, terr).querySelector(`section[id="${topicId}"]`)
}

// public
function getArgument(lang, terr, id) {
  return langBlock(lang, terr).querySelector(`a[id="${id}"]`)
}

// public
function getLabels(lang, terr, idiot) {
  const filter = idiot ? 'a[id^=LI]' : 'a[id^=LS]'
  return Array.from(langBlock(lang, terr).querySelectorAll(`.labels > ${filter} h2`))
}

// public
function getLocalizedContent(lang, terr, idiot) {
  const type = idiot ? 'idiot' : 'sheep'
  const content = langBlock(lang, terr).querySelector(`.${type}`)
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
  ['label', 'input', 'h1:not(.local)', 'center.bingo', 'center.test'].forEach(s => {
    const replacement = largs.querySelector(s)
    if (replacement) args.replaceChild(replacement, args.querySelector(s))
  })

  return args.innerHTML
}

// public
async function loadContent(lang, terr) {
  const loaded = langBlock(lang, terr)
  if (!loaded) {
    const locale = `${lang}-${terr}`
    const id = locales.includes(locale) ? locale : lang
    const root = elementWithKids('div', [
      elementWithKids('div', null, {
        'class': 'idiot'
      }),
      elementWithKids('div', null, {
        'class': 'sheep'
      }),
      elementWithKids('div', null, {
        'class': 'labels'
      }),
      elementWithKids('div', null, {
        'class': 'appeal-tos'
      }),
      elementWithKids('div', null, {
        'class': 'fallacies'
      }),
      elementWithKids('div', null, {
        'class': 'topics'
      })
    ], {
      id
    })
    document.querySelector('#content').appendChild(root)
    const [idiot, sheep, labels, appealTos, fallacies, topics, sources] = await Promise.all([
      fetchLocalizedContent(lang, terr, true),
      fetchLocalizedContent(lang, terr, false),
      fetchSilent(`content/${lang}/labels.html`),
      fetchSilent(`content/${lang}/appeal-tos.html`),
      fetchSilent(`content/${lang}/fallacies.html`),
      fetchLocalizedTopics(lang, terr)
    ])
    root.querySelector('.idiot').innerHTML = idiot
    root.querySelector('.sheep').innerHTML = sheep
    root.querySelector('.labels').innerHTML = labels
    root.querySelector('.appeal-tos').innerHTML = appealTos
    root.querySelector('.fallacies').innerHTML = fallacies
    root.querySelector('.topics').innerHTML = topics
    return root
  }
  return loaded
}

/**
 * get localized content arguments
 *
 * @param {lang} lang the language
 * @param {terr} terr the territory
 * @param {boolean} idiot whether to load the idiot or sheep arguments
 */
async function fetchLocalizedContent(lang, terr, idiot) {
  const file = idiot ? 'idiot.html' : 'sheep.html'
  let content = await fetchSilent(`content/${lang}/${file}`)
  const locale = `${lang}-${terr}`
  if (locales.includes(locale))
    content = mergeContent(content, await fetchSilent(`content/${lang}/${terr}/${file}`))

  return content
}

/**
 * get topics data with localized topics, arguments, titles and labels
 */
async function fetchLocalizedTopics(lang, terr) {
  const locale = `${lang}-${terr}`
  const id = locales.includes(locale) ? locale : lang
  const topics = elementWithKids('div')
  const localTopics = elementWithKids('div')
  topics.innerHTML = await fetchSilent('content/topics.html')
  let localHTML = await fetchSilent(`content/${id}/topics.html`)
  if (!localHTML.length && id !== lang) localHTML = await fetchSilent(`content/${lang}/topics.html`)
  localTopics.innerHTML = localHTML
  Array.from(localTopics.querySelectorAll('section')).forEach(localSection => {
    const section = topics.querySelector(`#${localSection.id}`)
    if (section)
      Array.from(section.querySelectorAll('a[id]')).forEach(a => localSection.appendChild(a))
  })
  return localTopics.innerHTML
}


/** Extract all topics and arguments into a topics array and both a topics array and hash
 * @return {Array} The topic id array and a hash argumentId => [topicId]
 */
function extractTopics(content) {
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
function getTopicsData() {
  const topics = getTopics(lang, terr)
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
 * @param {string} lang The language.
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
 * @param {string} lang The language.
 * @return {any} A content structure
 */
function extractContentForSide(content, topics, map, idiot) {
  const topicMapped = id => map[id] ? map[id].map(topicId => `${topicId}:${id}`) : [`:${id}`]
  const args = extractContentIds(content, idiot ? 'idiot' : 'sheep')
  const labels = extractContentIds(content, 'labels', idiot ? 'LI' : 'LS')
  const fallacies = extractContentIds(content, 'fallacies', idiot ? 'FI' : 'FS')
  const appealTos = extractContentIds(content, 'appeal-tos', idiot ? 'AI' : 'AS')
  const discusses = topics.map(topic => `${topic}:${idiot ? 'DI' : 'DS'}`)
  return {args: args.flatMap(topicMapped), labels, fallacies, appealTos, discusses}
}

/**
 * perform async initialization by loading all needed files so the game engine can run sync
 * @param {string} lang The language.
 * @return {any} A content structure
 */
function extractContent(lang, terr) {
  const content = langBlock(lang, terr)
  const [topics, map] = extractTopics(content)
  const idiot = extractContentForSide(content, topics, map, true)
  const sheep = extractContentForSide(content, topics, map, false)
  return {idiot, sheep}
}

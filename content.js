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
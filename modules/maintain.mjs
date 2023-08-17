import { htmlToElement, browserLocale, fetchSilent } from './common.mjs'
import { setLocale, localeBlock, loadContent, saveContent, loadSources, saveSources, extractTopics } from './content.mjs'
import { alert } from '../components/message-box.mjs'
import { initHDD, fetchHDD, saveHDD } from './filesystem.mjs'
import { initLFS, fetchLFS, saveLFS } from './gitlfs.mjs'

let init = warnInit
let fetch = fetchSilent
let save = warnSave

window.connect = async function (target = undefined) {
  if (target === 'lfs') {
    init = initLFS
    fetch = fetchLFS
    save = saveLFS
  } else if (target === 'hdd') {
    init = initHDD
    fetch = fetchHDD
    save = saveHDD
  }
  Array.from(document.querySelectorAll('#connect button, #connect h2')).forEach(button => button.classList.add('hidden'))

  await init()
  loadMaintain()
  await switchLocale()
  navigateTo('arguments')
}

async function warnInit () {
  await alert('Your may edit the application data but you cannot save or contribute!', 'Warning')
}

let warnedOnce = false
async function warnSave () {
  if (!warnedOnce) {
    warnedOnce = true
    await alert('The data you changed will affect your running application but can\'t be saved or contributed!', 'Warning')
  }
}

window.loadMaintain = function () {
  Array.from(document.querySelectorAll('.details.card-preview')).forEach(detail => detail.insertAdjacentHTML('afterbegin', '<centered-cards class="cards"><editable-card class="card"></editable-card></centered-cards>'))
  Array.from(document.querySelectorAll('.card')).forEach(card => card.addEventListener('mutated', event => cardMutated(event)))
  document.querySelector('#arguments .details centered-cards').insertAdjacentHTML('beforeend', '<div class="topics"><ul></ul></div>')
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection()
    const editable = selection.anchorNode.tagName !== 'CENTERED-CARDS'
    document.getElementById('edit-bar').classList.toggle('hidden', !editable)
  })

/*  document.addEventListener('keyup', e => {
    console.log(e)
    if (e.ctrlKey && e.keyCode === 66) toggleBold()
  }, false) */
}

window.switchLocale = async function (locale = undefined, normality = undefined) {
  setLocale(locale)
  await loadContent(fetch)
  await loadSources(fetch)
  updateAll()
}

window.addQuotes = function () {
  const selection = window.getSelection()
  if (selection.rangeCount && selection.anchorNode.tagName !== 'CENTERED-CARDS') {
    const range = selection.getRangeAt(0)
    range.insertNode(document.createTextNode('‘'))
    const clone = range.cloneRange()
    clone.collapse(false) // collapse the range to the end of selection
    clone.insertNode(document.createTextNode('’'))
  }
}

window.toggleBold = function () {
  const selection = window.getSelection()
  if (selection.rangeCount && selection.anchorNode.tagName !== 'CENTERED-CARDS') {
    const range = selection.getRangeAt(0)
    range.surroundContents(document.createElement('b'))
  }
}

window.addShy = function () {
  const selection = window.getSelection()
  if (selection.rangeCount && selection.anchorNode.tagName !== 'CENTERED-CARDS') {
    const range = selection.getRangeAt(0)
    range.insertNode(document.createTextNode('­'))
  }
}

function toArgumentData (arg, topicMap) {
  return {
    arg,
    id: arg.id,
    title: arg.querySelector('h2').innerHTML,
    text: arg.querySelector('p').innerHTML,
    length: arg.querySelector('h2').innerText.length,
    textLength: arg.querySelector('p').innerText.length,
    spellcheck: arg.hasAttribute('spellcheck'),
    topics: topicMap[arg.id] || []
  }
}

function toAppealToData (appealTo) {
  return {
    appealTo,
    id: appealTo.id,
    type: appealTo.id.includes('I') ? 'idiot' : 'sheep',
    class: appealTo.className,
    title: appealTo.querySelector('h2').innerHTML,
    text: appealTo.querySelector('p').innerHTML,
    length: appealTo.innerText.length
  }
}

function toFallacyData (fallacy) {
  return {
    fallacy,
    id: fallacy.id,
    type: fallacy.id.includes('I') ? 'idiot' : 'sheep',
    class: fallacy.className,
    text: fallacy.querySelector('h2').innerHTML,
    length: fallacy.querySelector('h2').innerText.length
  }
}

function toLabelData (label) {
  return {
    label,
    id: label.id,
    type: label.id.includes('I') ? 'idiot' : 'sheep',
    text: label.querySelector('h2').innerHTML,
    length: label.querySelector('h2').innerText.length
  }
}

function toCancelData (cancel) {
  return {
    cancel,
    id: cancel.id,
    type: cancel.id.includes('I') ? 'idiot' : 'sheep',
    text: cancel.querySelector('h2').innerHTML,
    length: cancel.querySelector('h2').innerText.length
  }
}

function toMessageData (message) {
  return {
    message,
    id: message.id,
    class: message.className,
    text: message.innerHTML,
    length: message.innerText.length
  }
}

function toSourceData (source) {
  return {
    source,
    lang: source.lang,
    url: source.href,
    class: source.className,
    text: source.innerHTML,
    length: source.innerHTML.length
  }
}

function getTableSelected (table) {
  const tr = table.querySelector('.selected')
  return tr ? tr.id : undefined
}

function setTableSelected (table, id) {
  const tr = table.querySelector(`tr[id=${id}]`)
  if (tr) {
    tr.classList.add('selected')
    update(tr)
  }
}

window.updateSourcePreview = function (target) {
  const tab = target && target.closest('.tab')
  const tr = target && target.closest('tr')
  if (tab && tr) {
    const url = tr.querySelector('.url').innerText
    tab.querySelector('.preview').src = url
    tab.querySelectorAll('tr').forEach(tr => tr.classList.remove('selected'))
    tr.classList.add('selected')
  }
}

window.update = function (target) {
  const tr = target && target.closest('tr')
  const tab = target && target.closest('.tab')
  if (tab && tr) {
    const card = tr.id
    tab.querySelector('.card').setAttribute('card', card)
    tab.querySelectorAll('tr').forEach(tr => tr.classList.remove('selected'))
    tr.classList.add('selected')
  }
}

window.toggleArgumentTopic = function (event) {
  const argId = event.target.closest('ul').className
  const topicId = event.target.className
  console.log(argId, topicId, event.target.checked)
}

window.updateArgument = function (target) {
  update(target)
  const tr = target && target.closest('tr')
  const tab = target && target.closest('.tab')
  if (tab && tr) {
    const card = tr.id
    const tbody = tab.querySelector('.sources tbody')
    // update argument sources
    const sources = extractSources(document.querySelector('#content .sources')).filter(source => source.class.split(' ').includes(card))
    tbody.innerHTML = ''
    sources.forEach(source => tbody.insertAdjacentHTML('beforeend', sourceRow(source)))
    // update argument topics
    const ul = tab.querySelector('.topics ul')
    ul.className = card
    const topics = extractTopicsData(localeBlock().querySelector('.topics'))
    const assigned = getArgumentData(card).topics
    ul.innerHTML = ''
    topics.forEach(topic => ul.insertAdjacentHTML('beforeend', `<li><input type="checkbox" class="${topic.id}" onchange="toggleArgumentTopic(event)" ${assigned.includes(topic.id) ? ' checked' : ''}> <b>${topic.id}</b> ${topic.title} </li>`))
  }
}

function cardMutated (event) {
  const mutation = event.detail
  const target = getParentElement(mutation.target, 'h2, p')
  const argCard = target.closest('argument-card')
  if (argCard) {
    const tag = target.tagName.toLowerCase()
    const node = localeBlock().querySelector(`.idiot a[id="${argCard.card}"] ${tag}, .sheep a[id="${argCard.card}"] ${tag}`)
    if (node) {
      node.innerHTML = target.innerHTML
      updateArgumentRow(argCard.card)
      saveContent(save, argCard.card.startsWith('I') ? 'idiot' : 'sheep')
    } else { console.error('could not find content target for mutation', mutation) }
  } else { console.error('no handler for card mutation', mutation) }
}

function argumentRow (arg) {
  const LONG_TEXT = 320
  const SHORT_TEXT = 200
  const LONG_TITLE = 34
  const show = showText() ? '' : 'hidden'
  return `<tr id="${arg.id}">
    <td class="id">${arg.id}</td>
    <td onclick="toggleSpellcheck(event)">${arg.spellcheck ? '🚧' : '✅'}</td>
    <td contenteditable="plaintext-only" class="title">${arg.title}</td>
    <td class="text ${show}" contenteditable="plaintext-only">${arg.text}</td>
    <td ${arg.length > LONG_TITLE ? 'class="fix"' : ''}>${arg.length}</td>
    <td ${arg.textLength > LONG_TEXT || arg.textLength < SHORT_TEXT ? 'class="fix"' : ''}>${arg.textLength}</td>
    <td>${arg.topics.join(', ')}</td>
  </tr>`
}

function updateArgumentList (args) {
  const tbody = document.querySelector('#arguments .list tbody')
  const selected = getTableSelected(tbody)
  tbody.innerHTML = ''
  args.forEach(arg => tbody.insertAdjacentHTML('beforeend', argumentRow(arg)))
  if (selected) setTableSelected(tbody, selected)
  return args
}

function getArgumentData (id) {
  const [, topicsMap] = extractTopics(localeBlock().querySelector('.topics'))
  const tr = document.querySelector(`#arguments .list tr[id=${id}]`)
  const node = localeBlock().querySelector(`.idiot a[id=${id}], .sheep a[id=${id}]`)
  return toArgumentData(node, topicsMap)
}

function updateArgumentRow (id, columnsToUpdate = undefined) {
  const tr = document.querySelector(`#arguments .list tr[id=${id}]`)
  const arg = getArgumentData(id)
  const row = htmlToElement(argumentRow(arg))
  if (columnsToUpdate) {
    columnsToUpdate.forEach(col => tr.children[col].outerHTML = row.children[col].outerHTML)
  } else { tr.innerHTML = row.innerHTML }
  tr.classList.add('selected')
}

window.toggleSpellcheck = function (event) {
  const id = event.target.closest('tr') ? event.target.closest('tr').id : ''
  const node = localeBlock().querySelector(`.idiot a[id=${id}], .sheep a[id=${id}]`)
  if (node) {
    node.toggleAttribute('spellcheck')
    event.target.innerHTML = node.hasAttribute('spellcheck') ? '🚧' : '✅'
    update(event.target)
  } else console.error('no target found for spellcheck toggle')
}

function showText () {
  return document.getElementById('show-text').checked
}

window.updateShowText = function () {
  const show = showText()
  Array.from(document.querySelectorAll('#arguments .list .text')).forEach(node => node.classList.toggle('hidden', !show))
}

window.updateArguments = function () {
  const [, topicsMap] = extractTopics(localeBlock().querySelector('.topics'))
  const args = Array.from(localeBlock().querySelectorAll('.idiot a[id], .sheep a[id]')).map(arg => toArgumentData(arg, topicsMap))
  return updateArgumentList(args)
}

function argumentListMutated (mutation) {
  const target = getParentElement(mutation.target, 'td') // target is always a #text
  console.log(target)
  const id = target.closest('tr').id
  const tag = target.classList.contains('title') ? 'h2' : target.classList.contains('text') ? 'p' : undefined
  if (tag) {
    const node = localeBlock().querySelector(`.idiot a[id=${id}] ${tag}, .sheep a[id=${id}] ${tag}`)
    if (node) {
      node.innerHTML = target.innerHTML
      update(target)
      updateArgumentRow(id, [4, 5])
      saveContent(save, id.startsWith('I') ? 'idiot' : 'sheep')
    } else { console.error('could not find content target for mutation', mutation) }
  } else { console.error('no target found for mutation', mutation) }
}

function topicRow (topic) {
  return `<tr id="${topic.id}">
    <td class="id">${topic.id}</td>
    <td contenteditable="plaintext-only" class="title">${topic.title}</td>
    <td contenteditable="plaintext-only" class="sheepTitle">${topic.sheepTitle}</td>
    <td contenteditable="plaintext-only" class="idiotTitle">${topic.idiotTitle}</td>
    <td contenteditable="plaintext-only" class="sheepLabel">${topic.sheepLabel}</td>
    <td contenteditable="plaintext-only" class="idiotLabel">${topic.idiotLabel}</td>
  </tr>`
}

function updateTopicsList (topics) {
  const tbody = document.querySelector('#topics .list tbody')
  const selected = getTableSelected(tbody)
  tbody.innerHTML = ''
  topics.forEach(topic => tbody.insertAdjacentHTML('beforeend', topicRow(topic)))
  if (selected) setTableSelected(tbody, selected)
  return topics
}

window.updateTopics = function () {
  const topics = extractTopicsData(localeBlock().querySelector('.topics'))
  return updateTopicsList(topics)
}

function extractTopicsData (topics) {
  return Array.from(topics.querySelectorAll('section')).map(topic => ({
    topic,
    id: topic.id,
    idiotLabel: topic.dataset.idiotLabel,
    sheepLabel: topic.dataset.sheepLabel,
    idiotTitle: topic.dataset.idiotTitle,
    sheepTitle: topic.dataset.sheepTitle,
    title: topic.title
  })
  )
}

function topicListMutated (mutation) {
  const target = getParentElement(mutation.target, 'td') // target is always a #text
  const id = target.closest('tr').id
  const attr = target.className
  const node = localeBlock().querySelector(`.topics section[id="${id}"]`)
  if (node) {
    node.setAttribute(attr, mutation.target.data)
    update(target)
    saveContent(save, 'topics')
  } else { console.error('no target found for mutation', mutation) }
}

function appealToRow (appealTo) {
  return `<tr id="${appealTo.id}">
    <td class="id">${appealTo.id}</td>
    <td class="select">${appealToClassSelect(appealTo.class)}</td>
    <td contenteditable="plaintext-only" class="title">${appealTo.title}</td>
    <td contenteditable="plaintext-only" class="text">${appealTo.text}</td>
    <td>${appealTo.length}</td>
  </tr>`
}

function updateAppealTosList (appealTos) {
  const tbody = document.querySelector('#appeal-tos .list tbody')
  const selected = getTableSelected(tbody)
  tbody.innerHTML = ''
  appealTos.forEach(appealTo => tbody.insertAdjacentHTML('beforeend', appealToRow(appealTo)))
  if (selected) setTableSelected(tbody, selected)
  return appealTos
}

function updateAppealToRow (id) {
  const tr = document.querySelector(`#appeal-tos .list tr[id=${id}]`)
  const node = localeBlock().querySelector(`.appeal-tos a[id=${id}]`)
  const arg = toAppealToData(node)
  tr.outerHTML = appealToRow(arg)
}

window.updateAppealTos = function () {
  const appealTos = extractAppealTos(localeBlock().querySelector('.appeal-tos'))
  return updateAppealTosList(appealTos)
}

function extractAppealTos (appealTos) {
  return Array.from(appealTos.querySelectorAll('a[id]')).map(toAppealToData)
}

function appealToListMutated (mutation) {
  const target = getParentElement(mutation.target, 'td') // target is always a #text
  const id = target.closest('tr').id
  const tag = target.className === 'title' ? 'h2' : target.className === 'text' ? 'p' : undefined
  const node = localeBlock().querySelector(`.appeal-tos a[id="${id}"] ${tag}`)
  if (tag && node) {
    node.innerHTML = target.innerHTML
    update(target)
    updateAppealToRow(id)
    saveContent(save, 'appeal-tos')
  } else { console.error('no target found for mutation', mutation) }
}

window.setAppealToClass = function (event) {
  const id = event.target.closest('tr').id
  const node = localeBlock().querySelector(`.appeal-tos a[id="${id}"]`)
  node.setAttribute('class', event.target.value)
  update(event.target)
}

function fallacyRow (fallacy) {
  return `<tr id="${fallacy.id}">
    <td class="id">${fallacy.id}</td>
    <td class="fallacy select">${fallacyClassSelect(fallacy.class)}</td>
    <td contenteditable="plaintext-only" class="text">${fallacy.text}</td>
    <td>${fallacy.length}</td>
  </tr>`
}

function updateFallaciesList (fallacies) {
  const tbody = document.querySelector('#fallacies .list tbody')
  const selected = getTableSelected(tbody)
  tbody.innerHTML = ''
  fallacies.forEach(fallacy => tbody.insertAdjacentHTML('beforeend', fallacyRow(fallacy)))
  if (selected) setTableSelected(tbody, selected)
  return fallacies
}

window.updateFallacies = function () {
  const fallacies = extractFallacies(localeBlock().querySelector('.fallacies'))
  return updateFallaciesList(fallacies)
}

function extractFallacies (fallacies) {
  return Array.from(fallacies.querySelectorAll('a[id]')).map(toFallacyData)
}

function fallacyListMutated (mutation) {
  const target = getParentElement(mutation.target, 'td') // target is always a #text
  const id = target.closest('tr').id
  const tag = target.className === 'fallacy' ? 'i' : target.className === 'text' ? 'h2' : undefined
  const node = localeBlock().querySelector(`.fallacies a[id="${id}"] ${tag}`)
  if (tag && node) {
    node.innerHTML = target.innerHTML
    update(target)
    saveContent(save, 'fallacies')
  } else { console.error('no target found for mutation', mutation) }
}

window.setFallacyClass = function (event) {
  const id = event.target.closest('tr').id
  const node = localeBlock().querySelector(`.fallacies a[id="${id}"]`)
  node.setAttribute('class', event.target.value)
  update(event.target)
}

function labelRow (label) {
  return `<tr id="${label.id}">
    <td class="id">${label.id}</td>
    <td contenteditable="plaintext-only">${label.text}</td>
    <td>${label.length}</td>
  </tr>`
}

function updateLabelsList (labels) {
  const tbody = document.querySelector('#labels .list tbody')
  const selected = getTableSelected(tbody)
  tbody.innerHTML = ''
  labels.forEach(label => tbody.insertAdjacentHTML('beforeend', labelRow(label)))
  if (selected) setTableSelected(tbody, selected)
  return labels
}

window.updateLabels = function () {
  const labels = extractLabels(localeBlock().querySelector('.labels'))
  return updateLabelsList(labels)
}

function extractLabels (labels) {
  return Array.from(labels.querySelectorAll('a[id]')).map(toLabelData)
}

function labelListMutated (mutation) {
  const target = getParentElement(mutation.target, 'td') // target is always a #text
  const id = target.closest('tr').id
  const node = localeBlock().querySelector(`.labels a[id="${id}"] h2`)
  if (node) {
    node.innerHTML = target.innerHTML
    update(target)
    saveContent(save, 'labels')
  } else { console.error('no target found for mutation', mutation) }
}

function cancelRow (cancel) {
  return `<tr id="${cancel.id}">
    <td class="id">${cancel.id}</td>
    <td contenteditable="plaintext-only">${cancel.text}</td>
    <td>${cancel.length}</td>
  </tr>`
}

function updateCancelsList (cancels) {
  const tbody = document.querySelector('#cancels .list tbody')
  const selected = getTableSelected(tbody)
  tbody.innerHTML = ''
  cancels.forEach(cancel => tbody.insertAdjacentHTML('beforeend', cancelRow(cancel)))
  if (selected) setTableSelected(tbody, selected)
  return cancels
}

window.updateCancels = function () {
  const cancels = extractLabels(localeBlock().querySelector('.cancels'))
  return updateCancelsList(cancels)
}

function extractCancels (cancels) {
  return Array.from(cancels.querySelectorAll('a[id]')).map(toCancelData)
}

function cancelListMutated (mutation) {
  const target = getParentElement(mutation.target, 'td') // target is always a #text
  const id = target.closest('tr').id
  const node = localeBlock().querySelector(`.cancels a[id="${id}"] h2`)
  if (node) {
    node.innerHTML = target.innerHTML
    update(target)
    saveContent(save, 'cancels')
  } else { console.error('no target found for mutation', mutation) }
}

function messageRow (message) {
  return `<tr id="${message.id}">
    <td class="id hidden">${message.id}</td>
    <td class="keys">${message.class}</td>
    <td contenteditable="plaintext-only">${message.text}</td>
    <td>${message.length}</td>
  </tr>`
}

function updateMessagesList (messages) {
  const tbody = document.querySelector('#messages .list tbody')
  const selected = getTableSelected(tbody)
  tbody.innerHTML = ''
  messages.forEach(message => tbody.insertAdjacentHTML('beforeend', messageRow(message)))
  if (selected) setTableSelected(tbody, selected)
  return messages
}

window.updateMessages = function () {
  const messages = extractMessages(localeBlock().querySelector('.messages'))
  return updateMessagesList(messages)
}

function extractMessages (messages) {
  return Array.from(messages.querySelectorAll('a[class]')).map(toMessageData)
}

function messageListMutated (mutation) {
  const target = getParentElement(mutation.target, 'td') // target is always a #text
  const clazz = target.closest('tr').children[1].innerText
  const node = localeBlock().querySelector(`.messages a[class="${clazz}"]`)
  if (node) {
    node.innerHTML = target.innerHTML
    update(target)
    saveContent(save, 'messages')
  } else { console.error('no target found for mutation', mutation) }
}

function sourceRow (source) {
  return `<tr>
    <td class="id hidden"></td>
    <td class="lang">${source.lang}</td>
    <td class="keys">${source.class}</td>
    <td contenteditable="plaintext-only" class="url">${source.url}</td>
    <td contenteditable="plaintext-only">${source.text}</td>
    <td>${source.length}</td>
  </tr>`
}

function updateSourcesList (sources) {
  const tbody = document.querySelector('#sources .list tbody')
  const selected = getTableSelected(tbody)
  tbody.innerHTML = ''
  sources.forEach(source => tbody.insertAdjacentHTML('beforeend', sourceRow(source)))
  if (selected) setTableSelected(tbody, selected)
  return sources
}

window.updateSources = function () {
  const sources = extractSources(document.querySelector('#content .sources'))
  return updateSourcesList(sources)
}

function extractSources (sources) {
  return Array.from(sources.querySelectorAll('a[class]')).map(toSourceData)
}

function sourceList (mutation) {
  const target = mutation.target.closest('td') // target is always a #text
  const clazz = target.closest('tr').children[1].innerText
  const node = document.querySelector(`#content .sources a[class="${clazz}"]`)
  if (node) {
    node.innerHTML = target.innerHTML
    update(target)
  } else { console.error('no target found for mutation', mutation) }
}

function updateAll () {
  updateArguments()
  updateFallacies()
  updateAppealTos()
  updateTopics()
  updateLabels()
  updateCancels()
  updateMessages()
  updateSources()
  observe(document.querySelector('#arguments .list'), argumentListMutated)
  observe(document.querySelector('#fallacies .list'), fallacyListMutated)
  observe(document.querySelector('#labels .list'), labelListMutated)
  observe(document.querySelector('#topics .list'), topicListMutated)
  observe(document.querySelector('#appeal-tos .list'), appealToListMutated)
  observe(document.querySelector('#cancels .list'), cancelListMutated)
  observe(document.querySelector('#messages .list'), messageListMutated)
}

window.navigate = function (event) {
  const current = event.target
  const index = Array.prototype.indexOf.call(current.parentNode.children, current)
  let next

  switch (event.key) {
    case 'ArrowLeft':
      if (textInfo(current).atStart) next = current.closest('td').previousElementSibling
      break
    case 'ArrowRight':
      if (textInfo(current).atEnd) next = current.closest('td').nextElementSibling
      break
    case 'ArrowDown': {
      const row = current.closest('tr').nextElementSibling
      if (row) next = row.children[index]
    }
      break
    case 'ArrowUp': {
      const row = current.closest('tr').previousElementSibling
      if (row) next = row.children[index]
    }
  }

  if (next && (next.hasAttribute('contenteditable') || next.classList.contains('select'))) {
    if (next.classList.contains('select')) next.firstElementChild.focus(); else next.focus()
    event.stopPropagation()
    return false
  } else { return true }
}

function textInfo (el) {
  let atStart = false; let atEnd = false
  const sel = window.getSelection()
  if (sel.rangeCount) {
    const selRange = sel.getRangeAt(0)
    const testRange = selRange.cloneRange()

    testRange.selectNodeContents(el)
    testRange.setEnd(selRange.startContainer, selRange.startOffset)
    atStart = (testRange.toString() === '')

    testRange.selectNodeContents(el)
    testRange.setStart(selRange.endContainer, selRange.endOffset)
    atEnd = (testRange.toString() === '')
  }

  return { atStart, atEnd }
}

window.navigateMaintain = function (event) {
  navigateTo(event.target.id.substring(1))
}

function navigateTo (tab) {
  Array.from(document.querySelectorAll('.tab')).forEach(tab => tab.classList.add('hidden'))
  document.getElementById(`_${tab}`).toggleAttribute('checked', true)
  document.getElementById(tab).classList.remove('hidden')
}

function observe (element, callback) {
  const observer = new MutationObserver(
    mutations => mutations.forEach(mutation => callback(mutation)))
  observer.observe(element, { subtree: true, characterData: true })
}

function getParentElement (node, selector = undefined) {
  while (!node.parentElement) node = node.parentNode
  return selector ? node.parentElement.closest(selector) : node.parentElement
}

window.searchMaintain = function (event) {
  const table = event.target.closest('.tab').querySelector('.list')
  const input = event.target.value.toLowerCase()
  const entries = Array.from(table.querySelectorAll('tr'))
  entries.forEach(tr => tr.classList.remove('not-matching'))
  const notMatching = input.length ? entries.filter(tr => !tr.textContent.replace(/\u00ad/gi, '').toLowerCase().includes(input)) : []
  notMatching.forEach(tr => tr.classList.add('not-matching'))
}

/**
 * Generate appeal-to classes select
 * @return {string} select HTML
 */
export function appealToClassSelect (selected) {
  const classes = Array.from(localeBlock().querySelectorAll('.messages a.appeal-to.class')).map(clazz => {
    const value = clazz.classList.item(clazz.classList.length - 1)
    return `<option value="${value}" ${selected === value ? 'selected' : ''}>${clazz.innerHTML}</option>`
  })
  return `<select onchange="setAppealToClass(event)">${classes}</select>`
}

/**
 * Generate fallacy classes select
 * @return {string} select HTML
 */
export function fallacyClassSelect (selected) {
  const classes = Array.from(localeBlock().querySelectorAll('.messages a.fallacy.class')).map(clazz => {
    const value = clazz.classList.item(clazz.classList.length - 1)
    return `<option value="${value}" ${selected === value ? 'selected' : ''}>${clazz.innerHTML}</option>`
  })
  return `<select onchange="setFallacyClass(event)">${classes}</select>`
}

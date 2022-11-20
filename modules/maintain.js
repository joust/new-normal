import { setLocale, htmlToElement } from './common.js'
import { loadContent, loadSources, extractTopics } from './content.js'

window.loadMaintain = async function() {
  setLocale(document.body.lang = 'de')
  const content = await loadContent()
  await loadSources()
  document.querySelector('#details').insertAdjacentHTML('beforeEnd', '<centered-cards id="cards"><editable-card id="card"></editable-card></centered-cards>')
  document.querySelector('#card').addEventListener('mutated', event => cardMutated(event))

  updateAll()
}

function toArgumentData(arg, topicMap) {
  const prefix = arg.querySelector('p').cloneNode(true)
  if (!prefix.querySelector('span')) console.error(arg)
  prefix.removeChild(prefix.querySelector('span'))
  return {
    arg,
    id: arg.id,
    title: arg.querySelector('h2').innerHTML,
    textPrefix: prefix.innerHTML,
    text: arg.querySelector('span').innerHTML,
    length: arg.querySelector('h2').innerText.length,
    textLength: arg.querySelector('p').innerText.length,
    spellcheck: arg.hasAttribute('spellcheck'),
    topics: topicMap[arg.id] || [] 
  }
}

function toAppealToData(appealTo) {
  return {
    appealTo,
    id: appealTo.id,
    type: appealTo.id.includes('I') ? 'idiot' : 'sheep',
    'class': appealTo.className,
    title: appealTo.querySelector('h2').innerHTML,
    text: appealTo.querySelector('p').innerHTML,
    length: appealTo.innerText.length
  }
}

function toFallacyData(fallacy) {
  return {
    fallacy,
    id: fallacy.id,
    type: fallacy.id.includes('I') ? 'idiot' : 'sheep',
    'class': fallacy.className,
    text: fallacy.querySelector('h2').innerHTML,
    length: fallacy.querySelector('h2').innerText.length
  }
}

function toLabelData(label) {
  return {
    label,
    id: label.id,
    type: label.id.includes('I') ? 'idiot' : 'sheep',
    text: label.querySelector('h2').innerHTML,
    length: label.querySelector('h2').innerText.length
  }
}

function toCancelData(cancel) {
  return {
    cancel,
    id: cancel.id,
    type: cancel.id.includes('I') ? 'idiot' : 'sheep',
    text: cancel.querySelector('h2').innerHTML,
    length: cancel.querySelector('h2').innerText.length
  }
}

function toMessageData(message) {
  return {
    message,
    id: message.id,
    'class': message.className,
    text: message.innerHTML,
    length: message.innerText.length
  }
}

function toSourceData(source) {
  return {
    source,
    lang: source.lang,
    url: source.href,
    'class': source.className,
    text: source.innerHTML,
    length: source.innerHTML.length
  }
}

window.updateSourcePreview = function(target) {
  const tr = target && target.closest('tr')
  if (tr) {
    const url = tr.querySelector('.url').innerText
    document.querySelector('#preview').src = url
    document.querySelector('#preview').classList.remove('hidden')
    document.querySelector('#edit-bar').classList.add('hidden')
    document.querySelector('#cards').classList.add('hidden')
    document.querySelectorAll('tr').forEach(tr => tr.classList.remove('selected'))
    if (event) {
      const selected = event.target.closest('tr')
      if (selected) selected.classList.add('selected')
    }
  }
}

window.updateMaintainCard = function(target) {
  const card = target && target.closest('tr') ? target.closest('tr').firstElementChild.innerText : ''
  document.querySelector('#card').setAttribute('card', card)
  document.querySelector('#preview').classList.add('hidden')
  document.querySelector('#edit-bar').classList.remove('hidden')
  document.querySelector('#cards').classList.remove('hidden')
  document.querySelectorAll('tr').forEach(tr => tr.classList.remove('selected'))
  if (event) {
    const selected = event.target.closest('tr')
    if (selected) selected.classList.add('selected')
  }
}

function cardMutated(event) {
  const mutation = event.detail
  const target = mutation.target.parentNode
  const argCard = target.closest('argument-card')
  if (argCard) {
    const tag = target.tagName.toLowerCase()
    const node = document.querySelector(`#content .idiot a[id="${argCard.card}"] ${tag}, #content .sheep a[id="${argCard.card}"] ${tag}`)
    if (node) {
      node.innerHTML = mutation.target.data
      updateArgumentRow(argCard.card)
    } else
      console.error('could not find content target for mutation', mutation)
  } else
      console.error('no handler for card mutation', mutation)
}

function argumentRow(arg) {
  const LONG_TEXT = 320
  const SHORT_TEXT = 200
  const LONG_TITLE = 34
  return `<tr id="${arg.id}">
    <td class="id">${arg.id}</td>
    <td onclick="toggleSpellcheck(event)">${arg.spellcheck ? '🚧' : '✅'}</td>
    <td contenteditable="plaintext-only" class="title">${arg.title}</td>
    <td class="text-column hidden">${arg.textPrefix}<span contenteditable="plaintext-only" class="text">${arg.text}</span></td>
    <td ${arg.length > LONG_TITLE ? 'class="fix"' : ''}>${arg.length}</td>
    <td ${arg.textLength > LONG_TEXT || arg.textLength < SHORT_TEXT ? 'class="fix"' : ''}>${arg.textLength}</td>
    <td>${arg.topics.join(', ')}</td>
  </tr>`
}

function updateArgumentList(args) {
  const tbody = document.querySelector('#arguments .list tbody')
  tbody.innerHTML = ''
  args.forEach(arg => tbody.insertAdjacentHTML('beforeEnd', argumentRow(arg)))
  updateMaintainCard()
  return args
}

function updateArgumentRow(id, columnsToUpdate = undefined) {
  const [, topicsMap] = extractTopics(document.querySelector('#content .topics'))
  const tr = document.querySelector(`#arguments .list tr[id=${id}]`)
  const node = document.querySelector(`#content .idiot a[id=${id}], #content .sheep a[id=${id}]`)
  const arg = toArgumentData(node, topicsMap)
  const row = htmlToElement(argumentRow(arg))
  if (columnsToUpdate) {
    columnsToUpdate.forEach(col => tr.children[col].outerHTML = row.children[col].outerHTML)
  } else
    tr.innerHTML = row.innerHTML
  tr.classList.add('selected')
}

window.toggleSpellcheck = function(event) {
  const id = event.target.closest('tr') ? event.target.closest('tr').firstElementChild.innerText : ''
  const node = document.querySelector(`#content .idiot a[id=${id}], #content .sheep a[id=${id}]`)
  if (node) {
    node.toggleAttribute('spellcheck')
    event.target.innerHTML = node.hasAttribute('spellcheck') ? '🚧' : '✅'
    updateMaintainCard(event.target)
  } else console.error('no target found for spellcheck toggle')
}

window.toggleText = function() {
  Array.from(document.querySelectorAll('#arguments .list .text-column')).forEach(node => node.classList.toggle('hidden'))
}

window.updateArguments = function() {
  const [, topicsMap] = extractTopics(document.querySelector('#content .topics'))
  const args = Array.from(document.querySelectorAll('#content .idiot a[id], #content .sheep a[id]')).map(arg => toArgumentData(arg, topicsMap))
  return updateArgumentList(args)
}

function argumentListMutated(mutation) {
  const target = getParentElement(mutation.target) // target is always a #text
  const id = target.closest('tr').firstElementChild.innerText
  const tag = target.classList.contains('title') ? 'h2' : target.classList.contains('text') ? 'span' : undefined
  if (tag) {
    const node = document.querySelector(`#content .idiot a[id=${id}] ${tag}, #content .sheep a[id=${id}] ${tag}`)
    if (node) {
      node.innerHTML = mutation.target.data
      updateMaintainCard(target)
      updateArgumentRow(id, [4, 5])
    } else
      console.error('could not find content target for mutation', mutation)
    
  } else 
    console.error('no target found for mutation', mutation)
}

function topicRow(topic) {
  return `<tr>
    <td class="id">${topic.id}</td>
    <td contenteditable="plaintext-only" class="title">${topic.title}</td>
    <td contenteditable="plaintext-only" class="sheepTitle">${topic.sheepTitle}</td>
    <td contenteditable="plaintext-only" class="idiotTitle">${topic.idiotTitle}</td>
    <td contenteditable="plaintext-only" class="sheepLabel">${topic.sheepLabel}</td>
    <td contenteditable="plaintext-only" class="idiotLabel">${topic.idiotLabel}</td>
  </tr>`
}

function updateTopicsList(topics) {
  const tbody = document.querySelector('#topics .list tbody')
  tbody.innerHTML = ''
  topics.forEach(topic => tbody.insertAdjacentHTML('beforeEnd', topicRow(topic)))
  return topics
}

window.updateTopics = function() {
  const topics = extractTopicsData(document.querySelector('#content .topics'))
  return updateTopicsList(topics)
}

function extractTopicsData(topics) {
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

function topicListMutated(mutation) {
  const target = getParentElement(mutation.target) // target is always a #text
  const id = target.closest('tr').firstElementChild.innerText
  const attr = target.className
  const node = document.querySelector(`#content .topics section[id="${id}"]`)
  if (node) {
    node.setAttribute(attr, mutation.target.data)
    updateMaintainCard(target)
  } else 
    console.error('no target found for mutation', mutation)
}

function appealToRow(appealTo) {
  return `<tr id="${appealTo.id}">
    <td class="id">${appealTo.id}</td>
    <td>${appealToClassSelect(appealTo.class)}</td>
    <td contenteditable="plaintext-only" class="title">${appealTo.title}</td>
    <td contenteditable="plaintext-only" class="text">${appealTo.text}</td>
    <td>${appealTo.length}</td>
  </tr>`
}

function updateAppealTosList(appealTos) {
  const tbody = document.querySelector('#appeal-tos .list tbody')
  tbody.innerHTML = ''
  appealTos.forEach(appealTo => tbody.insertAdjacentHTML('beforeEnd', appealToRow(appealTo)))
  return appealTos
}

function updateAppealToRow(id) {
  const tr = document.querySelector(`#appeal-tos .list tr[id=${id}]`)
  const node = document.querySelector(`#content .appeal-tos a[id=${id}]`)
  const arg = toAppealToData(node)
  tr.outerHTML = appealToRow(arg)
}


window.updateAppealTos = function() {
  const appealTos = extractAppealTos(document.querySelector('#content .appeal-tos'))
  return updateAppealTosList(appealTos)
}

function extractAppealTos(appealTos) {
  return Array.from(appealTos.querySelectorAll('a[id]')).map(toAppealToData)
}

function appealToListMutated(mutation) {
  const target = getParentElement(mutation.target).closest('td') // target is always a #text
  const id = target.closest('tr').firstElementChild.innerText
  const tag = target.className==='title' ? 'h2' : target.className==='text' ? 'p' : undefined
  const node = document.querySelector(`#content .appeal-tos a[id="${id}"] ${tag}`)
  if (tag && node) {
    node.innerHTML = target.innerHTML
    updateMaintainCard(target)
    updateAppealToRow(id)
  } else 
    console.error('no target found for mutation', mutation)
}

window.setAppealToClass = function(event) {
  const id = event.target.closest('tr').firstElementChild.innerText
  const node = document.querySelector(`#content .appeal-tos a[id="${id}"]`)
  node.setAttribute('class', event.target.value)
}

function fallacyRow(fallacy) {
  return `<tr>
    <td class="id">${fallacy.id}</td>
    <td contenteditable="plaintext-only" class="fallacy">${fallacyClassSelect(fallacy.class)}</td>
    <td contenteditable="plaintext-only" class="text">${fallacy.text}</td>
    <td>${fallacy.length}</td>
  </tr>`
}

function updateFallaciesList(fallacies) {
  const tbody = document.querySelector('#fallacies .list tbody')
  tbody.innerHTML = ''
  fallacies.forEach(fallacy => tbody.insertAdjacentHTML('beforeEnd', fallacyRow(fallacy)))
  return fallacies
}

window.updateFallacies = function() {
  const fallacies = extractFallacies(document.querySelector('#content .fallacies'))
  return updateFallaciesList(fallacies)
}

function extractFallacies(fallacies) {
  return Array.from(fallacies.querySelectorAll('a[id]')).map(toFallacyData)
}

function fallacyListMutated(mutation) {
  const target = mutation.target.parentElement.closest('td') // target is always a #text
  const id = target.closest('tr').firstElementChild.innerText
  const tag = target.className==='fallacy' ? 'i' : target.className==='text' ? 'h2' : undefined
  const node = document.querySelector(`#content .fallacies a[id="${id}"] ${tag}`)
  if (tag && node) {
    node.innerHTML = mutation.target.data
    updateMaintainCard(target)
  } else 
    console.error('no target found for mutation', mutation)
}

window.setFallacyClass = function(event) {
  const id = event.target.closest('tr').firstElementChild.innerText
  const node = document.querySelector(`#content .fallacies a[id="${id}"]`)
  node.setAttribute('class', event.target.value)
}

function labelRow(label) {
  return `<tr>
    <td class="id">${label.id}</td>
    <td contenteditable="plaintext-only">${label.text}</td>
    <td>${label.length}</td>
  </tr>`
}

function updateLabelsList(labels) {
  const tbody = document.querySelector('#labels .list tbody')
  tbody.innerHTML = ''
  labels.forEach(label => tbody.insertAdjacentHTML('beforeEnd', labelRow(label)))
  return labels
}

window.updateLabels = function() {
  const labels = extractLabels(document.querySelector('#content .labels'))
  return updateLabelsList(labels)
}

function extractLabels(labels) {
  return Array.from(labels.querySelectorAll('a[id]')).map(toLabelData)
}

function labelListMutated(mutation) {
  const target = mutation.target.parentElement // target is always a #text
  const id = target.closest('tr').firstElementChild.innerText
  const node = document.querySelector(`#content .labels a[id="${id}"] h2`)
  if (node) {
    node.innerHTML = mutation.target.data
    updateMaintainCard(target)
  } else 
    console.error('no target found for mutation', mutation)
}

function cancelRow(cancel) {
  return `<tr>
    <td class="id">${cancel.id}</td>
    <td contenteditable="plaintext-only">${cancel.text}</td>
    <td>${cancel.length}</td>
  </tr>`
}

function updateCancelsList(cancels) {
  const tbody = document.querySelector('#cancels .list tbody')
  tbody.innerHTML = ''
  cancels.forEach(cancel => tbody.insertAdjacentHTML('beforeEnd', cancelRow(cancel)))
  return cancels
}

window.updateCancels = function() {
  const cancels = extractLabels(document.querySelector('#content .cancels'))
  return updateCancelsList(cancels)
}

function extractCancels(cancels) {
  return Array.from(cancels.querySelectorAll('a[id]')).map(toCancelData)
}

function cancelListMutated(mutation) {
  const target = mutation.target.parentElement // target is always a #text
  const id = target.closest('tr').firstElementChild.innerText
  const node = document.querySelector(`#content .cancels a[id="${id}"] h2`)
  if (node) {
    node.innerHTML = mutation.target.data
    updateMaintainCard(target)
  } else 
    console.error('no target found for mutation', mutation)
}

function messageRow(message) {
  return `<tr>
    <td class="id hidden">${message.id}</td>
    <td class="keys">${message.class}</td>
    <td contenteditable="plaintext-only">${message.text}</td>
    <td>${message.length}</td>
  </tr>`
}

function updateMessagesList(messages) {
  const tbody = document.querySelector('#messages .list tbody')
  tbody.innerHTML = ''
  messages.forEach(message => tbody.insertAdjacentHTML('beforeEnd', messageRow(message)))
  return messages
}

window.updateMessages = function() {
  const messages = extractMessages(document.querySelector('#content .messages'))
  return updateMessagesList(messages)
}

function extractMessages(messages) {
  return Array.from(messages.querySelectorAll('a[class]')).map(toMessageData)
}

function messageListMutated(mutation) {
  const target = mutation.target.parentElement // target is always a #text
  const clazz = target.closest('tr').children[1].innerText
  const node = document.querySelector(`#content .messages a[class="${clazz}"]`)
  if (node) {
    node.innerHTML = mutation.target.data
    updateMaintainCard(target)
  } else 
    console.error('no target found for mutation', mutation)
}


function sourceRow(source) {
  return `<tr>
    <td class="id hidden"></td>
    <td class="lang">${source.lang}</td>
    <td class="keys">${source.class}</td>
    <td contenteditable="plaintext-only" class="url">${source.url}</td>
    <td contenteditable="plaintext-only">${source.text}</td>
    <td>${source.length}</td>
  </tr>`
}

function updateSourcesList(sources) {
  const tbody = document.querySelector('#sources .list tbody')
  tbody.innerHTML = ''
  sources.forEach(source => tbody.insertAdjacentHTML('beforeEnd', sourceRow(source)))
  return sources
}

window.updateSources = function() {
  const sources = extractSources(document.querySelector('#content .sources'))
  return updateSourcesList(sources)
}

function extractSources(sources) {
  return Array.from(sources.querySelectorAll('a[class]')).map(toSourceData)
}

function sourceListMutated(mutation) {
  const target = mutation.target.parentElement // target is always a #text
  const clazz = target.closest('tr').children[1].innerText
  const node = document.querySelector(`#content .messages a[class="${clazz}"]`)
  if (node) {
    node.innerHTML = mutation.target.data
    updateMaintainCard(target)
  } else 
    console.error('no target found for mutation', mutation)
}

function updateAll() {
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

window.navigateMaintain = function(event) {
  const selected = event.target.id.substring(1)
  Array.from(document.querySelectorAll('.tab')).forEach(tab => tab.classList.add('hidden'))
  document.getElementById(selected).classList.remove('hidden')
  updateMaintainCard()
}

function observe(element, callback) {
  const observer = new MutationObserver(
    mutations => mutations.forEach(mutation => callback(mutation)))
  observer.observe(element, { subtree: true, characterData: true })
}

function getParentElement(node) {
  while (!node.parentElement) node = node.parentNode
  return node.parentElement
}

window.searchMaintain = function(event) {
  const table = event.target.parentElement.querySelector('.list')
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
export function appealToClassSelect(selected) {
  const classes = Array.from(document.querySelectorAll(`#content .messages a.appeal-to.class`)).map(clazz => {
    const value = clazz.classList.item(clazz.classList.length-1)
    return `<option value="${value}" ${selected===value?'selected':''}">${clazz.innerHTML}</option>`
  })
  return `<select onchange="setAppealToClass(event)">${classes}</select>`
}

/**
 * Generate fallacy classes select
 * @return {string} select HTML
 */
export function fallacyClassSelect(selected) {
  const classes = Array.from(document.querySelectorAll(`#content .messages a.fallacy.class`)).map(clazz => {
    const value = clazz.classList.item(clazz.classList.length-1)
    return `<option value="${value}" ${selected===value?'selected':''}">${clazz.innerHTML}</option>`
  })
  return `<select onchange="setFallacyClass(event)">${classes}</select>`}

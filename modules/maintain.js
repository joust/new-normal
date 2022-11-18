import { setLocale } from './common.js'
import { loadContent, extractTopics } from './content.js'

window.loadMaintain = async function() {
  setLocale(document.body.lang = 'de')
  const content = await loadContent() 
  document.querySelector('#details').insertAdjacentHTML('beforeEnd', '<centered-cards><editable-card id="card"></editable-card></centered-cards>')
  updateAll()
}

function toArgumentData(arg, topicMap) {
  return {
    arg,
    id: arg.id,
    title: arg.querySelector('h2').innerHTML,
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
    'class': appealTo.getAttribute('class'),
    title: appealTo.querySelector('h2').innerHTML,
    length: appealTo.innerText.length
  }
}

function toFallacyData(fallacy) {
  return {
    fallacy,
    id: fallacy.id,
    type: fallacy.id.includes('I') ? 'idiot' : 'sheep',
    'class': fallacy.querySelector('i').innerHTML,
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

window.selectCard = function(event) {
  const card = event && event.target.closest('tr') ? event.target.closest('tr').firstElementChild.innerText : ''
  document.querySelector('#card').setAttribute('card', card)
  document.querySelectorAll('tr').forEach(tr => tr.classList.remove('selected'))
  if (event) {
    const selected = event.target.closest('tr')
    if (selected) selected.classList.add('selected')
  }
}

function updateArgumentTable(args) {
  const tbody = document.querySelector('#arguments .list tbody')
  tbody.innerHTML = ''
  args.forEach(arg => {
    const row = `<tr><td class="id">${arg.id}</td><td>${arg.title}</td><td>${arg.length}</td><td>${arg.textLength}</td><td>${arg.topics.join(', ')}</td></tr>`
    tbody.insertAdjacentHTML('beforeEnd', row)
  })
  selectCard()
  return args
}

window.updateArguments = function() {
  const LONG_THRESHOLD = 320
  const SHORT_THRESHOLD = 245
  const LONG_TITLE_THRESHOLD = 34
  const SHORT_TITLE_THRESHOLD = 14
  const [, topicsMap] = extractTopics(document.querySelector('#content .topics'))
  const type = document.querySelector('#arguments .type').value
  const args = Array.from(document.querySelectorAll(`#content .${type} a[id]`)).map(arg => toArgumentData(arg, topicsMap))
  const task = document.querySelector('#arguments .task').value
  switch (task) {
    case 'review-translations':
      return updateArgumentTable(args.filter(arg => arg.spellcheck))
    case 'fix-long':
      return updateArgumentTable(args.filter(arg => arg.textLength > LONG_THRESHOLD))
    case 'fix-short':
      return updateArgumentTable(args.filter(arg => arg.textLength < SHORT_THRESHOLD))
    case 'fix-long-titles':
      return updateArgumentTable(args.filter(arg => arg.length > LONG_TITLE_THRESHOLD))
    case 'fix-short-titles':
      return updateArgumentTable(args.filter(arg => arg.length < SHORT_TITLE_THRESHOLD))
    case 'assign-topics':
      return updateArgumentTable(args)
    case 'assign-unassigned': 
      return updateArgumentTable(args.filter(arg => arg.topics.length === 0))
  }
}

function updateTopicsTable(topics) {
  const tbody = document.querySelector('#topics .list tbody')
  tbody.innerHTML = ''
  topics.forEach(topic => {
    const row = `<tr><td class="id">${topic.id}</td><td contenteditable="plaintext-only">${topic.title}</td><td contenteditable="plaintext-only">${topic.sheepTitle}</td><td contenteditable="plaintext-only">${topic.idiotTitle}</td><td contenteditable="plaintext-only">${topic.sheepLabel}</td><td contenteditable="plaintext-only">${topic.idiotLabel}</td></tr>`
    tbody.insertAdjacentHTML('beforeEnd', row)
  })
  return topics
}

window.updateTopics = function() {
  const topics = extractTopicsData(document.querySelector('#content .topics'))
  return updateTopicsTable(topics)
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

function updateAppealTosTable(appealTos) {
  const tbody = document.querySelector('#appeal-tos .list tbody')
  tbody.innerHTML = ''
  appealTos.forEach(appealTo => {
    const row = `<tr><td class="id">${appealTo.id}</td><td>${appealTo['class']}</td><td contenteditable="plaintext-only">${appealTo.title}</td><td>${appealTo.length}</td></tr>`
    tbody.insertAdjacentHTML('beforeEnd', row)
  })
  return appealTos
}

window.updateAppealTos = function() {
  const type = document.querySelector('#appeal-tos .type').value
  const appealTos = extractAppealTos(document.querySelector('#content .appeal-tos'))
  return updateAppealTosTable(appealTos.filter(appealTo => appealTo.type===type))
}

function extractAppealTos(appealTos) {
  return Array.from(appealTos.querySelectorAll('a[id]')).map(toAppealToData)
}

function updateFallaciesTable(fallacies) {
  const tbody = document.querySelector('#fallacies .list tbody')
  tbody.innerHTML = ''
  fallacies.forEach(fallacy => {
    const row = `<tr><td class="id">${fallacy.id}</td><td contenteditable="plaintext-only">${fallacy['class']}</td><td contenteditable="plaintext-only">${fallacy.text}</td><td>${fallacy.length}</td></tr>`
    tbody.insertAdjacentHTML('beforeEnd', row)
  })
  return fallacies
}

window.updateFallacies = function() {
  const type = document.querySelector('#fallacies .type').value
  const fallacies = extractFallacies(document.querySelector('#content .fallacies'))
  return updateFallaciesTable(fallacies.filter(fallacy => fallacy.type===type))
}

function extractFallacies(fallacies) {
  return Array.from(fallacies.querySelectorAll('a[id]')).map(toFallacyData)
}

function updateLabelsTable(labels) {
  const tbody = document.querySelector('#labels .list tbody')
  tbody.innerHTML = ''
  labels.forEach(label => {
    const row = `<tr><td class="id">${label.id}</td><td contenteditable="plaintext-only">${label.text}</td><td>${label.length}</td></tr>`
    tbody.insertAdjacentHTML('beforeEnd', row)
  })
  return labels
}

window.updateLabels = function() {
  const type = document.querySelector('#labels .type').value
  const labels = extractLabels(document.querySelector('#content .labels'))
  return updateLabelsTable(labels.filter(label => label.type===type))
}

function extractLabels(labels) {
  return Array.from(labels.querySelectorAll('a[id]')).map(toLabelData)
}


function updateCancelsTable(cancels) {
  const tbody = document.querySelector('#cancels .list tbody')
  tbody.innerHTML = ''
  cancels.forEach(cancel => {
    const row = `<tr><td class="id">${cancel.id}</td><td contenteditable="plaintext-only">${cancel.text}</td><td>${cancel.length}</td></tr>`
    tbody.insertAdjacentHTML('beforeEnd', row)
  })
  return cancels
}

window.updateCancels = function() {
  const type = document.querySelector('#cancels .type').value
  const cancels = extractLabels(document.querySelector('#content .cancels'))
  return updateCancelsTable(cancels.filter(label => label.type===type))
}

function extractCancels(labels) {
  return Array.from(cancels.querySelectorAll('a[id]')).map(toCancelData)
}

function updateAll() {
  updateArguments()
  updateFallacies()
  updateAppealTos()
  updateTopics()
  updateLabels()
  updateCancels()
  observe(document.querySelector('#fallacies .list'))
  observe(document.querySelector('#labels .list'))
  observe(document.querySelector('#topics .list'))
  observe(document.querySelector('#appeal-tos .list'))
  observe(document.querySelector('#cancels .list'))
}

window.navigateMaintain = function(event) {
  const selected = event.target.id.substring(1)
  Array.from(document.querySelectorAll('.tab')).forEach(tab => tab.classList.add('hidden'))
  document.getElementById(selected).classList.remove('hidden')
}

function observe(element) {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      const id = mutation.target.parentElement.closest('tr').firstElementChild.innerText
      const message = id + " from '" + mutation.oldValue + "' to '" + mutation.target.data + "'"
      console.log(message, mutation)
    })
  })
  observer.observe(element, {
    subtree: true,
    characterData: true,
    characterDataOldValue: true
  })
}
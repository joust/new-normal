let stats // test stats

/**
 * create one idiot and one sheep and start the test with one of them visible
 */
async function test(size1, size2 = 0) {
  await loadTestCard('#wrapper-1', true, 0, size1)
  await loadTestCard('#wrapper-2', false, size1*size1, size2)
  initTestStats(size1, size2)
  if (size2) showWrapperTwo(); else hideWrapperTwo() 
  showGame()
}

/**
 * load a card by fetching the needed content (idiot/sheep + local) from the server
 *
 * @param {HTMLElement|string} wrapper wrapper element to load the card into
 * @param {boolean} idiot load idiot content if true, otherwise sheep content
 * @param {number} start start category for the test card to generate
 * @param {number} size size of test card (2,3,4,5,6) - >6 too large for mobile
 */
async function loadTestCard(wrapper, idiot, start, size, update = false) {
  if (typeof wrapper === 'string') wrapper = document.querySelector(wrapper)
  wrapper.querySelector('.content').innerHTML = await getLocalizedContent(idiot)
  wrapper.querySelector('.detail').onclick = event => handleTestClick(event)
  wrapper.classList.toggle('idiot', idiot)
  wrapper.classList.toggle('sheep', !idiot)
  await addSources(wrapper, false)
  wrapper.querySelector('.buttons.bingo').remove()
  wrapper.querySelectorAll('i').forEach(e => e.remove())
  setPermalink(wrapper)

  const topics = getTopics(wrapper)
  if (update)
    updateCard(wrapper, topics)
  else  
    prepareTestCard(wrapper, topics, start, size)
  prepareTestCardTitle(wrapper)
  addNavigationToCard(wrapper)
  copyLogoToTestCard(wrapper, idiot)
}

/**
 * prepare the test card title for the front side of the card wrapper
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 */
function prepareTestCardTitle(wrapper) {
  // prepare card title
  const title = wrapper.querySelector('.title')
  while (title.firstChild) title.removeChild(title.firstChild)
  const select = wrapper.querySelector('.detail select')
  title.appendChild(select)
  select.value = ''
  const label = wrapper.querySelector('.detail label')
  if (label) {
    title.appendChild(label)
    title.querySelector('label').classList.add('hidden')
  }
}

/**
 * copy the logo to the top of the details side of the test card wrapper
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 * @param {boolean} idiot true if an idiot card
 */
function copyLogoToTestCard(wrapper, idiot) {
  wrapper.querySelector('.content').prepend(
    document.querySelector('.logo').cloneNode(true))
  wrapper.querySelector('.logo select').value = `${lang}-${terr}`
  wrapper.querySelector('.logo select').onchange = 
    event => testUpdate(wrapper, idiot, event.target.value)
}


/**
 * prepare the test card on the front side of the card wrapper
 *
 * @param {HTMLElement} wrapper wrapper element to load the card into
 * @param {Array} topics the topics to use
 * @param {number} start the topics start item to begin with
 * @param {number} size the size of the test card
 */
function prepareTestCard(wrapper, topics, start, size) {
  makeTestCard(wrapper, topics, start, size)
  wrapper.classList.add('test')
  wrapper.querySelector('.reload').onclick = () => clearTest()
}

/**
 * generate a test card as an HTML table with the given parent and size size
 *
 * @param {HTMLElement} wrapper - parent element to generate the table into
 * @param {Array} topics - Array of topics with data for the card
 * @param {number} index - starting index for the selection
 * @param {number} size - side length for the card to generate
     Implies nr of questions, e.g. 3 => 9, 4 => 16, 5 => 25, 6 => 36
 */
function makeTestCard(wrapper, topics, index, size) {
  const div = wrapper.querySelector('.bingo')
  const rows = []
  if (div.firstChild) div.removeChild(div.firstChild)
  for (let y = 0; y < size; y++) {
    const cells = []
    for (let x = 0; x < size; x++,index++) {
      const node = elementWithKids('td')
      const topic = topics[index]
      node.id = topic.id
      node.dataset.idiotLabel = topic.idiotLabel
      node.dataset.sheepLabel = topic.sheepLabel
      node.innerHTML = node.title = topic.title
      node.onclick = event => {
        openTestDetails(event, index, topic)
      }
      cells.push(node)
    }
    rows.push(elementWithKids('tr', cells))
  }
  const table = elementWithKids('table', elementWithKids('tbody', rows))
  div.appendChild(table)
  safariFix(div)
}

/**
 * open both detail window, adding the CSS 'single' classes to the given id details
 * @param {Event} event the event that triggered the open action
 */
function openTestDetails(event, index, topic) {
  const wrapper = event.target.closest('.card-wrapper')
  const wrapper1 = document.querySelector('#wrapper-1')
  const wrapper2 = document.querySelector('#wrapper-2')
  stats.start[index] = Date.now()
  singleDetails(wrapper1, topic.id, topic.idiot, topic.idiot[0], false)
  singleDetails(wrapper2, topic.id, topic.sheep, topic.sheep[0], false)
  flipOpen(event)
  open(wrapper.id === 'wrapper-1' ? wrapper2 : wrapper1)
  showWrapperTwo()
}

/**
 * handle a click on the details window
 * @param {Event} event the click event
 */
function handleTestClick(event) {
  const wrapper1 = document.querySelector('#wrapper-1')
  const wrapper2 = document.querySelector('#wrapper-2')
  switch (event.target.tagName.toLowerCase()) {
    case 'span':
    case 'input':
    case 'select':
      break;
    case 'q':
      showSources(event, false)
      break;
    case 'a':
      showSources(event)
      break;
    default:
      markTestChoice(event)
      showSources(event, false)
      if (!stats.size2) hideWrapperTwo()
      close(wrapper2)
      close(wrapper1)
  }
}

/**
 * mark test choice in table
 *
 * @param {Event} event the Event triggering the action
 */
function markTestChoice(event) {
  const wrapper = event.target.closest('.card-wrapper')
  const detail = wrapper.querySelector('.detail')
  const id = wrapper.querySelector('.navigation').id
  const idiot = wrapper.id === 'wrapper-1'
  const node = document.querySelector(`.card td#${id}`)
  node.classList.add('set')
  node.classList.toggle('idiot', idiot)
  node.classList.toggle('sheep', !idiot)
  updateTestStats()
  const done = checkTestCard()
  document.querySelector('#wrapper-1').classList.toggle('done', done)
  document.querySelector('#wrapper-2').classList.toggle('done', done)
  if (done) {
    loadTestResult()
    showResult()
  } else
    hideResult()
}

/**
 * update an test argument card with a different language
 *
 * @param {HTMLElement} wrapper wrapper element of the card
 * @param {boolean} idiot if idiot card
 * @param {string} locale the new locale to switch to
 */
async function testUpdate(wrapper, idiot, locale) {
  [lang, terr] = locale.split('-')
  const size = Math.sqrt(wrapper.querySelectorAll('td').length)
  const nav = wrapper.querySelector('.navigation')
  const ids = Array.from(nav.querySelectorAll('span')).map(span => span.innerHTML)
  const id = nav.querySelector('span.selected').innerHTML 
  await loadTestCard(wrapper, idiot, size, 0, true)
  if (ids.length) singleDetails(wrapper, nav.id, ids, id, false)
  wrapper.querySelector('.location').value = `${lang}-${terr}`
  document.querySelector('.location').value = `${lang}-${terr}`
}

/**
 * clear test choices
 */
function clearTest() {
  document.querySelectorAll('.card td').forEach(node => node.classList.remove('set', 'idiot', 'sheep'))
}

/**
 * check a test card table for fully set
 *
 * @param {HTMLElement} table - table element representing the card
 *
 * @return {boolean} True if all test questions are answered
 */
function checkTestCard() {
  const set = node => node.classList.contains('set')
  const allNodes = Array.from(document.querySelectorAll('.card td'))
  return allNodes.filter(set).length === allNodes.length
}

/**
 * init the stats for a test card table
 */
function initTestStats(size1, size2) {
  const allNodes = Array.from(document.querySelectorAll('.card td'))
  stats = {
    nodes: allNodes,
    begin: Date.now(),
    duration: 0,
    size1: size1,
    size2: size2,
    cycles: allNodes.length,
    choice: new Array(allNodes.length),
    start: new Array(allNodes.length),
    times: new Array(allNodes.length),
    idiot: { count: 0, attributes: [] },
    sheep: { count: 0, attributes: [] }
  }
}

/**
 * update the stats for a test card table
 *
 * @param {HTMLElement} table - table element representing the card
 *
 * @return {Object} stats for the test questions
 */
function updateTestStats() {
  const set = node => node.classList.contains('set')
  const idiot = node => node.classList.contains('idiot')
  const sheep = node => node.classList.contains('sheep')
  const count = (counter, key) => { counter[key] = 1 + counter[key] || 1; return counter }
  const bycount = (a, b) => b[1] - a[1]
  stats.duration = Date.now() - stats.begin
  stats.nodes = Array.from(document.querySelectorAll('.card td'))
  stats.idiot.count = stats.nodes.filter(idiot).length
  stats.sheep.count = stats.nodes.filter(sheep).length
  stats.idiot.attributes = Object.entries(stats.nodes.filter(sheep).map(n => n.dataset.idiotLabel).reduce(count, {})).sort(bycount)
  stats.sheep.attributes = Object.entries(stats.nodes.filter(idiot).map(n => n.dataset.sheepLabel).reduce(count, {})).sort(bycount)
}

/**
 * load and fill test result template
 */
async function loadTestResult() {
  const start = new Date(stats.begin)
  const locale = `${lang}-${terr}`
  const template = await fetchSilent(lang + '/result.html')
  const result = document.querySelector('#result')
  result.innerHTML = template
  result.querySelector('.date-time').innerHTML = `Berlin, ${start.toLocaleDateString(locale)} ${start.toLocaleTimeString(locale)}`
  result.querySelector('.cycles').innerHTML = stats.cycles
  result.querySelector('.duration').innerHTML = `${Math.round(stats.duration/1000)}s`
  for (const type of ['idiot', 'sheep']) {
    const info = stats[type]
    const attributes = info.attributes.map(e => `${e[0]}: ${e[1]}`).join('<br>')
    const row = result.querySelector(`table tbody tr.${type}`)
    row.childNodes[1].innerHTML = info.count
    row.childNodes[2].innerHTML = `${Math.round(info.count * 100 / stats.cycles)} %`
    row.childNodes[3].innerHTML = info.count >= stats.cycles/2 ? attributes : ''
    
    if (info.attributes.length)
      result.querySelector(`.result .${type} .attribute`).innerHTML = info.attributes[0][0]
  }
  
  result.querySelector('.result .idiot').classList.toggle('hidden', 
    stats.idiot.count <= stats.sheep.count)
  result.querySelector('.result .sheep').classList.toggle('hidden', 
    stats.idiot.count >= stats.sheep.count)
  result.querySelector('.result .none').classList.toggle('hidden', 
    stats.idiot.count != stats.sheep.count)
  
  const select = document.querySelector(`#wrapper-${stats.idiot.count > stats.sheep.count ? 1 : 2} select`).cloneNode(true)
  select.removeChild(select.children[1])
  select.removeChild(select.children[0])
  result.querySelector('.labels').appendChild(select)
  
  copyLogoToTestResult()
}

/**
 * copy the logo to the top of the test result
 */
function copyLogoToTestResult() {
  const logo = document.querySelector('.logo').cloneNode(true)
  logo.removeChild(logo.querySelector('select'))
  document.querySelector('#result').prepend(logo)
}

/**
 * handle a click on the results div
 * @param {Event} event the click event
 */
function handleResultClick(event) {
  if (event.target.tagName.toLowerCase() !== 'select')
      hideResult()
}

/**
 * Show the test result panel
 */
function showResult() {
  document.querySelector('#result').classList.remove('hidden')
}

/**
 * Hide the test result panel
 */
function hideResult() {
  document.querySelector('#result').classList.add('hidden')
}

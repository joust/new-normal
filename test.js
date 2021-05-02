let stats // test stats

/**
 * create one idiot and one sheep and start the test with one of them visible
 */
function test(size) {
  loadTestCard('#wrapper-1', true, size)
  loadTestCard('#wrapper-2', false, size)
  hideWrapperTwo()
  showGame()
}

/**
 * load a card by fetching the needed content (idiot/sheep + local) from the server
 *
 * @param {HTMLElement|string} wrapper wrapper element to load the card into
 * @param {boolean} idiot load idiot content if true, otherwise sheep content
 * @param {number} size size of test card (2,3,4,5,6)
 * @param {boolean} update true if to update the card with a different locale
 */
async function loadTestCard(wrapper, idiot, size, update = false) {
  const content = await fetchSilent(lang + (idiot ? '/idiot.html' : '/sheep.html'))
  let local = await fetchSilent(terr + (idiot ? '/idiot-local.html' : '/sheep-local.html'))
  if (!local.length)
    local = await fetchSilent(lang + (idiot ? '/idiot-local.html' : '/sheep-local.html'))
  if (typeof wrapper === 'string') wrapper = document.querySelector(wrapper)
  wrapper.querySelector('.content').innerHTML = content + local
  wrapper.querySelector('.detail').onclick = event => handleTestClick(event)
  await addSources(wrapper, false)
  wrapper.querySelector('.buttons.bingo').remove()
  wrapper.querySelectorAll('i').forEach(e => e.remove())
  setPermalink(wrapper)

  if (update) updateCard(wrapper); else prepareTestCard(wrapper, size)
  prepareTestCardTitle(wrapper)
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
 * @param {number} size the size of the test card
 */
async function prepareTestCard(wrapper, size) {
  const tests = elementWithKids('div')
  tests.innerHTML = await fetchSilent(lang +'/test.html')
  const testset = Array.from(tests.querySelectorAll('q')).map((q, index) => ({
    id: 'T'+index,
    idiot: q.dataset.idiot,
    sheep: q.dataset.sheep,
    label: q.innerHTML
  }))
  makeTestCard(wrapper, testset, size)
  initTestStats(wrapper, testset)
  wrapper.classList.add('test')
  wrapper.classList.remove('idiot', 'sheep')
  wrapper.querySelector('.reload').onclick = () => clearTest()
}

/**
 * generate a test card as an HTML table with the given parent and size size
 *
 * @param {HTMLElement} wrapper - parent element to generate the table into
 * @param {{id: string, word: string}[]} testset - Array of (id, word) tuples with data for the card
 * @param {number} size - side length for the card to generate.
     Implies nr of questions, e.g. 3 => 9, 4 => 16, 5 => 25, 6 => 36
 */
function makeTestCard(wrapper, testset, size) {
  const div = wrapper.querySelector('.bingo')
  const rows = []
  let index = 0
  if (div.firstChild) div.removeChild(div.firstChild)
  for (let y = 0; y < size; y++) {
    const cells = []
    for (let x = 0; x < size; x++,index++) {
      const node = elementWithKids('td')
      const set = testset[index]
      node.id = set.id
      node.innerHTML = node.title = set.label
      if (set.idiot.length) node.classList.add(set.idiot)
      if (set.sheep.length) node.classList.add(set.sheep)
      node.onclick = event => {
        openTestDetails(event, index, set.idiot, set.sheep)
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
function openTestDetails(event, index, idiot, sheep) {
  const wrapper1 = document.querySelector('#wrapper-1')
  const wrapper2 = document.querySelector('#wrapper-2')
  stats.start[index] = Date.now()
  singleDetails(wrapper1, [idiot], false)
  singleDetails(wrapper2, [sheep], false)
  flipOpen(event)
  showWrapperTwo()
  open(wrapper2)
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
    case 'a':
      showTestSources(event)
      break;
    case 'button':
      markTestChoice(event)
    default:
      showTestSources(event, false)
      hideWrapperTwo()
      close(wrapper2)
      close(wrapper1)
  }
}

/**
 * show/hide all sources boxes if available
 *
 * @param {Event} event the Event triggering the action
 * @param {boolean} show true if the sources should be made visible false otherwise
 */
function showTestSources(event, show = true) {
  const detail = event.target.closest('.card-wrapper').querySelector('.detail')
  if (!attitude.open)
    detail.querySelectorAll('q').forEach(q => q.classList.toggle('hidden', !show))
  detail.querySelectorAll('a[href=""]').forEach(e => e.classList.toggle('hidden', show))
}

/**
 * mark test choice in wrapper1 table
 *
 * @param {Event} event the Event triggering the action
 */
function markTestChoice(event) {
  const wrapper1 = document.querySelector('#wrapper-1')
  const wrapper = event.target.closest('.card-wrapper')
  const detail = wrapper.querySelector('.detail')
  const id = detail.querySelector('a.single').id
  const idiot = wrapper.id === 'wrapper-1'
  const table = wrapper1.querySelector('table')
  const node = table.querySelector(`td.${id}`)
  node.classList.add('set')
  node.classList.toggle('idiot', idiot)
  node.classList.toggle('sheep', !idiot)
  updateTestStats(table)
  const done = checkTestCard(table)
  wrapper.classList.toggle('done', done)
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
 */
async function testUpdate(wrapper, idiot, locale) {
  [lang, terr] = locale.split('-')
  const size = Math.sqrt(wrapper.querySelectorAll('td').length)
  const ids = Array.from(wrapper.querySelectorAll('a.single')).map(a => a.id)
  await loadTestCard(wrapper, idiot, size, true)
  if (ids.length) singleDetails(wrapper, ids, false)
  wrapper.querySelector('.location').value = `${lang}-${terr}`
  document.querySelector('.location').value = `${lang}-${terr}`
}

/**
 * clear test choices in wrapper1 table
 */
function clearTest() {
  const wrapper1 = document.querySelector('#wrapper-1')
  const table = wrapper1.querySelector('table')
  table.querySelectorAll('td').forEach(node => node.classList.remove('set', 'idiot', 'sheep'))
}

/**
 * check a test card table for fully set
 *
 * @param {HTMLElement} table - table element representing the card
 *
 * @return {boolean} True if all test questions are answered
 */
function checkTestCard(table) {
  const set = node => node.classList.contains('set')
  const allNodes = Array.from(table.querySelectorAll('td'))
  return allNodes.filter(set).length === allNodes.length
}

/**
 * init the stats for a test card table
 */
function initTestStats(table, testset) {
  const allNodes = Array.from(table.querySelectorAll('td'))
  stats = {
    testset: testset,
    nodes: allNodes,
    begin: Date.now(),
    duration: 0,
    cycles: allNodes.length,
    choice: new Array(allNodes.length),
    start: new Array(allNodes.length),
    times: new Array(allNodes.length),
    idiot: {
      count: 0,
      duration: 0
    },
    sheep: {
      count: 0,
      duration: 0
    }
  }
}

/**
 * update the stats for a test card table
 *
 * @param {HTMLElement} table - table element representing the card
 *
 * @return {Object} stats for the test questions
 */
function updateTestStats(table) {
  const set = node => node.classList.contains('set')
  const idiot = node => node.classList.contains('idiot')
  const sheep = node => node.classList.contains('sheep')
  stats.duration = Date.now() - stats.begin
  stats.nodes = Array.from(table.querySelectorAll('td'))
  stats.idiot.count = stats.nodes.filter(idiot).length
  stats.sheep.count = stats.nodes.filter(sheep).length
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
    const row = result.querySelector(`table tbody tr.${type}`)
    row.childNodes[1].innerHTML = info.count
    row.childNodes[2].innerHTML = `${Math.round(info.count * 100 / stats.cycles)} %`
    row.childNodes[3].innerHTML = info.duration
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

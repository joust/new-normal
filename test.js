let stats // test stats

/**
 * create one idiot and one sheep and start the test with one of them visible
 */
async function test(cycles) {
  initTestStats(cycles)
  await loadSources()
  await loadContent(lang, terr)
  const content = extractContent(lang, terr)
  shuffle(content.idiot.args)
  shuffle(content.sheep.args)
  const idiotArgs = Math.random()>=0.5 ? Math.floor(cycles/2) : Math.ceil(cycles/2)
  const testCards = [
    ...elementsFrom(idiotArgs, content.idiot.args),
    ...elementsFrom(cycles-idiotArgs, content.sheep.args)
  ]
  shuffle(testCards)
  document.getElementById('test').insertAdjacentHTML('afterBegin', `
  <centered-cards>
    <test-pile id="test-pile" cards="${testCards.join(',')}"></test-pile>
  </centered-cards>
  `)
  document.getElementById('test-pile').addEventListener('finish', finish)
  showTest()
}

function finish(event) {
  updateTestStats(event.detail)
  loadTestResult()
  showResult()
}

/**
 * Show the test panel and stop button, hide the menu
 */
function showTest() {
  element('stop').onclick = hideTest
  element('stop').classList.remove('hidden')
  element('test').classList.remove('hidden')
  element('menu').classList.add('hidden')
}

/**
 * Hide the test panel and stop button
 */
function hideTest() {
  element('stop').classList.add('hidden')
  element('test').classList.add('hidden')
  element('result').classList.add('hidden')
  show('start')
}

/**
 * init the stats for a test card table
 */
function initTestStats(cycles) {
  stats = {
    begin: Date.now(),
    duration: 0,
    cycles,
    idiot: { count: 0, attributes: [] },
    sheep: { count: 0, attributes: [] }
  }
}

/**
 * update the stats for a test card table
 *
 * @param {{ likes: [], rejects: [] }} choices the candidate took
 *
 * @return {Object} stats for the test questions
 */
function updateTestStats(choices) {
  const topics = getTopicsData().reduce((map, topic) => { map[topic.id] = topic; return map }, {})
  const idiotArgument = id => id.includes('I')
  const sheepArgument = id => id.includes('S')
  const count = (counter, key) => { counter[key] = 1 + counter[key] || 1; return counter }
  const bycount = (a, b) => b[1] - a[1]
  
  stats.duration = Date.now() - stats.begin
  const idiot = [...choices.likes.filter(idiotArgument), ...choices.rejects.filter(sheepArgument)]
  const sheep = [...choices.likes.filter(sheepArgument), ...choices.rejects.filter(idiotArgument)]
  stats.idiot.count = idiot.length
  stats.idiot.attributes = Object.entries(
    idiot.map(topicOf).map(id => topics[id].idiotLabel).reduce(count, {})).sort(bycount)
  stats.sheep.count = sheep.length
  stats.sheep.attributes = Object.entries(
    sheep.map(topicOf).map(id => topics[id].sheepLabel).reduce(count, {})).sort(bycount)
}

/**
 * load and fill test result template
 */
async function loadTestResult() {
  const start = new Date(stats.begin)
  const locale = `${lang}-${terr}`
  const template = await fetchSilent(`content/${lang}/result.html`)
  const result = element('result')
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
  
  const select = labelSelect(stats.idiot.count < stats.sheep.count)
  result.querySelector('.labels').appendChild(select)
  
  copyLogoToTestResult()
}

/**
 * copy the logo to the top of the test result
 */
function copyLogoToTestResult() {
  const logo = document.querySelector('.logo').cloneNode(true)
  logo.removeChild(logo.querySelector('select'))
  element('result').prepend(logo)
}

/**
 * Show the test result panel
 */
function showResult() {
  element('result').classList.remove('hidden')
}

/**
 * Hide the test result panel
 */
function hideResult() {
  element('result').classList.add('hidden')
}

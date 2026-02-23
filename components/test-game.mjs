import { BaseComponent } from './base-component.mjs'
import { fetchSilent, shuffle, elementsFrom } from '../modules/common.mjs'
import { topicOf } from '../modules/uno-bg.mjs'

export class TestGame extends BaseComponent {
  get css () {
    return `
    ${super.css}
    :host {
      display: block;
    }

    centered-cards {
      width: 100%;
      height: 100%;
      transition: margin ease 0.5s;
    }

    :host(.hidden) centered-cards {
      margin-top: -150%;
    }

    #result {
      position: absolute;
      width: 100%;
      height: 100%;
      font-size: 2.5vmin;
      background-color: #fff;
      color: #666;
      padding: 0;
      margin: 0;
      text-align: center;
      transition: margin ease 0.5s;
      overflow: hidden;
    }

    #result test-certificate {
      width: 100%;
      height: 100%;
    }

    #result.hidden {
      margin-bottom: -150%;
    }

    #result h1 {
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-weight: 600;
      font-size: 7vmin;
    }

    #result table {
      border: 0.25vmax solid #aaa;
      margin-left: auto;
      margin-right: auto;
      width: 80%;
      text-align: left;
    }

    #result .result {
      color: var(--sheep-color);
      background-color: var(--sheep-background);
    }

    #result.idiot .result {
      color: var(--idiot-color);
      background-color: var(--idiot-background);
    }

    #result .drawer, #result .result {
      margin-left: 3vmin;
      margin-right: 3vmin;
    }

    #result .drawer {
      border: 0.5vmax solid #666;
      border-bottom: none;
      margin-top: 0;
      margin-bottom: 0;
      transform: perspective(20vmax) rotateX(40deg);
      transform-origin: bottom;
      padding: 1vmax;
      height: 5vmax;
    }

    #result .arrow {
      display: block;
      margin-top: -3vmax;
      margin-bottom: -8vmax;
    }

    #result .arrow::before {
      content: '▼';
      display: block;
      font-size: 6vmax;
    }

    #result .result {
      margin-top: 0;
    }

    @media (prefers-color-scheme: dark) {
      test-certificate {
        color: #ddd;
      }

      #result .drawer {
        border: 0.5vmax solid #ddd;
      }
    }
    `
  }

  get html () {
    return `
    <centered-cards id="test-area"></centered-cards>
    <div id="result" class="hidden"></div>
    `
  }

  start (cycles, { content, language, territory, topics, labelSelect }) {
    this._language = language
    this._territory = territory
    this._topics = topics
    this._labelSelect = labelSelect
    this.initTestStats(cycles)

    shuffle(content.idiot.args)
    shuffle(content.sheep.args)
    const idiotArgs = Math.random() >= 0.5 ? Math.floor(cycles / 2) : Math.ceil(cycles / 2)
    const testCards = [
      ...elementsFrom(idiotArgs, content.idiot.args),
      ...elementsFrom(cycles - idiotArgs, content.sheep.args)
    ]
    shuffle(testCards)

    this.createTestPile(testCards)
  }

  startFromHash (cards, { language, territory, topics, labelSelect }) {
    this._language = language
    this._territory = territory
    this._topics = topics
    this._labelSelect = labelSelect
    this.initTestStats(cards.length)

    this.createTestPile(cards)
  }

  createTestPile (cards) {
    const area = this.element('test-area')
    area.innerHTML = ''
    const pile = document.createElement('test-pile')
    pile.setAttribute('cards', cards.join(','))
    pile.addEventListener('finish', event => this.finish(event))
    area.appendChild(pile)
  }

  stop () {
    this.element('test-area').innerHTML = ''
    this.element('result').classList.add('hidden')
    this.element('result').innerHTML = ''
  }

  initTestStats (cycles) {
    this._stats = {
      begin: Date.now(),
      duration: 0,
      cycles,
      idiot: { count: 0, attributes: [] },
      sheep: { count: 0, attributes: [] }
    }
  }

  updateTestStats (choices) {
    const topics = this._topics.reduce((map, topic) => { map[topic.id] = topic; return map }, {})
    const idiotArgument = id => id.includes('I')
    const sheepArgument = id => id.includes('S')
    const count = (counter, key) => { counter[key] = 1 + counter[key] || 1; return counter }
    const bycount = (a, b) => b[1] - a[1]

    this._stats.duration = Date.now() - this._stats.begin
    const idiot = [...choices.approves.filter(idiotArgument), ...choices.rejects.filter(sheepArgument)]
    const sheep = [...choices.approves.filter(sheepArgument), ...choices.rejects.filter(idiotArgument)]
    this._stats.idiot.count = idiot.length
    this._stats.idiot.attributes = Object.entries(
      idiot.map(topicOf).map(id => topics[id].idiotLabel).reduce(count, {})).sort(bycount)
    this._stats.sheep.count = sheep.length
    this._stats.sheep.attributes = Object.entries(
      sheep.map(topicOf).map(id => topics[id].sheepLabel).reduce(count, {})).sort(bycount)
  }

  async loadTestResult () {
    const stats = this._stats
    const start = new Date(stats.begin)
    const locale = `${this._language}-${this._territory}`
    const template = await fetchSilent(`content/pandemic/${this._language}/result.html`)
    const result = this.element('result')
    result.classList.toggle('idiot', stats.idiot.count >= stats.sheep.count)
    result.innerHTML = `<test-certificate>${template}</test-certificate>`
    result.querySelector('.date-time').innerHTML = `Berlin, ${start.toLocaleDateString(locale)} ${start.toLocaleTimeString(locale)}`
    result.querySelector('.cycles').innerHTML = stats.cycles
    result.querySelector('.duration').innerHTML = `${Math.round(stats.duration / 1000)}s`
    for (const type of ['idiot', 'sheep']) {
      const info = stats[type]
      const attributes = info.attributes.map(e => `${e[0]}: ${e[1]}`).join('<br>')
      const row = result.querySelector(`table tbody tr.${type}`)
      row.childNodes[1].innerHTML = info.count
      row.childNodes[2].innerHTML = `${Math.round(info.count * 100 / stats.cycles)} %`
      row.childNodes[3].innerHTML = info.count >= stats.cycles / 2 ? attributes : ''

      if (info.attributes.length) { result.querySelector(`.result .${type} .attribute`).innerHTML = info.attributes[0][0] }
    }

    result.querySelector('.result .idiot').classList.toggle('hidden',
      stats.idiot.count <= stats.sheep.count)
    result.querySelector('.result .sheep').classList.toggle('hidden',
      stats.idiot.count >= stats.sheep.count)
    result.querySelector('.result .none').classList.toggle('hidden',
      stats.idiot.count !== stats.sheep.count)

    const select = this._labelSelect(stats.idiot.count > stats.sheep.count)
    result.querySelector('.labels').appendChild(select)
  }

  async finish (event) {
    this.updateTestStats(event.detail)
    await this.loadTestResult()
    this.element('result').classList.remove('hidden')
  }
}

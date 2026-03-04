import { BaseComponent } from './base-component.mjs'

export class BingoCard extends BaseComponent {
  get idiot () { return this.hasAttribute('idiot') }
  get size () { return parseInt(this.getAttribute('size') || '5') }

  get css () {
    return `
    ${super.css}
    :host {
      position: relative;
      display: block;
      width: 100vmin;
      aspect-ratio: 1;
    }

    :host(.hidden) {
      display: none;
    }

    flip-area {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    #front, #back {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    #front {
      box-shadow: 0 1vw 3vw rgba(0, 0, 0, 0.4);
      background: #999;
    }

    :host([idiot]) #front {
      background: var(--idiot-card-background);
    }

    :host(:not([idiot])) #front {
      background: var(--sheep-card-background);
    }

    flip-area[open] #front {
      box-shadow: none;
    }

    flip-area[open] #back {
      box-shadow: 0 1vw 3vw rgba(0, 0, 0, 0.4);
    }

    .title {
      height: 4vmax;
      font-size: 2vmax;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      width: calc(100% - 3vmax);
    }

    .title label {
      font-size: 2vmax;
    }

    .title label.hidden {
      display: none;
    }

    .title select {
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: 3vmax;
      font-weight: 600;
      border: none;
      background: transparent;
      color: var(--sheep-color);
      outline: none;
      text-align: center;
      text-align-last: center;
      appearance: none;
      cursor: pointer;
      -webkit-appearance: none;
    }

    :host([idiot]) .title select {
      color: var(--idiot-color);
    }

    .title select option {
      font-family: 'Open Sans', Helvetica, sans-serif;
    }

    #grid {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    table {
      height: calc(100% - 4vmax);
      border: 2vmax solid transparent;
      border-top: none;
      border-collapse: separate;
      user-select: none;
      table-layout: fixed;
      width: 100%;
    }

    tr {
      height: 20%;
    }

    td {
      width: 20%;
      background: rgba(255, 255, 255, 0.6);
      text-align: center;
      cursor: pointer;
      padding: 0.3vmax;
      overflow: hidden;
      position: relative;
    }

    td fitted-text {
      display: flex;
      width: 100%;
      height: 100%;
    }

    td.set {
      background: transparent;
      color: white;
    }

    td.center {
      background: transparent;
      color: white;
      font-size: 4vmax;
    }

    td.complete {
      background: yellow;
      color: black;
    }

    #reload {
      position: absolute;
      right: 0.2vmax;
      top: 0.2vmax;
      border: none;
      font-size: 3vmax;
      line-height: 3vmax;
      background: transparent;
      color: #ccc;
      outline: none;
      cursor: pointer;
      text-decoration: none;
      z-index: 1;
    }

    #reload:hover {
      background: rgba(255, 255, 255, 0.6);
      color: black;
    }

    @media (prefers-color-scheme: dark) {
      #front {
        background: #999;
      }
    }
    `
  }

  get html () {
    return `
    <flip-area id="fliparea">
      <div slot="back" id="back">
        <bingo-detail id="detail"></bingo-detail>
      </div>
      <div slot="front" id="front">
        <div class="title" id="title"></div>
        <div id="grid"></div>
        <button id="reload">&#x27F3;</button>
      </div>
    </flip-area>
    `
  }

  connectedCallback () {
    super.connectedCallback()
    this.element('reload').onclick = () => this.regenerate()
    const detail = this.element('detail')
    detail.addEventListener('flip-close', () => this.close())
    detail.addEventListener('counter-arguments', event => {
      this.dispatchEvent(new CustomEvent('counter-arguments', {
        bubbles: true, detail: event.detail
      }))
    })
    detail.addEventListener('locale-change', event => {
      this.dispatchEvent(new CustomEvent('locale-change', {
        bubbles: true, detail: event.detail
      }))
    })
    detail.addEventListener('exclusion-change', event => {
      this.dispatchEvent(new CustomEvent('exclusion-change', {
        bubbles: true, detail: event.detail
      }))
    })
  }

  init (topics, language, territory, attitude, sources, labelSelect, randomElement) {
    this._topics = topics
    this._language = language
    this._territory = territory
    this._attitude = attitude
    this._sources = sources
    this._labelSelect = labelSelect
    this._randomElement = randomElement

    const detail = this.element('detail')
    detail.toggleAttribute('idiot', this.idiot)

    this.regenerate()
    this.prepareTitle()
    this.loadDetail()
  }

  loadDetail () {
    const detail = this.element('detail')
    if (this.hasAttribute('one')) detail.setAttribute('one', '')
    else detail.removeAttribute('one')

    const contentRoot = document.querySelector(`#content > #${this._language}`) ||
                        document.querySelector(`#content > #${this._language}-${this._territory}`)
    if (!contentRoot) return
    const type = this.idiot ? 'idiot' : 'sheep'
    const contentDiv = contentRoot.querySelector(`.${type}`)
    if (!contentDiv) return

    detail.setContent(contentDiv.innerHTML, this._language, this._territory, this._attitude, this._sources)
  }

  regenerate () {
    if (!this._topics) return
    const topics = this._topics.slice()
    const size = this.size
    const idiot = this.idiot
    const center = idiot ? ['\uD83E\uDD2A', '\uD83D\uDC7B'] : ['\uD83D\uDC11', '\uD83D\uDE37']
    const grid = this.element('grid')

    if (grid.firstChild) grid.removeChild(grid.firstChild)

    const tbody = document.createElement('tbody')
    for (let y = 0; y < size; y++) {
      const tr = document.createElement('tr')
      for (let x = 0; x < size; x++) {
        const td = document.createElement('td')
        if (Math.floor(size / 2) === x && Math.floor(size / 2) === y) {
          td.textContent = this._randomElement(center)
          td.classList.add('center', 'set')
          td.onclick = event => this.open(event.clientX, event.clientY)
        } else {
          const topic = this.uniqueTopic(topics)
          td.id = topic.id
          const fitted = document.createElement('fitted-text')
          fitted.textContent = (idiot ? topic.idiotClaim : topic.sheepClaim) || (idiot ? topic.idiotTitle : topic.sheepTitle)
          td.appendChild(fitted)
          td.title = this.getArgumentsForTopic(topic.id)

          td.onclick = event => {
            const args = idiot ? topic.idiot : topic.sheep
            const cell = event.target.closest('td')
            const isSet = cell.classList.toggle('set')
            const complete = this.checkCard()
            this.dispatchEvent(new CustomEvent('bingo', {
              bubbles: true, detail: { complete }
            }))
            if (isSet && this._attitude.curious) this.openDetail(topic.id, args)
          }
        }
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    const table = document.createElement('table')
    table.setAttribute('lang', this._language)
    table.appendChild(tbody)
    grid.appendChild(table)

    // Safari fix
    grid.parentElement.style.display = 'none'
    grid.parentElement.offsetHeight
    grid.parentElement.style.display = ''
  }

  uniqueTopic (topics) {
    const index = Math.floor(Math.random() * topics.length)
    return topics.splice(index, 1)[0]
  }

  checkCard () {
    const table = this.shadowRoot.querySelector('table')
    if (!table) return false
    const size = this.size
    const base = Array.from({ length: size }, (_, i) => i + 1)
    const allSet = nodes => nodes.reduce((set, node) => set && node.classList.contains('set'), true)
    const rows = base.map(n => Array.from(table.querySelectorAll(`tr:nth-of-type(${n}) td`)))
    const columns = base.map(n => Array.from(table.querySelectorAll(`td:nth-of-type(${n})`)))
    const diagonals = [
      base.map(n => table.querySelector(`tr:nth-of-type(${n}) td:nth-of-type(${n})`)),
      base.map(n => table.querySelector(`tr:nth-of-type(${n}) td:nth-of-type(${size - n + 1})`))
    ]
    const complete = rows.concat(columns, diagonals).filter(allSet)
    table.querySelectorAll('td').forEach(node => node.classList.remove('complete'))
    complete.forEach(row => row.forEach(node => node.classList.add('complete')))
    return complete.length > 0
  }

  getArgumentsForTopic (topicId) {
    const contentRoot = document.querySelector(`#content > #${this._language}`) ||
                        document.querySelector(`#content > #${this._language}-${this._territory}`)
    if (!contentRoot) return ''
    const topic = contentRoot.querySelector(`.topics section[id="${topicId}"]`)
    if (!topic) return ''
    const prefix = this.idiot ? 'I' : 'S'
    const argIds = Array.from(topic.querySelectorAll(`a[id^=${prefix}]`)).map(a => a.id)
    return argIds.map(argId => {
      const arg = contentRoot.querySelector(`a[id="${argId}"] h2`)
      return arg ? arg.innerHTML : ''
    }).filter(Boolean).join('\n')
  }

  prepareTitle () {
    const title = this.element('title')
    while (title.firstChild) title.removeChild(title.firstChild)
    const select = this._labelSelect(this.idiot)
    const options = Array.from(select.querySelectorAll('option'))
    if (!this._attitude.fair && options.length) {
      this._randomElement(options).selected = true
    } else { select.value = '' }
    title.appendChild(select)

    const contentRoot = document.querySelector(`#content > #${this._language}`) ||
                        document.querySelector(`#content > #${this._language}-${this._territory}`)
    if (contentRoot) {
      const type = this.idiot ? 'idiot' : 'sheep'
      const label = contentRoot.querySelector(`.${type} label[for="label"]`)
      if (label) title.appendChild(label.cloneNode(true))
    }
  }

  updateGridTopics (topics) {
    if (topics) this._topics = topics
    this.shadowRoot.querySelectorAll('td[id]').forEach(td => {
      const topic = this._topics.find(t => t.id === td.id)
      if (topic) {
        const text = (this.idiot ? topic.idiotClaim : topic.sheepClaim) || (this.idiot ? topic.idiotTitle : topic.sheepTitle)
        let fitted = td.querySelector('fitted-text')
        if (!fitted) {
          fitted = document.createElement('fitted-text')
          td.textContent = ''
          td.appendChild(fitted)
        }
        fitted.textContent = text
        td.title = this.getArgumentsForTopic(topic.id)
      }
    })
  }

  refresh (topics, language, territory) {
    this._topics = topics
    this._language = language
    this._territory = territory
    const detail = this.element('detail')
    const navState = detail.getNavigationState()

    this.updateGridTopics()
    this.prepareTitle()
    this.loadDetail()

    if (navState.ids.length) {
      detail.showArguments(navState.topicId, navState.ids, navState.selected)
    }
  }

  openDetail (topicId, args, selected) {
    const detail = this.element('detail')
    detail.showArguments(topicId, args, selected)
    this.open()
  }

  closeDetail () {
    const detail = this.element('detail')
    detail.showAll()
    this.close()
  }

  open (x = 0, y = 0) {
    this.element('fliparea').open(x, y)
  }

  close () {
    this.element('fliparea').close()
  }
}

import { BaseComponent } from './base-component.mjs'

export class BingoDetail extends BaseComponent {
  get idiot () { return this.hasAttribute('idiot') }

  get css () {
    return `
    ${super.css}
    :host {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    #detail {
      position: absolute;
      width: 100%;
      height: 100%;
      background: #eee;
      overflow-x: hidden;
      overflow-y: auto;
      text-align: left;
      cursor: pointer;
      user-select: text;
      padding: 2vmax;
      box-sizing: border-box;
    }

    #detail .location {
      font-size: 7vmin;
      max-width: 10vmin;
    }

    #detail .search {
      width: 100%;
      font-size: 2vmax;
      padding: 0.5vmax;
    }

    #detail.single {
      display: flex;
      align-items: start;
      user-select: none;
      overflow-y: hidden;
    }

    #detail.single q h2 {
      margin-left: 9vmax;
    }

    #detail.single q {
      position: absolute;
      top: 2vmax;
      left: 2vmax;
      right: 2vmax;
      bottom: 2vmax;
      margin: 0;
      padding: 2vmax;
      background: #eee;
      overflow-y: auto;
    }

    #detail a[id] input {
      float: left;
    }

    #detail a[id].excluded, #detail a[id].excluded p {
      color: #aaa;
    }

    #detail.single a[id],
    #detail.single a[id] p,
    #detail.single a[id] + ul,
    #detail.single a[id] > span,
    #detail.single .search,
    #detail.single input[type="checkbox"],
    #detail a[id].not-matching,
    #detail a[id].not-matching p {
      display: none;
    }

    #detail.single a.single, #detail.single a.single p {
      display: block;
      transition: height 0.5s ease;
    }

    #detail.single h1, #detail.single h1 + p {
      display: none;
    }

    #detail #content h2 {
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-weight: 600;
      font-stretch: condensed;
    }

    #detail #content h2::before {
      content: "\\201c"
    }

    #detail #content h2::after {
      content: "\\201d"
    }

    #detail #content > h2 {
      display: none;
    }

    #detail.single #content > h2 {
      display: block;
    }

    #detail ul {
      list-style-type: none;
      padding-left: 0;
    }

    #detail ul li span {
      margin-right: 0.5em;
    }

    #detail a[id] > span, #detail li span, .navigation span {
      color: #fff;
      padding: 0.5vmax;
      user-select: none;
      margin-left: 0.5vmax;
      margin-bottom: 0.5vmax;
      display: inline-block;
    }

    :host([idiot]) #detail a[id] > span,
    :host([idiot]) #detail li span,
    :host([idiot]) .navigation span,
    :host(:not([idiot])) .navigation span.counter {
      background: var(--idiot-background);
      color: var(--idiot-color);
    }

    :host(:not([idiot])) #detail a[id] > span,
    :host(:not([idiot])) #detail li span,
    :host(:not([idiot])) .navigation span,
    :host([idiot]) .navigation span.counter {
      background: var(--sheep-background);
      color: var(--sheep-color);
    }

    #detail a[id].excluded > span {
      background: #aaa;
    }

    #detail a[id] > span {
      float: right;
    }

    #detail li span {
      float: left;
      clear: both;
      min-width: 2.5em;
      text-align: center;
    }

    #detail li h3 {
      margin: 0.6em;
    }

    #detail li h3 a {
      color: inherit;
      text-decoration: none;
    }

    .navigation {
      display: none;
    }

    #detail.single .navigation {
      display: block;
    }

    .navigation span {
      opacity: 0.5;
    }

    .navigation span.selected {
      opacity: 1;
      transform: scale(1.1);
    }

    .logo {
      font-size: 6vmax;
      letter-spacing: -0.3vmax;
      text-align: center;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-weight: 600;
    }

    :host([one]) .logo {
      font-size: 12vmin;
      letter-spacing: -0.6vmax;
    }

    .logo .virus {
      position: relative;
      display: inline-block;
      background: url('/styles/images/virus.png');
      background-position: center;
      background-size: contain;
      background-repeat: no-repeat;
      width: 6vmax;
      height: 6vmax;
      margin-left: -1.3vmax;
      margin-right: -1.3vmax;
    }

    :host([one]) .logo .virus {
      width: 12vmin;
      height: 12vmin;
      margin-left: -2.6vmin;
      margin-right: -2.6vmin;
    }

    .hidden {
      display: none;
    }

    #detail label[for="label"] {
      display: none;
    }

    .red { color: var(--idiot-background); }
    .blue { color: var(--sheep-background); }

    #detail button {
      font-size: 3vmax;
    }

    :host([one]) #detail button {
      font-size: 6vmin;
    }

    #correct, #permalink {
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

    #correct {
      left: 0.2vmax;
      right: inherit;
    }

    #correct.active {
      background: yellow;
    }

    #permalink:hover, #correct:hover {
      background: rgba(255, 255, 255, 0.6);
      color: black;
    }

    @media (orientation: portrait) {
      #detail {
        font-size: 1.7vmax;
      }
    }

    @media (prefers-color-scheme: dark) {
      #detail {
        background: #555;
        color: white;
      }

      #detail.single q {
        background: #555;
      }
    }
    `
  }

  get html () {
    return `
    <div id="detail">
      <a id="correct">&#x270E;</a>
      <a id="permalink" href="" target="_blank">&#x1F517;</a>
      <div id="content"></div>
    </div>
    `
  }

  connectedCallback () {
    super.connectedCallback()
    this.element('detail').onclick = event => this.handleClick(event)
    this.element('correct').onclick = () => this.toggleCorrectMode()
  }

  setContent (contentHTML, language, territory, attitude, sources) {
    this._attitude = attitude
    this._sources = sources
    this._language = language
    this._territory = territory
    const content = this.element('content')
    content.innerHTML = ''

    const logo = document.querySelector('.logo').cloneNode(true)
    content.appendChild(logo)
    const localeSelector = logo.querySelector('locale-selector')
    if (localeSelector) {
      localeSelector.value = `${language}-${territory}`
    }

    const navigation = document.createElement('p')
    navigation.classList.add('navigation')
    content.appendChild(navigation)

    const tr = document.createElement('div')
    tr.setAttribute('lang', language)
    tr.classList.add('tr')
    tr.innerHTML = contentHTML
    content.appendChild(tr)

    this.addStatements()
    this.addIdTags()
    this.addSources()
    if (attitude.friendly) {
      this.element('content').querySelectorAll('i, #content button').forEach(e => e.remove())
    }
    this.applyExclusions()
    this.addCheckboxes()

    const searchInput = this.shadowRoot.querySelector('.search')
    if (searchInput) {
      searchInput.removeAttribute('oninput')
      searchInput.oninput = event => this.handleSearch(event)
    }
  }

  addStatements () {
    const msgRoot = document.querySelector(`#content > #${this._language} .messages`) ||
                    document.querySelector(`#content > #${this._language}-${this._territory} .messages`)
    const getMsg = key => {
      if (!msgRoot) return '???'
      const node = msgRoot.querySelector(`a.${key}`)
      return node ? node.innerHTML : '???'
    }
    const statement = getMsg('bingo.phrase.statement')
    const question = getMsg('bingo.phrase.question')
    this.element('content').querySelectorAll('a[id] p').forEach(p => {
      const hasQmark = p.innerHTML.includes('?')
      p.insertAdjacentHTML('afterbegin', `<i>${hasQmark ? question : statement} </i>`)
    })
  }

  addIdTags () {
    this.element('content').querySelectorAll('a[id]').forEach(a => {
      const idtag = document.createElement('span')
      idtag.textContent = a.id
      idtag.onclick = event => this.toggleDetails(event, [a.id])
      a.prepend(idtag)
    })
  }

  addSources () {
    if (!this._sources) return
    this.element('content').querySelectorAll('a[id]').forEach(a => {
      const links = this._sources.querySelectorAll(`a.${a.id}`)
      links.forEach(link => (link.target = '_blank'))
      if (links.length > 0) {
        const h2 = a.querySelector('h2')
        const q = document.createElement('q')
        if (h2) q.appendChild(h2.cloneNode(true))
        const ul = document.createElement('ul')
        Array.from(links).forEach(s => {
          const li = document.createElement('li')
          li.appendChild(s.cloneNode(true))
          li.appendChild(document.createTextNode(' ('))
          const mirror = s.cloneNode(true)
          mirror.href = `https://archive.is/${s.href}`
          mirror.firstChild.textContent = 'Mirror'
          li.appendChild(mirror)
          li.appendChild(document.createTextNode(')'))
          ul.appendChild(li)
        })
        q.appendChild(ul)
        q.classList.add('hidden')
        if (a.nextElementSibling) a.nextElementSibling.appendChild(q)
      }
    })
  }

  applyExclusions () {
    if (!this._attitude || !this._attitude.exclusions) return
    this._attitude.exclusions.split(',').forEach(e => {
      const el = this.shadowRoot.querySelector(`a[id="${e}"]`)
      if (el) el.classList.add('excluded')
    })
  }

  addCheckboxes () {
    this.element('content').querySelectorAll('a[id^=T]').forEach(a => {
      const checkbox = document.createElement('input')
      checkbox.checked = !a.classList.contains('excluded')
      checkbox.type = 'checkbox'
      checkbox.onclick = event => this.toggleExclusions(a.id, event)
      a.prepend(checkbox)
    })
  }

  toggleExclusions (id, event) {
    const exclude = !event.target.parentElement.classList.contains('excluded')
    event.target.parentElement.classList.toggle('excluded', exclude)
    const set = new Set(this._attitude.exclusions.split(','))
    if (exclude) set.add(id); else set.delete(id)
    this.dispatchEvent(new CustomEvent('exclusion-change', {
      bubbles: true, composed: true,
      detail: { exclusions: Array.from(set).join(',') }
    }))
  }

  handleClick (event) {
    switch (event.target.tagName.toLowerCase()) {
      case 'span':
      case 'input':
      case 'select':
        break
      case 'q':
        this.showSourcesToggle(false)
        break
      case 'a':
        if (event.target.id === 'correct' || event.target.id === 'permalink') break
        this.showSourcesToggle(true)
        break
      case 'i':
      case 'p':
      case 'h2':
        if (event.target.hasAttribute('contenteditable')) break
        // fall thru
      default:
        this.showSourcesToggle(false)
        this.requestClose()
    }
  }

  requestClose () {
    this.showAll()
    this.dispatchEvent(new CustomEvent('flip-close', { bubbles: true, composed: true }))
  }

  showSourcesToggle (show) {
    this.shadowRoot.querySelectorAll('q').forEach(q => q.classList.toggle('hidden', !show))
  }

  showArguments (topicId, ids, selected, showPermalink = true) {
    selected = selected || ids[0]
    this.setNavigation(topicId, ids, selected, showPermalink)
    const detail = this.element('detail')
    detail.classList.add('single')
    detail.querySelectorAll('a[id]').forEach(e => e.classList.remove('single'))
    const anchor = this.shadowRoot.querySelector(`a[id="${selected}"]`)
    if (anchor) {
      anchor.classList.add('single')
      detail.querySelectorAll('a[href=""]').forEach(e => e.classList.toggle('hidden',
        !anchor.querySelector('q')))
    }
    this.setPermalink(showPermalink ? ids : false)
  }

  showAll () {
    const detail = this.element('detail')
    detail.classList.remove('single')
    detail.querySelectorAll('a[id]').forEach(e => e.classList.remove('single'))
    this.setPermalink([this.idiot ? 'I' : 'S'])
  }

  getNavigationState () {
    const nav = this.shadowRoot.querySelector('.navigation')
    if (!nav) return { topicId: null, ids: [], selected: null }
    const spans = Array.from(nav.querySelectorAll('span:not(.counter)'))
    const ids = spans.map(span => span.textContent)
    const selectedSpan = nav.querySelector('span.selected')
    return {
      topicId: nav.id !== 'nav' ? nav.id : null,
      ids,
      selected: selectedSpan ? selectedSpan.textContent : null
    }
  }

  setNavigation (topicId, ids, selected, showPermalink) {
    const content = this.element('content')
    const navigation = document.createElement('p')
    ids.forEach(id => {
      navigation.appendChild(document.createTextNode('\u00ad'))
      const idtag = document.createElement('span')
      idtag.textContent = id
      idtag.onclick = () => this.showArguments(topicId, ids, id, showPermalink)
      if (id === selected) idtag.classList.add('selected')
      navigation.appendChild(idtag)
    })
    navigation.id = topicId || 'nav'
    navigation.classList.add('navigation')
    if (showPermalink && topicId) {
      const countertag = document.createElement('span')
      countertag.textContent = '\u25ba'
      countertag.classList.add('counter')
      countertag.onclick = () => {
        this.dispatchEvent(new CustomEvent('counter-arguments', {
          bubbles: true, composed: true,
          detail: { topicId, idiot: !this.idiot }
        }))
      }
      navigation.appendChild(countertag)
    }
    const oldNav = content.querySelector('.navigation')
    if (oldNav) content.replaceChild(navigation, oldNav)
  }

  setPermalink (ids) {
    const permalink = this.element('permalink')
    if (ids) {
      permalink.classList.remove('hidden')
      permalink.href = `${window.location.origin}/#${ids.join('&')}`
    } else { permalink.classList.add('hidden') }
  }

  toggleDetails (event, ids) {
    const single = event.target.parentElement.classList.contains('single')
    if (single) {
      this.showAll()
      const anchor = this.shadowRoot.querySelector(`a[id="${ids[0]}"]`)
      if (anchor) anchor.scrollIntoView()
    } else { this.showArguments(null, ids) }
  }

  handleSearch (event) {
    const input = event.target.value.toLowerCase()
    const args = Array.from(this.element('content').querySelectorAll('a[id]'))
    args.forEach(a => a.classList.remove('not-matching'))
    const notMatching = input.length
      ? args.filter(a => !a.textContent.replace(/\u00ad/gi, '').toLowerCase().includes(input))
      : []
    notMatching.forEach(a => a.classList.add('not-matching'))
  }

  toggleCorrectMode () {
    const correctBtn = this.element('correct')
    const currentMode = correctBtn.classList.contains('active')
    this.element('content').querySelectorAll('a[id] p, a[id] h2').forEach(e => {
      if (!currentMode) { e.setAttribute('contenteditable', 'plaintext-only') } else { e.removeAttribute('contenteditable') }
      e.oninput = this.debounce(event => {
        this.dispatchEvent(new CustomEvent('correction', {
          bubbles: true, composed: true,
          detail: {
            lang: this._language,
            idiot: this.idiot,
            edited: this.shadowRoot.querySelector('.tr').innerHTML
          }
        }))
      }, 1000)
    })
    correctBtn.classList.toggle('active', !currentMode)
  }
}

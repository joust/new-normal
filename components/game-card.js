const gameCardTemplate = document.createElement('template')
gameCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
      overflow: hidden;
      position: relative;
    }

    #card {
      width: 100%;
      height: 100%;
    }

    #previous, #next {
      position: absolute;
      font-size: calc(6 * var(--cavg));
      color: lightgrey;
      right: calc(50% - 5 * var(--cavg));
      cursor: pointer;
      width: calc(10 * var(--cavg));
      height: calc(10 * var(--cavg));
      text-align: center;
      border-radius: 50%;
      background-color: white;
      opacity: 0.2;
      border: none;
    }

    #previous:hover, #next:hover {
      background: grey;
    }

    #previous {
      top: 0.5%;
    }

    #next {
      bottom: 0.5%;
    }

    .hidden {
      display: none;
    }
  </style>
  <button id="previous">▲</button>
  <button id="next">▼</button>
`

const ALTERNATIVES_STEP = 300

class GameCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.alternatives = []
    this.altIndex = 0
  }

  static observedAttributes = ['card', 'alt', 'alternatives', 'mirrored']
  static contentRootSelector = '#content'

  element(id) { return this.shadowRoot.getElementById(id) }

  get card() {
    return this.getAttribute('card')
  }

  get alt() {
    return this.getAttribute('alt')
  }

  set alt(alt) {
    if (this.getAttribute('alt') !== alt) this.setAttribute('alt', alt)
  }

  get idOnly() {
    const card = this.alt || this.card
    return (this.hasTopic ? card.split(':')[1] : card).replace('*', '')
  }

  get isWildcard() {
    return this.card.endsWith('*')
  }

  get hasTopic() {
    const card = this.alt || this.card
    return card.includes(':')
  }

  get idiot() {
    return this.card.includes('I')
  }

  get topic() {
    const card  = this.alt || this.card
    return this.hasTopic ? card.split(':')[0] : ''
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback(name) {
    if (this.isConnected) {
      if (name==='card' || name==='alt') this.updateCard()
      if (name==='mirrored') this.updateMirrored()
      if (name==='alternatives') this.updateAlternatives()
    }
  }

  connectedCallback() {
    this.shadowRoot.appendChild(gameCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
    const template = document.createElement('template')
    this.shadowRoot.appendChild(template.content)
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    this.element('previous').insertAdjacentHTML('beforebegin', this.getCardElement())

    this.element('previous').onclick = () => this.updateAltIndex(-ALTERNATIVES_STEP)
    this.element('next').onclick = () => this.updateAltIndex(ALTERNATIVES_STEP)
    this.onwheel = event => this.updateAltIndex(event.deltaY)
    this.updateAlternatives()
  }

  updateAltIndex(delta) {
    this.altIndex += delta / ALTERNATIVES_STEP
    if (this.altIndex < 0) this.altIndex += this.alternatives.length
    if (this.altIndex >= this.alternatives.length) this.altIndex -= this.alternatives.length
    const index = Math.floor(this.altIndex)

    this.alt = this.alternatives[index]+(this.isWildcard?'*':'')
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }

  updateCard() {
    const card = this.element('card')
    if (this.isConnected && card) {
      card.insertAdjacentHTML('beforebegin', this.getCardElement())
      this.shadowRoot.removeChild(card)
    }
    if (!this.alternatives.length) this.alternatives = [this.card]
  }

  updateMirrored() {
    const card = this.element('card')
    if (card) card.toggleAttribute('mirrored', this.mirrored)
  }

  updateAlternatives() {
    this.alternatives = this.hasAttribute('alternatives') ? this.getAttribute('alternatives').split(',') : [this.card]

    const card = this.alt || this.card
    this.altIndex = this.alternatives.indexOf(card.replace('*', ''))
    if (this.altIndex<0) { this.alt = this.alternatives[0]; this.altIndex = 0; }
    const previous = this.element('previous')
    const next = this.element('next')
    if (previous) previous.classList.toggle('hidden', this.alternatives.length<=1)
    if (next) next.classList.toggle('hidden', this.alternatives.length<=1)
  }

  /**
   * generates an archive.is mirror anchor node for the given node
   *
   * @param {HTMLElement} a the anchor node to mirror
   */
   mirrorNode(a) {
    const mirror = a.cloneNode(true)
    mirror.href = `https://archive.is/${a.href}`
    mirror.firstChild.textContent = 'Mirror'
    return mirror
  }

  getSourcesHTML(id) {
    const sources = document.querySelector(`${GameCard.contentRootSelector} > .sources`)
    if (sources) {
      const links = Array.from(sources.querySelectorAll(`a.${id}`))
      if (links.length > 0) {
        const q = this.elementWithKids('q', [
  //        a.querySelector('h2').cloneNode(true),
          this.elementWithKids('ul', links.map(
          s => this.elementWithKids('li', [
            s.cloneNode(true), ' (', this.mirrorNode(s), ')'
          ])))
        ])
        return q.outerHTML
      }
    }
    return undefined
  }

  elementWithKids(tag, kids = undefined) {
    const node = document.createElement(tag)
    if (kids) {
      if (!(kids instanceof Array)) kids = [kids]
      kids.forEach(kid => {
        if (!(kid instanceof HTMLElement)) kid = document.createTextNode(kid)
        node.appendChild(kid)
      })
    }
    return node
  }

  getMessage(key, fallback = '???') {
    const node = document.querySelector(`${GameCard.contentRootSelector} > #${this.lang} .messages a.${key}`)
    return node ? node.innerHTML : fallback
  }

  getContent(key, clazz = undefined) {
    clazz = this.getMessage(clazz ? `${key}.class.${clazz}` : `${key}.class`, null)
    const phrase = this.getMessage(`${key}.phrase`, null)
    const description = this.getMessage(`${key}.description`, null)
    return (clazz ? `<i>${clazz}</i>` : '')
          + (phrase ? `<h2>${phrase}</h2>` : '')
          + (description ? `<p>${description}</p>` : '')
  }

  cardWithSources(id, title, front) {
    const sources = this.getSourcesHTML(id)
    if (sources) {
      const back = `<sources-back slot="back"><h2>${title}</h2>${sources}</sources-back>`
      front = front.replace(' ', ' slot="front" ')
      return `<flip-card id="card">${front}${back}</flip-card>`
    } else
      return front.replace(' ', ' id="card" ')
  }

  getCardElement() {
    const data = document.querySelector(`${GameCard.contentRootSelector} > #${this.lang} a[id="${this.idOnly}"]`)
    const clazz = data ? data.classList.item(0) || '' : ''
    const title = data ? data.querySelector('h2') ? data.querySelector('h2').innerHTML : data.title : '???'
    const type = this.idiot ? 'idiot' : ''
    const side = this.idiot ? 'idiot' : 'sheep'
    const mirrored = this.mirrored ? 'mirrored' : ''
    const wildcard = this.isWildcard ? 'wildcard' : ''
    const spellcheck = data && data.hasAttribute('spellcheck') ? 'spellcheck ' : ''
    switch (this.idOnly[0]) {
      case 'C': return `<cancel-card id="card" ${type} ${mirrored} card="${this.card}">${data ?data.outerHTML : ''}${this.getContent('cancel')}</cancel-card>`
      case 'L': return `<label-card id="card" ${type} ${mirrored} card="${this.card}">${data ?data.outerHTML : ''}${this.getContent('label')}</label-card>`
      case 'A': return this.cardWithSources(this.idOnly, title, `<appeal-to-card ${type} ${mirrored} card="${this.card}">${data ? data.outerHTML : ''}${this.getContent('appeal-to', clazz)}</appeal-to-card>`)
      case 'F': return `<fallacy-card id="card" ${type} ${mirrored} card="${this.card}">${data ?data.outerHTML : ''}${this.getContent('fallacy', clazz)}</fallacy-card>`
      case 'N': return `<strawman-card id="card" ${type} ${mirrored}>${this.getContent('strawman')}</strawman-card>`
      case 'R': return `<research-card id="card" ${type} ${mirrored}>${this.getContent(`research.${side}`)}</research-card>`
      case 'P': return `<pause-card id="card" ${type} ${mirrored}>${this.getContent(`pause.${side}`)}</pause-card>`
      case 'B': return `<banish-card id="card" ${type} ${mirrored}>${this.getContent('banish')}</banish-card>`
      default: // argument id and discuss id will have a topic
        const topicData = this.topic && document.querySelector(`${GameCard.contentRootSelector} > #${this.lang} > .topics > section[id="${this.topic}"]`)
        const topicTitle = topicData ? topicData.title : ''
        if (this.idOnly.startsWith('D'))
          return `<discuss-card id="card" ${type} ${mirrored} topicId="${this.topic}">${this.getContent('discuss').replace('TOPIC', `<b>${topicTitle}</b>`)}</discuss-card>`
        else {
          return this.cardWithSources(this.idOnly, title, `<argument-card ${type} ${mirrored} ${wildcard} ${spellcheck} card="${this.idOnly}" topicId="${this.topic}" topic="${topicTitle}">${data.innerHTML}</argument-card>`)
        }
    }
  }
}

customElements.define('game-card', GameCard)

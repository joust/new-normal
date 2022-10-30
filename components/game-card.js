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
      font-size: calc(7 * var(--cavg));
      color: grey;
      opacity: .2;
      right: 0;
      cursor: pointer;
      width: 100%;
      text-align: center;
      z-index: 1;
    }

    #previous.mirrored, #next.mirrored {
      left: 0;
      right: auto;
    }

    #previous {
      top: 0;
    }

    #next {
      bottom: 0;
    }

    .hidden {
      display: none;
    }
  </style>
  <div id="previous">▲</div>
  <div id="next">▼</div>
`

const ALTERNATIVES_STEP = 200

class GameCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.altIndex = 0
  }

  static observedAttributes = ['card', 'alt', 'alternatives', 'mirrored']
  static contentRootSelector = '#content'

  element(id) { return this.shadowRoot.getElementById(id) }

  get card() {
    return this.getAttribute('card')
  }

  get alt() {
    return this.getAttribute('alt')
  }

  get idOnly() {
    const card = this.alt || this.card
    if (!card) debugger
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

  get alternatives() {
    return this.hasAttribute('alternatives') ? this.getAttribute('alternatives').split(',') : [this.card]
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
    this.element('previous').insertAdjacentHTML('beforeBegin', this.getCardElement())

    this.element('previous').onlick = event => this.updateAltIndex(-1) // TODO not working
    this.element('next').onlick = event => this.updateAltIndex(1) // TODO not working
    this.onwheel = event => this.updateAltIndex(event.deltaY)
  }

  updateAltIndex(delta) {
    this.altIndex += delta / ALTERNATIVES_STEP
    if (this.altIndex < 0) this.altIndex += this.alternatives.length
    if (this.altIndex >= this.alternatives.length) this.altIndex -= this.alternatives.length
    const index = Math.floor(this.altIndex)
    console.log(this.index, this.alternatives[index])

    this.setAttribute('alt', this.alternatives[index]+(this.isWildcard?'*':''))
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }

  updateCard() {
    const card = this.element('card')
    if (this.isConnected && card) {
      card.insertAdjacentHTML('beforeBegin', this.getCardElement())
      this.shadowRoot.removeChild(card)
    }
  }

  updateMirrored() {
    const previous = this.element('previous')
    const next = this.element('next')
    const card = this.element('card')
    if (previous) previous.classList.toggle('mirrored', this.mirrored)
    if (next) next.classList.toggle('mirrored', this.mirrored)
    if (card) card.toggleAttribute('mirrored', this.mirrored)
  }

  updateAlternatives() {
    const card = this.alt || this.card
    this.altIndex = this.alternatives.indexOf(card.replace('*', ''))
    if (this.altIndex<0) { this.setAttribute('alt', this.alternatives[0]); this.altIndex = 0 }
    const previous = this.element('previous')
    const next = this.element('next')
    if (previous) previous.classList.toggle('hidden', this.alternatives.length===1)
    if (next) next.classList.toggle('hidden', this.alternatives.length===1)
  }

  getCardElement() {
    const data = document.querySelector(`${GameCard.contentRootSelector} > #${this.lang} a[id="${this.idOnly}"]`) || ''
    const type = this.idiot ? 'idiot' : ''
    const mirrored = this.mirrored ? 'mirrored' : ''
    const wildcard = this.isWildcard ? 'wildcard' : ''
    switch ((this.alt || this.card)[0]) {
      case 'L': return `<label-card id="card" ${type} ${mirrored} card="${this.card}">${data.outerHTML}</label-card>`
      case 'A': return `<appeal-to-card id="card" ${type} ${mirrored} type="${data.type}" card="${this.card}">${data.outerHTML}</appeal-to-card>`
      case 'F': return `<fallacy-card id="card" ${type} ${mirrored} card="${this.card}">${data.outerHTML}</fallacy-card>`
      case 'N': return `<strawman-card id="card" ${type} ${mirrored}></strawman-card>`
      case 'R': return `<research-card id="card" ${type} ${mirrored}></research-card>`
      case 'P': return `<pause-card id="card" ${type} ${mirrored}></pause-card>`
      default: // argument id and discuss id will contain the topic too
        const topicData = this.topic && document.querySelector(`${GameCard.contentRootSelector} > #${this.lang} a[id="${this.topic}"]`)
        const topic = topicData ? topicData.firstElementChild.innerHTML : ''
        if (this.idOnly.startsWith('D'))
          return `<discuss-card id="card" ${type} ${mirrored} topicId="${this.topic}" topic="${topic}"></discuss-card>`
        else
          return `<argument-card id="card" ${type} ${mirrored} ${wildcard} card="${this.idOnly}" topicId="${this.topic}" topic="${topic}">${data.innerHTML}</argument-card>`
    }
  }
}

customElements.define('game-card', GameCard)
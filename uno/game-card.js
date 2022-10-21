const gameCardTemplate = document.createElement('template')
gameCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
      overflow: hidden;
      position: relative;
    }

    #parent {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    #card {
      width: 100%;
      height: 100%;
    }

    #previous {
      position: absolute;
      top: 0;
      left: auto;
      right: auto;
      font-size: 1em;
      color: white;
      opacity: .5;
    }

    #next {
      position: absolute;
      bottom: 0;
      left: auto;
      right: auto;
      font-size: 1em;
      color: white;
      opacity: .3;
      cursor: pointer;
    }

    #previous:hover, #next:hover {
      opacity: 1;
    }
  </style>
  <div id="previous">▲</div>
  <div id="next">▼</div>
`

const ALTERNATIVES_STEP = 20

class GameCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['card', 'alternatives', 'mirrored']
  static contentRootSelector = '#content'

  element(id) { return this.shadowRoot.getElementById(id) }

  get card() {
    return this.getAttribute('card')
  }

  get idOnly() {
    return this.hasTopic ? this.card.split(':')[1] : this.card
  }

  get hasTopic() {
    return this.card.includes(':')
  }

  get idiot() {
    return this.card.includes('I')
  }

  get topic() {
    return this.hasTopic ? this.card.split(':')[0] : ''
  }

  get alternatives() {
    return this.hasAttribute('alternatives') ? this.getAttribute('alternatives').split(',') : []
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback(name) {
    if (this.isConnected) {
      if (name==='card') this.updateCard()
      if (name==='mirrored') this.updateMirrored()
      if (name==='alternatives') this.updateAlternatives()
    }
  }

  connectedCallback() {
    this.shadowRoot.appendChild(gameCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
    const template = document.createElement('template')
    this.shadowRoot.appendChild(template.content)
    this.element('previous').insertAdjacentHTML('beforeBegin', this.getCardElement())

    this.element('previous').onlick = event => console.log('click previous')
    this.element('next').onlick = event => console.log('click next')
    this.onwheel = event => {
      console.log('wheel', event.deltaY)
      if (Math.abs(event.deltaY) >= ALTERNATIVES_STEP) {
        this.setAttribute('card', randomElement(this.alternatives))
      }
    }
  }

  updateCard() {
    const card = this.element('card')
    if (this.isConnected && card) {
      card.insertAdjacentHTML('beforeBegin', this.getCardElement())
      this.shadowRoot.removeChild(card)
    }
  }

  updateMirrored() {
    const card = this.element('card')
    if (card) card.toggleAttribute('mirrored', this.mirrored)
  }

  updateAlternatives() {
    // TODO
  }

  getCardElement() {
    const data = document.querySelector(`${GameCard.contentRootSelector} > #${this.lang} a[id="${this.idOnly}"]`) || ''
    const type = this.idiot ? 'idiot' : ''
    const mirrored = this.mirrored ? 'mirrored' : ''
    switch (this.card[0]) {
      case 'L': return `<label-card id="card" ${type} ${mirrored} card="${this.card}">${data.innerHTML}</label-card>`
      case 'A': return `<appeal-to-card id="card"  ${type} ${mirrored} type="${data.type}" card="${this.card}">${data.innerHTML}</appeal-to-card>`
      case 'F': return `<fallacy-card id="card" ${type} ${mirrored} card="${this.card}">${data.innerHTML}</fallacy-card>`
      case 'S': return `<strawman-card id="card" ${type} ${mirrored}></strawman-card>`
      case 'R': return `<research-card id="card" ${type} ${mirrored}></research-card>`
      default: // argument id may contain the topic too
        const topicData = this.topic && document.querySelector(`${GameCard.contentRootSelector} > #${this.lang} a[id="${this.topic}"]`)
        const topic = topicData ? topicData.firstElementChild.innerHTML : ''
        return `<argument-card id="card" ${type} ${mirrored} card="${this.idOnly}" topicId="${this.topic}" topic="${topic}">${data.innerHTML}</argument-card>`
    }
  }
}

customElements.define('game-card', GameCard)
const gameCardTemplate = document.createElement('template')
gameCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
      width: 100%;
      height: 100%;
      border: none;
    }

    argument-card, fallacy-card, appeal-to-card, label-card, research-card, strawman-card {
      width: 100%;
      height: 100%;
    }
  </style>
`

class GameCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['id', 'mirrored']
  static contentRootSelector = '#content'

  get id() {
    return this.getAttribute('id')
  }

  get idOnly() {
    return this.hasTopic ? this.id.split(':')[1] : this.id
  }

  get hasTopic() {
    return this.id.includes(':')
  }

  get idiot() {
    return this.id.includes('I')
  }

  get topic() {
    return this.hasTopic ? this.id.split(':')[0] : ''
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback(name) {
    if (name==='id') this.updateId()
    if (name==='mirrored') this.updateMirrored()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(gameCardTemplate.content.cloneNode(true))
    const template = document.createElement('template')
    template.innerHTML = this.getCardElement()
    this.shadowRoot.appendChild(template.content)
  }

  updateId() {
      const card = this.querySelector('argument-card, fallacy-card, appeal-to-card, label-card, research-card, strawman-card')
    if (this.isConnected && card) {
      const template = document.createElement('template')
      template.innerHTML = this.getCardElement()
      card.parentElement.replaceChild(card, template.content)
    }
  }

  updateMirrored() {
    if (this.isConnected) {
      const card = this.querySelector('argument-card, fallacy-card, appeal-to-card, label-card, research-card, strawman-card')
      if (card) card.toggleAttribute('mirrored', this.mirrored)
    }
  }

  getCardElement() {
    const data = document.querySelector(`${GameCard.contentRootSelector} a[id="${this.idOnly}"]`)
    const type = this.idiot ? 'idiot' : ''
    switch (this.id[0]) {
      case 'L': return `<label-card ${type} id="${this.id}">${data.innerHTML}</label-card>`
      case 'A': return `<appeal-to-card ${type} type="${data.type}" id="${this.id}">${data.innerHTML}</appeal-to-card>`
      case 'F': return `<fallacy-card ${type} id="${this.id}">${data.innerHTML}</fallacy-card>`
      case 'S': return `<strawman-card ${type}></strawman-card>`
      case 'R': return `<research-card ${type}></research-card>`
      default: // argument id may contain the topic too
        const topicData = this.topic && document.querySelector(`${GameCard.contentRootSelector} a[id="${this.topic}"]`)
        const topic = topicData ? topicData.firstElementChild.innerHTML : ''
        return `<argument-card ${type} id="${this.idOnly}" topicId="${this.topic}" topic="${topic}">${data.innerHTML}</argument-card>`
    }
  }
}

customElements.define('game-card', GameCard)
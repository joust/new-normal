const gameCardTemplate = document.createElement('template')
gameCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
      width: 100%;
      height: 100%;
      border: none;
    }

    argument-card, fallacy-card, appeal-to-card, label-card {
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

  static observedAttributes = ['idiot', 'id', 'lang', 'mirrored']
  static contentRootSelector = '#content'

  get idiot() {
    return this.hasAttribute('idiot')
  }

  get id() {
    return this.getAttribute('id')
  }

  get lang() {
    return this.getAttribute('lang')
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback(name) {
    this.update()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(gameCardTemplate.content.cloneNode(true))
    const template = document.createElement('template')
    template.innerHTML = this.getCardElement()
    this.shadowRoot.appendChild(template.content)
  }

  update() {
    if (this.isConnected) {
      const card = this.shadowRoot.querySelector('argument-card, fallacy-card, appeal-to-card, label-card')
      card && card.toggleAttribute('mirrored', this.mirrored)
    }
  }

  random(min, max) {
    return min + Math.floor(Math.random()*(max-min+1))
  }

  getCardElement() {
    if (!this.id) {
      const t = this.idiot ? 'I' : 'S'
      const cards = Array.from(document.querySelectorAll(`
       ${GameCard.contentRootSelector} a[id^=${t}],
       ${GameCard.contentRootSelector} a[id^=L${t}],
       ${GameCard.contentRootSelector} a[id^=A${t}],
       ${GameCard.contentRootSelector} a[id^=S${t}],
       ${GameCard.contentRootSelector} a[id^=F${t}]
      `)).map(node => node.getAttribute('id'))
      this.setAttribute('id', cards[this.random(0, cards.length-1)])
    }
    
    const data = document.querySelector(`${GameCard.contentRootSelector} a[id=${this.id}]`)
    const type = this.idiot ? 'idiot' : ''
    switch (this.id[0]) {
      case 'I': return `<argument-card idiot id="${this.id}" topic="">${data.innerHTML}</argument-card>`
      case 'S': return `<argument-card id="${this.id}" topic="">${data.innerHTML}</argument-card>`
      case 'L': return `<label-card ${type} id="${this.id}">${data.innerHTML}</label-card>`
      case 'A': return `<appeal-to-card ${type} id="${this.id}">${data.innerHTML}</appeal-to-card>`
      case 'F': return `<fallacy-card ${type} id="${this.id}">${data.innerHTML}</fallacy-card>`
      case 'R': return `<let-me-research-card ${type} id="${this.id}">${data.innerHTML}</let-me-research-card>`
    }
  }
}

customElements.define('game-card', GameCard)
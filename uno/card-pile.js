const cardPileTemplate = document.createElement('template')
cardPileTemplate.innerHTML = `
  <style>
    :host {
      display: inline-block;
      width: 100%;
      height: 100%;
    }

    no-card, card-back, game-card {
      position: absolute;
      width: 98%;
      height: 98%;
      z-index: 2;
    }

    no-card#second {
      left: 1%;
      top: 1%;
      z-index: 1;
    }

    no-card#third {
      left: 2%;
      top: 2%;
      z-index: 0;
    }
  </style>
`

class CardPile extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  // no id given means empty stack, id given as 'I' or 'S' means facing down pile with idiot or sheep card-back
  static observedAttributes = ['id', 'mirrored']

  get id() {
    return this.getAttribute('id')
  }

  get idiot() {
    return this.id.includes('I')
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
    template.innerHTML = `${this.getTopElement()}<no-card id="second"></no-card><no-card id="third"></no-card>`

    this.shadowRoot.appendChild(template.content)
  }

  updateId() {
    const card = this.querySelector('no-card, card-back, game-card') // selects the first/top element
    if (this.isConnected && card) {
      const template = document.createElement('template')
      template.innerHTML = this.getTopElement()
      card.parentElement.replaceChild(card, template.content)
    }
  }

  updateMirrored() {
    if (this.isConnected) {
      const card = this.querySelector('game-card')
      if (card) card.toggleAttribute('mirrored', this.mirrored)
    }
  }

  getTopElement() {
    const mirrored = this.mirrored ? 'mirrored' : ''
    switch (this.id) {
      case null:
      case undefined:
      case '': return '<no-card></no-card>'
      case 'I': return '<card-back idiot></card-back>'
      case 'S': return '<card-back></card-back>'
      default: return `<game-card ${mirrored} id="${this.id}"></game-card>`
    }
  }
}

customElements.define('card-pile', CardPile)
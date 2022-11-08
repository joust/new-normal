const cardPileTemplate = document.createElement('template')
cardPileTemplate.innerHTML = `
  <style>
    :host {
      display: inline-block;
      position: relative;
    }

    no-card, card-back, game-card {
      position: absolute;
      width: 98%;
      height: 98%;
      z-index: 2;
      cursor: pointer;
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

  // no top given means empty stack, top given as 'I' or 'S' means facing down pile with idiot or sheep card-back
  static observedAttributes = ['top', 'mirrored']

  get top() {
    return this.getAttribute('top')
  }

  get idiot() {
    return this.top.includes('I')
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback(name) {
    if (name==='top') this.updateTop()
    if (name==='mirrored') this.updateMirrored()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(cardPileTemplate.content.cloneNode(true))
    const template = document.createElement('template')
    template.innerHTML = `${this.getTopElement()}<no-card id="second"></no-card><no-card id="third"></no-card>`

    this.shadowRoot.appendChild(template.content)
  }

  updateTop() {
    const card = this.shadowRoot.querySelector('no-card, card-back, game-card') // select top element
    if (this.isConnected && card) {
      card.insertAdjacentHTML('beforeBegin', this.getTopElement())
      this.shadowRoot.removeChild(card)
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
    switch (this.top) {
      case null:
      case undefined:
      case 'undefined':
      case '': return '<no-card></no-card>'
      case 'I': return '<card-back idiot></card-back>'
      case 'S': return '<card-back></card-back>'
      default: return `<game-card ${mirrored} card="${this.top}"></game-card>`
    }
  }
}

customElements.define('card-pile', CardPile)
import {BaseComponent} from './base-component.mjs'

window.customElements.define('test-pile', class TestPile extends BaseComponent {
  static observedAttributes = ['cards']

  get cards() {
    const cards = this.getAttribute('cards')
    return cards ? cards.split(',') : []
  }

  get css() {
    return `
    :host {
      display: inline-block;
      position: relative;
    }

    #pile {
      width: 100%;
      height: 100%;
    }

    test-card {
      position: absolute;
      width: 97%;
      height: 97%;
      cursor: pointer;
    }

    test-card:first-child {
      left: 2%;
      top: 2%;
    }

    test-card:nth-child(2) {
      left: 1%;
      top: 1%;
    }
  `
  }

  get html() {
    return `
    <div id="pile"></div>
  `
  }

  constructor() {
    super()
    this.stats = { approves: [], rejects: [] }
  }

  attributeChangedCallback(name) {
    this.updateCards()
  }

  elements(parent, tag) {
    return Array.from(parent.getElementsByTagName(tag))
  }

  connectedCallback() {
    super.connectedCallback()
    this.updateCards()
  }

  updateCards() {
    if (this.shadowRoot && this.isConnected) {
      const pile = this.element('pile')
      this.elements(pile, 'test-card').forEach(element => element.parentElement.removeChild(element))
      this.cards.forEach(card => pile.insertAdjacentHTML('beforeEnd', this.getElement(card)))
      this.elements(pile, 'test-card').forEach(element => element.addEventListener('choice', event => this.choice(event)))
    }
  }

  getElement(card) {
    return `<test-card card="${card}"></test-card>`
  }

  choice(event) {
    const pile = this.element('pile')
    const card = event.target
    if (event.detail.approve) this.stats.approves.push(card.card); else this.stats.rejects.push(card.card)
    setTimeout(() => pile.removeChild(card), 300)
    if (card.card === this.cards[0])
      this.dispatchEvent(new CustomEvent('finish', { detail: this.stats }))
  }
})

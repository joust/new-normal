const testPileTemplate = document.createElement('template')
testPileTemplate.innerHTML = `
  <style>
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
  </style>
  <div id="pile"></div>
`

class TestPile extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.stats = { approves: [], rejects: [] }
  }

  static observedAttributes = ['cards']

  element(id) { return this.shadowRoot.getElementById(id) }

  elements(parent, tag) {
    return Array.from(parent.getElementsByTagName(tag))
  }

  get cards() {
    const cards = this.getAttribute('cards')
    return cards ? cards.split(',') : []
  }

  attributeChangedCallback(name) {
    this.updateCards()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(testPileTemplate.content.cloneNode(true))
    const template = document.createElement('template')
    this.shadowRoot.appendChild(template.content)
    this.updateCards()
  }

  updateCards() {
    const pile = this.element('pile')
    if (this.isConnected && pile) {
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
}

customElements.define('test-pile', TestPile)

const testPileTemplate = document.createElement('template')
testPileTemplate.innerHTML = `
  <style>
    :host {
      display: inline-block;
      position: relative;
    }

    test-card, no-card {
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

class TestPile extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.stats = { likes: [], rejects: [] }
  }

  static observedAttributes = ['cards']

  element(id) { return this.shadowRoot.getElementById(id) }

  get cards() {
    const cards = this.getAttribute('cards')
    return cards ? cards.split(',') : []
  }

  get top() {
    return this.cards.length>0 ? this.cards[this.cards.length-1] : undefined
  }

  attributeChangedCallback(name) {
    this.updateTop()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(testPileTemplate.content.cloneNode(true))
    const template = document.createElement('template')
    template.innerHTML = `${this.getTopElement()}<no-card id="second"></no-card><no-card id="third"></no-card>`

    this.shadowRoot.appendChild(template.content)
    console.log(this.element('card'))
    this.element('card').addEventListener('choice', event => this.choice(event))
  }

  updateTop() {
    const card = this.shadowRoot.querySelector('test-card') // select top element
    if (this.isConnected && card) {
      card.setAttribute('id', 'old')
      setTimeout(() => this.shadowRoot.removeChild(card), 300)
      card.insertAdjacentHTML('beforeBegin', this.getTopElement())
      this.element('card').addEventListener('choice', event => this.choice(event))
    }
  }

  getTopElement() {
    return this.top ? `<test-card id="card" card="${this.top}"></test-card>` : '<no-card id="card"></no-card>'
  }

  choice(event) {
    console.log('cboice', event)
    const cards = this.cards
    const top = cards.pop()
    if (event.detail.like) this.stats.likes.push(top); else this.stats.rejects.push(top)
    this.setAttribute('cards', cards.join(','))
    if (cards.length===0)
      this.dispatchEvent(new CustomEvent('finish', { detail: { ...this.stats } }))
  }
}

customElements.define('test-pile', TestPile)
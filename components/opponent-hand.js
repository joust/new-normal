const opponentHandTemplate = document.createElement('template')
opponentHandTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #opponent-hand {
      width: 100%;
      height: calc(100% - 4vh);
      overflow-x: hidden;
      overflow-y: auto;
      box-sizing: border-box;
      display: grid;
      grid-gap: 0;
      overflow: visible;
    }  

    #opponent-name {
      font-family: 'HVD Crocodile', Helvetica;
      font-size: 2vh;
      font-weight: 300;
      text-align: center;
    }
  </style>
  <div id="opponent-hand"></div>
  <div id="opponent-name"></div>
`

class OpponentHand extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['nr', 'name', 'cards']

  element(id) { return this.shadowRoot.getElementById(id) }

  get nr() {
    return this.getAttribute('nr')
  }

  get name() {
    return this.getAttribute('name')
  }

  get cards() {
    return parseInt(this.getAttribute('cards'))
  }

  get idiot() {
    return !!(this.nr%2)
  }

  connectedCallback() {
    this.shadowRoot.appendChild(opponentHandTemplate.content.cloneNode(true))
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    this.updateCards()
    this.update()
  }
  
  attributeChangedCallback() {
    if (this.isConnected && this.element('opponent-hand')) {
      this.updateCards()
      this.updateName()
      this.update()
    }
    this.style.cursor = this.name ? 'not-allowed' : 'pointer'
  }

  updateCards() {
    const hand = this.element('opponent-hand')
    const type = this.idiot ? 'idiot' : ''
    let elements = Array.from(hand.querySelectorAll('card-back'))
    for (let index=0; index < Math.max(this.cards, elements.length); index++) {
      if (index < Math.min(this.cards, elements.length)) {
        elements[index].toggleAttribute('idiot', this.idiot)
      } else if (index < this.cards) {
        hand.insertAdjacentHTML('beforeEnd', `<card-back ${type}></card-back>`);
        elements = Array.from(hand.querySelectorAll('card-back'))
      } else {
        elements[index].parentElement.removeChild(elements[index])
      }
    }
  }

  updateName() {
    this.element('opponent-name').innerHTML = this.name ? this.name : '?'
  }

  ownChildren() {
    return Array.from(this.element('opponent-hand').querySelectorAll('card-back'))
  }

  columns(len) {
    const cw = this.clientWidth, ch = this.element('opponent-hand').clientHeight, ratio = 0.71
    const cardw = ch * ratio, rest = cw - cardw
    const cardw8 = (cardw/8)*100/cw
    const restw8 = Math.min(cardw/8, rest/(len-1))*100/cw
    const card = Array(8).fill(cardw8)
    const before = Array(len-1).fill(restw8)
    return [...before, ...card].map(c => `${c}%`).join(' ')
  }

  recalc() {
    const columns = this.columns(this.cards)
    this.element('opponent-hand').style.gridTemplateColumns = `1fr ${columns} 1fr`
  }
  
  resize() {
    this.recalc()
  }

  update() {
    const visible = this.ownChildren()
    visible.forEach((child, index) => {
      child.style.gridRow = 1
      child.style.gridColumn = `${index+2}/span 8`
    })
    this.recalc()
  }
}

customElements.define('opponent-hand', OpponentHand)
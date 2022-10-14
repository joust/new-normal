const opponentHandTemplate = document.createElement('template')
opponentHandTemplate.innerHTML = `
  <style>
     :host {
      --ratio: 0.71;
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
      font-family: 'Open Sans', Helvetica;
      font-size: calc(6 * var(--cavg));
      font-weight: 600;
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
    return this.getAttribute('cards')
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
      this.updateNameNr()
      this.update()
    }
  }

  updateCards() {
    const hand = this.element('opponent-hand')
    const type = this.idiot ? 'idiot' : ''
    let elements = Array.from(hand.querySelectorAll('card-back'))
    for (let index=0; index < Math.max(this.cards, elements.length); index++) {
      if (index < Math.min(this.cards, elements.length)) {
        elements[index].toggleAttribute('idiot', this.idiot)
      } else if (index < this.cards) {
        hand.insertAdjacentHTML('beforeend', `<card-back ${type}></card-back>`);
        elements = Array.from(hand.querySelectorAll('card-back'))
      } else {
        elements[index].parentElement.removeChild(elements[index])
      }
    }
  }

  updateNameNr() {
    this.element('opponent-name').innerHTML = `${this.nr}${this.name ? ': '+this.name : ''}`
  }

  ownChildren() {
    return Array.from(this.element('opponent-hand').querySelectorAll('game-card'))
  }

  columns(len) {
    const cw = this.clientWidth, ch = this.clientHeight, ratio = 0.71
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
    const ch = this.clientHeight/100
    this.style.setProperty('--ch', `${ch}px`)
    this.recalc()
  }

  update() {
    const visible = this.ownChildren()
    let z = visible.length
    visible.forEach((child, index) => {
      child.style.gridRow = 1
      child.style.gridColumn = `${index+2}/span 8`
      child.style.zIndex = z
    })
    this.recalc()
  }
}

customElements.define('opponent-hand', OpponentHand)
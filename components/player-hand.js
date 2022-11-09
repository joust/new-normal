const playerHandTemplate = document.createElement('template')
playerHandTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #player-name {
      font-family: 'HVD Crocodile', Helvetica;
      font-size: 3vh;
      font-weight: 300;
      font-weight: 300;
      text-align: center;
    }

    #player-hand {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      height: calc(100% - 4vh);
      display: grid;
      grid-gap: 0;
      overflow: visible;
    }  

    #player-hand * {
      cursor: not-allowed;
    }

    #player-hand .playable {
      cursor: pointer;
    }

    #player-hand > .playable[top] {
      transform: scale(1.03) translateY(-1vh);
      transition: all .2s linear;
    }
  </style>
  <div id="player-hand"></div>
  <div id="player-name"></div>
`

class PlayerHand extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.cards = []
    this.ownChildren = []
    this.revChildren = []
  }

  static observedAttributes = ['cards', 'nr', 'name']

  element(id) { return this.shadowRoot.getElementById(id) }

  playable(index) {
    return this.cards[index].playable
  }

  get nr() {
    return this.getAttribute('nr')
  }

  get name() {
    return this.getAttribute('name')
  }

  connectedCallback() {
    this.shadowRoot.appendChild(playerHandTemplate.content.cloneNode(true))
    const hand = this.element('player-hand')
    hand.onclick = e => this.down(e)
    hand.ontouchmove = e => this.over(e)
    hand.onmouseover = e => this.over(e)
    this.updateCards()
    
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
  }
  
  attributeChangedCallback(name) {
    if (this.isConnected && this.element('player-hand')) {
      if (name=='cards') {
        this.updateCards()
      }
      this.updateName()
      this.updateLayout()
    }
  }

  updateCards() {
    // JSON array of id+alternative+playable elements in the format { id: '...', alt: ['...', '...'], playable: ...}
    const json = this.getAttribute('cards')
    this.cards = !json || !json.length ? [] : JSON.parse(json)
    
    const cards = this.cards.map(element => element.card)
    const alts = this.cards.map(element => element.alt || [element.card])
    const hand = this.element('player-hand')
    let elements = Array.from(hand.querySelectorAll('game-card'))
    for (let index=0; index < Math.max(cards.length, elements.length); index++) {
      if (index < Math.min(cards.length, elements.length)) {
        elements[index].setAttribute('alternatives', alts[index].join(','))
        elements[index].setAttribute('card', cards[index])
      } else if (index < cards.length) {
        hand.insertAdjacentHTML('beforeEnd', `<game-card card="${cards[index]}" alternatives="${alts[index].join(',')}"></game-card>`);
        elements = Array.from(hand.querySelectorAll('game-card'))
      } else {
        elements[index].parentElement.removeChild(elements[index])
      }
    }
    // update children
    this.ownChildren = Array.from(hand.querySelectorAll('game-card'))
    this.revChildren = [...this.ownChildren].reverse()
  }

  updateName() {
    this.element('player-name').innerHTML = this.name ? this.name : '?'
  }

  columns(len, top) {
    if (top<0) top = 0
    const cw = this.clientWidth, ch = this.clientHeight, ratio = 0.71
    const cardw = ch * ratio, rest = cw - cardw
    const cardw8 = (cardw/8)*100/cw
    const restw8 = Math.min(cardw/8, rest/(len-1))*100/cw
    const card = Array(8).fill(cardw8)
    const before = Array(top).fill(restw8)
    const after = Array(Math.max(0, len-top-1)).fill(restw8)
    return [...before, ...card, ...after].map(c => `${c}%`).join(' ')
  }

  recalc() {
    const topIndex = this.ownChildren.findIndex(child => child.hasAttribute('top'))
    const columns = this.columns(this.ownChildren.length, topIndex)
    this.element('player-hand').style.gridTemplateColumns = `1fr ${columns} 1fr`
  }
  
  resize() {
    this.recalc()
  }

  updateLayout() {
    let z = this.revChildren.length, after = false
    this.revChildren.forEach((child, index) => {
      child.style.gridRow = 1
      child.style.gridColumn = `${index+2}/span 8`
      child.style.zIndex = z
      child.toggleAttribute('mirrored', after)
      const idx = this.ownChildren.indexOf(child)
      child.classList.toggle('playable', this.playable(idx))
      if (child.hasAttribute('top')) after = true
      if (after) z--; else z++
    })
    this.recalc()
  }

  over(event) {
    event.target && event.target.id!=='player-hand' && this.show(event.target)
  }

  down(event) {
    const target = event.target
    if (target && target.id!=='player-hand') {
      this.show(target)
      const index = this.ownChildren.indexOf(event.target)
      const card = target.getAttribute('alt') || target.getAttribute('card')
      if (card && this.playable(index)) 
        this.dispatchEvent(new CustomEvent('play', { detail: { index, card } }))
    }
  }

  show(element) {
    if (!element.hasAttribute('top') && element.parentElement) {
      for (const node of element.parentElement.children) 
        node.toggleAttribute('top', node === element)
    }
    this.updateLayout()
  }
}

customElements.define('player-hand', PlayerHand)
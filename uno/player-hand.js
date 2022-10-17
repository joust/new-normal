const playerHandTemplate = document.createElement('template')
playerHandTemplate.innerHTML = `
  <style>
     :host {
      --ratio: 0.71;
      display: inline-block;
    }

    #player-name {
      font-family: 'Open Sans', Helvetica;
      font-size: calc(12 * var(--cavg));
      font-weight: 600;
      text-align: center;
    }

    #player-hand {
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      box-sizing: border-box;
    }

    #player-hand.active {
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
      

    #player-hand:not(.active) ::slotted(game-card) {
      display: inline-block;
      height: calc(100 * var(--ch));
      width: calc(100 * var(--ratio) * var(--ch));
    }
  </style>
  <div id="player-hand"><slot></div>
  <div id="player-name"></div>
`

class PlayerHand extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['ids', 'playable', 'nr', 'name', 'active']

  element(id) { return this.shadowRoot.getElementById(id) }

  get ids() {
    const ids = this.getAttribute('ids')
    return !ids || !ids.length ? [] : ids.split(',')
  }

  get playable() {
    const ids = this.getAttribute('playable')
    return !ids || !ids.length ? [] : ids.split(',')
  }

  get nr() {
    return this.getAttribute('nr')
  }

  get name() {
    return this.getAttribute('name')
  }

  get active() {
    return this.hasAttribute('active')
  }

  connectedCallback() {
    this.shadowRoot.appendChild(playerHandTemplate.content.cloneNode(true))
    const hand = this.element('player-hand')
    hand.classList.toggle('active', this.active)
    hand.ontouchmove = e => this.move(e)
    hand.onclick = e => this.down(e)
    hand.onmouseover = e => this.over(e)
    this.updateCards()
    
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    //const mutationObserver = new MutationObserver(() => this.updateLayout())
    //mutationObserver.observe(this, { subtree: true, childList: true, attributes: true, //attributeFilter: ['top', 'style', 'class']})
    this.addSwiping()
  }
  
  attributeChangedCallback(name) {
    if (this.isConnected && this.element('player-hand')) {
      if (name=="ids") {
        this.updateCards()
      }
      if (name==="active") {
        this.element('player-hand').classList.toggle('active', this.active)
      }
      this.updateName()
      this.updateLayout()
    }
  }

  updateCards() {
    const cardIds = this.ids
    const hand = this.element('player-hand')
    let elements = Array.from(hand.querySelectorAll('game-card'))
    for (let index=0; index < Math.max(cardIds.length, elements.length); index++) {
      if (index < Math.min(cardIds.length, elements.length)) {
        elements[index].setAttribute('id', cardIds[index])
      } else if (index < cardIds.length) {
        hand.insertAdjacentHTML('beforeEnd', `<game-card id="${cardIds[index]}"></game-card>`);
        elements = Array.from(hand.querySelectorAll('game-card'))
      } else {
        elements[index].parentElement.removeChild(elements[index])
      }
    }
  }

  updateName() {
    this.element('player-name').innerHTML = this.name ? this.name : '?'
  }

  slotChildren() {
    return this.element('player-hand').firstChild.assignedElements()
  }

  ownChildren() {
    return Array.from(this.element('player-hand').querySelectorAll('game-card'))
  }

  slotVisible() {
    return this.slotChildren().filter(node => !!node.offsetParent)
  }

  slotInvisible() {
    return this.slotChildren().filter(node => !node.offsetParent)
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
    const children = [ ...this.slotVisible(), ...this.ownChildren()]
    const topIndex = children.findIndex(child => child.hasAttribute('top'))
    const columns = this.columns(children.length, topIndex)
    this.element('player-hand').style.gridTemplateColumns = `1fr ${columns} 1fr`
  }
  
  resize() {
    const ch = this.clientHeight/100
    this.style.setProperty('--ch', `${ch}px`)
    this.recalc()
  }

  updateLayout() {
    const invisible = this.active ? this.slotInvisible() : this.slotChildren()
    // reverse() to handle zIndex priorities on mouseover
    const visible = [ ...this.slotVisible(), ...this.ownChildren()].reverse()
    invisible.forEach(child => {
      child.style.removeProperty('gridRow')
      child.style.removeProperty('gridColumn')
      child.style.removeProperty('zIndex')
    })
    let z = visible.length, after = false
    if (this.active) {
      visible.forEach((child, index) => {
        child.style.gridRow = 1
        child.style.gridColumn = `${index+2}/span 8`
        child.style.zIndex = z
        child.toggleAttribute('mirrored', after)
        child.classList.toggle('playable', this.playable.includes(child.id))
        if (child.hasAttribute('top')) after = true
        if (after) z--; else z++
      })
      this.recalc()
    } else
      this.element('player-hand').style.gridTemplateColumns = undefined
  }

  move(event) {
    event.target && this.show(event.target)
  }

  over(event) {
    event.target && this.show(event.target)
  }

  down(event) {
    event.target && this.show(event.target)
    this.dispatchEvent(new CustomEvent('play', {
      detail: {
        id: event.target.id, 
        index: this.ownChildren().indexOf(event.target)
      }
    }))
  }

  show(element) {
    if (!element.hasAttribute('top') && element.parentElement) {
      for (const node of element.parentElement.children) 
        node.toggleAttribute('top', node === element)
    }
    this.updateLayout()
  }

  addSwiping() {
    const hand = this.element('player-hand')
    const swipy = new Swipy(hand)

    swipy.on('swipetop', () => {
      const top = hand.querySelector('*[top]')
      this.dispatchEvent(new CustomEvent('play', {
        detail: {
          id: event.target.id, 
          index: this.ownChildren().indexOf(event.target)
        }
      }))      
    })
    swipy.on('swipeleft', () => {
      const top = hand.querySelector('*[top]')
      if (top && top.previousElementSibling) this.show(top.previousElementSibling)
    })
    swipy.on('swiperight', () => {
      const top = hand.querySelector('*[top]')
      if (top && top.nextElementSibling) this.show(top.nextElementSibling)
    })
  }

}

customElements.define('player-hand', PlayerHand)
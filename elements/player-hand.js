const playerHandTemplate = document.createElement('template')
playerHandTemplate.innerHTML = `
  <style>
     :host {
      --ratio: 0.71;
      display: inline-block;
    }

    #player-hand {
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      box-sizing: border-box;
    }

    #player-hand.active {
      height: 100%;
      display: grid;
      grid-gap: 0;
      overflow: visible;
    }  

    #player-hand:not(.active) ::slotted(nn-card) {
      display: inline-block;
      height: calc(100 * var(--ch));
      width: calc(100 * var(--ratio) * var(--ch));
    }
  </style>
  <div id="player-hand"><slot></div>
`

class PlayerHand extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['active']

  element(id) { return this.shadowRoot.getElementById(id) }

  get active() {
    return this.hasAttribute('active')
  }

  connectedCallback() {
    this.shadowRoot.appendChild(playerHandTemplate.content.cloneNode(true))
    this.element('player-hand').classList.toggle('active', this.active)
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    const mutationObserver = new MutationObserver(() => this.update())
    mutationObserver.observe(this, { subtree: true, childList: true, attributes: true, attributeFilter: ['top', 'style', 'class']})
  }
  
  attributeChangedCallback() {
    if (this.isConnected && this.element('hand')) {
      this.element('player-hand').classList.toggle('active', this.active)
      this.update()
    }
  }

  slotChildren() {
    return this.element('player-hand').firstChild.assignedElements()
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
    const children = this.slotVisible()
    const topIndex = children.findIndex(child => child.hasAttribute('top'))
    const columns = this.columns(children.length, topIndex)
    this.element('player-hand').style.gridTemplateColumns = `1fr ${columns} 1fr`
  }
  
  resize() {
    const ch = this.clientHeight/100
    this.style.setProperty('--ch', `${ch}px`)
    this.recalc()
  }

  update() {
    const invisible = this.active ? this.slotInvisible() : this.slotChildren()
    const visible = this.slotVisible()
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
        if (child.hasAttribute('top')) after = true
        if (after) z--; else z++
      })
      this.recalc()
    } else
      this.element('player-hand').style.gridTemplateColumns = undefined
  }
}

customElements.define('player-hand', PlayerHand)
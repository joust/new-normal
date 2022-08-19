const handTemplate = document.createElement('template')
handTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #hand {
      width: 100%;
      height: 100%;
      display: grid;
      grid-gap: 0;
      box-sizing: border-box;
    }  
  </style>
  <div id="hand"><slot></div>
`

class Hand extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  element(id) { return this.shadowRoot.getElementById(id) }

  connectedCallback() {
    this.shadowRoot.appendChild(handTemplate.content.cloneNode(true))
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    const mutationObserver = new MutationObserver(() => this.update())
    mutationObserver.observe(this, { subtree: true, childList: true, attributes: true, attributeFilter: ['top']})
  }
  
  visible() {
    return this.element('hand').firstChild.assignedElements().filter(node => !!node.offsetParent)
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
    const children = this.visible()
    const topIndex = children.findIndex(child => child.hasAttribute('top'))
    const columns = this.columns(children.length, topIndex)
    this.element('hand').style.gridTemplateColumns = `1fr ${columns} 1fr`
  }
  
  resize() {
    const ch = this.clientHeight/100
    this.style.setProperty('--ch', `${ch}px`)
    this.recalc()
  }

  update() {
    const children = this.visible()
    let z = children.length, after = false
    children.forEach((child, index) => {
      child.style.gridRow = 1
      child.style.gridColumn = `${index+2}/span 8`
      child.style.zIndex = z
      child.toggleAttribute('mirrored', after)
      if (child.hasAttribute('top')) after = true
      if (after) z--; else z++
    })
    this.recalc()
  }
}

customElements.define('nn-hand', Hand)
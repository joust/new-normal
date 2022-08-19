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
      grid-template-columns: repeat(calc(var(--cards) + 7), 1fr);
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
    const resizeObserver = new ResizeObserver(() => {
      const cw = this.clientWidth/100, ch = this.clientHeight/100
      this.style.setProperty('--cw', `${cw}px`)
      this.style.setProperty('--ch', `${ch}px`)
    })
    resizeObserver.observe(this)
  }

  element(id) { return this.shadowRoot.getElementById(id) }

  connectedCallback() {
    this.shadowRoot.appendChild(handTemplate.content.cloneNode(true))
    const mutationObserver = new MutationObserver(() => this.update())
    mutationObserver.observe(this, { subtree: true, childList: true, attributes: true, attributeFilter: ['top']})
  }

  update() {
    const children = this.element('hand').firstChild.assignedElements()
    let z = children.length, after = false
    children.forEach((child, index) => {
      child.style.gridRow = 1
      child.style.gridColumn = `${index+1}/span 8`
      child.style.zIndex = z
      child.toggleAttribute('mirrored', after)
      if (child.hasAttribute('top')) after = true
      if (after) z--; else z++
    })
  }
}

customElements.define('nn-hand', Hand)
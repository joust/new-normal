const centeredCardsTemplate = document.createElement('template')
centeredCardsTemplate.innerHTML = `
  <style>
     :host {
      --ratio: 0.71;
      display: inline-block;
    }

    #centered {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }

    ::slotted(*) {
      height: 100%;
      width: calc(var(--ratio) * 100 * var(--ch));
    }
  </style>
  <div id="centered"><slot></slot></div>
`

class CenteredCards extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  debounce(f, delay) {
    let timer = 0
    return function(...args) {
      clearTimeout(timer)
      timer = setTimeout(() => f.apply(this, args), delay)
    }
  }
  
  connectedCallback() {
    this.shadowRoot.appendChild(centeredCardsTemplate.content.cloneNode(true))
    const resizeObserver = new ResizeObserver(this.debounce(() => this.resize(), 0))
    resizeObserver.observe(this)
  }

  resize() {
    const ch = this.clientHeight/100
    this.style.setProperty('--ch', `${ch}px`)
  }
}

customElements.define('centered-cards', CenteredCards)
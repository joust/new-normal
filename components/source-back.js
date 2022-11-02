const sourceBackTemplate = document.createElement('template')
sourceBackTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #source-back {
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: white;
    }
  </style>
  <div id="source-back"></div>
`

class SourceBack extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.shadowRoot.appendChild(sourceBackTemplate.content.cloneNode(true))
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }
}

customElements.define('source-back', SourceBack)
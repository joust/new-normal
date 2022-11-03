const sourcesBackTemplate = document.createElement('template')
sourcesBackTemplate.innerHTML = `
  <style>
    :host {
      display: inline-block;
      position: relative;
    }

    #sources-back {
      position: absolute;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: calc(4 * var(--cavg));
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: linear-gradient(30deg, #fdfdfd 0%, #fff 100%);
      color: grey;
      overflow: auto;
    }

    ::slotted(q):after, ::slotted(q):before {
      visibility: collapse;
    }

    ::slotted(*) {
      font-family: 'Open Sans', Helvetica;
      font-size: calc(3 * var(--cavg));
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
    }

    ::slotted(h2) {
      font-family: 'HVD Crocodile', Helvetica;
      font-weight: 600;
      font-stretch: condensed;
      font-size: calc(7 * var(--cavg));
      text-align: left;
      margin-top: 0;
      margin-bottom: 0;
      color: var(--neutral);
    }
    
    ::slotted(h2)::before {
      content: open-quote;
    }

    ::slotted(h2)::after {
      content: close-quote;
    }
  </style>
  <div id="sources-back"><slot></div>
`

class SourcesBack extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.shadowRoot.appendChild(sourcesBackTemplate.content.cloneNode(true))
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    Array.from(this.querySelectorAll('a')).forEach(a => a.onclick = event => event.stopPropagation())
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }
}

customElements.define('sources-back', SourcesBack)
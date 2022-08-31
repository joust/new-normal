const appealToCardTemplate = document.createElement('template')
appealToCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #appeal-to-card {
      --yellow: yellow;
      --orange: orange;
      --sidebar-width: 12%;
      --watermark-size: 50%;
      --to: 'WHO';
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: linear-gradient(30deg, var(--yellow) 0%, var(--orange) 100%);
      user-select: none;
    }

    #watermark {
      position: absolute;
      width: var(--watermark-size);
      height: var(--watermark-size);
      top: 4%;
      right: 0;
      opacity: 0.15;
      background-image: url('images/virus.png');
      background-size: contain;
      background-repeat: no-repeat;
    }

    .mirrored #watermark {
      right: var(--sidebar-width);
    }

    
    #new, #normal {
      font-family: 'HVD Crocodile';
      font-weight: 600;
      font-size: calc(14 * var(--cavg));
      position: absolute;
      color: white;
      opacity: 0.15;
    }
    
    #new {
      left: var(--sidebar-width);
      top: 0;
    }

    .mirrored #new {
      left: 2%;
    }

    #normal {
      bottom: 0;
      right: 2%;
    }

    .mirrored #normal {
      right: calc(2% + var(--sidebar-width));
    }

    #phrase {
      position: absolute;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      width: calc(100% - var(--sidebar-width));
      left: var(--sidebar-width);
      height: 100%;
      hyphens: auto;
    }

    .mirrored #label {
      left: 0;
      right: var(--sidebar-width);
    }

     #fallacy {
      font-family: 'Open Sans', Helvetica;
      font-size: calc(4 * var(--cavg));
    }

    #fallacy::after {
      content: 'Appeal to Authority';
    }

    #phrase span.phrase {
      font-family: 'HVD Crocodile';
      font-size: calc(7 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      max-width: 100%;
      display: inline-block;
      text-align: center;
    }

    .quoted::before {
      content: open-quote;
    }

    .quoted::after {
      content: '!' close-quote;
    }

    #side-phrase {
      position: absolute;
      font-family: 'HVD Crocodile';
      font-size: calc(6 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      color: darkgrey;
      opacity: 0.4;
      padding-left: 2%;
      top: 100%;
      left: 0;
      height: calc(15 * var(--cw));
      width: calc(85 * var(--ch));
      text-overflow: ellipsis;
      text-align: left;
      overflow: hidden;
      white-space: nowrap;
      transform: rotate(-90deg);
      transform-origin: top left;
    }

    #side-phrase::after {
      content: '!';
    }

    .mirrored #side-phrase {
      left: calc(100% - var(--sidebar-width));
    }

    .to::after {
      content: var(--to);
    }
  </style>
  <div id="appeal-to-card">
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="phrase"><span id="fallacy"></span><span class="quoted phrase"><span class="to"></span></span></span></div>
    <div id="side-phrase"><span class="phrase"><span class="to"></span></span></div>
    <div id="normal">Normal</div>
  </div>
`

class AppealToCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['idiot', 'to', 'mirrored']

  element(id) { return this.shadowRoot.getElementById(id) }

  get idiot() {
    return this.hasAttribute('idiot')
  }

  get to() {
    return this.getAttribute('to')
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.update()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(appealToCardTemplate.content.cloneNode(true))
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    this.update()
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cw', `${cw}px`)
    this.style.setProperty('--ch', `${ch}px`)
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }

  update() {
    if (this.isConnected && this.element('appeal-to-card')) {
      this.element('appeal-to-card').classList.toggle('mirrored', this.mirrored)
      this.element('appeal-to-card').classList.toggle('idiot', this.idiot)
      if (this.to) this.style.setProperty('--to', this.to)
    }
  }
}

customElements.define('appeal-to-card', AppealToCard)
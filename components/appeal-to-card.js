const appealToCardTemplate = document.createElement('template')
appealToCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #appeal-to-card {
      --red: #f72d5d;
      --blue: #2d60f6;
      --lightblue: aliceblue;
      --lightgrey: lightgrey;
      --sidebar-width: 12%;
      --watermark-size: 50%;
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: linear-gradient(30deg, var(--lightblue) 0%, var(--lightgrey) 100%);
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
      font-family: 'HVD Crocodile', Helvetica;
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
      color: grey;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      width: calc(100% - var(--sidebar-width));
      left: var(--sidebar-width);
      height: 100%;
      hyphens: auto;
    }

    .mirrored #phrase {
      left: 0;
      right: var(--sidebar-width);
    }

    #phrase {
      font-family: 'HVD Crocodile', Helvetica;
      font-size: calc(7 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
    }

    #phrase .to {
      color: var(--blue);
    }

    .idiot #phrase .to {
      color: var(--red);
    }

     #fallacy {
      font-family: 'Open Sans', Helvetica;
      font-size: calc(4 * var(--cavg));
      font-weight: 300;
      max-width: 100%;
      display: inline-block;
      text-align: center;
    }

    .quoted {
      padding-left: calc(7 * var(--cavg));
      padding-right: calc(7 * var(--cavg));
    }

    .quoted::before {
      content: open-quote;
    }

    .quoted::after {
      content: close-quote;
    }

    #card {
      position: absolute;
      right: 0;
      top: 0;
      width: 12%;
      height: 4%;
      font-family: 'Open Sans', Helvetica;
      font-size: calc(2.5 * var(--cavg));
      text-align: center;
      color: white;
      border-top-right-radius: calc(2 * var(--cavg));
      background-color: var(--blue);
    }

    .idiot #card {
      background-color: var(--red);
    }

    .mirrored #card {
      left: 0;
      right: auto;
      border-top-left-radius: calc(2 * var(--cavg));
      border-top-right-radius: 0;
    }

    #side-to {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica;
      font-size: calc(6 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      color: var(--blue);
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

    .idiot #side-to {
      color: var(--red);
    }

    .mirrored #side-to {
      left: calc(100% - var(--sidebar-width));
    }
  </style>
  <div id="appeal-to-card">
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="phrase"><span id="fallacy"></span><span class="quoted"><span class="to"></span> <span class="phrase"></span></span></div>
    <div id="side-to"><span class="to"></span></div>
    <div id="normal">Normal</div>
    <div id="card"></div>
  </div>
`

class AppealToCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['idiot', 'type', 'mirrored']

  element(id) { return this.shadowRoot.getElementById(id) }

  get idiot() {
    return this.hasAttribute('idiot')
  }

  get type() {
    return this.getAttribute('type')
  }

  get card() {
    return this.querySelector('a') ? this.querySelector('a').id : ''
  }

  get fallacy() {
    return this.type === 'authority' ? 'Appeal to Authority' : 'Appeal to Popularity'
  }

  get to() {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
  }

  get phrase() {
    return this.querySelector('p') ? this.querySelector('p').innerHTML : ''
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback() {
    this.update()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(appealToCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
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
    const root = this.element('appeal-to-card')
    if (this.isConnected && root) {
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      this.element('card').innerHTML = this.card
      this.element('fallacy').innerHTML = this.fallacy 
      Array.from(root.querySelectorAll('.to')).forEach(node => node.innerHTML = this.to)
      root.querySelector('.phrase').innerHTML = this.phrase
    }
  }
}

customElements.define('appeal-to-card', AppealToCard)
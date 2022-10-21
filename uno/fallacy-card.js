const FallacyCardTemplate = document.createElement('template')
FallacyCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #fallacy-card {
      --red: #f72d5d;
      --blue: #2d60f6;
      --lred: #f93b6b;
      --lblue: #3b69f8;
      --sidebar-width: 12%;
      --watermark-size: 50%;
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: linear-gradient(30deg, var(--lblue) 0%, var(--blue) 100%);
      user-select: none;
    }

    #fallacy-card.idiot {
      background: linear-gradient(30deg, var(--lred) 0%, var(--red) 100%);
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
      font-family: 'HVD Crocodile', Helvetica;
      font-size: calc(7 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
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

    .mirrored #phrase {
      left: 0;
      right: var(--sidebar-width);
    }

    #phrase .phrase {
      padding-left: calc(7 * var(--cavg));
      padding-right: calc(7 * var(--cavg));
    }

    #fallacy {
      font-family: 'Open Sans', Helvetica;
      font-size: calc(4 * var(--cavg));
      font-weight: 300;
    }

    .quoted::before {
      content: open-quote;
    }

    .quoted::after {
      content: '!' close-quote;
    }

    #side-phrase {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica;
      font-size: calc(6 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      color: white;
      opacity: 0.4;
      padding-left: 2%;
      top: 100%;
      left: 0;
      text-overflow: ellipsis;
      text-align: left;
      overflow: hidden;
      white-space: nowrap;
      height: calc(15 * var(--cw));
      width: calc(85 * var(--ch));
      transform: rotate(-90deg);
      transform-origin: top left;
    }

    #side-phrase::after {
      content: '!';
    }

    .mirrored #side-phrase {
      left: calc(100% - var(--sidebar-width));
    }
  </style>
  <div id="fallacy-card">
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="phrase"><span id="fallacy"></span><span class="quoted phrase"></span></div>
    <div id="side-phrase"><span class="phrase"></span></div>
    <div id="normal">Normal</div>
  </div>
`

class FallacyCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['card', 'mirrored']

  element(id) { return this.shadowRoot.getElementById(id) }

  get idiot() {
    return this.card && this.card.includes('I')
  }

  get fallacy() {
    return this.querySelector('i') ? this.querySelector('i').innerHTML : ''
  }

  get phrase() {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
  }

  get card() {
    return this.getAttribute('card')
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback() {
    this.update()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(FallacyCardTemplate.content.cloneNode(true))
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
    const root = this.element('fallacy-card')
    if (this.isConnected && root) {
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      this.element('fallacy').innerHTML = this.fallacy 
      Array.from(root.querySelectorAll('.phrase')).forEach(node => node.innerHTML = this.phrase)
    }
  }
}

customElements.define('fallacy-card', FallacyCard)
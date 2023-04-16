import {flagMapped} from './shared.js'

const appealToCardTemplate = document.createElement('template')
appealToCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #appeal-to-card {
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: linear-gradient(30deg, var(--lightblue) 0%, var(--lightgrey) 100%);
      user-select: none;
    }

    #icon {
      position: absolute;
      width: calc(1.3 * var(--sidebar-width));
      height: calc(1.3 * var(--sidebar-width))
      top: 0;
      left: 0;
      font-size: calc(8 * var(--cavg));
      text-align: center;
      color: white;
      opacity: .8;
    }

    #icon:before {
      content: '🗣';
    }

    .mirrored #icon {
      right: 0;
      left: auto;
    }

    #watermark {
      position: absolute;
      width: var(--watermark-size);
      height: var(--watermark-size);
      top: 4%;
      right: 0;
      opacity: 0.15;
      background-image: url('/styles/images/virus.png');
      background-size: contain;
      background-repeat: no-repeat;
    }

    .mirrored #watermark {
      right: var(--sidebar-width);
    }

    
    #new, #normal {
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
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

    #img {
      display: inline-block;
      text-align: center;
      width: auto;
      height: 40%;
    }

    #img.hidden {
      display: none;
    }

    #phrase {
      position: absolute;
      font-family: 'Open Sans', Helvetica, sans-serif;
      font-size: calc(4 * var(--cavg));
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      width: calc(100% - var(--sidebar-width));
      left: var(--sidebar-width);
      height: 100%;
      -webkit-hyphens: auto;
      hyphens: auto;
    }

    .mirrored #phrase {
      left: 0;
      right: var(--sidebar-width);
    }

    #phrase b {
      color: var(--bold);
    }

    #phrase .to {
      color: var(--sheep-appeal-to-color);
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc(7 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
    }

    .idiot #phrase .to {
      color: var(--idiot-appeal-to-color);
    }

     #fallacy {
      font-family: 'Open Sans', Helvetica, sans-serif;
      font-size: calc(4 * var(--cavg));
      font-weight: 300;
      max-width: 100%;
      color: #666;
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
      padding: 0 2% 0 2%;
      height: 4%;
      font-family: 'Open Sans', Helvetica, sans-serif;
      font-size: calc(2.5 * var(--cavg));
      text-align: center;
      border-top-right-radius: calc(2 * var(--cavg));
    }

    .idiot #card {
      background-color: var(--idiot-background);
      color: var(--idiot-color);
    }
    .sheep #card {
      background-color: var(--sheep-background);
      color: var(--sheep-color);
    }

    .mirrored #card {
      left: 0;
      right: auto;
      border-top-left-radius: calc(2 * var(--cavg));
      border-top-right-radius: 0;
    }

    #side-to {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc(6 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      color: var(--sheep-appeal-to-color);
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
      color: var(--idiot-appeal-to-color);
    }

    .mirrored #side-to {
      left: calc(100% - var(--sidebar-width));
    }
  </style>
  <div id="appeal-to-card">
    <div id="icon"></div>
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="phrase"><span id="fallacy"></span><img id="img" draggable="false" class="hidden"></span><span class="quoted"><span class="to"></span> <span class="phrase"></span></span></div>
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

  element(id) { return this.shadowRoot.getElementById(id) }

  get idiot() {
    return this.hasAttribute('idiot')
  }

  get type() {
    return this.getAttribute('type')
  }

  get card() {
    return this.querySelector('a') ? this.querySelector('a').getAttribute('id') : ''
  }

  get fallacy() {
    return this.querySelector('i') ? this.querySelector('i').innerHTML : ''
  }

  get img() {
    return this.querySelector('a') ? this.querySelector('a').getAttribute('href') : ''
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
      this.element('card').innerHTML = flagMapped(this.card)
      this.element('fallacy').innerHTML = this.fallacy
      this.element('img').classList.toggle('hidden', !this.img || !this.img.length)
      this.element('img').setAttribute('src', `/content/images/${this.img}`)
      Array.from(root.querySelectorAll('.to')).forEach(node => node.innerHTML = this.to)
      root.querySelector('.phrase').innerHTML = this.phrase
    }
  }
}

customElements.define('appeal-to-card', AppealToCard)

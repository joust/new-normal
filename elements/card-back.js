const cardBackTemplate = document.createElement('template')
cardBackTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #card-back {
      --red: #f72d5d;
      --blue: #2d60f6;
      --lred: #f93b6b;
      --lblue: #3b69f8;
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: linear-gradient(30deg, var(--lblue) 0%, var(--blue) 100%);
    }
    
    #card-back.idiot {
      background: linear-gradient(30deg, var(--lred) 0%, var(--red) 100%);
    }

    #inner {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      border: calc(3 * var(--cavg)) solid white;
      border-radius: calc(2 * var(--cavg));
    }

    #watermark {
      width: 100%;
      height: 100%;
      opacity: 0.15;
      background: var(--background);
      overflow: hidden;
    }
  </style>
  <div id="card-back"><div id="inner"><div id="watermark"></div></div></div>
`

class CardBack extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['idiot']
  static virus = 'images/virus.png'

  element(id) { return this.shadowRoot.getElementById(id) }

  get idiot() {
    return this.hasAttribute('idiot')
  }

  attributeChangedCallback() {
    this.update()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(cardBackTemplate.content.cloneNode(true))
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    this.style.setProperty('--background', this.randomViruses())
    this.update()
  }

  random(min, max) {
    return min + Math.floor(Math.random()*(max-min+1))
  }

  randomViruses() {
    return Array(60).fill().map(() => `url(${CardBack.virus}) ${this.random(-20,120)}% ${this.random(-20,120)}% / ${this.random(20,40)}% no-repeat`).join(',')
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }

  update() {
    if (this.isConnected && this.element('card-back')) {
      this.element('card-back').classList.toggle('idiot', this.idiot)
    }
  }
}

customElements.define('card-back', CardBack)
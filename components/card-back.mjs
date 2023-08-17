import {BaseComponent} from './base-component.mjs'

window.customElements.define('card-back', class CardBack extends BaseComponent {
  static observedAttributes = ['idiot']
  static virus = 'styles/images/virus.png'

  get idiot() {
    return this.hasAttribute('idiot')
  }

  get css() {
    return `
     :host {
      display: inline-block;
    }

    #card-back {
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: var(--sheep-card-background);
    }
    
    #card-back.idiot {
      background: var(--idiot-card-background);
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
  `
  }

  get html() {
    return `<div id="card-back"><div id="inner"><div id="watermark"></div></div></div>`
  }

  attributeChangedCallback() {
    this.update()
  }

  connectedCallback() {
    super.connectedCallback()
    this.update()
  }

  random(min, max) {
    return min + Math.floor(Math.random()*(max-min+1))
  }

  randomViruses() {
    return Array(10).fill('').map(() => `url(${CardBack.virus}) ${this.random(-20,120)}% ${this.random(-20,120)}% / ${this.random(30,50)}% no-repeat`).join(',')
  }

  update() {
    if (this.shadowRoot && this.isConnected) {
      this.element('card-back').classList.toggle('idiot', this.idiot)
    }
  }
})

import {flagMapped} from './shared.mjs'
import {BaseCard} from './base-card.mjs'

window.customElements.define('appeal-to-card', class AppealToCard extends BaseCard {
  static observedAttributes = ['idiot', 'type', 'mirrored']

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

  get css() {
    return `
    ${super.css}
    #appeal-to-card {
      background: linear-gradient(30deg, var(--lightblue) 0%, var(--lightgrey) 100%);
    }

    #icon:before {
      content: '🗣';
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
      font-size: calc((4cqw + 4cqh) / var(--avg));
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
      font-size: calc((7cqw + 7cqh) / var(--avg));
      font-weight: 600;
      font-stretch: condensed;
    }

    .idiot #phrase .to {
      color: var(--idiot-appeal-to-color);
    }

     #fallacy {
      font-family: 'Open Sans', Helvetica, sans-serif;
      font-size: calc((4cqw + 4cqh) / var(--avg));
      font-weight: 300;
      max-width: 100%;
      color: #666;
      display: inline-block;
      text-align: center;
    }

    .quoted {
      padding-left: calc((7cqw + 7cqh) / var(--avg));
      padding-right: calc((7cqw + 7cqh) / var(--avg));
    }

    .idiot #card {
      background-color: var(--idiot-background);
      color: var(--idiot-color);
    }
    .sheep #card {
      background-color: var(--sheep-background);
      color: var(--sheep-color);
    }

    #side {
      color: var(--sheep-appeal-to-color);
    }

    .idiot #side {
      color: var(--idiot-appeal-to-color);
    }
  `
  }

  get html() {
    return `
    <div id="appeal-to-card" class="card">
      <div id="icon"></div>
      <div id="watermark"></div>
      <div id="new">New</div>
      <div id="phrase"><span id="fallacy"></span><img id="img" draggable="false" class="hidden"></span><span class="quoted"><span class="to"></span> <span class="phrase"></span></span></div>
      <div id="side"><span class="to"></span></div>
      <div id="normal">Normal</div>
      <div id="card"></div>
    </div>
  `
  }

  attributeChangedCallback() {
    this.update()
  }

  connectedCallback() {
    super.connectedCallback()
    this.update()
  }

  update() {
    if (this.shadowRoot && this.isConnected) {
      const root = this.element('appeal-to-card')
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
})

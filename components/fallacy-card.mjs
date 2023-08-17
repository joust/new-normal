import {BaseCard} from './base-card.mjs'

window.customElements.define('fallacy-card', class FallacyCard extends BaseCard {
  static observedAttributes = ['mirrored']

  get idiot() {
    return this.card && this.card.includes('I')
  }

  get fallacy() {
    return this.querySelector('i') ? this.querySelector('i').innerHTML : ''
  }

  get phrase() {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
  }

  get description() {
    return this.querySelector('p') ? this.querySelector('p').innerHTML : ''
  }

  get card() {
    return this.querySelector('a') ? this.querySelector('a').id : ''
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  get css() {
    return `
    ${super.css}
    #fallacy-card {
      background: var(--sheep-fallacy-background);
    }

    #fallacy-card.idiot {
      background: var(--idiot-fallacy-background);
    }

    #icon:before {
      content: '🚫';
    }

    #phrase {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc((7cqw + 7cqh) / var(--avg));
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
      -webkit-hyphens: auto;
      hyphens: auto;
    }

    .mirrored #phrase {
      left: 0;
      right: var(--sidebar-width);
    }

    #phrase .phrase {
      padding-left: calc((7cqw + 7cqh) / var(--avg));
      padding-right: calc((7cqw + 7cqh) / var(--avg));
      text-align: center;
    }

    #fallacy {
      font-family: 'Open Sans', Helvetica, sans-serif;
      font-size: calc((4cqw + 4cqh) / var(--avg));
      font-weight: 300;
    }

    .idiot #card {
      background-color: var(--idiot-background);
      color: var(--idiot-color);
    }
    .sheep #card {
      background-color: var(--sheep-background);
      color: var(--sheep-color);
    }
  `
  }

  get html () {
    return `
    <div id="fallacy-card" class="card">
      <div id="icon"></div>
      <div id="watermark"></div>
      <div id="new">New</div>
      <div id="phrase"><span id="fallacy"></span><span class="quoted phrase"></span><span id="description"></span></div>
      <div id="side"><span class="phrase"></span></div>
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
      const root = this.element('fallacy-card')
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      this.element('card').innerHTML = this.card
      this.element('fallacy').innerHTML = this.fallacy
      Array.from(root.querySelectorAll('.phrase')).forEach(node => node.innerHTML = this.phrase)
      this.element('description').innerHTML = this.description
    }
  }
})

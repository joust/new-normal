import { BaseCard } from './base-card.mjs'

window.customElements.define('label-card', class LabelCard extends BaseCard {
  static observedAttributes = ['idiot', 'mirrored']

  get idiot () {
    return this.hasAttribute('idiot')
  }

  get label () {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
  }

  get fallacy () {
    return this.querySelector('i') ? this.querySelector('i').innerHTML : ''
  }

  get description () {
    return this.querySelector('p') ? this.querySelector('p').innerHTML : ''
  }

  get mirrored () {
    return this.hasAttribute('mirrored')
  }

  get card () {
    return this.querySelector('a') ? this.querySelector('a').id : ''
  }

  get css () {
    return `
    ${super.css}
    #label-card {
      background: linear-gradient(30deg, black 0%, grey 100%);
    }

    #icon:before {
      content: '⚔️';
    }

    #label {
      position: absolute;
      color: var(--sheep-label-color);
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

    .mirrored #label {
      left: 0;
      right: var(--sidebar-width);
    }

    #fallacy {
      font-family: 'Open Sans', Helvetica, sans-serif;
      font-size: calc((4cqw + 4cqh) / var(--avg));
      font-weight: 300;
      color: white;
    }

    #label-name {
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc((7cqw + 7cqh) / var(--avg));
      font-weight: 600;
      font-stretch: condensed;
      max-width: 100%;
      display: inline-block;
      padding-left: calc((7cqw + 7cqh) / var(--avg));
      padding-right: calc((7cqw + 7cqh) / var(--avg));
      text-align: center;
    }

    .quoted::before {
      content: open-quote;
    }

    .quoted::after {
      content: '!' close-quote;
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
      border-top-left-radius: calc((2cqw + 2cqh) / var(--avg));
      border-top-right-radius: 0;
    }

    #side {
      color: var(--sheep-label-color);
      opacity: 0.8;
    }

    #label-card.idiot #label, #label-card.idiot #side {
      color: var(--idiot-label-color);
    }

    #side::after {
      content: '!';
    }

    .mirrored #side {
      left: calc(100% - var(--sidebar-width));
    }
    `
  }

  get html () {
    return `
    <div id="label-card" class="card">
      <div id="icon"></div>
      <div id="watermark"></div>
      <div id="new">New</div>
      <div id="label"><span id="fallacy"></span><span class="quoted" id="label-name"></span><span id="description"></span></div>
      <div id="side"></div>
      <div id="normal">Normal</div>
      <div id="card"></div>
    </div>
  `
  }

  attributeChangedCallback () {
    this.update()
  }

  connectedCallback () {
    super.connectedCallback()
    this.update()
  }

  update () {
    if (this.shadowRoot && this.isConnected) {
      const root = this.element('label-card')
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      this.element('card').innerHTML = this.card
      this.element('side').innerHTML = this.label
      this.element('label-name').innerHTML = this.label
      this.element('fallacy').innerHTML = this.fallacy
      this.element('description').innerHTML = this.description
    }
  }
})

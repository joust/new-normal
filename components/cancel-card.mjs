import { BaseCard } from './base-card.mjs'

window.customElements.define('cancel-card', class CancelCard extends BaseCard {
  static observedAttributes = ['idiot', 'mirrored']

  get idiot () {
    return this.hasAttribute('idiot')
  }

  get fallacy () {
    return this.querySelector('i') ? this.querySelector('i').innerHTML : ''
  }

  get cancel () {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
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
    #cancel-card {
      background: linear-gradient(30deg, var(--lgreen) 0%, var(--green) 100%);
    }

    #icon {
      color: white;
      opacity: .8;
    }

    #icon:before {
      content: '💀';
    }

    #cancel {
      position: absolute;
      color: darkred;
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

    .mirrored #cancel {
      left: 0;
      right: var(--sidebar-width);
    }

    #fallacy {
      font-family: 'Open Sans', Helvetica, sans-serif;
      font-size: calc((4cqw + 4cqh) / var(--avg));
      font-weight: 300;
      color: white;
    }

    #cancel-name {
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
    <div id="cancel-card" class="card">
      <div id="icon"></div>
      <div id="watermark"></div>
      <div id="new">New</div>
      <div id="cancel"><span id="fallacy"></span><span class="quoted" id="cancel-name"></span><span id="description"></span></div>
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
      const root = this.element('cancel-card')
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      this.element('card').innerHTML = this.card
      this.element('side').innerHTML = this.cancel
      this.element('cancel-name').innerHTML = this.cancel
      this.element('fallacy').innerHTML = this.fallacy
      this.element('description').innerHTML = this.description
    }
  }
})

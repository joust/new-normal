import { BaseCard } from './base-card.mjs'

window.customElements.define('research-card', class ResearchCard extends BaseCard {
  static observedAttributes = ['idiot', 'mirrored']

  get idiot () {
    return this.hasAttribute('idiot')
  }

  get phrase () {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
  }

  get description () {
    return this.querySelector('p') ? this.querySelector('p').innerHTML : ''
  }

  get mirrored () {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback () {
    this.update()
  }

  get css () {
    return `
    ${super.css}
    #research-card {
      background: var(--sheep-research-background);
    }

    #research-card.idiot {
    background: var(--idiot-research-background);
    }

    #icon:before {
      content: '🔍';
    }

    .mirrored #icon:before {
      content: '🔎';
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
      padding: calc((7cqw + 7cqh) / var(--avg));
      box-sizing: border-box;
    }

    .mirrored #phrase {
      left: 0;
      right: var(--sidebar-width);
    }

    #phrase span {
      max-width: 100%;
      display: inline;
      text-align: center;
    }

    #phrase > span::before {
      content: open-quote;
    }

    #phrase > span::after {
      content: close-quote;
    }
  `
  }

  get html () {
    return `
    <div id="research-card" class="card">
      <div id="icon"></div>
      <div id="watermark"></div>
      <div id="new">New</div>
      <div id="phrase"><span><span class="phrase"></span></span><span id="description"></span></div>
      <div id="side"><span class="phrase"></span></div>
      <div id="normal">Normal</div>
    </div>
  `
  }

  connectedCallback () {
    super.connectedCallback()
    this.element('side').innerHTML = this.element('phrase').innerHTML // copy phrases
    this.update()
  }

  update () {
    if (this.shadowRoot && this.isConnected) {
      const root = this.element('research-card')
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      Array.from(root.querySelectorAll('.phrase')).forEach(node => (node.innerHTML = this.phrase))
      this.element('description').innerHTML = this.description
    }
  }
})

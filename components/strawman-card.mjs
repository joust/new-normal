import {BaseCard} from './base-card.mjs'

window.customElements.define('strawman-card', class StrawmanCard extends BaseCard {
  static observedAttributes = ['idiot', 'mirrored']

  get idiot() {
    return this.hasAttribute('idiot')
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

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  get css() {
    return `
    ${super.css}
    #strawman-card {
      background: linear-gradient(30deg, var(--orange) 0%, var(--yellow) 100%);
    }

    #icon:before {
      content: '🤔';
    }

    #img {
      display: inline-block;
      height: 40%;
      width: auto;
    }

    #phrase {
      position: absolute;
      color: var(--sheep-strawman-color);
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

    .idiot #phrase {
      color: var(--idiot-strawman-color);
    }

    .mirrored #phrase {
      left: 0;
      right: var(--sidebar-width);
    }

     #fallacy {
      font-family: 'Open Sans', Helvetica, sans-serif;
      font-size: calc((4cqw + 4cqh) / var(--avg));
      font-weight: 300;
      color: white;
    }

    #description {
      color: var(--sheep-strawman-color);
    }

    .idiot #description {
      color: var(--idiot-strawman-color);
    }

    #phrase span.quoted {
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc((7cqw + 7cqh) / var(--avg));
      font-weight: 600;
      font-stretch: condensed;
      max-width: 100%;
      display: inline;
      text-align: center;
    }

    #side {
      color: var(--sheep-strawman-color);
    }

    .idiot #side {
      color: var(--idiot-strawman-color);
    }
  `
  }

  get html() {
    return `
    <div id="strawman-card" class="card">
      <div id="icon"></div>
      <div id="new">New</div>
      <div id="phrase"><img id="img" draggable="false" src="/components/images/strawman.png"><span id="fallacy"></span><span class="quoted"><span class="phrase"></span></span><span id="description"></span></div>
      <div id="side"><span class="phrase"></span></div>
      <div id="normal">Normal</div>
    </div>
  `
  }

  attributeChangedCallback() {
    this.update()
  }

  connectedCallback() {
    super.connectedCallback()
    const langObserver = new MutationObserver(() => this.update())
    langObserver.observe(document, { attributes: true, attributeFilter: ['lang'] })
    this.update()
  }

  update() {
    if (this.shadowRoot && this.isConnected) {
      const root = this.element('strawman-card')
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      Array.from(root.querySelectorAll('.phrase')).forEach(node => node.innerHTML = this.phrase)
      this.element('description').innerHTML = this.description
    }
  }
})

import {BaseCard} from './base-card.mjs'

window.customElements.define('pause-card', class PauseCard extends BaseCard {
  static observedAttributes = ['idiot', 'mirrored']

  get idiot() {
    return this.hasAttribute('idiot')
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
    #pause-card {
      background: linear-gradient(30deg, var(--blue0) 0%, var(--blue1) 100%);
    }

    #icon:before {
      content: '🕒';
    }

    #phrase {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc(7 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      color: var(--sheep-pause-color);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      width: calc(100% - var(--sidebar-width));
      left: var(--sidebar-width);
      height: 100%;
      -webkit-hyphens: auto;
      hyphens: auto;
      padding: calc(7 * var(--cavg));
      box-sizing: border-box;
    }

    .idiot #phrase {
      color: var(--idiot-pause-color);
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

    #side {
      color: var(--sheep-pause-color);
    }

    .idiot #side {
      color: var(--idiot-pause-color);
    }
  `
  }

  get html() {
    return `
    <div id="pause-card" class="card">
      <div id="icon"></div>
      <div id="watermark"></div>
      <div id="new">New</div>
      <div id="phrase"><span><span class="phrase"></span></span></div>
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
    this.element('side').innerHTML = this.element('phrase').innerHTML // copy phrases
    const langObserver = new MutationObserver(() => this.update())
    langObserver.observe(document, { attributes: true, attributeFilter: ['lang'] })
    this.update()
  }

  update() {
    if (this.shadowRoot && this.isConnected) {
      const root = this.element('pause-card')
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      Array.from(root.querySelectorAll('.phrase')).forEach(node => node.innerHTML = this.phrase)
    }
  }
})

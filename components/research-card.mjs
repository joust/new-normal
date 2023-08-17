import {BaseComponent} from './base-component.mjs'

window.customElements.define('research-card', class ResearchCard extends BaseComponent {
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

  attributeChangedCallback() {
    this.update()
  }

  get css () {
    return `
    :host {
      display: inline-block;
    }

    #research-card {
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: var(--sheep-research-background);
      user-select: none;
    }

    #research-card.idiot {
    background: var(--idiot-research-background);
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
      content: '🔍';
    }

    .mirrored #icon {
      right: 0;
      left: auto;
    }

    .mirrored #icon:before {
      content: '🔎';
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

    #phrase {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc(7 * var(--cavg));
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
      padding: calc(7 * var(--cavg));
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

    #description {
      position: absolute;
      bottom: 0;
      font-family: 'Open Sans', Helvetica, sans-serif;
      padding: calc(5 * var(--cavg));
      padding-bottom: calc(16 * var(--cavg));
      font-size: calc(3 * var(--cavg));
      font-style: italic;
      color: white;
      opacity: 0.4;
    }

    #side-phrase {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc(6 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      color: white;
      opacity: 0.4;
      padding-left: 2%;
      top: 100%;
      left: 0;
      height: calc(15 * var(--cw));
      width: calc(85 * var(--ch));
      transform: rotate(-90deg);
      transform-origin: top left;
    }

    .mirrored #side-phrase {
      left: calc(100% - var(--sidebar-width));
    }
  `
  }

  get html() {
    return `
    <div id="research-card">
      <div id="icon"></div>
      <div id="watermark"></div>
      <div id="new">New</div>
      <div id="phrase"><span><span class="phrase"></span></span><span id="description"></span></div>
      <div id="side-phrase"><span class="phrase"></span></div>
      <div id="normal">Normal</div>
    </div>
  `
  }

  connectedCallback() {
    super.connectedCallback()
    this.element('side-phrase').innerHTML = this.element('phrase').innerHTML // copy phrases
    this.update()
  }

  update() {
    if (this.shadowRoot && this.isConnected) {
      const root = this.element('research-card')
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      Array.from(root.querySelectorAll('.phrase')).forEach(node => node.innerHTML = this.phrase)
      this.element('description').innerHTML = this.description
    }
  }
})

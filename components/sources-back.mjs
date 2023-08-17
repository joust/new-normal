import {BaseComponent} from './base-component.mjs'

window.customElements.define('sources-back', class SourcesBack extends BaseComponent {
  get css() {
    return `
    :host {
      display: inline-block;
      position: relative;
    }

    #sources-back {
      position: absolute;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: calc(4 * var(--cavg));
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: linear-gradient(30deg, #fdfdfd 0%, #fff 100%);
      color: grey;
      overflow: auto;
    }

    ::slotted(q):after, ::slotted(q):before {
      visibility: collapse;
    }

    ::slotted(*) {
      font-family: 'Open Sans', Helvetica, sans-serif;
      font-size: calc(3 * var(--cavg));
      text-align: justify;
      -webkit-hyphens: auto;
      hyphens: auto;
    }

    ::slotted(h2) {
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-weight: 600;
      font-stretch: condensed;
      font-size: calc(7 * var(--cavg));
      text-align: left;
      margin-top: 0;
      margin-bottom: 0;
      color: var(--neutral);
    }
    
    ::slotted(h2)::before {
      content: open-quote;
    }

    ::slotted(h2)::after {
      content: close-quote;
    }
  `
  }

  get html () {
    return `<div id="sources-back"><slot></slot></div>`
  }

  connectedCallback() {
    super.connectedCallback()
    Array.from(this.querySelectorAll('a')).forEach(a => a.onclick = event => event.stopPropagation())
  }
})

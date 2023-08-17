import {BaseComponent} from './base-component.mjs'

window.customElements.define('centered-cards', class CenteredCards extends BaseComponent {
  get css() {
    return `
     :host {
      display: inline-block;
    }

    #centered {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }

    ::slotted(*) {
      height: 100%;
      width: calc(var(--ratio) * 100 * var(--ch));
    }
  `
  }

  get html() {
    return `<div id="centered"><slot></slot></div>`
  }
})

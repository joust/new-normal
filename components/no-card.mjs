import { BaseComponent } from './base-component.mjs'

window.customElements.define('no-card', class NoCard extends BaseComponent {
  get css () {
    return `
     :host {
      display: inline-block;
    }

    #no-card {
      position: relative;
      width: 100%;
      height: 100%;
      border: calc((0.1cqw + 0.1cqh) / var(--avg)) solid #aaa;
      border-radius: calc((2cqw + 2cqh) / var(--avg));
      background: white;
    }

    @media (prefers-color-scheme: dark) {
      #no-card {
        background: #555;
      }
    }
  `
  }

  get html () {
    return '<div id="no-card"></div>'
  }
})

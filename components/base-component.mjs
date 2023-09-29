export class BaseComponent extends HTMLElement {
  connectedCallback () {
    this.lang = document.body.lang
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `<style>${this.css}</style>${this.html}`
  }

  get css () {
    return `
    :host {
      display: inline-block;
      container-type: size;
    }
    `
  }

  get html () { return '' }

  element (name) {
    return this.shadowRoot.getElementById(name)
  }

  elements (query) {
    return [...this.shadowRoot.querySelectorAll(query)]
  }

  debounce (f, delay) {
    let timer = 0
    return function (...args) {
      clearTimeout(timer)
      timer = setTimeout(() => f.apply(this, args), delay)
    }
  }
}

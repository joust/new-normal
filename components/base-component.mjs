export class BaseComponent extends HTMLElement {
  connectedCallback () {
    this.lang = document.body.lang
    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.createElement('template')
    template.innerHTML = `<style>${this.css}</style>${this.html}`
    shadowRoot.appendChild(template.content)
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

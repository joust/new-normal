export class BaseComponent extends HTMLElement {
  connectedCallback () {
    this.lang = document.body.lang
    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.createElement('template')
    template.innerHTML = `<style>${this.css}</style>${this.html}`
    shadowRoot.appendChild(template.content)
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
  }

  get css () { return '' }

  get html () { return '' }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cw', `${cw}px`)
    this.style.setProperty('--ch', `${ch}px`)
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }

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

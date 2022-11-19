const editableCardTemplate = document.createElement('template')
editableCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
      overflow: hidden;
      position: relative;
    }

    #editable-card, #card {
      width: 100%;
      height: 100%;
    }

    [contenteditable] {
      background-color: rgb(255, 248, 220, 0.5);
    }
  </style>
  <div id="editable-card">
  </div>
`

class EditableCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['card']
  static contentRootSelector = '#content'

  element(id) { return this.shadowRoot.getElementById(id) }

  get card() {
    return this.getAttribute('card')
  }

  get idOnly() {
    return (this.hasTopic ? this.card.split(':')[1] : this.card).replace('*', '')
  }

  get hasTopic() {
    return this.card.includes(':')
  }

  get idiot() {
    return this.card.includes('I')
  }

  get topic() {
    return this.hasTopic ? this.card.split(':')[0] : ''
  }

  attributeChangedCallback(name) {
    if (this.isConnected) {
      if (name==='card') this.updateCard()
    }
  }

  connectedCallback() {
    this.shadowRoot.appendChild(editableCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
    const template = document.createElement('template')
    this.shadowRoot.appendChild(template.content)
    this.updateCard()
  }

  updateCard() {
    const parent = this.element('editable-card')
    if (this.isConnected && parent) {
      const card = this.element('card')
      if (card) parent.removeChild(card)
      parent.insertAdjacentHTML('afterBegin', this.getCardElement())
      Array.from(this.shadowRoot.querySelectorAll('[contenteditable]')).forEach(node => this.observe(node))
    }
  }

  observe(element) {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        const message = this.card + " from '" + mutation.oldValue + "' to '" + mutation.target.data + "'"
        console.log(message)
      })
    })
    observer.observe(element, {
      subtree: true,
      characterData: true,
      characterDataOldValue: true
    })
  }

  setEditable(e, editable) {
    if (editable)
        e.setAttribute('contenteditable', 'plaintext-only')
    else
      e.removeAttribute('contenteditable')
    // e.oninput = () => this.debounce(handleCorrection, 1000)
  }

  debounce(callback, wait) {
    let timeoutId = null
    return (...args) => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args)
      }, wait)
    }
  }

  makeEditable(content) {
    // if (content && content.querySelector('i'))
      // this.setEditable(content.querySelector('i'), true)
    if (content && content.querySelector('h2'))
      this.setEditable(content.querySelector('h2'), true)
    if (content && content.querySelector('span'))
      this.setEditable(content.querySelector('span'), true)
    return content
  }
                                                
  getCardElement() {
    if (!this.card || !this.card.length) return '<div></div>'
    const data = document.querySelector(`${EditableCard.contentRootSelector} > #${this.lang} *[id="${this.card}"]`) 
    const title = data ? data.querySelector('h2') ? data.querySelector('h2').innerHTML : data.title : '???'
    const type = this.idiot ? 'idiot' : ''
    const spellcheck = data && data.hasAttribute('spellcheck') ? 'spellcheck ' : ''
    const content = this.makeEditable(data)
    switch (this.card[0]) {
      case 'C': return `<cancel-card id="card" card="${this.card}">${content.outerHTML}</cancel-card>`
      case 'L': return `<label-card id="card" ${type} card="${this.card}">${content.outerHTML}</label-card>`
      case 'A': return this.card, title, `<appeal-to-card id="card" ${type} type="${data.type}" card="${this.card}">${content.outerHTML}</appeal-to-card>`
      case 'F': return `<fallacy-card id="card" ${type} card="${this.card}">${content.outerHTML}</fallacy-card>`
      case 'D': 
      case 'T': 
        return `<discuss-card id="card" ${type} topicId="${this.card}" topic="${title}"></discuss-card>`
      case 'N': return `<strawman-card id="card" ${type}></strawman-card>`
      case 'R': return `<research-card id="card" ${type}></research-card>`
      case 'P': return `<pause-card id="card" ${type}></pause-card>`
      case 'B': return `<banish-card id="card" ${type}></banish-card>`
      case 'I':
      case 'S': return`<argument-card id="card" ${type} ${spellcheck} card="${this.card}">${content.innerHTML}</argument-card>`
    }
  }
}

customElements.define('editable-card', EditableCard)
import {BaseComponent} from './base-component.mjs'

window.customElements.define('editable-card', class EditableCard extends BaseComponent {
  static observedAttributes = ['card']
  static contentRootSelector = '#content'

  get card() {
    return this.getAttribute('card')
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

  get css() {
    return `
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
`
  }

  get html() {
    return `
      <div id="editable-card">
      </div>
    `
  }

  attributeChangedCallback(name) {
    if (name==='card') this.updateCard()
  }

  connectedCallback() {
    super.connectedCallback()
    this.updateCard()
  }

  updateCard() {
    if (this.shadowRoot && this.isConnected) {
      const parent = this.element('editable-card')
      const card = this.element('card')
      if (card) parent.removeChild(card)
      parent.insertAdjacentHTML('afterbegin', this.getCardElement())
      Array.from(this.shadowRoot.querySelectorAll('[contenteditable]')).forEach(node => this.observe(node))
    }
  }

  observe(element) {
    const observer = new MutationObserver(mutations =>
      mutations.forEach(mutation =>
        this.dispatchEvent(new CustomEvent('mutated', {detail: mutation})))
    )
    observer.observe(element, { subtree: true, characterData: true, characterDataOldValue: true })
  }

  getMessage(key, fallback = '???') {
    const node = document.querySelector(`${EditableCard.contentRootSelector} > #${this.lang} .messages a.${key}`)
    return node ? node.innerHTML : fallback
  }

  getContent(key, clazz = undefined) {
    clazz = this.getMessage(clazz ? `${key}.class.${clazz}` : `${key}.class`, null)
    const phrase = this.getMessage(`${key}.phrase`, null)
    const description = this.getMessage(`${key}.description`, null)
    return (clazz ? `<i>${clazz}</i>` : '')
          + (phrase ? `<h2>${phrase}</h2>` : '')
          + (description ? `<p>${description}</p>` : '')
  }

  setEditable(e, editable) {
    if (editable)
        e.setAttribute('contenteditable', 'plaintext-only')
    else
      e.removeAttribute('contenteditable')
  }

  makeEditable(content) {
    if (content && content.querySelector('h2'))
      this.setEditable(content.querySelector('h2'), true)
    if (content && content.querySelector('p'))
      this.setEditable(content.querySelector('p'), true)
    return content
  }

  getCardElement() {
    if (!this.card || !this.card.length) return '<div></div>'
    const data = document.querySelector(`${EditableCard.contentRootSelector} > #${this.lang} *[id="${this.card}"]`)
    const clazz = data.classList.item(0) || ''
    const title = data ? data.querySelector('h2') ? data.querySelector('h2').innerHTML : data.title : '???'
    const type = this.idiot ? 'idiot' : ''
    const side = this.idiot ? 'idiot' : 'sheep'
    const spellcheck = data && data.hasAttribute('spellcheck') ? 'spellcheck ' : ''
    const content = this.makeEditable(data)
    switch (this.card[0]) {
      case 'C': return `<cancel-card id="card" card="${this.card}">${content.outerHTML}${this.getContent('cancel')}</cancel-card>`
      case 'L': return `<label-card id="card" ${type} card="${this.card}">${content.outerHTML}${this.getContent('label')}</label-card>`
      case 'A': return `<appeal-to-card id="card" ${type} type="${data.type}" card="${this.card}">${content.outerHTML}${this.getContent('appeal-to', clazz)}</appeal-to-card>`
      case 'F': return `<fallacy-card id="card" ${type} card="${this.card}">${content.outerHTML}${this.getContent('fallacy', clazz)}</fallacy-card>`
      case 'D':
      case 'T':
        return `<discuss-card id="card" ${type} topicId="${this.card}">${this.getContent('discuss').replace('TOPIC', `<b>${title}</b>`)}</discuss-card>`
      case 'N': return `<strawman-card id="card" ${type}>${this.getContent('strawman')}</strawman-card>`
      case 'R': return `<research-card id="card" ${type}>${this.getContent(`research.${side}`)}</research-card>`
      case 'P': return `<pause-card id="card" ${type}>${this.getContent(`pause.${side}`)}</pause-card>`
      case 'B': return `<banish-card id="card" ${type}>${this.getContent('banish')}</banish-card>`
      case 'I':
      case 'S': return`<argument-card id="card" ${type} ${spellcheck} card="${this.card}">${content.innerHTML}</argument-card>`
    }
  }
})

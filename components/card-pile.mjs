import { BaseComponent } from './base-component.mjs'

window.customElements.define('card-pile', class CardPile extends BaseComponent {
  // no top given means empty stack, top given as 'I' or 'S' means facing down pile with idiot or sheep card-back
  static observedAttributes = ['top', 'mirrored', 'draggable', 'droppable']

  get top () {
    return this.getAttribute('top')
  }

  get idiot () {
    return this.top.includes('I')
  }

  get mirrored () {
    return this.hasAttribute('mirrored')
  }

  get draggable () {
    return this.hasAttribute('draggable')
  }

  get droppable () {
    return this.hasAttribute('droppable')
  }

  get css () {
    return `
    ${super.css}
    :host {
      position: relative;
    }

    no-card, card-back, game-card {
      position: absolute;
      width: 98%;
      height: 98%;
      z-index: 2;
      cursor: pointer;
    }

    no-card#second {
      left: 1%;
      top: 1%;
      z-index: 1;
    }

    no-card#third {
      left: 2%;
      top: 2%;
      z-index: 0;
    }
    
    .dropping {
      border: 5px solid blue;
    }
  `
  }

  get html () {
    return `${this.getTopElement()}<no-card id="second"></no-card><no-card id="third"></no-card>`
  }

  attributeChangedCallback (name) {
    if (name === 'top') this.updateTop()
    if (name === 'mirrored') this.updateMirrored()
  }

  connectedCallback () {
    super.connectedCallback()
    this.updateDraggable()
    this.updateDroppable()
  }

  updateTop () {
    if (this.shadowRoot && this.isConnected) {
      const card = this.shadowRoot.querySelector('no-card, card-back, game-card') // select top element
      card.insertAdjacentHTML('beforebegin', this.getTopElement())
      this.shadowRoot.removeChild(card)
      this.updateDraggable()
    }
  }

  updateMirrored () {
    if (this.shadowRoot && this.isConnected) {
      const card = this.querySelector('game-card')
      if (card) card.toggleAttribute('mirrored', this.mirrored)
    }
  }

  updateDraggable () {
    const card = this.shadowRoot.querySelector('card-back, game-card')
    if (this.draggable && card) {
      card.setAttribute('draggable', 'true')
      card.addEventListener('dragstart', event => this.dragstart(event))
      card.addEventListener('dragend', event => this.dragend(event))
    }
  }

  dragstart (event) {
    event.dataTransfer.setData('text/plain', JSON.stringify({ draw: true }))
  }

  dragend (event) {
    event.preventDefault()
  }

  updateDroppable () {
    if (this.droppable) {
      this.addEventListener('dragenter', event => this.dragenter(event))
      this.addEventListener('dragleave', event => this.dragleave(event))
      this.addEventListener('dragover', event => this.dragover(event))
      this.addEventListener('drop', event => this.drop(event))
    }
  }

  dragenter (event) {
    const card = this.shadowRoot.querySelector('no-card, card-back, game-card')
    if (card) card.classList.add('dropping')
    event.preventDefault()
  }

  dragleave (event) {
    const card = this.shadowRoot.querySelector('no-card, card-back, game-card')
    if (card) card.classList.remove('dropping')
    event.preventDefault()
  }

  dragover (event) {
    event.preventDefault()
  }

  drop (event) {
    const detail = JSON.parse(event.dataTransfer.getData('text/plain'))
    console.log('drop!', detail)
    this.dispatchEvent(new CustomEvent('dropped', { detail }))
    const card = this.shadowRoot.querySelector('no-card, card-back, game-card')
    if (card) card.classList.remove('dropping')
    event.stopPropagation()
    event.preventDefault()
  }

  getTopElement () {
    const mirrored = this.mirrored ? 'mirrored' : ''
    switch (this.top) {
      case null:
      case undefined:
      case 'undefined':
      case '': return '<no-card></no-card>'
      case 'I': return '<card-back idiot></card-back>'
      case 'S': return '<card-back></card-back>'
      default: return `<game-card ${mirrored} card="${this.top}"></game-card>`
    }
  }
})

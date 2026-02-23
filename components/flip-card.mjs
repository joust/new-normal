import { BaseComponent } from './base-component.mjs'

export class FlipCard extends BaseComponent {
  static observedAttributes = ['mirrored']

  get css () {
    return `
      ${super.css}
     :host {
      position: relative;
      overflow: visible;
    }

    flip-area, #front, #back, slot, ::slotted(*[slot]) {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    #open {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10%;
      height: 7%;
      color: lightgrey;
      text-align: center;
      font-size: calc((5cqw + 5cqh) / var(--avg));
      font-family: 'Open Sans', Helvetica, sans-serif;
    }

    #open.mirrored {
      right: auto;
      left: 0;
    }

    #open:after {
      content: '"';
    }
  `
  }

  get html () {
    return `
    <flip-area id="fliparea">
      <div slot="back" id="back"><slot name="back"></slot></div>
      <div slot="front" id="front">
        <slot name="front"></slot>
        <div id="open"></div>
      </div>
    </flip-area>
  `
  }

  attributeChangedCallback () {
    this.updateMirrored()
  }

  connectedCallback () {
    super.connectedCallback()
    this.element('front').ondblclick = event => { this.openRandom(event); event.stopPropagation() }
    this.element('back').onclick = event => { this.close(); event.stopPropagation() }
  }

  updateMirrored () {
    const slots = Array.from(this.querySelectorAll('[slot]'))
    slots.forEach(slot => slot.toggleAttribute('mirrored', this.mirrored))
    const open = this.element('open')
    if (open) open.classList.toggle('mirrored', this.mirrored)
  }

  clickOpen (event) {
    this.element('fliparea').clickOpen(event)
  }

  openRandom () {
    this.element('fliparea').openRandom()
  }

  open (x = 0, y = 0) {
    this.element('fliparea').open(x, y)
  }

  close () {
    this.element('fliparea').close()
  }
}

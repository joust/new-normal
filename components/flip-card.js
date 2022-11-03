// idea from: https://github.com/hakimel/css/tree/master/flipside
const flipCardTemplate = document.createElement('template')
flipCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
      position: relative;
      overflow: visible;
    }

    #wrapper, #flip, #front, #back, slot, ::slotted(*[slot]) {
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
      color: white;
      background: lightgrey;
      text-align: center;
      font-size: calc(5 * var(--cavg));
      cursor: pointer;
      border-radius: 50%;
      font-family: 'Open Sans', Helvetica;
    }

    #open:hover {
      color: white;
      background: grey;
    }

    #open.mirrored {
      right: auto;
      left: 0;
    }

    #open:after {
      content: '“';
    }

    #wrapper {
      perspective: 3000px;
    }

    #flip {
      position: relative;
      transition: width 0.8s cubic-bezier(0.23, 1, 0.32, 1), height 0.8s cubic-bezier(0.23, 1, 0.32, 1), transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), margin 0.5s ease;
      transform-style: preserve-3d;
      transform-origin: 50% 50%;
    }

    #front {
      display: block;
      backface-visibility: hidden;
      transition: background 0.15s ease, line-height 0.8s cubic-bezier(0.23, 1, 0.32, 1);
      transition: opacity 0.2s ease;
    }

    #back {
      display: block;
      transform: translateZ(-2px) rotateX(180deg);
      backface-visibility: hidden;
      cursor: pointer;
    }

    #flip[data-direction="left"] #back,
    #flip[data-direction="right"] #back {
      transform: translateZ(-2px) rotateY(180deg);
    }

    #flip.is-open #front {
      pointer-events: none;
      opacity: 0;
    }

    #flip #back {
      opacity: 0;
    }

    #flip.is-open #back {
      opacity: 1;
    }

    #flip[data-direction="top"].is-open {
      transform: rotateX(180deg);
    }

    #flip[data-direction="right"].is-open {
      transform: rotateY(180deg);
    }

    #flip[data-direction="bottom"].is-open {
      transform: rotateX(-180deg);
    }

    #flip[data-direction="left"].is-open {
      transform: rotateY(-180deg);
    }
  </style>
  <div id="wrapper">
    <div id="flip">
      <div id="back"><slot name="back"></slot></div>
      <div id="front">
        <slot name="front"></slot>
        <div id="open"></div>
      </div>
    </div>
  </div>
`

class FlipCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['mirrored']
  static contentRootSelector = '#content'

  element(id) { return this.shadowRoot.getElementById(id) }

  attributeChangedCallback() {
    this.updateMirrored()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(flipCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
    const template = document.createElement('template')
    this.shadowRoot.appendChild(template.content)
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    this.element('open').onclick = event => { this.openRandom(event); event.stopPropagation() }
    this.element('back').onclick = event => { this.close(); event.stopPropagation() }
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }

  updateMirrored() {
    const slots = Array.from(this.querySelectorAll('[slot]'))
    slots.forEach(slot => slot.toggleAttribute('mirrored', this.mirrored))
    const open = this.element('open')
    if (open) open.classList.toggle('mirrored', this.mirrored)
  }

  /**
   * flip open, taking the mouse position into account
   *
   * @param {MouseEvent} event event that triggered the open action
   */
  clickOpen(event) {
    this.open(event.clientX, event.clientY)
  }

  openRandom(event) {
    const randomX = Math.random() * this.clientWidth
    const randomY = Math.random() * this.clientHeight
    this.open(randomX, randomY)
  }

  /**
   * flip open, taking mouse position into account
   *
   * @param {number} x mouse position x
   * @param {number} y mouse position y
   */
  open(x = 0, y = 0) {
    const flip = this.element('flip')
    const w = flip.offsetWidth, h = flip.offsetHeight

    const directions = [
      { id: 'top', x: w/2, y: 0 },
      { id: 'right', x: w, y: h/2 },
      { id: 'bottom', x: w/2, y: h },
      { id: 'left', x: 0, y: h/2 }
    ]

    if (x || y) {
      const mx = x - flip.offsetLeft, my = y - flip.offsetTop
      directions.sort((a, b) => {
          return this.distance(mx, my, a.x, a.y) - this.distance(mx, my, b.x, b.y)
      })
      flip.setAttribute('data-direction', directions.shift().id)
    } else {
      const current = flip.getAttribute('data-direction')
      const filteredDirections = directions.filter(d => d.id !== current)
      flip.setAttribute('data-direction', filteredDirections[Math.floor(Math.random() * filteredDirections.length)].id)
    }

    flip.classList.add('is-open')
  }

  /**
   * flip close
   */
  close() {
    const flip = this.element('flip')
    flip.classList.remove('is-open')
  }

  /**
   * calculate distance between (x1,y1) and (x2,y2) in a coordinate system
   *
   * @param {number} x1 x1 coordinate
   * @param {number} y1 y1 coordinate
   * @param {number} x2 x2 coordinate
   * @param {number} y2 y2 coordinate
   * @return {number} the calculated distance
   */
  distance(x1, y1, x2, y2) {
    const dx = x1-x2, dy = y1-y2
    return Math.sqrt(dx*dx + dy*dy)
  }
}

customElements.define('flip-card', FlipCard)

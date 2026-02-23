// idea from: https://github.com/hakimel/css/tree/master/flipside
import { BaseComponent } from './base-component.mjs'

export class FlipArea extends BaseComponent {
  connectedCallback () {
    super.connectedCallback()
  }

  get css () {
    const time = 1
    return `
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

      #wrapper {
        perspective: 3000px;
      }

      #flip {
        position: relative;
        transition: width ${time}s cubic-bezier(0.23, 1, 0.32, 1), height ${time}s cubic-bezier(0.23, 1, 0.32, 1), transform ${time}s cubic-bezier(0.175, 0.885, 0.32, 1.275), margin ${time}s ease;
        transform-style: preserve-3d;
        transform-origin: 50% 50%;
      }

      #front {
        display: block;
        z-index: 100;
        transition: background ${time}s ease, line-height ${time}s cubic-bezier(0.23, 1, 0.32, 1), opacity ${time / 5}s ease;
      }

      #back {
        display: block;
        transform: translateZ(-2px) rotateX(180deg);
        transition: background ${time}s ease, line-height ${time}s cubic-bezier(0.23, 1, 0.32, 1), opacity ${time / 5}s ease;
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
      `
  }

  get html () {
    return `
      <div id="wrapper">
        <div id="flip">
          <div id="back"><slot name="back"></slot></div>
          <div id="front"><slot name="front"></slot></div>
        </div>
     </div>
    `
  }

  clickOpen (event) {
    this.open(event.clientX, event.clientY)
  }

  openRandom () {
    const randomX = Math.random() * this.clientWidth
    const randomY = Math.random() * this.clientHeight
    this.open(randomX, randomY)
  }

  open (x = 0, y = 0) {
    const flip = this.element('flip')
    const w = flip.offsetWidth; const h = flip.offsetHeight

    const directions = [
      { id: 'top', x: w / 2, y: 0 },
      { id: 'right', x: w, y: h / 2 },
      { id: 'bottom', x: w / 2, y: h },
      { id: 'left', x: 0, y: h / 2 }
    ]

    if (x || y) {
      const mx = x - flip.offsetLeft; const my = y - flip.offsetTop
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
    this.toggleAttribute('open', true)
  }

  close () {
    this.element('flip').classList.remove('is-open')
    this.removeAttribute('open')
  }

  isOpen () {
    return this.element('flip').classList.contains('is-open')
  }

  distance (x1, y1, x2, y2) {
    const dx = x1 - x2; const dy = y1 - y2
    return Math.sqrt(dx * dx + dy * dy)
  }
}

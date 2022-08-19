const labelCardTemplate = document.createElement('template')
labelCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #card {
      --sidebar-width: 12%;
      --watermark-size: 50%;
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
    }

    #watermark {
      position: absolute;
      width: var(--watermark-size);
      height: var(--watermark-size);
      top: 4%;
      right: 0;
      opacity: 0.15;
      background-image: url('images/virus.png');
      background-size: contain;
      background-repeat: no-repeat;
    }

    .mirrored #watermark {
      right: var(--sidebar-width);
    }

    #new {
      font-family: 'HVD Crocodile';
      font-weight: 600;
      font-size: calc(14 * var(--cavg));
      position: absolute;
      left: var(--sidebar-width);
      top: 0;
      color: white;
      opacity: 0.15;
    }

    .mirrored #new {
      left: 2%;
    }

    #normal {
      font-family: 'HVD Crocodile';
      font-weight: 600;
      font-size: calc(14 * var(--cavg));
      position: absolute;
      bottom: 0;
      right: 2%;
      color: white;
      opacity: 0.15;
    }

    .mirrored #normal {
      right: calc(2% + var(--sidebar-width));
    }

    #label {
      position: absolute;
      font-family: 'HVD Crocodile';
      font-size: calc(7 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      width: calc(100% - var(--sidebar-width));
      left: var(--sidebar-width);
      height: 100%;
      hyphens: auto;
    }

    .mirrored #label {
      left: 0;
      right: var(--sidebar-width);
    }

    #label-name {
      max-width: 100%;
      display: inline-block;
      text-align: center;
    }

    #label-name::before {
      content: '\u201c'
    }

    #label-name::after {
      content: '!\u201d'
    }

    #side-label {
      position: absolute;
      font-family: 'HVD Crocodile';
      font-size: calc(6 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      color: white;
      opacity: 0.4;
      padding-left: 2%;
      top: 100%;
      left: 0;
      height: calc(15 * var(--cw));
      width: calc(85 * var(--ch));
      text-overflow: ellipsis;
      transform: rotate(-90deg);
      transform-origin: top left;
    }

    #side-label::after {
      content: '!'
    }

    .mirrored #side-label {
      left: calc(100% - var(--sidebar-width));
    }

    .red-bg {
      background-color: #f72d5d;
    }

    .blue-bg {
        background-color: #2d60f6;
     }
  </style>
  <div id="card">
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="label"><span id="label-name"></span></div>
    <div id="side-label"></div>
    <div id="normal">Normal</div>
  </div>
`

class LabelCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    const resizeObserver = new ResizeObserver(() => {
      const cw = this.clientWidth/100, ch = this.clientHeight/100
      this.style.setProperty('--cw', `${cw}px`)
      this.style.setProperty('--ch', `${ch}px`)
      this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
    })
    resizeObserver.observe(this)
  }

  static observedAttributes = ['idiot', 'label', 'mirrored']

  element(id) { return this.shadowRoot.getElementById(id) }

  get idiot() {
    return this.hasAttribute('idiot')
  }

  get label() {
    return this.getAttribute('label')
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.update()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(labelCardTemplate.content.cloneNode(true))
    this.update()
  }

  update() {
    if (this.isConnected) {
      this.element('card').classList.toggle('mirrored', this.mirrored)
      this.element('card').classList.toggle('red-bg', this.idiot)
      this.element('card').classList.toggle('blue-bg', !this.idiot)
      this.element('side-label').innerHTML = this.label
      this.element('label-name').innerHTML = this.label
    }
  }
}

customElements.define('nn-label-card', LabelCard)
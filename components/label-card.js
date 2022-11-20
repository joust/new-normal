const labelCardTemplate = document.createElement('template')
labelCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #label-card {
      --red: #f72d5d;
      --blue: #2d60f6;
      --sidebar-width: 12%;
      --watermark-size: 50%;
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: linear-gradient(30deg, black 0%, grey 100%);
      user-select: none;
    }

    #icon {
      position: absolute;
      width: calc(1.3 * var(--sidebar-width));
      heigt: calc(1.3 * var(--sidebar-width))
      top: 0;
      left: 0;
      font-size: calc(8 * var(--cavg));
      text-align: center;
      color: white;
      opacity: .8;
    }

    #icon:before {
      content: '⚔️';
    }

    .mirrored #icon {
      right: 0;
      left: auto;
    }

    #watermark {
      position: absolute;
      width: var(--watermark-size);
      height: var(--watermark-size);
      top: 4%;
      right: 0;
      opacity: 0.15;
      background-image: url('/styles/images/virus.png');
      background-size: contain;
      background-repeat: no-repeat;
    }

    .mirrored #watermark {
      right: var(--sidebar-width);
    }

    
    #new, #normal {
      font-family: 'HVD Crocodile', Helvetica;
      font-weight: 600;
      font-size: calc(14 * var(--cavg));
      position: absolute;
      color: white;
      opacity: 0.15;
    }
    
    #new {
      left: var(--sidebar-width);
      top: 0;
    }

    .mirrored #new {
      left: 2%;
    }

    #normal {
      bottom: 0;
      right: 2%;
    }

    .mirrored #normal {
      right: calc(2% + var(--sidebar-width));
    }

    #label {
      position: absolute;
      color: var(--blue);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      width: calc(100% - var(--sidebar-width));
      left: var(--sidebar-width);
      height: 100%;
      -webkit-hyphens: auto;
      hyphens: auto;
    }

    .mirrored #label {
      left: 0;
      right: var(--sidebar-width);
    }

    #fallacy {
      font-family: 'Open Sans', Helvetica;
      font-size: calc(4 * var(--cavg));
      font-weight: 300;
      color: white;
    }

    #label-name {
      font-family: 'HVD Crocodile', Helvetica;
      font-size: calc(7 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      max-width: 100%;
      display: inline-block;
      padding-left: calc(7 * var(--cavg));
      padding-right: calc(7 * var(--cavg));
      text-align: center;
    }

    .quoted::before {
      content: open-quote;
    }

    .quoted::after {
      content: '!' close-quote;
    }

    #description {
      position: absolute;
      bottom: 0; 
      font-family: 'Open Sans', Helvetica;
      padding: calc(5 * var(--cavg));
      padding-bottom: calc(16 * var(--cavg));
      font-size: calc(3 * var(--cavg));
      font-style: italic;
      color: white;
      opacity: 0.4;
    }

    #card {
      position: absolute;
      right: 0;
      top: 0;
      width: 12%;
      height: 4%;
      font-family: 'Open Sans', Helvetica;
      font-size: calc(2.5 * var(--cavg));
      text-align: center;
      color: white;
      border-top-right-radius: calc(2 * var(--cavg));
      background-color: var(--blue);
    }

    .idiot #card {
      background-color: var(--red);
    }

    .mirrored #card {
      left: 0;
      right: auto;
      border-top-left-radius: calc(2 * var(--cavg));
      border-top-right-radius: 0;
    }

    #side-label {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica;
      font-size: calc(6 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      color: var(--blue);
      opacity: 0.8;
      padding-left: 2%;
      top: 100%;
      left: 0;
      height: calc(15 * var(--cw));
      width: calc(85 * var(--ch));
      text-overflow: ellipsis;
      transform: rotate(-90deg);
      transform-origin: top left;
    }

    #label-card.idiot #label, #label-card.idiot #side-label {
      color: var(--red);
    }

    #side-label::after {
      content: '!';
    }

    .mirrored #side-label {
      left: calc(100% - var(--sidebar-width));
    }
  </style>
  <div id="label-card">
    <div id="icon"></div>
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="label"><span id="fallacy"></span><span class="quoted" id="label-name"></span><span id="description"></span></div>
    <div id="side-label"></div>
    <div id="normal">Normal</div>
    <div id="card"></div>
  </div>
`

class LabelCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['idiot', 'mirrored']

  element(id) { return this.shadowRoot.getElementById(id) }

  get idiot() {
    return this.hasAttribute('idiot')
  }

  get label() {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
  }

  get fallacy() {
    return this.querySelector('i') ? this.querySelector('i').innerHTML : ''
  }

  get description() {
    return this.querySelector('p') ? this.querySelector('p').innerHTML : ''
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  get card() {
    return this.querySelector('a') ? this.querySelector('a').id : ''
  }

  attributeChangedCallback() {
    this.update()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(labelCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    this.update()
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cw', `${cw}px`)
    this.style.setProperty('--ch', `${ch}px`)
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }

  update() {
    const root = this.element('label-card')
    if (this.isConnected && root) {
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      this.element('card').innerHTML = this.card
      this.element('side-label').innerHTML = this.label
      this.element('label-name').innerHTML = this.label
      this.element('fallacy').innerHTML = this.fallacy
      this.element('description').innerHTML = this.description
    }
  }
}

customElements.define('label-card', LabelCard)
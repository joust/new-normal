const argumentCardTemplate = document.createElement('template')
argumentCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #argument-card {
      --red: #f72d5d;
      --blue: #2d60f6;
      --topic-height: 3%;
      --sidebar-width: 12%;
      --watermark-size: 50%;
      position: relative;
      background: linear-gradient(30deg, #fdfdfd 0%, #fff 100%);
      font-family: 'Open Sans', Helvetica;
      font-size: calc(4 * var(--cavg));
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      width: 100%;
      height: 100%;
      user-select: none;
    }

    #topic-icon {
      position: absolute;
      width: calc(1.3 * var(--sidebar-width));
      heigt: calc(1.3 * var(--sidebar-width))
      top: 0;
      left: 0;
      font-family: 'HVD Crocodile', Helvetica;
      font-weight: 600;
      font-stretch: condensed;
      font-size: calc(8 * var(--cavg));
      text-align: center;
      margin-top: 0;
      margin-bottom: 0;
      color: var(--blue);
    }

    .idiot #topic-icon {
      color: var(--red);
    }

    .mirrored #topic-icon {
      right: 0;
      left: auto;
    }

    #topic-name {
      position: absolute;
      font-weight: 300;
      height: var(--topic-height);
      top: 0;
      left: calc(var(--sidebar-width) + 6 * var(--cw));
      right: 0;
      color: var(--blue);
    }

    .idiot #topic-name {
      color: var(--red);
    }

    .mirrored #topic-name {
      right: calc(var(--sidebar-width) + 6 * var(--cw));
      left: 0;
      text-align: right;
    }

    #watermark {
      position: absolute;
      width: var(--watermark-size);
      height: var(--watermark-size);
      top: var(--topic-height);
      right: 0;
      opacity: 0.15;
      background-image: url('images/virus.png');
      background-size: contain;
      background-repeat: no-repeat;
    }

    .mirrored #watermark {
      right: var(--sidebar-width);
    }

    #content {
      position: absolute;
      left: var(--sidebar-width);
      top: var(--topic-height);
      right: 0;
      bottom: 0;
      padding: calc(2 * var(--cavg));
      overflow: hidden;
    }

    .mirrored #content {
      left: 0;
      right: var(--sidebar-width);
    }

    ::slotted(*) {
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
    }

    ::slotted(h2) {
      font-family: 'HVD Crocodile', Helvetica;
      font-weight: 600;
      font-stretch: condensed;
      font-size: calc(7 * var(--cavg));
      text-align: left;
      margin-top: 0;
      margin-bottom: 0;
      color: var(--blue);
    }

    .idiot ::slotted(h2) {
      color: var(--red);
    }
    
    ::slotted(h2)::before {
      content: open-quote;
    }

    ::slotted(h2)::after {
      content: close-quote;
    }

    ::slotted(.red) {
      color: #f72d5d;
    }

    ::slotted(.blue) {
        color: #2d60f6;
     }

    #side-title {
      font-family: 'HVD Crocodile', Helvetica;
      font-size: calc(6 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      position: absolute;
      color: lightgrey;
      padding-left: 2%;
      top: 100%;
      left: 0;
      height: calc(15 * var(--cw));
      width: calc(85 * var(--ch));
      text-overflow: ellipsis;
      text-align: left;
      overflow: hidden;
      white-space: nowrap;
      transform: rotate(-90deg);
      transform-origin: top left;
    }

    .mirrored #side-title {
      left: calc(100% - var(--sidebar-width));
    }

    #card {
      position: absolute;
      right: 0;
      top: 0;
      width: 12%;
      height: 4%;
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
  </style>
  <div id="argument-card">
    <div id="watermark"></div>
    <div id="topic-icon"></div>
    <div id="topic-name"></div>
    <div id="content"><slot></div>
    <div id="side-title"></div>
    <div id="card"></div>
  </div>
`

class ArgumentCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['idiot', 'topic', 'topicId', 'card', 'mirrored']

  element(id) { return this.shadowRoot.getElementById(id) }

  get idiot() {
    return this.hasAttribute('idiot')
  }

  get topic() {
    return this.getAttribute('topic')
  }

  get topicId() {
    return this.getAttribute('topicId')
  }

  get card() {
    return this.getAttribute('card')
  }

  get title() {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback() {
    this.update()
  }

  debounce(f, delay) {
    let timer = 0
    return function(...args) {
      clearTimeout(timer)
      timer = setTimeout(() => f.apply(this, args), delay)
    }
  }

  connectedCallback() {
    this.shadowRoot.appendChild(argumentCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
    const resizeObserver = new ResizeObserver(this.debounce(() => this.resize(), 10))
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
    const root = this.element('argument-card')
    if (this.isConnected && root) {
      root.classList.toggle('idiot', this.idiot)
      root.classList.toggle('mirrored', this.mirrored)
      this.element('card').innerHTML = this.card
      this.element('topic-icon').innerHTML = this.topicId.substring(1)
      this.element('topic-name').innerHTML = this.topic
      this.element('side-title').innerHTML = this.title
    }
  }
}

customElements.define('argument-card', ArgumentCard)
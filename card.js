const cardTemplate = document.createElement('template')
cardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #card {
      --topic-height: 3%;
      --sidebar-width: 12%;
      --watermark-size: 50%;
      position: relative;
      background: linear-gradient(0deg, #fdfdfd 0%, #fff 100%);
      font-family: 'Open Sans', Helvetica;
      font-size: calc(4 * var(--cavg));
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      width: 100%;
      height: 100%;
    }

    #topic-icon {
      position: absolute;
      width: var(--sidebar-width);
      heigt: var(--sidebar-width);
      top: 0;
      left: 0;
    }

    .mirrored #topic-icon {
      right: 0;
      left: auto;
    }

    #topic-name {
      position: absolute;
      height: var(--topic-height);
      top: 0;
      left: calc(var(--sidebar-width) + 6 * var(--cw));
      right: 0;
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
    }

    .mirrored #content {
      left: 0;
      right: var(--sidebar-width);
    }

    #title {
      font-family: 'HVD Crocodile';
      font-weight: 600;
      font-stretch: condensed;
      font-size: calc(7 * var(--cavg));
      width: 100%;
      height: auto;
      hyphens: auto;
    }

    #title::before {
      content: '\u201c'
    }

    #title::after {
      content: '\u201d'
    }

    .red {
      color: #f72d5d;
    }

    .blue {
        color: #2d60f6;
     }

    .red-bg {
      background-color: #f72d5d;
    }

    .blue-bg {
        background-color: #2d60f6;
     }

    #argument {
      width: 100%;
      text-align: justify;
      hyphens: auto;
      height: auto;
      overflow: auto;
    }

    #side-title {
      font-family: 'HVD Crocodile';
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
      transform: rotate(-90deg);
      transform-origin: top left;
    }

    .mirrored #side-title {
      left: calc(100% - var(--sidebar-width));
    }

    #id {
      position: absolute;
      right: 0;
      top: 0;
      width: 10%;
      height: 4%;
      font-size: calc(2.5 * var(--cavg));
      text-align: center;
      color: white;
      border-top-right-radius: calc(2 * var(--cavg));
    }

    .mirrored #id {
      left: 0;
      right: auto;
      border-top-left-radius: calc(2 * var(--cavg));
      border-top-right-radius: 0;
    }
  </style>
  <div id="card">
    <div id="watermark"></div>
    <div id="topic-icon"></div>
    <div id="topic-name"></div>
    <div id="content">
      <div id="title"></div>
      <div id="argument"><slot></div>
    </div>
    <div id="side-title"></div>
    <div id="id"></div>
  </div>
`

class Card extends HTMLElement {
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

  static observedAttributes = ['idiot', 'topic', 'id', 'title', 'mirrored']

  get idiot() {
    return this.hasAttribute('idiot')
  }

  get topic() {
    return this.getAttribute('topic')
  }

  get id() {
    return this.getAttribute('id')
  }

  get title() {
    return this.getAttribute('title')
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.update()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(cardTemplate.content.cloneNode(true))
    this.update()
  }

  update() {
    if (this.isConnected) {
      const element = id => this.shadowRoot.getElementById(id)
      element('card').classList.toggle('mirrored', this.mirrored)
      element('id').innerHTML = this.id
      element('id').classList.toggle('red-bg', this.idiot)
      element('id').classList.toggle('blue-bg', !this.idiot)
      element('side-title').innerHTML = this.title
      element('title').innerHTML = this.title
      element('title').classList.toggle('red', this.idiot)
      element('title').classList.toggle('blue', !this.idiot)
      element('topic-name').innerHTML = this.topic
      element('topic-name').classList.toggle('red', this.idiot)
      element('topic-name').classList.toggle('blue', !this.idiot)
    }
  }
}

customElements.define('nn-card', Card)
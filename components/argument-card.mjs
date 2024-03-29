import { flagMapped } from './shared.mjs'
import { BaseCard } from './base-card.mjs'

window.customElements.define('argument-card', class ArgumentCard extends BaseCard {
  static observedAttributes = ['topic', 'neutral', 'topicId', 'card', 'wildcard', 'spellcheck', 'mirrored']

  get idiot () {
    return this.card && this.card.includes('I')
  }

  get topic () {
    return this.getAttribute('topic')
  }

  get topicId () {
    return this.getAttribute('topicId')
  }

  get card () {
    return this.getAttribute('card')
  }

  get title () {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
  }

  get content () {
    return this.querySelector('p') ? this.querySelector('p').innerHTML : ''
  }

  get wildcard () {
    return this.hasAttribute('wildcard')
  }

  get neutral () {
    return this.hasAttribute('neutral')
  }

  get spellcheck () {
    return this.hasAttribute('spellcheck')
  }

  get mirrored () {
    return this.hasAttribute('mirrored')
  }

  get css () {
    return `
    ${super.css}
    #argument-card {
      background: var(--neutral-background);
      font-family: 'Open Sans', Helvetica, 'NotoColorEmojiLimited';
      font-size: calc((4cqw + 4cqh) / var(--avg));
    }

    #argument-card.idiot {
      background: var(--idiot-argument-background);
      color: var(--idiot-argument-color);
    }
    #argument-card.sheep {
      background: var(--sheep-argument-background);
      color: var(--sheep-argument-color);
    }

    #topic-icon {
      position: absolute;
      width: calc(1.3 * var(--sidebar-width));
      height: calc(1.3 * var(--sidebar-width))
      top: 0;
      left: 0;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-weight: 600;
      font-stretch: condensed;
      font-size: calc((8cqw + 8cqh) / var(--avg));
      text-align: center;
      margin-top: 0;
      margin-bottom: 0;
      color: var(--neutral);
    }

    .idiot #topic-icon {
      color: var(--idiot-argument-title-color);
    }
    .sheep #topic-icon {
      color: var(--sheep-argument-title-color);
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
      left: calc((var(--sidebar-width) + 6cqw + var(--sidebar-width) + 6cqh) / var(--avg));
      right: 0;
      color: var(--neutral);
    }

    .idiot #topic-name {
      color: var(--idiot-argument-title-color);
    }
    .sheep #topic-name {
      color: var(--sheep-argument-title-color);
    }

    .mirrored #topic-name {
      right: calc(var(--sidebar-width) + 6cqw);
      left: 0;
      text-align: right;
    }

    #content {
      position: absolute;
      left: var(--sidebar-width);
      top: var(--topic-height);
      right: 0;
      bottom: 0;
      padding: calc((2cqw + 2cqh) / var(--avg));
      overflow: hidden;
    }

    .mirrored #content {
      left: 0;
      right: var(--sidebar-width);
    }

    ::slotted(*) {
      text-align: justify;
      -webkit-hyphens: auto;
      hyphens: auto;
    }

    ::slotted(h2) {
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-weight: 600;
      font-stretch: condensed;
      font-size: calc((7cqw + 7cqh) / var(--avg));
      text-align: left;
      margin-top: 0;
      margin-bottom: 0;
      color: var(--neutral);
    }

    .idiot ::slotted(h2) {
      color: var(--idiot-argument-title-color);
    }
    .sheep ::slotted(h2) {
      color: var(--sheep-argument-title-color);
    }
    
    ::slotted(h2)::before {
      content: open-quote;
    }

    ::slotted(h2)::after {
      content: close-quote;
    }

    #content #placeholder {
      display: none;
    }

    #content.empty #placeholder {
      display: block;
      text-align: justify;
      font-size: calc((3cqw + 3cqh) / var(--avg));
      line-height: 1.8;
    }

    #placeholder span {
      background: lightgray;
      color: lightgray;
      opacity: 0.5;
      display: inline;
    }

    #side {
      color: lightgrey;
    }

    #card {
      color: white;
      background-color: var(--neutral);
    }

    .idiot #card {
      background-color: var(--idiot-background);
      color: var(--idiot-color);
    }
    .sheep #card {
      background-color: var(--sheep-background);
      color: var(--sheep-color);
    }

    #wildcard {
      position: absolute;
      right: 0;
      bottom: 0;
      font-size: calc((40cqw + 40cqh) / var(--avg));
      color: grey;
      opacity: 0.4;
    }

    .mirrored #wildcard {
      left: 0;
      right: auto;
    }

    #wildcard:after {
      content: '✱';
    }

    #spellcheck {
      position: absolute;
      right: 0;
      top: 4%;
      width: 8%;
      height: 6%;
      font-size: calc((5cqw + 5cqh) / var(--avg));
    }

    .mirrored #spellcheck {
      left: 0;
      right: auto;
    }

    #spellcheck:after {
      content: '🚧';
    }

    .hidden {
      display: none;
    }
  `
  }

  get html () {
    return `
      <div id="argument-card" class="card">
        <div id="watermark"></div>
        <div id="topic-icon"></div>
        <div id="topic-name"></div>
        <div id="content"><slot></slot><p id="placeholder"></p></div>
        <div id="side"></div>
        <div id="card"></div>
        <div id="spellcheck" class="hidden"></div>
        <div id="wildcard" class="hidden"></div>
      </div>
    `
  }

  constructor () {
    super()
    this.placeholder = this.randomPlaceholder(400)
  }

  attributeChangedCallback () {
    this.update()
  }

  random (min, max) {
    return min + Math.floor(Math.random() * (max - min + 1))
  }

  randomPlaceholder (len) {
    let placeholder = ''
    let letters = 0
    while (letters < len) {
      const l = this.random(2, 12)
      placeholder += `<span>${'____________'.substring(0, l)}</span> `
      letters += l + 1
    }
    return placeholder
  }

  connectedCallback () {
    super.connectedCallback()
    this.update()
  }

  update () {
    if (this.shadowRoot && this.isConnected) {
      const root = this.element('argument-card')
      root.classList.toggle('idiot', !this.neutral && this.idiot)
      root.classList.toggle('sheep', !this.neutral && !this.idiot)
      root.classList.toggle('mirrored', this.mirrored)
      this.element('wildcard').classList.toggle('hidden', !this.wildcard)
      this.element('spellcheck').classList.toggle('hidden', !this.spellcheck)
      this.element('card').innerHTML = flagMapped(this.card)
      this.element('card').classList.toggle('hidden', this.neutral)
      this.element('content').classList.toggle('empty', !this.content.length)
      this.element('placeholder').innerHTML = this.placeholder
      this.element('topic-icon').innerHTML = flagMapped(this.topicId ? this.topicId.substring(1) : '?')
      this.element('topic-name').innerHTML = this.topic
      this.element('side').innerHTML = `${this.wildcard ? '✱ ' : ''}${this.title}`
    }
  }
})

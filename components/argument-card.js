const argumentCardTemplate = document.createElement('template')
argumentCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #argument-card {
      --neutral: #777; 
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
      color: var(--neutral);
    }

    .idiot #topic-icon {
      color: var(--red);
    }
    .sheep #topic-icon {
      color: var(--blue);
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
      left: calc(var(--sidebar-width) + 6 * var(--cavg));
      right: 0;
      color: var(--neutral);
    }

    .idiot #topic-name {
      color: var(--red);
    }
    .sheep #topic-name {
      color: var(--blue);
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
      color: var(--neutral);
    }

    .idiot ::slotted(h2) {
      color: var(--red);
    }
    .sheep ::slotted(h2) {
      color: var(--blue);
    }
    
    ::slotted(h2)::before {
      content: open-quote;
    }

    ::slotted(h2)::after {
      content: close-quote;
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
      background-color: var(--neutral);
    }

    .idiot #card {
      background-color: var(--red);
    }
    .sheep #card {
      background-color: var(--blue);
    }

    .mirrored #card {
      left: 0;
      right: auto;
      border-top-left-radius: calc(2 * var(--cavg));
      border-top-right-radius: 0;
    }

    #wildcard {
      position: absolute;
      right: 0;
      bottom: 0;
      font-size: calc(40 * var(--cavg));
      color: grey;
      opacity: 0.4;
    }

    .mirrored #wildcard {
      left: 0;
      right: auto;
    }

    #wildcard:after {
      content: '✱'
    }

    #spellcheck {
      position: absolute;
      right: 0%;
      top: 4%;
      width: 8%;
      height: 6%;
      font-size: calc(5 * var(--cavg));
    }

    .mirrored #spellcheck {
      left: 0%;
      right: auto;
    }

    #spellcheck:after {
      content: '🚧'
    }

    .hidden {
      display: none;
    }
  </style>
  <div id="argument-card">
    <div id="watermark"></div>
    <div id="topic-icon"></div>
    <div id="topic-name"></div>
    <div id="content"><slot></div>
    <div id="side-title"></div>
    <div id="card"></div>
    <div id="spellcheck" class="hidden"></div>
    <div id="wildcard" class="hidden"></div>
  </div>
`

class ArgumentCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['topic', 'neutral', 'topicId', 'card', 'wildcard', 'spellcheck', 'mirrored']

  element(id) { return this.shadowRoot.getElementById(id) }

  get idiot() {
    return this.card && this.card.includes('I')
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

  get wildcard() {
    return this.hasAttribute('wildcard')
  }

  get neutral() {
    return this.hasAttribute('neutral')
  }

  get spellcheck() {
    return this.hasAttribute('spellcheck')
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
    const resizeObserver = new ResizeObserver(this.debounce(() => this.resize(), 0))
    resizeObserver.observe(this)
    this.update()
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cw', `${cw}px`)
    this.style.setProperty('--ch', `${ch}px`)
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }

  flagMapped(s) {
    const flagMap = {
      de: '🇩🇪',
      at: '🇦🇹',
      ch: '🇨🇭',
      ch: '🇨🇭',
      ch: '🇨🇭',
      da: '🇩🇰',
      li: '🇱🇮',
      it: '🇮🇹',
      it: '🇮🇹',
      sm: '🇸🇲',
      va: '🇻🇦',
      us: '🇺🇸',
      gb: '🇬🇧',
      au: '🇦🇺',
      nz: '🇳🇿',
      ca: '🇨🇦',
      ca: '🇨🇦',
      pl: '🇵🇱',
      ag: '🇦🇬',
      bs: '🇧🇸',
      bb: '🇧🇧',
      bz: '🇧🇿',
      dm: '🇩🇲',
      gd: '🇬🇩',
      gy: '🇬🇾',
      ie: '🇮🇪',
      jm: '🇯🇲',
      mt: '🇲🇹',
      kn: '🇰🇳',
      lc: '🇱🇨',
      vc: '🇻🇨',
      tt: '🇹🇹',
      es: '🇪🇸',
      cu: '🇨🇺',
      pe: '🇵🇪',
      cl: '🇨🇱',
      mx: '🇲🇽',
      pr: '🇵🇷',
      ar: '🇦🇷',
      bo: '🇧🇴',
      co: '🇨🇴',
      cr: '🇨🇷',
      do: '🇩🇴',
      ec: '🇪🇨',
      sv: '🇸🇻',
      gq: '🇬🇶',
      gt: '🇬🇹',
      hn: '🇭🇳',
      ni: '🇳🇮',
      pa: '🇵🇦',
      py: '🇵🇾',
      uy: '🇺🇾',
      ve: '🇻🇪',
      pt: '🇵🇹',
      br: '🇧🇷',
      ao: '🇦🇴',
      mz: '🇲🇿',
      gw: '🇬🇼',
      st: '🇸🇹',
      cv: '🇨🇻',
      fr: '🇫🇷',
      be: '🇧🇪',
      be: '🇧🇪',
      be: '🇧🇪',
      cd: '🇨🇩',
      cg: '🇨🇬',
      ko: '🇨🇮',
      ko: '🇲🇬',
      cm: '🇨🇲',
      cm: '🇨🇲',
      bf: '🇧🇫',
      ne: '🇳🇪',
      ml: '🇲🇱',
      sn: '🇸🇳',
      ht: '🇭🇹',
      bj: '🇧🇯'
    }
    if (!s || !s.length) return s
    if ((s[0]==='I' || s[0]==='S') && s[1]>='A') { // argument id
      const flag = flagMap[s.substring(1, 3).toLowerCase()]
      return flag ? `${s[0]}${flag}${s.substring(3)}` : s
    } else if (s[0]>='A') { // topic id
      const flag = flagMap[s.substring(0, 2).toLowerCase()]
      return flag ? `${s.substring(2)}${flag}` : s
    }
    return s
  }

  update() {
    const root = this.element('argument-card')
    if (this.isConnected && root) {
      root.classList.toggle('idiot', !this.neutral && this.idiot)
      root.classList.toggle('sheep', !this.neutral && !this.idiot)
      root.classList.toggle('mirrored', this.mirrored)
      this.element('wildcard').classList.toggle('hidden', !this.wildcard)
      this.element('spellcheck').classList.toggle('hidden', !this.spellcheck)
      this.element('card').innerHTML = this.flagMapped(this.card)
      this.element('card').classList.toggle('hidden', this.neutral)
      this.element('topic-icon').innerHTML = this.flagMapped(this.topicId ? this.topicId.substring(1) : '?')
      this.element('topic-name').innerHTML = this.topic
      this.element('side-title').innerHTML = `${this.wildcard?'✱ ':''}${this.title}`
    }
  }
}

customElements.define('argument-card', ArgumentCard)
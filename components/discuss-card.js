const discussCardTemplate = document.createElement('template')
discussCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #discuss-card {
      --red: #f72d5d;
      --blue: #2d60f6;
      --sidebar-width: 12%;
      --watermark-size: 50%;
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: radial-gradient(
        circle,
        var(--blue) 0%,
        var(--blue) 40%,
        var(--red) 100%
      );
      user-select: none;
    }

    #discuss-card.idiot {
    background: radial-gradient(
        circle,
        var(--red) 0%,
        var(--red) 40%,
        var(--blue) 100%
      );
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
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
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

    #topic-icon {
      position: absolute;
      width: calc(1.3 * var(--sidebar-width));
      height: calc(1.3 * var(--sidebar-width))
      top: 0;
      left: 0;
      font-family: 'HVD Crocodile', Helvetica, 'NotoColorEmojiLimited';
      font-weight: 600;
      font-stretch: condensed;
      font-size: calc(8 * var(--cavg));
      text-align: center;
      margin-top: 0;
      margin-bottom: 0;
      color: var(--blue);
      -webkit-text-stroke: calc(0.15 * var(--cavg)) white;
    }

    .idiot #topic-icon {
      color: var(--red);
    }

    .mirrored #topic-icon {
      right: 0;
      left: auto;
    }

    #phrase {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
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
      -webkit-hyphens: auto;
      hyphens: auto;
      padding: calc(7 * var(--cavg));
      box-sizing: border-box;
    }

    #phrase b {
      -webkit-text-stroke: calc(0.15 * var(--cavg)) white;
      color: var(--blue);
    }

    .idiot #phrase b {
      color: var(--red);
    }

    .mirrored #phrase {
      left: 0;
      right: var(--sidebar-width);
    }

    #phrase span {
      max-width: 100%;
      display: inline;
      text-align: center;
    }

    #phrase > span::before {
      content: open-quote;
    }

    #phrase > span::after {
      content: close-quote;
    }

    #description {
      position: absolute;
      bottom: 0; 
      font-family: 'Open Sans', Helvetica, sans-serif;
      padding: calc(5 * var(--cavg));
      padding-bottom: calc(16 * var(--cavg));
      font-size: calc(3 * var(--cavg));
      font-style: italic;
      color: white;
      opacity: 0.4;
    }

    #side-phrase {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
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
      text-align: left;
      overflow: hidden;
      white-space: nowrap;
      transform: rotate(-90deg);
      transform-origin: top left;
    }

    .mirrored #side-phrase {
      left: calc(100% - var(--sidebar-width));
    }
  </style>
  <div id="discuss-card">
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="topic-icon"></div>
    <div id="phrase"><span><span class="phrase"></span></span><span id="description"></span></div>
    <div id="side-phrase"><span class="phrase"></span></div>
    <div id="normal">Normal</div>
  </div>
`

class DiscussCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['idiot', 'topicId', 'mirrored']

  element(id) { return this.shadowRoot.getElementById(id) }

  get topicId() {
    return this.getAttribute('topicId')
  }

  get phrase() {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
  }

  get description() {
    return this.querySelector('p') ? this.querySelector('p').innerHTML : ''
  }

  get idiot() {
    return this.hasAttribute('idiot')
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback() {
    this.update()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(discussCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
    this.element('side-phrase').innerHTML = this.element('phrase').innerHTML // copy phrases
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    const langObserver = new MutationObserver(() => this.update())
    langObserver.observe(document, { attributes: true, attributeFilter: ['lang'] })
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
      da: '🇩🇰',
      li: '🇱🇮',
      it: '🇮🇹',
      sm: '🇸🇲',
      va: '🇻🇦',
      us: '🇺🇸',
      gb: '🇬🇧',
      au: '🇦🇺',
      nz: '🇳🇿',
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
      nl: '🇳🇱',
      be: '🇧🇪',
      cd: '🇨🇩',
      cg: '🇨🇬',
      ko: '🇲🇬',
      cm: '🇨🇲',
      bf: '🇧🇫',
      ne: '🇳🇪',
      ml: '🇲🇱',
      sn: '🇸🇳',
      ht: '🇭🇹',
      bj: '🇧🇯'
    }
    if (!s || !s.length) return s
    if (s[0]>='A') {
      const flag = flagMap[s.substring(0, 2).toLowerCase()]
      return flag ? `${s.substring(2)}${flag}` : s
    }
    return s
  }

  update() {
    const root = this.element('discuss-card')
    if (this.isConnected && root) {
      this.element('topic-icon').innerHTML = this.flagMapped(this.topicId ? this.topicId.substring(1) : '')
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      Array.from(root.querySelectorAll('.phrase')).forEach(node => node.innerHTML = this.phrase)
      this.element('description').innerHTML = this.description
    }
  }
}

customElements.define('discuss-card', DiscussCard)

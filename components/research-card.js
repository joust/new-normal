const researchCardTemplate = document.createElement('template')
researchCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #research-card {
      --sidebar-width: 12%;
      --watermark-size: 50%;
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
    background: linear-gradient(
        30deg,
        rgba(255, 0, 0, 1) 0%,
        rgba(255, 154, 0, 1) 10%,
        rgba(208, 222, 33, 1) 20%,
        rgba(79, 220, 74, 1) 30%,
        rgba(63, 218, 216, 1) 40%,
        rgba(47, 201, 226, 1) 50%,
        rgba(28, 127, 238, 1) 60%,
        rgba(95, 21, 242, 1) 70%,
        rgba(186, 12, 248, 1) 80%,
        rgba(251, 7, 217, 1) 90%,
        rgba(255, 0, 0, 1) 100%
      );
      user-select: none;
    }

    #research-card.idiot {
    background: linear-gradient(
        30deg,
        rgba(28, 127, 238, 1) 0%,
        rgba(95, 21, 242, 1) 10%,
        rgba(186, 12, 248, 1) 20%,
        rgba(251, 7, 217, 1) 30%,
        rgba(255, 0, 0, 1) 40%,
        rgba(255, 154, 0, 1) 50%,
        rgba(208, 222, 33, 1) 60%,
        rgba(79, 220, 74, 1) 70%,
        rgba(63, 218, 216, 1) 80%,
        rgba(47, 201, 226, 1) 90%,
        rgba(28, 127, 238, 1) 100%
      );
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

    #phrase {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica;
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
      padding: calc(7 * var(--cavg));
      box-sizing: border-box;
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

    #side-phrase {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica;
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
      transform: rotate(-90deg);
      transform-origin: top left;
    }

    .mirrored #side-phrase {
      left: calc(100% - var(--sidebar-width));
    }
  </style>
  <div id="research-card">
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="phrase"><span><span class="phrase"></span></span></div>
    <div id="side-phrase"><span class="phrase"></span></div>
    <div id="normal">Normal</div>
  </div>
`

class ResearchCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['idiot', 'mirrored']
  static phrase = {
    sheep: {
      da: 'Lad mig google det et øjeblik!',
      de: 'Lass mich das kurz googlen!',
      en: 'Let me google this for us!',
      es: '¡Déjeme buscar en Google por un momento!',
      fr: 'Laisse-moi faire une recherche rapide sur Google !',
      it: 'Lasciatemi cercare su Google!',
      pl: 'Pozwól, że przez chwilę pogoogluję!',
      pt: 'Deixe-me ir ao Google por um momento!',
      'pt-br': 'Deixe-me ir ao Google por um momento!'
    },
    idiot: {
      da: 'Lad mig lige tale med Telegram!',
      de: 'Lass mich kurz auf Telegram!',
      en: 'Let me just find this on Telegram!',
      es: '¡Dejadme un momento en Telegram!',
      fr: 'Laisse-moi un peu sur Telegram !',
      it: 'Lasciatemi un attimo su Telegram!',
      pl: 'Daj mi chwilkę na Telegramie!',
      pt: 'Dê-me um momento no Telegrama!',
      'pr-br': 'Dê-me um momento no Telegrama!'
    }
  }

  element(id) { return this.shadowRoot.getElementById(id) }

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
    this.shadowRoot.appendChild(researchCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
    this.element('side-phrase').innerHTML = this.element('phrase').innerHTML // copy phrases
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
    const root = this.element('research-card')
    if (this.isConnected && root) {
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      const type = this.idiot ? 'idiot' : 'sheep'
      const key = Object.keys(ResearchCard.phrase[type]).find(p => this.lang.startsWith(p)) || 'de'
      const phrase = ResearchCard.phrase[type][key]
      Array.from(root.querySelectorAll('.phrase')).forEach(node => node.innerHTML = phrase)
    }
  }
}

customElements.define('research-card', ResearchCard)
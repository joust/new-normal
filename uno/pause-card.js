const pauseCardTemplate = document.createElement('template')
pauseCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #pause-card {
      --red: #f72d5d;
      --blue: #2d60f6;
      --blue0: lightblue;
      --blue1: cornflowerblue;
      --sidebar-width: 12%;
      --watermark-size: 50%;
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: linear-gradient(30deg, var(--blue0) 0%, var(--blue1) 100%);
      user-select: none;
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
      color: var(--blue);
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

    .idiot #phrase {
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

    #side-phrase {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica;
      font-size: calc(6 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      color: var(--blue);
      opacity: 0.4;
      padding-left: 2%;
      top: 100%;
      left: 0;
      height: calc(15 * var(--cw));
      width: calc(85 * var(--ch));
      transform: rotate(-90deg);
      transform-origin: top left;
    }

    .idiot #phrase {
      color: var(--red);
    }

    .mirrored #side-phrase {
      left: calc(100% - var(--sidebar-width));
    }
  </style>
  <div id="pause-card">
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="phrase"><span><span class="phrase"></span></span></div>
    <div id="side-phrase"><span class="phrase"></span></div>
    <div id="normal">Normal</div>
  </div>
`

class PauseCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['idiot', 'mirrored']
  static phrase = {
    sheep: {
      da: 'Vær venlig også at sige noget!',
      de: 'Sag\' doch bitte auch mal was!',
      en: 'Please say something too!',
      es: 'Por favor, ¡diga algo también!',
      fr: 'Dis quelque chose !',
      it: 'Per favore, dite qualcosa anche voi!',
      pl: 'Proszę też coś powiedzieć!',
      pt: 'Por favor, diga algo também!',
      'pt-br': 'Por favor, diga algo também!'
    },
    idiot: {
      da: 'Hjælp mig her, tak!',
      de: 'Hilf mir doch mal bitte, Mensch!',
      en: 'Help me out here, please!',
      es: '¡Ayúdenme, por favor!',
      fr: 'Aide-moi, s\'il te plaît !',
      it: 'Aiutatemi, per favore!',
      pl: 'Pomóż mi tutaj, proszę!',
      pt: 'Ajude-me, por favor!',
      'pr-br': 'Ajude-me, por favor!'
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
    this.shadowRoot.appendChild(pauseCardTemplate.content.cloneNode(true))
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
    const root = this.element('pause-card')
    if (this.isConnected && root) {
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      const type = this.idiot ? 'idiot' : 'sheep'
      const key = Object.keys(PauseCard.phrase[type]).find(p => p.startsWith(this.lang)) || 'de'
      const phrase = PauseCard.phrase[type][key]
      Array.from(root.querySelectorAll('.phrase')).forEach(node => node.innerHTML = phrase)
    }
  }
}

customElements.define('pause-card', PauseCard)
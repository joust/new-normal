const banishCardTemplate = document.createElement('template')
banishCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #banish-card {
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
        #222 0%,
        #222 50%,
        var(--blue) 100%
      );
      user-select: none;
    }

    #banish-card.idiot {
      background: radial-gradient(
        circle,
        #222 0%,
        #222 50%,
        var(--red) 100%
      );
    }

    #icon {
      position: absolute;
      width: calc(1.3 * var(--sidebar-width));
      height: calc(1.3 * var(--sidebar-width))
      top: 0;
      left: 0;
      font-size: calc(8 * var(--cavg));
      text-align: center;
      color: white;
      opacity: .8;
    }

    #icon:before {
      content: '🗑️';
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

    #phrase {
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

    #description {
      position: absolute;
      bottom: 0; 
      font-family: 'Open Sans', Helvetica, sans-serif;
      padding: calc(5 * var(--cavg));
      padding-bottom: calc(16 * var(--cavg));
      font-size: calc(3 * var(--cavg));
      font-style: italic;
      color: var(--blue);
      opacity: 0.4;
    }

    .idiot #description {
      color: var(--red);
    }

    #phrase span.quoted {
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc(7 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      max-width: 100%;
      display: inline;
      text-align: center;
    }

    .quoted::before {
      content: open-quote;
    }

    .quoted::after {
      content: close-quote;
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
      text-overflow: ellipsis;
      text-align: left;
      overflow: hidden;
      white-space: nowrap;
      height: calc(15 * var(--cw));
      width: calc(85 * var(--ch));
      transform: rotate(-90deg);
      transform-origin: top left;
      -webkit-text-stroke: calc(0.15 * var(--cavg)) white;
    }

    .mirrored #side-phrase {
      left: calc(100% - var(--sidebar-width));
    }
  </style>
  <div id="banish-card">
    <div id="icon"></div>
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="phrase"><span class="quoted"><span class="phrase"></span></span><span id="description"></span></div>
    <div id="side-phrase"><span class="phrase"></span></div>
    <div id="normal">Normal</div>
  </div>
`

class BanishCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['idiot', 'mirrored']

  static phrase = {
    da: 'Lad os ikke tale mere om det!',
    de: 'Lass uns da nicht mehr drüber sprechen!',
    en: 'Let\'s not talk about that anymore!',
    nl: 'Laten we er niet meer over praten!',
    es: '¡No hablemos más del tema!',
    fr: 'Ne parlons plus de ça !',
    it: 'Non parliamone più!',
    pl: 'Nie mówmy już o tym!',
    pt: 'Não falemos mais sobre isto!',
    'pt-br': 'Não falemos mais sobre isto!'
  }

  static description = {
    da: 'Bortvis alle argumenter om det emne fra spillet',
    de: 'Alle Argumente zum Thema aus dem Spiel verbannen',
    en: 'Banish all arguments on the topic from the game',
    nl: 'Alle argumenten over dit onderwerp uit het spel bannen',
    es: 'Desterrar del juego todas las discusiones sobre el tema',
    fr: 'Bannir du jeu tous les arguments sur le thème',
    it: 'Bandire dal gioco tutte le discussioni sull\'argomento',
    pl: 'Wyeliminowanie z gry wszystkich argumentów na temat',
    pt: 'Banir do jogo todos os argumentos sobre o tema',
    'pt-br': 'Banir do jogo todos os argumentos sobre o tema'
  }

  element(id) { return this.shadowRoot.getElementById(id) }

  get idiot() {
    return this.hasAttribute('idiot')
  }

  get phrase() {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
  }

  get description() {
    return this.querySelector('p') ? this.querySelector('p').innerHTML : ''
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback() {
    this.update()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(banishCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
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

  update() {
    const root = this.element('banish-card')
    if (this.isConnected && root) {
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      Array.from(root.querySelectorAll('.phrase')).forEach(node => node.innerHTML = this.phrase)
      const dkey = Object.keys(BanishCard.description).find(p => this.lang.startsWith(p)) || 'de'
      this.element('description').innerHTML = this.description[dkey]
    }
  }
}

customElements.define('banish-card', BanishCard)

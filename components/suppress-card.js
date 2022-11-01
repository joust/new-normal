const suppressCardTemplate = document.createElement('template')
suppressCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #suppress-card {
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

    #suppress-card.idiot {
      background: radial-gradient(
        circle,
        #222 0%,
        #222 50%,
        var(--red) 100%
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

    #description {
      position: absolute;
      bottom: 0; 
      font-family: 'Open Sans', Helvetica;
      padding: calc(5 * var(--cavg));;
      padding-bottom: calc(15 * var(--cavg));;
      font-size: calc(3 * var(--cavg));
      font-style: italic;
      color: var(--blue);
      opacity: 0.4;
    }

    .idiot #description {
      color: var(--red);
    }

    #phrase span.quoted {
      font-family: 'HVD Crocodile', Helvetica;
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
      font-family: 'HVD Crocodile', Helvetica;
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
  <div id="suppress-card">
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="phrase"><span class="quoted"><span class="phrase"></span></span><span id="description"></span></div>
    <div id="side-phrase"><span class="phrase"></span></div>
    <div id="normal">Normal</div>
  </div>
`

class SuppressCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['idiot', 'mirrored']

  static phrase = {
    da: 'Lad os ikke tale mere om det!',
    de: 'Lass uns da nicht mehr drüber sprechen!',
    en: 'Let\'s not talk about that anymore!',
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

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback() {
    this.update()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(suppressCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    const langObserver = new MutationObserver(() => this.update())
    langObserver.observe(document, { attributes: true, attributeFilter: ['lang'], subtree: true })
    this.update()
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cw', `${cw}px`)
    this.style.setProperty('--ch', `${ch}px`)
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }

  update() {
    const root = this.element('suppress-card')
    if (this.isConnected && root) {
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      const key = Object.keys(SuppressCard.phrase).find(p => p.startsWith(this.lang)) || 'de'
      const phrase = SuppressCard.phrase[key]
      Array.from(root.querySelectorAll('.phrase')).forEach(node => node.innerHTML = phrase)
      const dkey = Object.keys(SuppressCard.description).find(p => p.startsWith(this.lang)) || 'de'
      this.element('description').innerHTML = SuppressCard.description[dkey]
    }
  }
}

customElements.define('suppress-card', SuppressCard)
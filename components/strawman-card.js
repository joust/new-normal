const strawmanCardTemplate = document.createElement('template')
strawmanCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #strawman-card {
      --red: #f72d5d;
      --blue: #2d60f6;
      --yellow: yellow;
      --orange: orange;
      --sidebar-width: 12%;
      --watermark-size: 50%;
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: linear-gradient(30deg, var(--yellow) 0%, var(--orange) 100%);
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
      content: '🤔';
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

     #fallacy {
      font-family: 'Open Sans', Helvetica;
      font-size: calc(4 * var(--cavg));
      font-weight: 300;
      color: white;
    }

    #fallacy::after {
      content: 'Strawman';
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
      color: var(--blue);
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
    }

    .idiot #side-phrase {
      color: var(--red);
    }

    .mirrored #side-phrase {
      left: calc(100% - var(--sidebar-width));
    }
  </style>
  <div id="strawman-card">
    <div id="icon"></div>
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="phrase"><span id="fallacy"></span><span class="quoted"><span class="phrase"></span></span><span id="description"></span></div>
    <div id="side-phrase"><span class="phrase"></span></div>
    <div id="normal">Normal</div>
  </div>
`

class StrawmanCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  static observedAttributes = ['idiot', 'mirrored']

  static phrase = {
    da: 'Lad mig lægge det her i din mund!',
    de: 'Lass mich Dir das in den Mund legen!',	
    en: 'Let me put this in your mouth!',
    nl: 'Laat me dit in je mond steken!',
    es: '¡Déjame poner esto en tu boca!',
    fr: 'Laisse-moi te mettre ça en bouche !',
    it: 'Lasciate che ve lo metta in bocca!',
    pl: 'Pozwól, że włożę ci to do ust!',
    pt: 'Deixa-me pôr-te isto na boca!',
    'pt-br': 'Deixe-me pôr isto em sua boca!'
  }

  static description = {
    da: 'At pådutte den anden side et argument, der passer til mine kort',
    de: 'Der Gegenseite ein zu meinen Karten passendes Argument unterschieben',
    en: 'Foist an argument on the other side that fits my cards',
    nl: 'Om de andere kant een argument op te dringen dat bij mijn kaarten past',
    es: 'Para endilgar un argumento a la otra parte que se ajuste a mis cartas',
    fr: 'Donner à l\'autre partie un argument qui correspond à mes cartes',
    it: 'Per imporre all\'altra parte un\'argomentazione che si adatti alle mie carte',
    pl: 'Aby przedstawić drugiej stronie argument, który pasuje do moich kart',
    pt: 'Impor uma discussão do outro lado que se encaixa nas minhas cartas',
    'pt-br': 'Impor uma discussão do outro lado que se encaixa nas minhas cartas'
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
    this.shadowRoot.appendChild(strawmanCardTemplate.content.cloneNode(true))
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
    const root = this.element('strawman-card')
    if (this.isConnected && root) {
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      const key = Object.keys(StrawmanCard.phrase).find(p => this.lang.startsWith(p)) || 'de'
      const phrase = StrawmanCard.phrase[key]
      Array.from(root.querySelectorAll('.phrase')).forEach(node => node.innerHTML = phrase)
      const dkey = Object.keys(StrawmanCard.description).find(p => this.lang.startsWith(p)) || 'de'
      this.element('description').innerHTML = StrawmanCard.description[dkey]
    }
  }
}

customElements.define('strawman-card', StrawmanCard)
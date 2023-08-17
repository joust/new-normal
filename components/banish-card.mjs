import { BaseCard } from './base-card.mjs'

window.customElements.define('banish-card', class BanishCard extends BaseCard {
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

  get idiot () {
    return this.hasAttribute('idiot')
  }

  get phrase () {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
  }

  get mirrored () {
    return this.hasAttribute('mirrored')
  }

  get css () {
    return `
    ${super.css}
    #banish-card {
      background: var(--sheep-banish-background);
    }

    #banish-card.idiot {
      background: var(--idiot-banish-background);
    }

    #icon:before {
      content: '🗑️';
    }

    #phrase {
      position: absolute;
      color: var(--sheep-banish-color);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      width: calc(100% - var(--sidebar-width));
      left: var(--sidebar-width);
      height: 100%;
      -webkit-hyphens: auto;
      hyphens: auto;
      padding: calc((7cqw + 7cqh) / var(--avg));
      box-sizing: border-box;
    }

    .idiot #phrase {
      color: var(--idiot-banish-color);
    }

    .mirrored #phrase {
      left: 0;
      right: var(--sidebar-width);
    }

    #description {
      color: var(--sheep-banish-color);
      opacity: 0.4;
    }

    .idiot #description {
      color: var(--idiot-banish-color);
    }

    #phrase span.quoted {
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc((7cqw + 7cqh) / var(--avg));
      font-weight: 600;
      font-stretch: condensed;
      max-width: 100%;
      display: inline;
      text-align: center;
    }

    #side {
      -webkit-text-stroke: calc((0.15cqw + 0.15cqh) / var(--avg)) white;
    }
  `
  }

  get html () {
    return `
    <div id="banish-card" class="card">
      <div id="icon"></div>
      <div id="watermark"></div>
      <div id="new">New</div>
      <div id="phrase"><span class="quoted"><span class="phrase"></span></span><span id="description"></span></div>
      <div id="side"><span class="phrase"></span></div>
      <div id="normal">Normal</div>
    </div>
  `
  }

  attributeChangedCallback () {
    this.update()
  }

  connectedCallback () {
    super.connectedCallback()
    const langObserver = new MutationObserver(() => this.update())
    langObserver.observe(document, { attributes: true, attributeFilter: ['lang'] })
    this.update()
  }

  update () {
    if (this.shadowRoot && this.isConnected) {
      const root = this.element('banish-card')
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      Array.from(root.querySelectorAll('.phrase')).forEach(node => (node.innerHTML = this.phrase))
      const dkey = Object.keys(BanishCard.description).find(p => this.lang.startsWith(p)) || 'de'
      this.element('description').innerHTML = BanishCard.description[dkey]
    }
  }
})

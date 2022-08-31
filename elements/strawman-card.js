const strawmanCardTemplate = document.createElement('template')
strawmanCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
    }

    #strawman-card {
      --grey: grey;
      --lightgrey: lightgrey;
      --sidebar-width: 12%;
      --watermark-size: 50%;
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
      background: linear-gradient(30deg, var(--grey) 0%, var(--lightgrey) 100%);
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
      font-family: 'HVD Crocodile';
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

     #fallacy {
      font-family: 'Open Sans', Helvetica;
      font-size: calc(4 * var(--cavg));
    }

    #fallacy::after {
      content: 'Strawman';
    }

    #phrase span.quoted {
      font-family: 'HVD Crocodile';
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
      content: '!' close-quote;
    }

    #side-phrase {
      position: absolute;
      font-family: 'HVD Crocodile';
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

    #side-phrase::after {
      content: '!';
    }

    .mirrored #side-phrase {
      left: calc(100% - var(--sidebar-width));
    }

    :lang(da) .phrase::after {
      content: 'Lad mig lægge det her i din mund';
    }

    :lang(de) .phrase::after {
      content: 'Lass mich Dir das in den Mund legen';
    }

    :lang(en) .phrase::after {
      content: 'Let me put this in your mouth';
    }

    :lang(es) .phrase::after {
      content: 'Déjame poner esto en tu boca';
    }

    :lang(fr) .phrase::after {
      content: 'Laisse-moi te mettre ça en bouche';
    }

    :lang(it) .phrase::after {
      content: 'Lasciate che ve lo metta in bocca';
    }

    :lang(pl) .phrase::after {
      content: 'Pozwól, że włożę ci to do ust';
    }

    :lang(pt) .phrase::after {
      content: 'Deixa-me pôr-te isto na boca';
    }

    :lang(pt-br) .phrase::after {
      content: 'Deixe-me pôr isto em sua boca';
    }

  </style>
  <div id="strawman-card">
    <div id="watermark"></div>
    <div id="new">New</div>
    <div id="phrase"><span id="fallacy"></span><span class="quoted"><span class="phrase"></span></span></div>
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

  element(id) { return this.shadowRoot.getElementById(id) }

  get idiot() {
    return this.hasAttribute('idiot')
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.update()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(strawmanCardTemplate.content.cloneNode(true))
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
    if (this.isConnected && this.element('strawman-card')) {
      this.element('strawman-card').classList.toggle('mirrored', this.mirrored)
      this.element('strawman-card').classList.toggle('idiot', this.idiot)
    }
  }
}

customElements.define('strawman-card', StrawmanCard)
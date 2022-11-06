const gameCardTemplate = document.createElement('template')
gameCardTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
      overflow: hidden;
      position: relative;
    }

    #card {
      width: 100%;
      height: 100%;
    }

    #previous, #next {
      position: absolute;
      font-size: calc(7 * var(--cavg));
      color: lightgrey;
      opacity: 0;
      right: 0;
      cursor: pointer;
      width: calc(7 * var(--cavg));
      text-align: center;
      display: none;
    }

    #previous {
      top: 0;
    }

    #next {
      bottom: 0;
    }

    .hidden {
      display: none;
    }
  </style>
  <div id="previous">▲</div>
  <div id="next">▼</div>
`

const ALTERNATIVES_STEP = 200

class GameCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.altIndex = 0
  }

  static observedAttributes = ['card', 'alt', 'alternatives', 'mirrored']
  static contentRootSelector = '#content'

  element(id) { return this.shadowRoot.getElementById(id) }

  get card() {
    return this.getAttribute('card')
  }

  get alt() {
    return this.getAttribute('alt')
  }

  get idOnly() {
    const card = this.alt || this.card
    return (this.hasTopic ? card.split(':')[1] : card).replace('*', '')
  }

  get isWildcard() {
    return this.card.endsWith('*')
  }

  get hasTopic() {
    const card = this.alt || this.card
    return card.includes(':')
  }

  get idiot() {
    return this.card.includes('I')
  }

  get topic() {
    const card  = this.alt || this.card
    return this.hasTopic ? card.split(':')[0] : ''
  }

  get alternatives() {
    return this.hasAttribute('alternatives') ? this.getAttribute('alternatives').split(',') : [this.card]
  }

  get mirrored() {
    return this.hasAttribute('mirrored')
  }

  attributeChangedCallback(name) {
    if (this.isConnected) {
      if (name==='card' || name==='alt') this.updateCard()
      if (name==='mirrored') this.updateMirrored()
      if (name==='alternatives') this.updateAlternatives()
    }
  }

  connectedCallback() {
    this.shadowRoot.appendChild(gameCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
    const template = document.createElement('template')
    this.shadowRoot.appendChild(template.content)
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    this.element('previous').insertAdjacentHTML('beforeBegin', this.getCardElement())

    this.element('previous').onlick = event => this.updateAltIndex(-1) // TODO not working
    this.element('next').onlick = event => this.updateAltIndex(1) // TODO not working
    this.onwheel = event => this.updateAltIndex(event.deltaY)
  }

  updateAltIndex(delta) {
    this.altIndex += delta / ALTERNATIVES_STEP
    if (this.altIndex < 0) this.altIndex += this.alternatives.length
    if (this.altIndex >= this.alternatives.length) this.altIndex -= this.alternatives.length
    const index = Math.floor(this.altIndex)

    this.setAttribute('alt', this.alternatives[index]+(this.isWildcard?'*':''))
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }

  updateCard() {
    const card = this.element('card')
    if (this.isConnected && card) {
      card.insertAdjacentHTML('beforeBegin', this.getCardElement())
      this.shadowRoot.removeChild(card)
    }
  }

  updateMirrored() {
    const previous = this.element('previous')
    const next = this.element('next')
    const card = this.element('card')
    if (previous) previous.classList.toggle('mirrored', this.mirrored)
    if (next) next.classList.toggle('mirrored', this.mirrored)
    if (card) card.toggleAttribute('mirrored', this.mirrored)
  }

  updateAlternatives() {
    const card = this.alt || this.card
    this.altIndex = this.alternatives.indexOf(card.replace('*', ''))
    if (this.altIndex<0) { this.setAttribute('alt', this.alternatives[0]); this.altIndex = 0 }
    const previous = this.element('previous')
    const next = this.element('next')
    if (previous) previous.classList.toggle('hidden', this.alternatives.length===1)
    if (next) next.classList.toggle('hidden', this.alternatives.length===1)
  }

  /**
   * generates an archive.is mirror anchor node for the given node 
   *
   * @param {HTMLElement} a the anchor node to mirror
   */
   mirrorNode(a) {
    const mirror = a.cloneNode(true)
    mirror.href = `https://archive.is/${a.href}` 
    mirror.firstChild.textContent = 'Mirror'
    return mirror
  }

  replaceStatement(lang, content) {
    const from1 = {
      de: 'Die sagen<i> doch allen Ernstes</i>',
      en: 'They say<i> in all seriousness</i>',
      fr: 'Ils disent<i> en toute sincérité</i>',
      es: 'Dicen<i> con toda seriedad</i>',
      it: 'Dicono<i> in tutta serietà</i>',
      da: 'De siger<i> med al alvor</i>',
      pl: 'Twierdzą<i> z całą powagą</i>',
      pt: 'Dizem<i> com toda a seriedade</i>',
      'pt-br': 'Dizem<i> com toda a seriedade</i>'
    }
    const to1 = {
      de: 'Ich bin bei denen, die sagen',
      en: 'I am with those who say',
      fr: 'Je suis avec ceux qui disent',
      es: 'Estoy con quienes dicen',
      it: 'Sono d\'accordo con chi dice',
      da: 'Jeg er enig med dem, der siger',
      pl: 'Jestem z tymi, którzy twierdzą',
      pt: 'Estou com aqueles que dizem',
      'pt-br': 'Estou com aqueles que dizem'
    }
    const from2 = {
      de: 'Die fragen<i> doch allen Ernstes</i>',
      en: 'They ask<i> in all seriousness</i>',
      fr: 'Ils demandent<i> en toute sincérité</i>',
      es: 'Preguntan<i> con toda seriedad</i>',
      it: 'Chiedono<i> in tutta serietà</i>',
      da: 'De spørger<i> med al alvor</i>',
      pl: 'Pytają<i> z całą powagą</i>',
      pt: 'Pergunta<i> com toda a seriedade</i>',
      'pt-br': 'Pergunta<i> com toda a seriedade</i>'

    }
    const to2 = {
      de: 'Ich bin bei denen, die fragen',
      en: 'I am with those who ask',
      fr: 'Je suis avec ceux qui demandent',
      es: 'Estoy con quienes preguntan',
      it: 'Sono d\'accordo con chi chiedono',
      da: 'Jeg er enig med dem, der spørger',
      pl: 'Jestem z tymi, którzy pytają',
      pt: 'Estou com aqueles que perguntam',
      'pt-br': 'Estou com aqueles que perguntam'
    }
    return content.replaceAll(from1[lang], to1[lang]).replaceAll(from2[lang], to2[lang])
  }

  getSourcesHTML(id) {
    const sources = document.querySelector(`${GameCard.contentRootSelector} > .sources`)
    const links = Array.from(sources.querySelectorAll(`a.${id}`))
    if (links.length > 0) {
      const q = elementWithKids('q', [
//        a.querySelector('h2').cloneNode(true),
        elementWithKids('ul', links.map(
        s => elementWithKids('li', [
          s.cloneNode(true), ' (', this.mirrorNode(s), ')'
        ])))
      ])
      return q.outerHTML
    }
    return undefined
  }

  cardWithSources(id, title, front) {
    const sources = this.getSourcesHTML(id)
    if (sources) {
      const back = `<sources-back slot="back"><h2>${title}</h2>${sources}</sources-back>`
      front = front.replace(' ', ' slot="front" ')
      return `<flip-card id="card">${front}${back}</flip-card>`
    } else
      return front.replace(' ', ' id="card" ')
  }
                                                  
  getCardElement() {
    const data = document.querySelector(`${GameCard.contentRootSelector} > #${this.lang} a[id="${this.idOnly}"]`)
    const title = data ? data.querySelector('h2').innerHTML : ''
    const type = this.idiot ? 'idiot' : ''
    const mirrored = this.mirrored ? 'mirrored' : ''
    const wildcard = this.isWildcard ? 'wildcard' : ''
    switch (this.idOnly[0]) {
      case 'L': return `<label-card id="card" ${type} ${mirrored} card="${this.card}">${data ?data.outerHTML : ''}</label-card>`
      case 'A': return this.cardWithSources(this.idOnly, title, `<appeal-to-card ${type} ${mirrored} type="${data.type}" card="${this.card}">${data ? data.outerHTML : ''}</appeal-to-card>`)
      case 'F': return `<fallacy-card id="card" ${type} ${mirrored} card="${this.card}">${data ?data.outerHTML : ''}</fallacy-card>`
      case 'N': return `<strawman-card id="card" ${type} ${mirrored}></strawman-card>`
      case 'R': return `<research-card id="card" ${type} ${mirrored}></research-card>`
      case 'P': return `<pause-card id="card" ${type} ${mirrored}></pause-card>`
      case 'B': return `<banish-card id="card" ${type} ${mirrored}></banish-card>`
      default: // argument id and discuss id will have a topic
        const topicData = this.topic && document.querySelector(`${GameCard.contentRootSelector} > #${this.lang} a[id="${this.topic}"]`)
        const topic = topicData ? topicData.firstElementChild.innerHTML : ''
        if (this.idOnly.startsWith('D'))
          return `<discuss-card id="card" ${type} ${mirrored} topicId="${this.topic}" topic="${topic}"></discuss-card>`
        else {
          const html = data ? this.replaceStatement(this.lang, data.innerHTML) : ''
          return this.cardWithSources(this.idOnly, title, `<argument-card ${type} ${mirrored} ${wildcard} card="${this.idOnly}" topicId="${this.topic}" topic="${topic}">${html}</argument-card>`)
        }
    }
  }
}

customElements.define('game-card', GameCard)
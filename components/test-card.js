// idea from: https://codepen.io/suez/pen/MaeVBy
const testCardTemplate = document.createElement('template')
testCardTemplate.innerHTML = `
  <style>
   :host {
      display: inline-block;
      overflow: visible;
      position: relative;
    }

    #card, #reject, #approve {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: calc(2 * var(--cavg));
    }

    .reset {
      transition: transform 0.3s;
      transform: translateX(0) !important;
      z-index: 0;
    }

    #approve.reset, #reject.reset {
      transition: opacity 0.3s;
      opacity: 0 !important;
    }

    .inactive {
      transition: transform 0.3s;
    }

    .to-left {
      transform: translateX(-30rem) !important;
    }

    .to-right {
      transform: translate(30rem) !important;
    }

    #approve, #reject {
      opacity: 0;
    }

    #approve:before, #reject:before {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      width: 2rem;
      height: 2rem;
      margin-left: -1rem;
      color: #fff;
      border-radius: 50%;
      box-shadow: -2rem -3rem #fff, 2rem -3rem #fff;
    }

    #approve:after, #reject:after {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      width: 3rem;
      height: 1rem;
      margin-left: -2rem;
      border: 0.6rem solid #fff;
    }
    
    #reject:after {
      border-bottom: none;
      border-top-left-radius: 1.5rem;
      border-top-right-radius: 1.5rem;
    }

    #approve:after {
      border-top: none;
      border-bottom-left-radius: 1.5rem;
      border-bottom-right-radius: 1.5rem;
    }

    #reject {
      background: var(--reject);
    }

    #approve {
      background: var(--approve);
    }

  </style>
  <div id="approve"></div>
  <div id="reject"></div>
`

class TestCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.pullDeltaX = 0
    this.animating = false
    this.decisionVal = 150
  }

  static observedAttributes = ['card']
  static contentRootSelector = '#content'

  element(id) { return this.shadowRoot.getElementById(id) }

  get card() {
    return this.getAttribute('card')
  }

  get idOnly() {
    return (this.hasTopic ? this.card.split(':')[1] : this.card)
  }

  get hasTopic() {
    return this.card.includes(':')
  }

  get idiot() {
    return this.card.includes('I')
  }

  get topic() {
    return this.hasTopic ? this.card.split(':')[0] : ''
  }

  attributeChangedCallback() {
    this.updateCard()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(testCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
    const template = document.createElement('template')
    this.shadowRoot.appendChild(template.content)
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    this.element('approve').insertAdjacentHTML('beforebegin', this.getCardElement())

    this.onmousedown = this.ontouchstart = e => {
      if (this.animating) return
      const startX =  e.pageX || e.originalEvent.touches[0].pageX

      this.onmousemove = this.ontouchmove = e => {
        const x = e.pageX || e.originalEvent.touches[0].pageX
        this.pullDeltaX = (x - startX)
        if (!this.pullDeltaX) return
        this.pullChange()
      }

      this.onmouseup = this.ontouchend = () => {
        this.onmousemove = this.ontouchmove = this.onmouseup = this.ontouchend = null
        if (!this.pullDeltaX) return // prevents from rapid click events
        this.release()
      }
    }
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }

  updateCard() {
    const card = this.element('card')
    if (this.isConnected && card) {
      card.insertAdjacentHTML('afterend', this.getCardElement())
      this.shadowRoot.removeChild(card)
    }
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

  getSourcesHTML(id) {
    const sources = document.querySelector(`${TestCard.contentRootSelector} > .sources`)
    const links = Array.from(sources.querySelectorAll(`a.${id}`))
    if (links.length > 0) {
      const q = this.elementWithKids('q', [
        this.elementWithKids('ul', links.map(
        s => this.elementWithKids('li', [
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

  elementWithKids(tag, kids = undefined) {
    const node = document.createElement(tag)
    if (kids) {
      if (!(kids instanceof Array)) kids = [kids]
      kids.forEach(kid => {
        if (!(kid instanceof HTMLElement)) kid = document.createTextNode(kid)
        node.appendChild(kid)
      })
    }
    return node
  }

  getCardElement() {
    const data = document.querySelector(`${TestCard.contentRootSelector} > #${this.lang} a[id="${this.idOnly}"]`) || ''
    const title = data ? data.querySelector('h2').innerHTML : ''
    const topicData = this.topic && document.querySelector(`${TestCard.contentRootSelector} > #${this.lang} > .topics > section[id="${this.topic}"]`)
    const topic = topicData ? topicData.title : ''
    return this.cardWithSources(this.idOnly, title, `<argument-card neutral card="${this.idOnly}" topicId="${this.topic}" topic="${topic}">${data ? data.innerHTML : ''}</argument-card>`)
  }

  pullChange() {
    this.animating = true
    this.element('card').style.transform = `translateX(${this.pullDeltaX}px)`
    this.element('reject').style.transform = `translateX(${this.pullDeltaX}px)`
    this.element('approve').style.transform = `translateX(${this.pullDeltaX}px)`

    const opacity = this.pullDeltaX / 180
    const rejectOpacity = (opacity >= 0) ? 0 : Math.abs(opacity)
    const approveOpacity = (opacity <= 0) ? 0 : opacity
    this.element('reject').style.opacity = ''+rejectOpacity
    this.element('approve').style.opacity = ''+approveOpacity
  }

  release() {
    if (this.pullDeltaX >= this.decisionVal) {
      this.element('card').classList.add('to-right')
      this.element('approve').classList.add('to-right')
      this.element('reject').classList.add('to-right')
      this.dispatchEvent(new CustomEvent('choice', { detail: { approve: true, card: this.card } }))
    } else if (this.pullDeltaX <= -this.decisionVal) {
      this.element('card').classList.add('to-left')
      this.element('approve').classList.add('to-left')
      this.element('reject').classList.add('to-left')
      this.dispatchEvent(new CustomEvent('choice', { detail: { approve: false, card: this.card } }))
    }

    if (Math.abs(this.pullDeltaX) >= this.decisionVal) {
      this.element('card').classList.add('inactive')
      this.element('approve').classList.add('inactive')
      this.element('reject').classList.add('inactive')

      setTimeout(() => {
        this.element('card').classList.remove(['inactive', 'to-left', 'to-right'])
      }, 300)
    }

    if (Math.abs(this.pullDeltaX) < this.decisionVal) {
      this.element('card').classList.add('reset')
      this.element('approve').classList.add('reset')
      this.element('reject').classList.add('reset')
    }

    setTimeout(() => {
      this.element('card').style = this.element('approve').style = this.element('reject').style = null
      this.element('card').classList.remove('reset')
      this.element('approve').classList.remove('reset')
      this.element('reject').classList.remove('reset')

      this.pullDeltaX = 0
      this.animating = false
    }, 300)
  }
}

customElements.define('test-card', TestCard)

// idea from: https://codepen.io/suez/pen/MaeVBy
const testCardTemplate = document.createElement('template')
testCardTemplate.innerHTML = `
  <style>
   :host {
      display: inline-block;
      overflow: visible;
      position: relative;
      --orange: #ff945a;
      --green: #b1da96;
    }

    #card, #reject, #like, #drag {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: calc(2 * var(--cavg));
    }

    .reset {
      transition: transform 0.3s;
      transform: translateX(0) !important;
    }

    #like.reset, #reject.reset {
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

    #like, #reject {
      opacity: 0;
    }

    #like:before, #reject:before {
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

    #like:after, #reject:after {
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

    #like:after {
      border-top: none;
      border-bottom-left-radius: 1.5rem;
      border-bottom-right-radius: 1.5rem;
    }

    #reject {
      background: var(--orange);
    }

    #like {
      background: var(--green);
    }

    #drag {
      z-index: 1;
      cursor: grab;
    }

  </style>
  <div id="reject"></div>
  <div id="like"></div>
  <div id="drag"></div>
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

  element(id) { return this.shadowRoot.getElementById(id) }

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

  attributeChangedCallback(name) {
    this.updateCard()
  }

  connectedCallback() {
    this.shadowRoot.appendChild(testCardTemplate.content.cloneNode(true))
    this.lang = document.body.lang
    const template = document.createElement('template')
    this.shadowRoot.appendChild(template.content)
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    this.element('reject').insertAdjacentHTML('beforeBegin', this.getCardElement())
    
    this.onmousedown = this.ontouchstart = e => {
      if (this.animating) return
      const startX =  e.pageX || e.originalEvent.touches[0].pageX

      this.onmousemove = this.ontouchmove = e => {
        var x = e.pageX || e.originalEvent.touches[0].pageX
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
      card.insertAdjacentHTML('beforeBegin', this.getCardElement())
      this.shadowRoot.removeChild(card)
    }
  }

  getCardElement() {
    const data = document.querySelector(`${TestCard.contentRootSelector} > #${this.lang} a[id="${this.idOnly}"]`) || ''
    const topicData = this.topic && document.querySelector(`${TestCard.contentRootSelector} > #${this.lang} a[id="${this.topic}"]`)
    const topic = topicData ? topicData.firstElementChild.innerHTML : ''
    return `<argument-card id="card" neutral card="${this.idOnly}" topicId="${this.topic}" topic="${topic}">${data.innerHTML}</argument-card>`
  }
  
  pullChange() {
    this.animating = true
    this.element('card').style.transform = `translateX(${this.pullDeltaX}px)`
    this.element('reject').style.transform = `translateX(${this.pullDeltaX}px)`
    this.element('like').style.transform = `translateX(${this.pullDeltaX}px)`

    const opacity = this.pullDeltaX / 100
    const rejectOpacity = (opacity >= 0) ? 0 : Math.abs(opacity)
    const likeOpacity = (opacity <= 0) ? 0 : opacity
    this.element('reject').style.opacity = rejectOpacity
    this.element('like').style.opacity = likeOpacity
  }

  release() {
    if (this.pullDeltaX >= this.decisionVal) {
      this.element('card').classList.add('to-right')
      this.element('like').classList.add('to-right')
      this.element('reject').classList.add('to-right')
    } else if (this.pullDeltaX <= -this.decisionVal) {
      this.element('card').classList.add('to-left')
      this.element('like').classList.add('to-left')
      this.element('reject').classList.add('to-left')
    }

    if (Math.abs(this.pullDeltaX) >= this.decisionVal) {
      this.element('card').classList.add('inactive')
      this.element('like').classList.add('inactive')
      this.element('reject').classList.add('inactive')

      setTimeout(() => {
        this.element('card').classList.remove(['inactive', 'to-left', 'to-right'])
      }, 300)
    }

    if (Math.abs(this.pullDeltaX) < this.decisionVal) {
      this.element('card').classList.add('reset')
      this.element('like').classList.add('reset')
      this.element('reject').classList.add('reset')
    }

    setTimeout(() => {
      this.element('card').style = this.element('like').style = this.element('reject').style = null
      this.element('card').classList.remove('reset')
      this.element('like').classList.remove('reset')
      this.element('reject').classList.remove('reset')

      this.pullDeltaX = 0
      this.animating = false
    }, 300)
  }
}

customElements.define('test-card', TestCard)
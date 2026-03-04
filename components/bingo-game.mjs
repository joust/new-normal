import { BaseComponent } from './base-component.mjs'

export class BingoGame extends BaseComponent {
  get css () {
    return `
    ${super.css}
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #fff;
      font-size: 1.7vmax;
    }

    :host(.one) {
      font-size: 3vmin;
    }

    @media (orientation: landscape) {
      :host {
        flex-direction: row;
      }

      :host(.hidden) bingo-card:nth-child(1) {
        margin-top: -150%;
      }

      :host(.hidden) bingo-card:nth-child(2) {
        margin-bottom: -150%;
      }
    }

    @media (orientation: portrait) {
      :host {
        flex-direction: column;
      }

      :host(.hidden) bingo-card:nth-child(1) {
        margin-left: -150%;
      }

      :host(.hidden) bingo-card:nth-child(2) {
        margin-right: -150%;
      }
    }

    @media (orientation: portrait) and (min-aspect-ratio: 1/2) {
      :host(:not(.one)) bingo-card {
        width: 50vh;
      }
    }

    @media (prefers-color-scheme: dark) {
      :host {
        background-color: #222;
      }
    }
    `
  }

  get html () {
    return '<pyro-effect id="pyro"></pyro-effect>'
  }

  start (one, two, { topics, language, territory, attitude, sources, labelSelect, randomElement }) {
    this._topics = topics
    this._language = language
    this._territory = territory
    this._attitude = attitude
    this._sources = sources
    this._labelSelect = labelSelect
    this._randomElement = randomElement

    this.cleanup()

    const card1 = this.createCard(one)
    this.shadowRoot.appendChild(card1)
    this.initCard(card1)
    this._cards.push(card1)

    if (two !== undefined) {
      const card2 = this.createCard(two)
      this.shadowRoot.appendChild(card2)
      this.initCard(card2)
      this._cards.push(card2)
      this.classList.remove('one')
    } else {
      this.classList.add('one')
      card1.setAttribute('one', '')
    }
  }

  startFromHash (ids, { topics, language, territory, attitude, sources, labelSelect, randomElement }) {
    this._topics = topics
    this._language = language
    this._territory = territory
    this._attitude = attitude
    this._sources = sources
    this._labelSelect = labelSelect
    this._randomElement = randomElement

    this.cleanup()

    const idiotIds = ids.filter(v => v.startsWith('I'))
    const sheepIds = ids.filter(v => v.startsWith('S'))

    const one = idiotIds.length > 0
    const card1 = this.createCard(one)
    this.shadowRoot.appendChild(card1)
    this.initCard(card1)
    this._cards.push(card1)
    card1.openDetail(null, one ? idiotIds : sheepIds)

    const hasTwo = (one ? sheepIds : idiotIds).length > 0
    if (hasTwo) {
      const card2 = this.createCard(!one)
      this.shadowRoot.appendChild(card2)
      this.initCard(card2)
      this._cards.push(card2)
      this.classList.remove('one')
      card2.openDetail(null, !one ? idiotIds : sheepIds)
    } else {
      this.classList.add('one')
      card1.setAttribute('one', '')
    }
  }

  refresh (topics, language, territory) {
    this._topics = topics
    this._language = language
    this._territory = territory
    this._cards.forEach(card => card.refresh(topics, language, territory))
  }

  stop () {
    this._cards.forEach(card => card.closeDetail())
    this.element('pyro').stop()
    this.cleanup()
  }

  createCard (idiot) {
    const card = document.createElement('bingo-card')
    if (idiot) card.setAttribute('idiot', '')

    card.addEventListener('bingo', event => {
      this.element('pyro').toggle(event.detail.complete)
    })

    card.addEventListener('counter-arguments', event => {
      this.showCounterArguments(card, event.detail)
    })

    card.addEventListener('locale-change', event => {
      this.dispatchEvent(new CustomEvent('locale-change', {
        bubbles: true, composed: true,
        detail: event.detail
      }))
    })

    card.addEventListener('exclusion-change', event => {
      this.dispatchEvent(new CustomEvent('exclusion-change', {
        bubbles: true, composed: true,
        detail: event.detail
      }))
    })

    return card
  }

  initCard (card) {
    card.init(
      this._topics,
      this._language,
      this._territory,
      this._attitude,
      this._sources,
      this._labelSelect,
      this._randomElement
    )
  }

  showCounterArguments (sourceCard, detail) {
    const { topicId, idiot } = detail
    let targetCard = this._cards.find(c => c !== sourceCard && c.idiot === idiot)

    if (!targetCard) {
      targetCard = this._cards.find(c => c !== sourceCard)
      if (!targetCard && this._cards.length < 2) {
        targetCard = this.createCard(idiot)
        this.shadowRoot.appendChild(targetCard)
        this.initCard(targetCard)
        this._cards.push(targetCard)
        this.classList.remove('one')
        this._cards.forEach(c => c.removeAttribute('one'))
      }
      if (!targetCard) return
    }

    const topic = this._topics.find(t => t.id === topicId)
    if (topic) {
      const args = idiot ? topic.idiot : topic.sheep
      targetCard.openDetail(topicId, args)
    }
  }

  cleanup () {
    this.shadowRoot.querySelectorAll('bingo-card').forEach(card => card.remove())
    this._cards = []
  }
}

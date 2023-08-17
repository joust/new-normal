import { flagMapped } from './shared.mjs'
import { BaseCard } from './base-card.mjs'

window.customElements.define('discuss-card', class DiscussCard extends BaseCard {
  static observedAttributes = ['idiot', 'topicId', 'mirrored']

  get topicId () {
    return this.getAttribute('topicId')
  }

  get phrase () {
    return this.querySelector('h2') ? this.querySelector('h2').innerHTML : ''
  }

  get description () {
    return this.querySelector('p') ? this.querySelector('p').innerHTML : ''
  }

  get idiot () {
    return this.hasAttribute('idiot')
  }

  get mirrored () {
    return this.hasAttribute('mirrored')
  }

  get css () {
    return `
    ${super.css}
    #discuss-card {
      background: var(--sheep-discuss-background);
    }

    #discuss-card.idiot {
    background: var(--idiot-discuss-background);
    }

    #topic-icon {
      position: absolute;
      width: calc(1.3 * var(--sidebar-width));
      height: calc(1.3 * var(--sidebar-width))
      top: 0;
      left: 0;
      font-family: 'HVD Crocodile', Helvetica, 'NotoColorEmojiLimited';
      font-weight: 600;
      font-stretch: condensed;
      font-size: calc((8cqw + 8cqh) / var(--avg));
      text-align: center;
      margin-top: 0;
      margin-bottom: 0;
      color: var(--sheep-discuss-color);
      -webkit-text-stroke: calc((0.15cqw + 0.15cqh) / var(--avg)) white;
    }

    .idiot #topic-icon {
      color: var(--idiot-discuss-color);
    }

    .mirrored #topic-icon {
      right: 0;
      left: auto;
    }

    #phrase {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc((7cqw + 7cqh) / var(--avg));
      font-weight: 600;
      font-stretch: condensed;
      color: var(--sheep-discuss-color);
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
      color: var(--idiot-discuss-color);
    }

    #phrase b {
      -webkit-text-stroke: calc((0.15cqw + 0.15cqh) / var(--avg)) white;
      color: var(--sheep-discuss-topic-color);
    }

    .idiot #phrase b {
      color: var(--idiot-discuss-topic-color);
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

    #phrase > span::after {
      content: close-quote;
    }
  `
  }

  get html () {
    return `
    <div id="discuss-card" class="card">
      <div id="watermark"></div>
      <div id="new">New</div>
      <div id="topic-icon"></div>
      <div id="phrase"><span><span class="phrase"></span></span><span id="description"></span></div>
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
      const root = this.element('discuss-card')
      this.element('topic-icon').innerHTML = flagMapped(this.topicId ? this.topicId.substring(1) : '')
      root.classList.toggle('mirrored', this.mirrored)
      root.classList.toggle('idiot', this.idiot)
      Array.from(root.querySelectorAll('.phrase')).forEach(node => (node.innerHTML = this.phrase))
      this.element('description').innerHTML = this.description
    }
  }
})

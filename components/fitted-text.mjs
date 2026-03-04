import { BaseComponent } from './base-component.mjs'

export class FittedText extends BaseComponent {
  get css () {
    return `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      container-type: size;
      -webkit-mask-image: linear-gradient(to bottom, black calc(100% - 1.5em), transparent 100%);
      mask-image: linear-gradient(to bottom, black calc(100% - 1.5em), transparent 100%);
    }

    :host(.fits) {
      -webkit-mask-image: none;
      mask-image: none;
    }

    :host(.scrolling) {
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 1.5em, black calc(100% - 1.5em), transparent 100%);
      mask-image: linear-gradient(to bottom, transparent 0%, black 1.5em, black calc(100% - 1.5em), transparent 100%);
    }

    #text {
      width: 100%;
      text-align: center;
      hyphens: auto;
      -webkit-hyphens: auto;
    }

    :host(.scrolling) #text {
      animation: scroll-up var(--scroll-duration) linear alternate infinite;
    }

    @keyframes scroll-up {
      0%   { transform: translateY(var(--scroll-start)); }
      100% { transform: translateY(var(--scroll-end)); }
    }
    `
  }

  get html () {
    return '<div id="text"><slot></slot></div>'
  }

  connectedCallback () {
    super.connectedCallback()
    this.addEventListener('mouseenter', () => this.startScroll())
    this.addEventListener('mouseleave', () => this.stopScroll())
    requestAnimationFrame(() => this.checkFit())
  }

  checkFit () {
    const text = this.element('text')
    if (!text) return
    this.classList.toggle('fits', text.scrollHeight <= this.clientHeight + 1)
  }

  startScroll () {
    const text = this.element('text')
    if (!text || text.scrollHeight <= this.clientHeight + 1) return

    const overflow = text.scrollHeight - this.clientHeight
    const duration = Math.max(2, overflow / 15)

    this.style.setProperty('--scroll-start', `${overflow / 2}px`)
    this.style.setProperty('--scroll-end', `-${overflow / 2}px`)
    this.style.setProperty('--scroll-duration', `${duration}s`)
    this.classList.add('scrolling')
  }

  stopScroll () {
    this.classList.remove('scrolling')
  }
}

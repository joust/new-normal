const testCertificateTemplate = document.createElement('template')
testCertificateTemplate.innerHTML = `
  <style>
     :host {
      display: inline-block;
      overflow: hidden;
    }

    #test-certificate {
      position: relative;
      width: 100%;
      height: 100%;
      padding: calc(5.5 * var(--cavg));
      background: var(--background);
      background-color: #f0f0f0;
      box-sizing: border-box;
    }

    #inner {
      border: calc(0.5 * var(--cavg)) solid grey;
      padding: calc(3 * var(--cavg));
      width: 100%;
      height: 100%;
      background-color: white;
      box-sizing: border-box;
    }

    .test-img {
      position: absolute;
      bottom: 0;
      width: calc(16 * var(--cavg));
      height: calc(16 * var(--cavg));
      background-position: center;
      background-size: contain;
      background-repeat: no-repeat;
    }

    #logo {
      position: absolute;
      top: 0;
      left: calc(50% - 27 * var(--cavg));
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-weight: 600;
      text-align: center;
      letter-spacing: -0.6vmax;
      font-size: 14vmin;
      background: linear-gradient(0deg, white 50%, transparent 50%);
      padding-right: calc(0.5 * var(--cavg));
    }

    .red {
      color: var(--idiot-background);
    }

    .blue {
      color: var(--sheep-background);
    }

    #logo .virus {
      position: relative;
      display: inline-block;
      background: url(styles/images/virus.png);
      background-position: center;
      background-size: contain;
      background-repeat: no-repeat;
      width: 12vmin;
      height: 12vmin;
      margin-left: -2.6vmin;
      margin-right: -2.6vmin;
    }

    @keyframes jump {
      0% {transform: translate3d(0, 0, 0) scale3d(1, 1, 1);}
      40% {transform: translate3d(0, -10%, 0) scale3d(0.8, 1.2, 1);}
      100% {transform: translate3d(0, -40%, 0) scale3d(1.2, 0.8, 1);}
    }

    .jump {
      transform-origin: 50% 50%;
      animation: jump 0.5s linear alternate infinite;
    }

    @media (prefers-color-scheme: dark) {
      #test-certificate {
        background-color: #999;
      }
      
      #inner {
        background-color: #666;
      }

      #logo {
        background: linear-gradient(0deg, #666 50%, transparent 50%);
      }
    }
</style>
  <div id="test-certificate">
    <div id="inner">
      <slot></slot>
    </div>
  </div>
  <div id="logo">
    <span class="red">New N</span><span class="jump virus" onclick="event.target.classList.toggle('jump')"></span><span class="blue">rmal</span>
  </div>
`

class TestCertificate extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  element(id) { return this.shadowRoot.getElementById(id) }

  static virus = 'styles/images/virus.png'

  connectedCallback() {
    this.shadowRoot.appendChild(testCertificateTemplate.content.cloneNode(true))
    const resizeObserver = new ResizeObserver(() => this.resize())
    resizeObserver.observe(this)
    this.element('test-certificate').style.setProperty('--background', this.randomViruses())
  }

  random(min, max) {
    return min + Math.floor(Math.random()*(max-min+1))
  }

  randomViruses() {
    return Array(100).fill('').map(() => `url(${TestCertificate.virus}) ${this.random(-20,120)}% ${this.random(-20,120)}% / ${this.random(10,20)}% no-repeat`).join(',')
  }

  resize() {
    const cw = this.clientWidth/100, ch = this.clientHeight/100
    this.style.setProperty('--cavg', `${(cw+ch)/1.6}px`)
  }
}

customElements.define('test-certificate', TestCertificate)

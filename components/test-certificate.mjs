import {BaseComponent} from './base-component.mjs'

window.customElements.define('test-certificate', class TestCertificate extends BaseComponent {
  static virus = 'styles/images/virus.png'

  get css() {
    return `
    ${super.css}
     :host {
      overflow: hidden;
    }

    #test-certificate {
      position: relative;
      width: 100%;
      height: 100%;
      padding: calc((5.5cqw + 5.5cqh) / var(--avg));
      background: var(--background);
      background-color: #f0f0f0;
      box-sizing: border-box;
    }

    #inner {
      border: calc((0.5cqw + 0.5cqh) / var(--avg)) solid grey;
      padding: calc((3cqw + 3cqh) / var(--avg));
      width: 100%;
      height: 100%;
      background-color: white;
      box-sizing: border-box;
    }

    .test-img {
      position: absolute;
      bottom: 0;
      width: calc((16cqw + 16cqh) / var(--avg));
      height: calc((16cqw + 16cqh) / var(--avg));
      background-position: center;
      background-size: contain;
      background-repeat: no-repeat;
    }

    #logo {
      position: absolute;
      top: 0;
      left: calc((50% - 27cqw + 50% - 27cqh) / var(--avg));
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-weight: 600;
      text-align: center;
      letter-spacing: -0.6vmax;
      font-size: 14vmin;
      background: linear-gradient(0deg, white 50%, transparent 50%);
      padding-right: calc((0.5cqw + 0.5cqh) / var(--avg));
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
  `
  }

  get html() {
    return `
    <div id="test-certificate">
      <div id="inner">
        <slot></slot>
      </div>
    </div>
    <div id="logo">
      <span class="red">New N</span><span class="jump virus" onclick="event.target.classList.toggle('jump')"></span><span class="blue">rmal</span>
    </div>
  `
  }

  connectedCallback() {
    super.connectedCallback()
    this.element('test-certificate').style.setProperty('--background', this.randomViruses())
  }

  random(min, max) {
    return min + Math.floor(Math.random()*(max-min+1))
  }

  randomViruses() {
    return Array(100).fill('').map(() => `url(${TestCertificate.virus}) ${this.random(-20,120)}% ${this.random(-20,120)}% / ${this.random(10,20)}% no-repeat`).join(',')
  }
})

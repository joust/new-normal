import { BaseComponent } from './base-component.mjs'

export class BaseCard extends BaseComponent {
  get css () {
    return `
    ${super.css}
    .card {
      position: relative;
      width: 100%;
      height: 100%;
      border: calc((0.1cqw + 0.1cqh) / var(--avg)) solid #aaa;
      border-radius: calc((2cqw + 2cqh) / var(--avg));
      user-select: none;
    }    
    
    .quoted::before {
      content: open-quote;
    }

    .quoted::after {
      content: close-quote;
    }

    #icon {
      position: absolute;
      width: calc(1.3 * var(--sidebar-width));
      height: calc(1.3 * var(--sidebar-width))
      top: 0;
      left: 0;
      font-size: calc((8cqw + 8cqh) / var(--avg));
      text-align: center;
      color: white;
      opacity: .8;
    }
    
    .mirrored #icon {
      right: 0;
      left: auto;
    }

    #card {
      position: absolute;
      right: 0;
      top: 0;
      padding: 0 2% 0 2%;
      height: 4%;
      font-family: 'Open Sans', Helvetica, sans-serif;
      font-size: calc((2.5cqw + 2.5cqh) / var(--avg));
      text-align: center;
      border-top-right-radius: calc((2cqw + 2cqh) / var(--avg));
    }

    .mirrored #card {
      left: 0;
      right: auto;
      border-top-left-radius: calc((2cqw + 2cqh) / var(--avg));
      border-top-right-radius: 0;
    }

    #watermark {
      position: absolute;
      width: var(--watermark-size);
      height: var(--watermark-size);
      top: 4%;
      right: 0;
      opacity: 0.15;
      background-image: url('/styles/images/virus.png');
      background-size: contain;
      background-repeat: no-repeat;
    }

    .mirrored #watermark {
      right: var(--sidebar-width);
    }
    
    #new, #normal {
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-weight: 600;
      font-size: calc((14cqw + 14cqh) / var(--avg));
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
    
    #side {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc((6cqw + 6cqh) / var(--avg));
      font-weight: 600;
      font-stretch: condensed;
      padding-left: 2%;
      top: 100%;
      left: 0;
      text-overflow: ellipsis;
      text-align: left;
      overflow: hidden;
      white-space: nowrap;
      height: 15cqw;
      width: 85cqh;
      transform: rotate(-90deg);
      transform-origin: top left;
      color: white;
      opacity: .4;
    }

    .mirrored #side {
      left: calc(100% - var(--sidebar-width));
    }
    
    #description {
      position: absolute;
      bottom: 0; 
      font-family: 'Open Sans', Helvetica, sans-serif;
      padding: calc((5 * var(--cavg)) calc(5 * var(--cavg)) calc(16cqw + 5 * var(--cavg)) calc(5 * var(--cavg)) calc(16cqh) / var(--avg));
      font-size: calc((3cqw + 3cqh) / var(--avg));
      font-style: italic;
      color: white;
      opacity: .4;
    }
    `
  }
}

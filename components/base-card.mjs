import {BaseComponent} from './base-component.mjs'

export class BaseCard extends BaseComponent {
  get css () {
    return `
     :host {
      display: inline-block;
    }
    
    .card {
      position: relative;
      width: 100%;
      height: 100%;
      border: calc(0.1 * var(--cavg)) solid #aaa;
      border-radius: calc(2 * var(--cavg));
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
      font-size: calc(8 * var(--cavg));
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
      font-size: calc(2.5 * var(--cavg));
      text-align: center;
      border-top-right-radius: calc(2 * var(--cavg));
    }

    .mirrored #card {
      left: 0;
      right: auto;
      border-top-left-radius: calc(2 * var(--cavg));
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
    
    #side {
      position: absolute;
      font-family: 'HVD Crocodile', Helvetica, sans-serif;
      font-size: calc(6 * var(--cavg));
      font-weight: 600;
      font-stretch: condensed;
      padding-left: 2%;
      top: 100%;
      left: 0;
      text-overflow: ellipsis;
      text-align: left;
      overflow: hidden;
      white-space: nowrap;
      height: calc(15 * var(--cw));
      width: calc(85 * var(--ch));
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
      padding: calc(5 * var(--cavg)) calc(5 * var(--cavg)) calc(16 * var(--cavg));
      font-size: calc(3 * var(--cavg));
      font-style: italic;
      color: white;
      opacity: .4;
    }
    `
  }
}

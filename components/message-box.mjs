// Message Box web component (based on a pen by https://codepen.io/takaneichinose)
import { BaseComponent } from './base-component.mjs'

window.customElements.define('message-box', class MessageBoxElement extends BaseComponent {
  get css () {
    const padding = '1em'
    return `
      .modal {
        font-size: 2em;
        font-weight: 300;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: auto;
        position: fixed;
        top: 0;
        left: 0;
      }
  
      .dialog {
        width: calc(100% - 2em);
        max-width: 40vw;
        overflow: hidden;
        box-sizing: border-box;
        box-shadow: 0 0.5em 1em rgba(0, 0, 0, 0.5);
        border-radius: 0.3em;
        animation: show 265ms cubic-bezier(0.18, 0.89, 0.32, 1.28)
      }
  
      .dialog.hide {
        opacity: 0;
        animation: hide 265ms ease-in;
      }
  
      @keyframes show {
        0% {
          opacity: 0;
          transform: translateY(-100%);
        }
        100% {
          opacity: 1;
          transform: translateX(0);
        }
      }
  
      @keyframes hide {
        0% {
          opacity: 1;
          transform: translateX(0);
        }
        100% {
          opacity: 0;
          transform: translateY(-50%);
        }
      }
  
      .header {
        color: inherit;
        background-color: rgba(0, 0, 0, 0.05);
        padding: ${padding};
        border-bottom: solid 1px rgba(0, 0, 0, 0.15);
      }
  
      .body {
        color: inherit;
        padding: ${padding};
      }
  
      .body > p {
        color: inherit;
        padding: 0;
        margin: 0;
      }
  
      .footer {
        color: inherit;
        display: flex;
        justify-content: stretch;
      }
  
      .button {
        color: inherit;
        font-family: inherit;
        font-size: inherit;
        background-color: rgba(0, 0, 0, 0);
        width: 100%;
        padding: 1em;
        border: none;
        border-top: solid 1px rgba(0, 0, 0, 0.15);
        outline: 0;
        border-radius: 0;
        transition: background-color 225ms ease-out;
      }
  
      .button:focus {
        background-color: rgba(0, 0, 0, 0.05);
      }
  
      .button:active {
        background-color: rgba(0, 0, 0, 0.15);
      }
  
      .textbox {
        color: inherit;
        font-family: inherit;
        font-size: inherit;
        width: 100%;
        padding: 0.5em;
        border: solid 1px rgba(0, 0, 0, 0.15);
        margin-top: ${padding};
        outline: 0;
        box-sizing: border-box;
        border-radius: 0;
        box-shadow: 0 0 0 0 rgba(13, 134, 255, 0.5);
        transition: box-shadow 125ms ease-out, border 125ms ease-out;
      }
  
      .textbox:focus {
        border: solid 1px rgba(13, 134, 255, 0.8);
        box-shadow: 0 0 0.1em 0.2em rgba(13, 134, 255, 0.5);
      }
  
      @media (prefers-color-scheme: dark) {
        .modal {
          background-color: rgba(31, 31, 31, 0.5);
        }
  
        .dialog {
          color: #f2f2f2;
          background-color: #464646;
        }
  
        .textbox {
          background-color: #2f2f2f;
        }
      }
  
      @media (prefers-color-scheme: light) {
        .modal {
          background-color: rgba(221, 221, 221, 0.5);
        }
  
        .dialog {
          color: #101010;
          background-color: #ffffff;
        }
      }`
  }

  get html () {
    return `
      <div class="modal">
        <div class="dialog">
          <div class="header"></div>
          <div class="body">
            <p></p>
          </div>
          <div class="footer">
          </div>
        </div>
      </div>`
  }

  /**
   * Set the default value of the dialog box
   */
  setDefault () {
    const content = this.dataset.content
    let title = this.dataset.title
    const type = this.dataset.type
    if (typeof content === 'undefined' || typeof type === 'undefined') {
      // Dialog will be built if these two datatypes are existing
      // as HTML attributes. This is to prevent calling the dialog
      // builders twice when the dialog was call from javascript.
      return
    }
    if (typeof title === 'undefined') {
      title = null
    }
    switch (type) {
      case 'inform':
        this.setInform(content, title).then()
        break
      case 'progress':
        this.setProgress(content, title).then()
        break
      case 'alert':
        this.setAlert(content, title).then()
        break
      case 'confirm':
        this.setConfirm(content, title).then()
        break
      case 'prompt':
        this.setPrompt(content, title).then()
        break
    }
  }

  /**
   * Put the title and the content of the dialog box.
   */
  setupDialog (content, title) {
    const header = this.shadowRoot.querySelector('.header')
    const body = this.shadowRoot.querySelector('.body > p')
    body.innerHTML = content
    if (title === null) {
      header.remove()
    } else {
      header.innerHTML = title
    }
  }

  /**
   * Execute 'animationend' event of the dialog, then dispose
   */
  disposeDialog () {
    const dialog = this.shadowRoot.querySelector('.dialog')
    dialog.classList.add('hide')
    dialog.addEventListener('animationend', event => {
      if (event.animationName === 'hide') {
        this.remove()
      }
    })
  }

  /* Only for progress dialogs */
  progress (value, max) {
    const progress = this.shadowRoot.querySelector('progress')
    console.log(value, max)
    if (progress) {
      console.log('setting values')
      progress.max = max
      progress.value = value
    }
  }

  t (v) {
    const lang = navigator.language.substring(0, 2)
    const text = {
      Cancel: {
        da: 'Annuller',
        de: 'Abbrechen',
        fr: 'Annuler',
        es: 'Cancelar',
        it: 'Annulla',
        pt: 'Cancelar',
        pl: 'Anuluj',
        ru: 'Отмена',
        nl: 'Annuleren',
        tr: 'İptal'
      }
    }
    return (text[v] && text[v][lang]) || v
  }

  /**
   * Creates the inform dialog element which closes when the given promise is resolved/rejected
   */
  setInform (content, title, promise) {
    this.setupDialog(content, title)
    if (!promise) {
      promise = new Promise(resolve => setTimeout(() => resolve(), 2000))
    } // show for 2s
    return promise.then(() => this.disposeDialog())
  }

  /**
   * Creates the progress dialog element which closes when the given promise is resolved/rejected
   */
  setProgress (content, title, promise) {
    this.setupDialog(content, title)
    const body = this.shadowRoot.querySelector('.body')
    const progress = document.createElement('progress')
    body.append(progress)
    if (promise) return promise.then(() => this.disposeDialog())
    return Promise.resolve()
  }

  /**
   * Creates the alert dialog element
   */
  setAlert (content, title) {
    this.setupDialog(content, title)
    const footer = this.shadowRoot.querySelector('.footer')
    const confirm = document.createElement('button')
    confirm.classList.add('button')
    confirm.innerText = 'OK'
    footer.append(confirm)
    confirm.focus()
    return new Promise(resolve => {
      confirm.addEventListener('click', () => {
        this.disposeDialog()
        resolve(true)
      })
    })
  }

  /**
   * Creates the confirm dialog element
   */
  setConfirm (content, title) {
    this.setupDialog(content, title)
    const footer = this.shadowRoot.querySelector('.footer')
    const cancel = document.createElement('button')
    const confirm = document.createElement('button')
    cancel.classList.add('button')
    cancel.innerText = this.t('Cancel')
    confirm.classList.add('button')
    confirm.innerText = 'OK'
    footer.append(cancel, confirm)
    cancel.focus()
    return new Promise(resolve => {
      cancel.addEventListener('click', () => {
        this.disposeDialog()
        resolve(false)
      })
      confirm.addEventListener('click', () => {
        this.disposeDialog()
        resolve(true)
      })
    })
  }

  /**
   * Creates the prompt dialog element
   */
  setPrompt (content, title) {
    this.setupDialog(content, title)
    // Create Textbox and put into the dialog body.
    const body = this.shadowRoot.querySelector('.body')
    const p = document.createElement('p')
    const input = document.createElement('input')
    input.classList.add('textbox')
    input.type = 'text'
    input.value = ''
    p.append(input)
    body.append(p)
    // Create buttons, and put into the dialog footer.
    const footer = this.shadowRoot.querySelector('.footer')
    const cancel = document.createElement('button')
    const confirm = document.createElement('button')
    cancel.classList.add('button')
    cancel.innerText = this.t('Cancel')
    confirm.classList.add('button')
    confirm.innerText = 'OK'
    footer.append(cancel, confirm)
    input.focus()
    // Prompt message textbox KeyPress event
    input.addEventListener('keypress', event => {
      if (event.key === 'Enter') {
        // If Enter key has been pressed
        confirm.click()
      }
    })
    return new Promise(resolve => {
      cancel.addEventListener('click', () => {
        this.disposeDialog()
        resolve(null)
      })
      confirm.addEventListener('click', () => {
        console.log(input.value)
        this.disposeDialog()
        resolve(input.value)
      })
    })
  }
})

export function inform (content, title = null, promise = null) {
  const box = document.createElement('message-box')
  document.body.appendChild(box)
  return box.setInform(content, title, promise)
}

export function progress (content, title = null, promise = null) {
  const box = document.createElement('message-box')
  document.body.appendChild(box)
  box.setProgress(content, title, promise)
  return box
}

export function alert (content, title = null) {
  const box = document.createElement('message-box')
  document.body.appendChild(box)
  return box.setAlert(content, title)
}

export function confirm (content, title = null) {
  const box = document.createElement('message-box')
  document.body.appendChild(box)
  return box.setConfirm(content, title)
}

export function prompt (content, title = null) {
  const box = document.createElement('message-box')
  document.body.appendChild(box)
  return box.setPrompt(content, title)
}

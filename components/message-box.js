// Message Box web component (based on a pen by https://codepen.io/takaneichinose)
const padding = '1em'
const messageBoxTemplate = document.createElement('template')
messageBoxTemplate.innerHTML = `
  <style>
    .msg-box-modal {
      font-family: 'HVD Crocodile';
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

    .msg-box-dialog {
      width: calc(100% - 2em);
      max-width: 40vw;
      overflow: hidden;
      box-sizing: border-box;
      box-shadow: 0 0.5em 1em rgba(0, 0, 0, 0.5);
      border-radius: 0.3em;
      animation: msg-box-dialog-show 265ms cubic-bezier(0.18, 0.89, 0.32, 1.28)
    }

    .msg-box-dialog.msg-box-dialog-hide {
      opacity: 0;
      animation: msg-box-dialog-hide 265ms ease-in;
    }

    @keyframes msg-box-dialog-show {
      0% {
        opacity: 0;
        transform: translateY(-100%);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes msg-box-dialog-hide {
      0% {
        opacity: 1;
        transform: translateX(0);
      }
      100% {
        opacity: 0;
        transform: translateY(-50%);
      }
    }

    .msg-box-dialog-header {
      color: inherit;
      background-color: rgba(0, 0, 0, 0.05);
      padding: ${padding};
      border-bottom: solid 1px rgba(0, 0, 0, 0.15);
    }

    .msg-box-dialog-body {
      color: inherit;
      padding: ${padding};
    }

    .msg-box-dialog-body > p {
      color: inherit;
      padding: 0;
      margin: 0;
    }

    .msg-box-dialog-footer {
      color: inherit;
      display: flex;
      justify-content: stretch;
    }

    .msg-box-dialog-button {
      color: inherit;
      font-family: inherit;
      font-size: inherit;
      background-color: rgba(0, 0, 0, 0);
      width: 100%;
      padding: 1em;
      border: none;
      border-top: solid 1px rgba(0, 0, 0, 0.15);
      outline: 0;
      border-radius: 0px;
      transition: background-color 225ms ease-out;
    }

    .msg-box-dialog-button:focus {
      background-color: rgba(0, 0, 0, 0.05);
    }

    .msg-box-dialog-button:active {
      background-color: rgba(0, 0, 0, 0.15);
    }

    .msg-box-dialog-textbox {
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

    .msg-box-dialog-textbox:focus {
      border: solid 1px rgba(13, 134, 255, 0.8);
      box-shadow: 0 0 0.1em 0.2em rgba(13, 134, 255, 0.5);
    }

    @media (prefers-color-scheme: dark) {
      .msg-box-modal {
        background-color: rgba(31, 31, 31, 0.5);
      }

      .msg-box-dialog {
        color: #f2f2f2;
        background-color: #464646;
      }

      .msg-box-dialog-textbox {
        background-color: #2f2f2f;
      }
    }

    @media (prefers-color-scheme: light) {
      .msg-box-modal {
        background-color: rgba(221, 221, 221, 0.5);
      }

      .msg-box-dialog {
        color: #101010;
        background-color: #ffffff;
      }
    }
  </style>
  <div class="msg-box-modal">
    <div class="msg-box-dialog">
      <div class="msg-box-dialog-header">
      </div>
      <div class="msg-box-dialog-body">
        <p></p>
      </div>
      <div class="msg-box-dialog-footer">
      </div>
    </div>
  </div>
`

class MessageBoxElement extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }
  
  connectedCallback() {
    this.shadowRoot.appendChild(messageBoxTemplate.content.cloneNode(true))
    this.setDefault()
  }

  /**
   * Set the default value of the dialog box
   */
  setDefault() {
    let content = this.dataset.content
    let title = this.dataset.title
    let type = this.dataset.type
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
      this.setInform(content, title)
      break
    case 'alert':
      this.setAlert(content, title)
      break
    case 'confirm':
      this.setConfirm(content, title)
      break
    case 'prompt':
      this.setPrompt(content, title)
      break
    }
  }
  
  /**
   * Put the title and the content of the dialog box.
   */
  setupDialog(content, title) {
    const dialogHeaderElm = this.shadowRoot.querySelector('.msg-box-dialog-header')
    const dialogBodyElm = this.shadowRoot.querySelector('.msg-box-dialog-body > p')
    dialogBodyElm.innerHTML = content
    if (title === null) {
      dialogHeaderElm.remove()
    } else {
      dialogHeaderElm.innerHTML = title
    }
  }
  
  /**
   * Execute 'animationend' event of the dialog, then dispose
   */
  disposeDialog() {
    const dialogElm = this.shadowRoot.querySelector('.msg-box-dialog')
    dialogElm.classList.add('msg-box-dialog-hide')
    dialogElm.addEventListener('animationend', (evt) => {
      if (evt.animationName === 'msg-box-dialog-hide') {
        this.remove()
      }
    })
  }
  
  t(v) {
    const lang = navigator.language.substring(0, 2)
    const text = {
      'Cancel': {
        'da': 'Annuller',
        'de': 'Abbrechen',
        'fr': 'Annuler',
        'es': 'Cancelar',
        'it': 'Annulla',
        'pt': 'Cancelar',
        'pt-br': 'Cancelar',
        'pl': 'Anuluj',
        'ru': 'Отмена',
        'nl': 'Annuleren',
        'tr': 'İptal'
      }
    }
    return text[v] && text[v][lang] || v
  }
  
  /**
   * Creates the inform dialog element which closes when the given promise is resolved/rejected
   */
  setInform(content, title, promise) {
    this.setupDialog(content, title)
    if (promise) return promise.then(() => this.disposeDialog())
    return Promise.resolve()
  }

  /**
   * Creates the alert dialog element
   */
  setAlert(content, title) {
    this.setupDialog(content, title)
    const dialogFooterElm = this.shadowRoot.querySelector('.msg-box-dialog-footer')
    const dialogConfirmBtn = document.createElement('button')
    dialogConfirmBtn.classList.add('msg-box-dialog-button')
    dialogConfirmBtn.innerText = 'OK'
    dialogFooterElm.append(dialogConfirmBtn)
    dialogConfirmBtn.focus()
    return new Promise((resolve) => {
      dialogConfirmBtn.addEventListener('click', () => {
        this.disposeDialog()
        resolve(true)
      })
    })
  }
  
  /**
   * Creates the confirm dialog element
   */
  setConfirm(content, title) {
    this.setupDialog(content, title)
    const dialogFooterElm = this.shadowRoot.querySelector('.msg-box-dialog-footer')
    const dialogCancelBtn = document.createElement('button')
    const dialogConfirmBtn = document.createElement('button')
    dialogCancelBtn.classList.add('msg-box-dialog-button')
    dialogCancelBtn.innerText = this.t('Cancel')
    dialogConfirmBtn.classList.add('msg-box-dialog-button')
    dialogConfirmBtn.innerText = 'OK'
    dialogFooterElm.append(dialogCancelBtn, dialogConfirmBtn)
    dialogCancelBtn.focus()
    return new Promise((resolve) => {
      dialogCancelBtn.addEventListener('click', () => {
        this.disposeDialog()
        resolve(false)
      })
      dialogConfirmBtn.addEventListener('click', () => {
        this.disposeDialog()
        resolve(true)
      })
    })
  }
  
  /**
   * Creates the prompt dialog element
   */
  setPrompt(content, title) {
    this.setupDialog(content, title)
      // Create Textbox and put into the dialog body.
    const dialogBodyElm = this.shadowRoot.querySelector('.msg-box-dialog-body')
    const dialogMessageTextBoxContainer = document.createElement('p')
    const dialogMessageTextBox = document.createElement('input')
    dialogMessageTextBox.classList.add('msg-box-dialog-textbox')
    dialogMessageTextBox.type = 'text'
    dialogMessageTextBoxContainer.append(dialogMessageTextBox)
    dialogBodyElm.append(dialogMessageTextBoxContainer)
      // Create buttons, and put into the dialog footer.
    const dialogFooterElm = this.shadowRoot.querySelector('.msg-box-dialog-footer')
    const dialogCancelBtn = document.createElement('button')
    const dialogConfirmBtn = document.createElement('button')
    dialogCancelBtn.classList.add('msg-box-dialog-button')
    dialogCancelBtn.innerText = this.t('Cancel')
    dialogConfirmBtn.classList.add('msg-box-dialog-button')
    dialogConfirmBtn.innerText = 'OK'
    dialogFooterElm.append(dialogCancelBtn, dialogConfirmBtn)
    dialogMessageTextBox.focus()
    // Prompt message textbox KeyPress event
    dialogMessageTextBox.addEventListener('keypress', (evt) => {
      if (evt.key === 'Enter') {
        // If Enter key has been pressed
        dialogConfirmBtn.click()
      }
    })
    return new Promise((resolve) => {
      dialogCancelBtn.addEventListener('click', () => {
        this.disposeDialog()
        resolve(null)
      })
      dialogConfirmBtn.addEventListener('click', () => {
        this.disposeDialog()
        resolve(dialogMessageTextBox.value)
      })
    })
  }
}

// Define the custom element as a web component
customElements.define('message-box', MessageBoxElement)

export function inform(content, title = null, promise = null) {
  const dialogBox = document.createElement('message-box')
  document.body.appendChild(dialogBox)
  return dialogBox.setInform(content, title, promise)
}

export function alert(content, title = null) {
  const dialogBox = document.createElement('message-box')
  document.body.appendChild(dialogBox)
  return dialogBox.setAlert(content, title)
}

export function confirm(content, title = null) {
  const dialogBox = document.createElement('message-box')
  document.body.appendChild(dialogBox)
  return dialogBox.setConfirm(content, title)
}

export function prompt(content, title = null) {
  const dialogBox = document.createElement('message-box')
  document.body.appendChild(dialogBox)
  return dialogBox.setPrompt(content, title)
}
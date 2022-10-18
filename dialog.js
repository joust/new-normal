document.head.insertAdjacentHTML(
  'afterBegin',
  `<style>
    .u1x-modal .-buttons {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: .5rem;
        margin-top: 1rem;
    }
    </style>`
)

class Dialog {
  constructor(options) {
    const template = document.createElement('template')
    template.innerHTML =
      `<dialog class="u1x-modal">
            <form method=dialog>
                ${options.body}
                ${options.buttons ? '<div class=-buttons focusgroup></div> ' : ''}
            </form>
        </dialog>`
    const element = this.element = template.content.firstChild
    const btnCont = element.querySelector('.-buttons')
    options.buttons && options.buttons.forEach((btn, i) => {
      const el = document.createElement('button')
      el.innerHTML = btn.title
      el.value = btn.value
      el.addEventListener('click', e => {
        btn.then && btn.then.call(this, e)
      })
      btnCont.appendChild(el)
      if (i === 0) setTimeout(() => el.focus())
    })
    options.init && options.init(this.element)
  }
  show() {
    const element = this.element
    console.log(element)
    document.body.appendChild(element)
    element.showModal()
    return new Promise((resolve, reject) => {
      element.addEventListener('close', () => {
        resolve(this.value)
        element.remove()
      })
    })
  }
}

function toOptions(text) {
  if (typeof text === 'string') {
    return {
      body: htmlEntities(text)
    }
  }
  return text
}


function alert(text) {
  const options = toOptions(text)
  options.buttons = [{
    title: 'OK'
  }]
  return new Dialog(options).show()
}

function confirm(text) {
  const options = toOptions(text)
  options.buttons = [
    {
      title: 'OK',
      then() {
        dialog.value = true
      }
    },
    {
      title: t('Cancel')
    }
    ]
  const dialog = new Dialog(options)
  dialog.value = false
  return dialog.show()
}

function prompt(text, initial) {
  const options = toOptions(text)
  options.body = `<label>${options.body}<input style="width:100%; display:block; margin-top:.5rem"></label>`
  options.buttons = [
    {
      title: 'OK',
      then() {
        dialog.value = input.value
      }
    },
    {
      title: t('Cancel')
    }
    ]
  const dialog = new Dialog(options)
  const input = dialog.element.querySelector('input')
  input.value = initial
  setTimeout(() => input.focus())
  dialog.value = null
  return dialog.show()
}

/*
export function form(html){
    const dialog = new Dialog({
        body:html,
        buttons:[{title:'OK',then(){
            const form = dialog.element.querySelector('form')
            const data = {}
            form.querySelectorAll('input,textarea,select').forEach(el=>{
                data[el.name] = el.value
                if (el.type === 'checkbox') data[el.name] = el.checked ? el.value : null
            })
            dialog.value = data
        }}]
    })
    return dialog.show()
}
*/


// helper functions
function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp').replace(/</g, '&lt').replace(/>/g, '&gt').replace(/"/g, '&quot')
}

function t(v) {
  function getlang() {
    return navigator.language.substring(0, 2)
  }
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
      'ja': 'キャンセル',
      'ko': '취소',
      'zh': '取消',
      'nl': 'Annuleren',
      'tr': 'İptal'
    }
  }
  return text[v][getlang()] || v
}

// close dialog on backdrop-click if it has the backdropClose-class
addEventListener('click', e => {
  const el = e.target
  if (el.tagName !== 'DIALOG') return
  if (!el.classList.contains('backdropClose')) return
  const rect = el.getBoundingClientRect()
  let isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width)
  if (isInDialog) return
  el.close()
})
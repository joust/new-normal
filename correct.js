const patchFiles = supported.reduce((files, lang) => {
  files[lang] = { idiot: {}, sheep: {}}
  return files
}, {}) 
/*const dmp = new diff_match_patch()

function getDiff(base, edited) {
  return dmp.diff_main(base, edited)
}

function patchFile(base, edited, diff) {
  return dmp.patch_toText(dmp.patch_make(base, edited, diff))
}

function htmlFormatted(diff) {
  return dmp.diff_prettyHtml(diff)
}
*/
function setBaseContent(content, lang, idiot) {
  patchFiles[lang][idiot? 'idiot' : 'sheep'].base = content
}

/**
 * update patch file and html formatted representing the users text corrections for wrapper
 *
 * @param {wrapper} target wrapper
 */
function handleCorrection(event) {
  const wrapper = event.target.closest('.card-wrapper')
  const lang = wrapper.querySelector('.location').value.split('-')[0] // ${lang}-${terr}
  const idiot = !wrapper.classList.contains('idiot')
  const type = idiot? 'idiot' : 'sheep'
  const edited = wrapper.querySelector('.tr').innerHTML
  /*
  const base = patchFiles[lang][type].base
  const diff = getDiff(base, edited)
  patchFiles[lang][type].file = patchFile(base, edited, diff)
  patchFiles[lang][type].html = htmlFormatted(diff)
  console.log(patchFiles)
  */
}

/**
 * toggle correct mode for current card
 *
 * @param {wrapper} target wrapper
 */
function toggleCorrectMode(wrapper) {
  if (typeof wrapper === 'string') wrapper = document.querySelector(wrapper)
  const currentMode = wrapper.querySelector('.correct').classList.contains('active')
  wrapper.querySelectorAll('a[id] p, a[id] h2').forEach(e => {
    if (!currentMode)
      e.setAttribute('contenteditable', 'plaintext-only')
    else
      e.removeAttribute('contenteditable')
    e.oninput = debounce(handleCorrection, 1000)
  })
  wrapper.querySelector('.correct').classList.toggle('active', !currentMode)
}

function debounce(callback, wait) {
  let timeoutId = null
  return (...args) => {
    window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args)
    }, wait)
  }
}
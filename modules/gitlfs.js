const root = '/new-normal' // dir checked out from git
const author = { name: 'joust' } // needed for pull

let fs, pfs
export async function initLFS() {
  fs = new LightningFS('fs')
  pfs = fs.promises
}

export async function fetchLFS(path) {
  try {
    await pfs.readFile(`${root}/${path}`)
  } catch (e) {
    console.error(e)
    return ''
  }
}

export async function saveLFS(path, content) {
  try {
    await pfs.writeFile(`${root}/${path}`, content)
  } catch (e) {
    console.error(e)
  }
}

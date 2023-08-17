import http from 'https://unpkg.com/isomorphic-git/http/web/index.js'
import { inform } from '../components/message-box.mjs'

const corsProxy = 'https://cors.isomorphic-git.org'
const url = 'https://github.com/joust/new-normal.git'
const ref = 'master'
const singleBranch = true

const dir = '/new-normal' // dir checked out from git
const author = { name: 'joust' } // needed for pull

let fs, pfs
export async function initLFS() {
  // fs = new LightningFS('fs', { wipe: true })
  fs = new LightningFS('fs')
  pfs = fs.promises

  return inform(
    'Please wait while the git repository is cloned/pulled', 'Work in progress...',
    new Promise(async resolve => {
      // if git dir exists, pull, otherwise clone repo
      try {
        await pfs.readFile(`${dir}/.git/config`) // check if dir & config file is there
        await git.pull({ fs, http, corsProxy, dir, ref, author })
      } catch (e) {
        await pfs.mkdir(dir)
        await git.clone({ fs, http, corsProxy, dir, url, ref, singleBranch, depth: 10 })
      }
      resolve()
    })
  )
}

export async function fetchLFS(path) {
  try {
    return await pfs.readFile(`${dir}/${path}`)
  } catch (e) {
    // console.error(e)
    return ''
  }
}

export async function saveLFS(path, content) {
  try {
    await pfs.writeFile(`${dir}/${path}`, content)
  } catch (e) {
    console.error(e)
  }
}

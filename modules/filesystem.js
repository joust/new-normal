let root
export async function initHDD() {
  root = await window.showDirectoryPicker()
}

export async function fetchHDD(path) {
  try {
    const handle = await pathToHandle(path)
    return handle ? await load(handle) : ''
  } catch (e) {
    // console.error(e)
    return ''
  }
}

export async function saveHDD(path, content) {
  try {
    const handle = await pathToHandle(path)
    return handle ? await save(handle, content) : ''
  } catch (e) {
    console.error(e)
  }
}

// handle with write access
async function pathToHandle(path) {
  const dirs = path.split('/')
  const file = dirs.pop()
  let dir = root
  for (const d of dirs) dir = await dir.getDirectoryHandle(d)
  const handle = await dir.getFileHandle(file)
  return (await verifyPermission(handle, true)) ? handle : undefined
}

async function load(handle) {
  if (await verifyPermission(handle)) {
    const file = await handle.getFile()
    return await file.text()
  } else
    return null
}

async function save(handle, content) {
  if (await verifyPermission(handle, true)) {
    console.log(`saving ${content.length} bytes to '${handle.name}'`)
    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
  } else
    console.log(`no permission to write to file '${handle.name}'`)
}

async function verifyPermission(handle, rw) {
  const options = {}
  if (rw) options.mode = 'readwrite'
  if ((await handle.queryPermission(options)) === 'granted') return true
  if ((await handle.requestPermission(options)) === 'granted') return true
  return false
}

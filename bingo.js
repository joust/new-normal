/**
 * create a DOM Element, optionally with children.
 * Any string given as kids will be converted in a HTML text node
 *
 * @param {string} tag - tag name for the element to create
 * @param {(string|HTMLElement)|(string|HTMLElement)[]} kids - a element or string, or an array of elements or strings
 * @return {HTMLElement} The created element
 */
function elementWithKids(tag, kids) {
  const node = document.createElement(tag)
  if (kids) {
    if (!(kids instanceof Array)) kids = [kids]
    kids.forEach(kid => {
      if (!(kid instanceof HTMLElement)) kid = document.createTextNode(kid)
      node.appendChild(kid)
    })
  }
  return node
}

/**
 * select an unique random element from an array
 * side effect: The element is removed from from the array to achieve the uniqueness!
 *
 * @param {Array} wordset - Array to choose a random element from
 * @return {any} The random element selected
 */
function uniqueWord(wordset) {
  const index = Math.floor((Math.random() * wordset.length))
  return wordset.splice(index, 1)[0]
}

/**
 * generate a BINGO card as an HTML table with the given parent and size size
 *
 * @param {HTMLElement} wrapper - parent element to generate the table into
 * @param {{id: string, word: string}[]} wordset - Array of (id, word) tuples with data for the card
 * @param {number} size - side length for the card to generate (e.g. 3, 5, 7...)
 * @param {string} center - string with comma seperated text alternatives for the center
 */
function makeCard(wrapper, wordset, size, center) {
  const div = wrapper.querySelector('.bingo')
  const rows = []
  if (div.firstChild) div.removeChild(div.firstChild)
  wordset = wordset.slice()
  center = center.split(',')
  for (let y = 0; y < size; y++) {
    const cells = []
    for (let x = 0; x < size; x++) {
      const wordnode = elementWithKids('td')
      if (Math.floor(size / 2) === x && Math.floor(size / 2) === y) {
        wordnode.innerHTML = center[Math.floor(Math.random() * center.length)]
        wordnode.classList.add('center')
        wordnode.classList.add('set')
        wordnode.onclick = event => flipOpen(event)
      } else {
        const set = uniqueWord(wordset)
        wordnode.id = set.id
        wordnode.innerHTML = set.word
        wordnode.onclick = event => {
          const set = event.target.closest('td').classList.toggle('set')
          document.querySelector('#pyro').classList.toggle('hidden',
            !checkCard(event.target.closest('table'), size))
          if (set) {
            const detail = event.target.closest('.card-wrapper').querySelector('.detail')
            detail.classList.add('single')
            detail.querySelector('a[name='+ event.target.id + ']').classList.add('single')
            flipOpen(event)
          }
        }
      }
      cells.push(wordnode)
    }
    rows.push(elementWithKids('tr', cells))
  }
  const table = elementWithKids('table', elementWithKids('tbody', rows))
  div.appendChild(table)
  // safari fix to force flex relayout
  div.parentElement.style.display = 'none'
  div.parentElement.offsetHeight
  div.parentElement.style.display = ''
}

/**
 * check a card table for fully selected rows, colums or diagonals
 * side effect: set the CSS class 'complete' for all elements that are part of a row
 *
 * @param {HTMLElement} table - table element representing the card
 * @param {number} size - side length of the card (e.g. 3, 5, 7...)
 *
 * @return {boolean} True if the card contains at least one full row
 */
function checkCard(table, size) {
  const base = Array.from({length: size}, (_, i) => i+1)
  const allSet = nodes => nodes.reduce((set, node) => set && node.classList.contains('set'), true)
  const rows = base.map(n => Array.from(table.querySelectorAll('tr:nth-of-type('+n+') td')))
  const columns = base.map(n => Array.from(table.querySelectorAll('td:nth-of-type('+n+')')))
  const diagonals = [
    base.map(n => table.querySelector('tr:nth-of-type('+n+') td:nth-of-type('+n+')')), base.map(n => table.querySelector('tr:nth-of-type('+n+') td:nth-of-type('+(size-n+1)+')'))
  ]
  const complete = rows.concat(columns, diagonals).filter(allSet)
  table.querySelectorAll('td').forEach(node => node.classList.remove('complete'))
  complete.forEach(row => row.forEach(node => node.classList.add('complete')))
  return complete.length > 0
}

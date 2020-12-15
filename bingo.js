function elementWithKids(tag, kids) {
  const isDomNode = node => ('object' == typeof node) && ('nextSibling' in node)
  const node = document.createElement(tag)
  if (kids) {
    if (!(kids instanceof Array)) kids = [kids]
    kids.forEach(kid => {
      if (!isDomNode(kid)) kid = document.createTextNode(kid)
      node.appendChild(kid)
    })
  }
  return node
}

function uniqueWord(wordset) {
  const index = Math.floor((Math.random() * wordset.length))
  return wordset.splice(index, 1)[0]
}

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
      if (Math.floor(size / 2) == x && Math.floor(size / 2) == y) {
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
            !checkCard(event.target.closest('table')))
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

function checkCard(table) {
  table.querySelectorAll('td').forEach(node => node.classList.remove('complete'))
  const allSet = nodes => nodes.reduce((set, node) => set && node.classList.contains('set'), true)
  const rows = [1,2,3,4,5].map(n => Array.from(table.querySelectorAll('tr:nth-of-type('+n+') td')))
  const columns = [1,2,3,4,5].map(n => Array.from(table.querySelectorAll('td:nth-of-type('+n+')')))
  const diagonals = [
    [1,2,3,4,5].map(n => table.querySelector('tr:nth-of-type('+n+') td:nth-of-type('+n+')')), [1,2,3,4,5].map(n => table.querySelector('tr:nth-of-type('+n+') td:nth-of-type('+(6-n)+')'))
  ]
  const complete = rows.concat(columns, diagonals).filter(allSet)
  complete.forEach(row => row.forEach(node => node.classList.add('complete')))  
  return complete.length > 0
}

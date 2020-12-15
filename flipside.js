// source: https://github.com/hakimel/css/tree/master/flipside

function flipOpen(event) {
  const flip = event.target.closest('.flip')
  const mx = event.clientX - flip.offsetLeft, my = event.clientY - flip.offsetTop
  const w = flip.offsetWidth, h = flip.offsetHeight

  const directions = [
    { id: 'top', x: w/2, y: 0 },
    { id: 'right', x: w, y: h/2 },
    { id: 'bottom', x: w/2, y: h },
    { id: 'left', x: 0, y: h/2 }
  ]

  directions.sort((a, b) => {
      return distance(mx, my, a.x, a.y) - distance(mx, my, b.x, b.y)
  })

  flip.setAttribute('data-direction', directions.shift().id)
  flip.classList.add('is-open')
}

function flipClose(event) {
  const flip = event.target.closest('.flip')
  flip.classList.remove('is-open')
}

function distance(x1, y1, x2, y2) {
  const dx = x1-x2, dy = y1-y2
  return Math.sqrt(dx*dx + dy*dy)
}

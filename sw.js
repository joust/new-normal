const CACHE = 'new-normal'

// critical app shell files to precache on install
const cacheFiles = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/opensans.css',
  './styles/crocodile.css',
  './styles/style.css',
  './styles/theme.css',
  './styles/uno.css',
  './styles/bingo.css',
  './styles/test.css',
  './styles/flipside.css',
  './styles/pyro.css',
  './styles/noto.css',
  './styles/images/nn-icon.png',
  './styles/images/virus.png',
  './styles/fonts/HVDCrocodileWeb-Bold.woff2',
  './styles/fonts/HVDCrocodileWeb-BoldCondensed.woff2',
  './styles/fonts/HVDCrocodileWeb-Regular.woff2',
  './styles/fonts/open-sans-v18-latin-regular.woff2',
  './styles/fonts/open-sans-v18-latin-300.woff2',
  './styles/fonts/open-sans-v18-latin-italic.woff2',
  './styles/fonts/open-sans-v18-latin-300italic.woff2',
  './styles/fonts/open-sans-v18-latin-800.woff2',
  './define.mjs',
  './modules/main.mjs',
  './modules/common.mjs',
  './modules/content.mjs',
  './modules/bingo.mjs',
  './modules/uno.mjs',
  './modules/test.mjs',
  './modules/uno-bg.mjs',
  './libs/html5-dragdroptouch-shim.mjs',
  './web_modules/boardgame.io.js',
  './web_modules/@boardgame.io/p2p.js',
  './components/base-component.mjs',
  './components/base-card.mjs',
  './components/shared.mjs',
  './components/appeal-to-card.mjs',
  './components/argument-card.mjs',
  './components/banish-card.mjs',
  './components/bingo-card.mjs',
  './components/bingo-detail.mjs',
  './components/bingo-game.mjs',
  './components/cancel-card.mjs',
  './components/card-back.mjs',
  './components/card-pile.mjs',
  './components/centered-cards.mjs',
  './components/discuss-card.mjs',
  './components/editable-card.mjs',
  './components/fallacy-card.mjs',
  './components/fitted-text.mjs',
  './components/flip-area.mjs',
  './components/flip-card.mjs',
  './components/game-card.mjs',
  './components/label-card.mjs',
  './components/locale-selector.mjs',
  './components/message-box.mjs',
  './components/no-card.mjs',
  './components/opponent-hand.mjs',
  './components/pause-card.mjs',
  './components/player-hand.mjs',
  './components/pyro-effect.mjs',
  './components/research-card.mjs',
  './components/sources-back.mjs',
  './components/strawman-card.mjs',
  './components/test-card.mjs',
  './components/test-certificate.mjs',
  './components/test-game.mjs',
  './components/test-pile.mjs',
  './components/topic-manager.mjs',
  './components/uno-game.mjs'
]

// on install: precache app shell, activate immediately
// addAll is all-or-nothing — if one file 404s, fall back to caching individually
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache =>
        cache.addAll(cacheFiles).catch(() =>
          Promise.allSettled(cacheFiles.map(f => cache.add(f)))
        )
      )
      .then(() => self.skipWaiting())
  )
})

// on activate: clean up old versioned caches, claim clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n !== CACHE).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  )
})

// network-first with 8s timeout: try network, cache successful responses, fall back to cache
// only intercept same-origin GET requests
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  if (new URL(event.request.url).origin !== self.location.origin) return

  event.respondWith(
    new Promise((resolve, reject) => {
      const timeout = setTimeout(reject, 8000)
      fetch(event.request).then(response => {
        clearTimeout(timeout)
        resolve(response)
      }, reject)
    })
      .then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        caches.open(CACHE).then(cache => cache.match(event.request))
      )
  )
})

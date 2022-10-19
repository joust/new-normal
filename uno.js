const INITIAL = 8
const PERCENTAGE_APPEAL_TOS = 15 // e.g. 600 argument cards => 90 appeal to cards
const PERCENTAGE_STRAWMANS = 15 // e.g. 600 argument cards => 90 strawman cards
const PERCENTAGE_RESEARCHS = 20 // e.g. 600 argument cards => 120 research cards
const PERCENTAGE_LABELS = 15 // e.g. 600 argument cards => 90 research cards
const PERCENTAGE_FALLACIES = 15 // e.g. 600 argument cards => 90 research cards
const INVALID_MOVE = 'INVALID_MOVE'

/**
Game state: {
    lang: 'de', // opponents have to use the same language!
    deck: {
      idiot: ['I1', 'I2', ...],
      sheep: ['S1', 'S2', ...]
    },
    pile: [],
    hands: [[], ...]
    names: ['']
}
*/
let content
const Uno = {
  name: 'NewNormalUno',
  init: async (lang) => {
    content = await init(lang)
  },
  setup: (ctx) => {
    const decks = generateDecks()
    const hands = new Array(ctx.numPlayers).fill([]).map((p,i) => drawHand(decks, INITIAL, isIdiot(i)))
    const names = new Array(ctx.numPlayers).fill(undefined)
    const pile = [] // empty in the beginning
    return { lang: document.body.lang, decks, pile, hands, names }
  },
  moves: {
    playCard: (G, ctx, index) => {
      const idiot = isIdiot(ctx.currentPlayer)
      const hand = G.hands[ctx.currentPlayer]
      if (index === undefined || index >= hand.length) return INVALID_MOVE
      
      const card = hand[index]
      const top = G.pile.length ? G.pile[G.pile.length-1] : undefined
      if (!canBePlayedOn(top, card, idiot)) return INVALID_MOVE

      switch(card[0]) {
        case 'F': // fallacy
        case 'L': // label
          hand.splice(index, 1)
          G.pile.push(card) // allows to play any argument card afterwards
          break
        case 'R': // research
          resolveResearch(hand, G.decks, top, idiot)
          hand.splice(index, 1)
          break
        case 'S': // strawman
          resolveStrawman(hand, G.decks, idiot)
          hand.splice(index, 1)
          G.pile.push(card)
          break
        case 'A': // appeal to
        default: // argument
          hand.splice(index, 1)
          G.pile.push(card)
          // only playing a valid argument card of your side ends the turn
          if (isOfType(card, idiot)) {
            ctx.events.endTurn()
          }
      }
    },
    drawCard: (G, ctx) => {
      const hand = G.hands[ctx.currentPlayer]
      const type = isIdiot(ctx.currentPlayer) ? 'idiot' : 'sheep'
      const deck = G.decks[type]
      if (!hand.length) return INVALID_MOVE
      hand.push(deck.pop())
    },
    setName: (G, ctx, id, name) => {
      if (ctx.currentPlayer==='0')
        G.names = G.names.map((n, i) => i==id ? name : n);
      else
        return INVALID_MOVE
    }
    // reorder hand?
  },
  endIf: (G, ctx) => {
    const idiot = isIdiot(ctx.currentPlayer)
    const hand = G.hands[ctx.currentPlayer]
    const top = G.pile.length ? G.pile[G.pile.length-1] : undefined
    if (!hand.length && (isArgument(top) || isAppealTo(top)) && isOfType(top, idiot))
      return { winner: ctx.currentPlayer }
  },
  minPlayers: 2,
  disableUndo: true, // Disable undo feature for all the moves in the game
  ai: {
    enumerate: (G, ctx) => {
      const idiot = isIdiot(ctx.currentPlayer)
      const hand = G.hands[ctx.currentPlayer]
      const top = G.pile.length ? G.pile[G.pile.length-1] : undefined
      const toPlayMove = (card, index) => ({ move: 'playCard', args: [index]})
      const canBePlayed = move => canBePlayedOn(top, hand[move.args[0]], idiot)
      return [ { move: 'drawCard', args: [] }, ...hand.map(toPlayMove).filter(canBePlayed) ]
    }
  }
}

function canBePlayedOn(top, card, idiot) {
  if (top && !top.length) top = undefined // empty string or array
  switch(card[0]) {
    case 'F': // fallacy
    case 'L': // label
      return true
    case 'R': // research
      return top && (isArgument(top) || isAppealTo(top))
    case 'S': // strawman
      return top && isArgument(top)
    case 'A': // appeal to
      return isOfType(card, idiot) && 
        (!top || isAppealTo(top) || isArgument(top) || isFallacy(top) || isLabel(top))
    default: // argument
      return (top && isStrawman(top) && (isArgument(card) || isAppealTo(top)) && isOfType(card, !idiot))
        || isOfType(card, idiot) && (!top 
          || isAppealTo(top) 
          || (isArgument(top) && topicOf(card)===topicOf(top))
          || isFallacy(top) 
          || isLabel(top))
  }
}

/** check player for idiot */
function isIdiot(player) {
  return !!(player%2) // every second player is an idiot
}

function isArgument(id) { return id.includes(':') }
function isAppealTo(id) { return id.startsWith('A') }
function isFallacy(id) { return id.startsWith('F') }
function isLabel(id) { return id.startsWith('L') }
function isStrawman(id) { return id.startsWith('S') }
function isResearch(id) { return id.startsWith('R') }

/** check for type of card */
function isOfType(id, idiot) {
  return (id.includes('I') && idiot) || (id.includes('S') && !idiot)
}

/** find topic of card */
function topicOf(id) {
  return isArgument(id) ? id.split(':')[0] : undefined
}

/** check for topic match */
function hasTopic(id, topic) {
  return isArgument(id) ? id.split(':')[0]===topic : false
}

/**
 * look up cards matching the current argument on the pile and add to hand
 * gives you up to three argument cards
 * @param {Array}} hand The players hand.
 * @param {{idiot: Array, sheep: Array}} decks The decks.
 * @param {string} card card to counter on the pile
 */ 
function resolveResearch(hand, decks, top, idiot) {
  const deck = decks[idiot ? 'idiot' : 'sheep']
  const nrOfCards = 1+Math.floor(Math.random()*3)
  let cards
  if (isAppealTo(top)) {
    cards = deck.filter(isAppealTo).slice(0, nrOfCards)
    if (cards.length < nrOfCards)
      cards = [...cards, deck.filter(isArgument).slice(0, nrOfCards-cards.length)]
  } else {
    const topic = topicOf(top)
    cards = deck.filter(c => hasTopic(c, topic)).slice(0, nrOfCards)
    if (cards.length < nrOfCards)
      cards = [...cards, deck.filter(isAppealTo).slice(0, nrOfCards-cards.length)]
  }
  cards.forEach(card => deck.splice(deck.indexOf(card), 1))
  hand.push(...cards)
}

/**
 * look up other sides argument cards matching the arguments in hand - and add to hand
 * gives you one argument card of the other side that you can counter afterwards
 * @param {Array}} hand The players hand.
 * @param {{idiot: Array, sheep: Array}} decks The decks.
 * @param {boolean} idiot current player type.
 */ 
function resolveStrawman(hand, decks, idiot) {
  const deck = decks[idiot ? 'sheep' : 'idiot']
  const myTopics = hand.filter(isArgument).map(topicOf)
  let cards = deck.filter(isArgument).filter(c => myTopics.includes(topicOf(c)))
  if (cards.length) {
    deck.splice(deck.indexOf(cards[0]), 1)
    hand.push(cards[0])
  } else {
    cards = deck.filter(isAppealTo)
    if (cards.length) {
      deck.splice(deck.indexOf(cards[0]), 1)
      hand.push(cards[0])
    }
  }
}

/**
 * draw an initial hand of size size from a given deck
 * side effect: will modify the given deck
 * @param {{idiot: Array, sheep: Array}} decks The decks.
 * @param {number} size The size of the hand.
 * @param {boolean} idiot if to use the idiot or sheep deck.
 */
function drawHand(decks, size, idiot) {
  const deck = decks[idiot ? 'idiot' : 'sheep']
  const hand = []
  while (size--) hand.push(deck.pop())
  return hand
}

/**
 * generates decks for idiot and sheep
 * @param {string} lang The language.
 */
function generateDecks(lang) {
  const decks = { idiot: initialDeck(true), sheep: initialDeck(false) }
  adjustDeckSize(decks)
  shuffle(decks.idiot)
  shuffle(decks.sheep)
  return decks
}

/**
 * generates an initial deck
 * @param {string} lang The language.
 * @param {boolean} idiot If idiot or sheep deck.
 */
function initialDeck(idiot) {
  const type = idiot ? 'I' : 'S'
  const cards = content[idiot ? 'idiot' : 'sheep']
  const nargs = cards.args.length
  const strawmans = new Array(Math.round(PERCENTAGE_STRAWMANS*nargs/100)).fill(`S${type}`)
  const researchs = new Array(Math.round(PERCENTAGE_RESEARCHS*nargs/100)).fill(`R${type}`)
  const labels = elementsFrom(Math.round(PERCENTAGE_LABELS*nargs/100), cards.labels)
  const fallacies = elementsFrom(Math.round(PERCENTAGE_FALLACIES*nargs/100), cards.fallacies)
  const appealTos = elementsFrom(Math.round(PERCENTAGE_APPEAL_TOS*nargs/100), cards.appealTos)
  return [...cards.args, ...labels, ...fallacies, ...appealTos, ...strawmans, ...researchs]
}

/**
 * selects n elements from a list (which can be longer or shorter than n)
 * if list has no entries, an empty array is returned
 * @param {number} n number of cards to select.
 * @param {Array} list the list to select from.
 * @return {any} The selected elements
 */
function elementsFrom(n, list) {
  const selection = []
  if (!list.length) return selection
  while (n >= list.length) {
    selection.push(...list)
    n -= list.length
  }
  const rest = shuffle([...list])
  selection.push(...rest.slice(0, n))
  return selection
}

/**
 * perform async initialization by loading all needed files so the game engine can run sync
 * @param {string} lang The language.
 * @return {any} A content structure
 */
async function init(lang) {
  const topicMap = await fetchTopicMap()
  const topicMapped = id => `${topicMap[id]||''}:${id}`
  return {
    idiot: {
      args: (await fetchContentIds(lang, 'idiot')).map(topicMapped),
      labels: await fetchContentIds(lang, 'labels', 'LI'),
      fallacies: await fetchContentIds(lang, 'fallacies', 'FI'),
      appealTos: await fetchContentIds(lang, 'appeal-tos', 'AI')
    },
    sheep: {
      args: (await fetchContentIds(lang, 'sheep')).map(topicMapped),
      labels: await fetchContentIds(lang, 'labels', 'LS'),
      fallacies: await fetchContentIds(lang, 'fallacies', 'FS'),
      appealTos: await fetchContentIds(lang, 'appeal-tos', 'AS')
    }
  }
}

/**
 * adjust the deck size of the smaller deck 
 * by duplicating labels, fallacies, appealTos, strawmans or researchs
 * side effect: directly changes the smaller array
 * @param {{idiot: Array, sheep: Array}} decks The unadjusted decks
 */
function adjustDeckSize(decks) {
  const larger = decks.idiot.length > decks.sheep.length ? decks.idiot : decks.sheep
  const smaller = decks.idiot.length > decks.sheep.length ? decks.sheep : decks.idiot
  let difference = larger.length - smaller.length
  const start = smaller.findIndex(c => c.startsWith('L')) // do not duplicate argument cards
  while(difference--) smaller.push(randomElement(smaller, start))
}

/**
 * return a random element from an array, starting from element start
 *
 * @param {Array} array - Array to choose a random element from
 * @param {number} start - Element to start with (default 0)
 * @return {any} The random element selected
 */
function randomElement(array, start = 0) {
  return array[start + Math.floor((Math.random() * (array.length-start)))]
}

/**
 * Shuffles array in place.
 * @param {Array} array An array containing the items.
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Fetch ids from given content file, optionally filter by substring.
 * @param {string} lang The language.
 * @param {string} file The filename (without suffix).
 * @param {string} filter An optional string filter.
 */
async function fetchContentIds(lang, file, filter = '') {
  const content = await fetchSilent(`${lang}/${file}.html`)
  return [...content.matchAll(/a id="([^"]*)"/g)].map(r => r[1]).filter(id => id.includes(filter))
}

/** Fetch all topics and arguments into a hash argumentId => topicId */
async function fetchTopicMap() {
  const content = await fetchSilent(`topics-new.html`)
  const topicIds = [...content.matchAll(/p id="([^"]*)"/g)].map(r => r[1])
  const topicMap = {}
  for (const id of topicIds) {
    const subcontent = content.match(`p id="${id}">((.|\n)*?)<\/p`)[1]
    const argIds = [...subcontent.matchAll(/a id="([^"]*)"/g)].map(r => r[1])
    for (const argId of argIds) topicMap[argId] = id
  }
  return topicMap
}


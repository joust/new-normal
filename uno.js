const INITIAL = 8
const STRAWMANS = 100
const JOKERS = 100
const INVALID_MOVE = 'INVALID_MOVE'

/**
Game state: {
    deck: {
      idiot: ['I1', 'I2', ...],
      sheep: ['S1', 'S2', ...]
    },
    pile: [],
    hands: [[], ...]
}
*/
let content
export const Uno = {
  init: async (lang) => {
    content = await init(lang)
  },
  setup: (ctx) => {
    const decks = generateDecks()
    const hands = new Array(ctx.numPlayers).fill([]).map((p,i) => drawHand(decks, INITIAL, isIdiot(i)))
    const pile = [] // empty in the beginning
    return { decks, pile, hands }
  },
  moves: {
    playCard: (G, ctx, index) => {
      const idiot = isIdiot(ctx.currentPlayer)
      const hand = G.hands[ctx.currentPlayer]
      if (index === undefined || index >= hand.length) return INVALID_MOVE
      const card = hand[index]
      const top = G.pile.length ? G.pile[G.pile.length-1] : undefined
      switch(card[0]) {
        case 'A': // appeal to
        case 'F': // fallacy
        case 'L': // label
          hand.splice(index, 1)
          G.pile.push(card) // allows to play any argument card afterwards
          break;
        case 'J': // joker
          if (top && isArgument(top)) {
            resolveJoker(hand, G.decks, top, idiot)
            hand.splice(index, 1)
          } else return INVALID_MOVE
          break;
        case 'S': // strawman
          if (top && isArgument(top)) {
            resolveStrawman(hand, G.decks, isIdiot(ctx.currentPlayer))
            hand.splice(index, 1)
            G.pile.push(card)
          } else return INVALID_MOVE
          break;
        default: // argument card
          if (top && top[0]==='S' && isArgument(card) && isOfType(card, !idiot)) {
            hand.splice(index, 1)
            G.pile.push(card)
          } else if (!top 
                    || (isArgument(top) && isOfType(card, idiot) && topicOf(card)===topicOf(top))
                    || (['A','F','L'].includes(top[0]) && isOfType(card, idiot))) {
            hand.splice(index, 1)
            G.pile.push(card)
            ctx.events.endTurn() // only playing a valid argument card of your side ends the turn
          } else return INVALID_MOVE
      }
    },
    drawCard: (G, ctx) => {
      const hand = G.hands[ctx.currentPlayer]
      const type = isIdiot(ctx.currentPlayer) ? 'idiot' : 'sheep'
      const deck = G.decks[type]
      hand.push(deck.pop())
    }
    // reorder hand?
  },
  endIf: (G, ctx) => {
    const winner = G.hands.findIndex(hand => hand && hand.length === 0)
    if (winner >= 0) return { winner }
  },
  minPlayers: 2,
  maxPlayers: 10,
  // Disable undo feature for all the moves in the game
  disableUndo: true
}

/** check player for idiot */
function isIdiot(player) {
  return !!(player%2) // every second player is an idiot
}

/** check for argument card */
function isArgument(id) {
  return id.includes(':')
}

/** check for type of card */
function isOfType(id, idiot) {
  return isArgument(id) ? id.split(':')[1].startsWith('I')===idiot : undefined
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
function resolveJoker(hand, decks, top, idiot) {
  const deck = decks[idiot ? 'idiot' : 'sheep']
  const topic = topicOf(top)
  const cards = deck.filter(c => hasTopic(c, topic))
  shuffle(cards)
  hand.push(...cards.slice(0, 1+Math.floor(Math.random()*3))) // 1..3
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
  const cards = deck.filter(isArgument).filter(c => myTopics.includes(topicOf(c)))
  shuffle(cards)
  hand.push(cards[0])
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
  const strawmans = new Array(STRAWMANS).fill(`S${type}`)
  const jokers = new Array(JOKERS).fill(`J${type}`)
  return [...cards.args, ...cards.labels, ...cards.fallacies, ...cards.appealTos, ...strawmans, ...jokers]
}

/**
 * perform async initialization by loading all needed files so the game engine can run sync
 * @param {string} lang The language.
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
 * by duplicating labels, fallacies, appealTos, strawmans or jokers
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

/**
 * fetch a file from server, suppressing all errors
 *
 * @param {string} url - the url to fetch
 * @return {Promise<string>} the files content or '' on error
 */
function fetchSilent(url) {
  return fetch(url).then(async response => response.status >= 400 && response.status < 600 ? '' : await response.text()).catch(error => '')  
}


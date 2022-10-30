const { Client } = require('boardgame.io/client')
const { Local } = require('boardgame.io/multiplayer')
const { P2P } = require('@boardgame.io/p2p')
const INITIAL = 8
const PERCENTAGE_APPEAL_TOS = 15 // e.g. 600 cards => 90 appeal to cards
const PERCENTAGE_DISCUSSES = 5
const PERCENTAGE_STRAWMANS = 20
const PERCENTAGE_RESEARCHS = 20
const PERCENTAGE_LABELS = 20
const PERCENTAGE_FALLACIES = 20
const PERCENTAGE_PAUSES = 10
const INVALID_MOVE = 'INVALID_MOVE'

async function startLocal(lang, playerID) {
  const game = await Uno(lang, playerID)
  const player = Client({ game, playerID, multiplayer: Local() })
  const bot = Client({ game, playerID: playerID==='0' ? '1' : '0', multiplayer: Local() })
  player.start()
  bot.start()
  return playerID==='0' ? [player, bot] : [bot, player]
}

async function startClient(lang, isHost, numPlayers, playerID, matchID) {
  const game = await Uno(lang, isHost ? playerID : undefined)
  const peerOptions = { host: 'new-normal.app', port: 9443 }
  
  const client = Client({
    game,
    numPlayers,
    matchID,
    playerID,
    multiplayer: P2P({
      isHost,
      peerOptions,
      onError: e => { console.log('P2P error', e) }
    })
  })
  client.start()
  return client
}

/**
Uno game engine. Game state: {
    lang: 'de', // opponents have to use the same language!
    host: '0'/'1', 
    decks: {
      idiot: ['I1', 'I2', ...],
      sheep: ['S1', 'S2', ...]
    },
    pile: [],
    hands: [[], ...],
    names: ['']
}
*/
async function Uno(lang, host) {
  const [topics, topicMap] = await fetchTopics()
  const content = await init(lang)
 
  /**
   * adds wildcard argument cards to every players hand, removing the 
   * @param {Array}} hand The players hand.
   * @param {{idiot: Array, sheep: Array}} decks The decks.
   * @param {string} top top card on the pile
   * @param {boolean} idiot if an idiot
   */ 
  function resolveDiscuss(hands, decks, card) {
    const topic = topicOf(card)
    const firstI = decks.idiot.findLast(c => isArgument(c) && hasTopic(c, topic))
    const firstS = decks.sheep.findLast(c => isArgument(c) && hasTopic(c, topic))
    hands.forEach((hand, index) => {
      const idiot = isIdiot(index)
      // first remove all matching cards of this players hand
      hand.filter(c => isArgument(c) && isOfType(c, idiot) && hasTopic(c, topic)).forEach(c => hand.splice(hand.indexOf(c), 1))
      // next add the wildcard argument to his hand
      if (idiot && firstI)
        hand.push(`${firstI}*`)
      else if (!idiot && firstS)
        hand.push(`${firstS}*`)  
      // else do nothing for this player
    })
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
        cards = [...cards, ...deck.filter(isArgument).slice(0, nrOfCards-cards.length)]
    } else {
      const topic = topicOf(top)
      cards = deck.filter(c => isArgument(c) && hasTopic(c, topic)).slice(0, nrOfCards)
      if (cards.length < nrOfCards)
        cards = [...cards, ...deck.filter(isAppealTo).slice(0, nrOfCards-cards.length)]
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
   * draw an a card from the given deck into the given hand
   * side effect: will modify both the given deck and hand
   * @param {Array} hand The hand.
   * @param {Array} deck The deck.
   */
    function draw(hand, deck) {
    const top = deck[deck.length - 1]
    if (isArgument(top) || isAppealTo(top))
      deck.unshift(deck.pop()) // don't remove but put to the 'end' of the deck
    else
      deck.pop()
    hand.push(top)
  }
  
  /**
   * draw an initial hand of size size from a given deck
   * side effect: will modify the given deck
   * @param {{idiot: Array, sheep: Array}} decks The decks.
   * @param {number} size The size of the hand.
   * @param {boolean} idiot if to use the idiot or sheep deck.
   * @return {Array} the hand
   */
  function drawHand(decks, size, idiot) {
    const deck = decks[idiot ? 'idiot' : 'sheep']
    const hand = []
    while (size--) draw(hand, deck)
    return hand
  }

  /**
   * generates decks for idiot and sheep
   * @param {string} lang The language.
   * @return {{idiot: Array, sheep: Array}} The generated decks
   */
  function generateDecks(lang, players) {
    const decks = { idiot: initialDeck(true, players), sheep: initialDeck(false, players) }
    adjustDeckSize(decks)
    shuffle(decks.idiot)
    shuffle(decks.sheep)
    return decks
  }

  /**
   * generates an initial deck
   * @param {boolean} idiot If idiot or sheep deck.
   * @param {number} players Number of players.
   */
  function initialDeck(idiot, players) {
    const type = idiot ? 'I' : 'S'
    const cards = content[idiot ? 'idiot' : 'sheep']
    const nargs = cards.args.length
    const strawmans = new Array(Math.round(PERCENTAGE_STRAWMANS*nargs/100)).fill(`N${type}`)
    const researchs = new Array(Math.round(PERCENTAGE_RESEARCHS*nargs/100)).fill(`R${type}`)
    const labels = elementsFrom(Math.round(PERCENTAGE_LABELS*nargs/100), cards.labels)
    const fallacies = elementsFrom(Math.round(PERCENTAGE_FALLACIES*nargs/100), cards.fallacies)
    const appealTos = elementsFrom(Math.round(PERCENTAGE_APPEAL_TOS*nargs/100), cards.appealTos)
    const pauses = players > 2 ? new Array(Math.round(PERCENTAGE_PAUSES*nargs/100)).fill(`P${type}`) : []
    const discusses = elementsFrom(Math.round(PERCENTAGE_DISCUSSES*nargs/100), cards.discusses)
    return [...cards.args, ...labels, ...fallacies, ...appealTos, ...strawmans, ...researchs, ...pauses, ...discusses]
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
   * helper for init, loading one side of the arguments
   * @param {string} lang The language.
   * @return {any} A content structure
   */
  async function fetchContent(lang, idiot) {
    const topicMapped = id => topicMap[id] ? topicMap[id].map(topicId => `${topicId}:${id}`) : [`:${id}`]
    const [args, labels, fallacies, appealTos]  = await Promise.all([
      fetchContentIds(lang, idiot ? 'idiot' : 'sheep'),
      fetchContentIds(lang, 'labels', idiot ? 'LI' : 'LS'),
      fetchContentIds(lang, 'fallacies', idiot ? 'FI' : 'FS'),
      fetchContentIds(lang, 'appeal-tos', idiot ? 'AI' : 'AS')
      ])
    const discusses = topics.map(topic => `${topic}:${idiot ? 'DI' : 'DS'}`)
    return {args: args.flatMap(topicMapped), labels, fallacies, appealTos, discusses}
  }
  
  /**
   * perform async initialization by loading all needed files so the game engine can run sync
   * @param {string} lang The language.
   * @return {any} A content structure
   */
  async function init(lang) {
    const [idiot, sheep] = await Promise.all([
      fetchContent(lang, true),
      fetchContent(lang, false),
    ])
    return {idiot, sheep}
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
   * Shuffles array in place (side effect).
   * @param {Array} array An array containing the items.
   * @return {Array} the shuffled array
   */
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }
  
  function removeFrom(deckOrHand, card) {
    card = argumentOnly(card)
    const index = deckOrHand.findIndex(c => argumentOnly(c)===card)
    if (index>=0) deckOrHand.splice(index, 1)
  }

  function removeTopicFrom(hands, card) {
    hands.forEach(hand => {
      const index = hand.findIndex(c => isDiscuss(c) && topicOf(c)===topicOf(card))
      if (index>=0) hand.splice(index, 1)
    })
  }

  /**
   * Fetch ids from given content file, optionally filter by substring.
   * @param {string} lang The language.
   * @param {string} file The filename (without suffix).
   * @param {string} filter An optional string filter.
   * @return {Array} The content ids
   */
  async function fetchContentIds(lang, file, filter = '') {
    const content = await fetchSilent(`${lang}/${file}.html`)
    return [...content.matchAll(/a id="([^"]*)"/g)].map(r => r[1]).filter(id => id.includes(filter))
  }

  /** Fetch all topics and arguments into a topics array and both a topics array and hash
   * @return {Array} The topic id array and a hash argumentId => [topicId]
   */
  async function fetchTopics() {
    const content = await fetchSilent(`topics-new.html`)
    const topicIds = [...content.matchAll(/p id="([^"]*)"/g)].map(r => r[1])
    const map = {}
    for (const id of topicIds) {
      const subcontent = content.match(`p id="${id}">((.|\n)*?)<\/p`)[1]
      const argIds = [...subcontent.matchAll(/a id="([^"]*)"/g)].map(r => r[1])
      for (const argId of argIds) if (map[argId]) map[argId].push(id); else map[argId] = [id]
    }
    return [topicIds, map]
  }
  
  return {
    name: 'newnormaluno',
    content,
    setup: (ctx) => {
      const decks = generateDecks(ctx.numPlayers)
      const hands = new Array(ctx.numPlayers).fill([]).map((p,i) => drawHand(decks, INITIAL, isIdiot(i)))
      const names = new Array(ctx.numPlayers).fill(undefined)
      const pile = [] // empty in the beginning
      return { lang, host, decks, pile, hands, names }
    },
    moves: {
      playCard: (G, ctx, index, alt) => { // alt = alternative card to put on the pile
        const idiot = isIdiot(ctx.currentPlayer)
        const deck = idiot ? G.decks.idiot : G.decks.sheep
        const hand = G.hands[ctx.currentPlayer]
        if (index === undefined || index >= hand.length) return INVALID_MOVE

        const card = hand[index]
        alt = alt ? argumentOnly(alt) : argumentOnly(card) // if not given, use the card
        
        const top = G.pile.length ? G.pile[G.pile.length-1] : undefined
        if (!canBePlayedOn(top, card, idiot)) return INVALID_MOVE

        switch(cardType(card)) {
          case 'F': // Fallacy
          case 'L': // Label
            hand.splice(index, 1)
            G.pile.push(alt) // allows to play any argument card afterwards
            break
          case 'D': // Discuss
            hand.splice(index, 1)
            resolveDiscuss(G.hands, G.decks, card)
            G.pile.push(alt)
            break
          case 'R': // Research
            resolveResearch(hand, G.decks, top, idiot)
            hand.splice(index, 1)
            break
          case 'N': // strawmaN
            resolveStrawman(hand, G.decks, idiot)
            hand.splice(index, 1)
            G.pile.push(alt)
            break
          case 'P': // Pause
            hand.splice(index, 1)
            G.pile.push(alt) // allows to play any argument card afterwards
            ctx.events.endTurn({ next: ctx.playOrder[(ctx.playOrderPos + 2) % ctx.numPlayers]})
            break;
          case 'A': // Appeal to
            removeFrom(deck, card) // appeal to cards are only removed from their deck when played
            hand.splice(index, 1)
            G.pile.push(alt)
            break
          default: // argument
            removeFrom(deck, argumentOnly(card)) // argument cards are only removed from their deck when played
            if (isWildcard(card))
              resolveDiscuss(G.hands, G.decks, card)
            else  
              hand.splice(index, 1)
            G.pile.push(alt)
        }
      },
      drawCard: (G, ctx) => {
        const hand = G.hands[ctx.currentPlayer]
        const type = isIdiot(ctx.currentPlayer) ? 'idiot' : 'sheep'
        const deck = G.decks[type]
        if (!deck.length) return INVALID_MOVE
        draw(hand, deck)
      },
      setName: (G, ctx, id, name) => {
        if (ctx.currentPlayer===G.host)
          G.names = G.names.map((n, i) => i==id ? name : n);
        else
          return INVALID_MOVE
      }
      // feat: update hand (to persist changed argument / appeal-to cards)
      // feat: reorder hand (to persist order)?
    },
    events: {
      endGame: false // disallow to manually endGame
    },
    turn: {
      order: {
        first: (G, ctx) => host==='0' ? 0 : 1,
        next: (G, ctx) => (ctx.playOrderPos + 1) % ctx.numPlayers
      },
      endIf: (G, ctx) => {
        const idiot = isIdiot(ctx.currentPlayer)
        const top = G.pile.length ? G.pile[G.pile.length-1] : undefined
        // only when a valid argument / appeal to card was played, the turn is over
        return top && isOfType(top, idiot) && (isAppealTo(top) || isArgument(top) || isDiscuss(top))
      }
    },
    endIf: (G, ctx) => {
      const idiot = isIdiot(ctx.currentPlayer)
      const hand = G.hands[ctx.currentPlayer]
      const top = G.pile.length ? G.pile[G.pile.length-1] : undefined
      if (!hand.length && (isArgument(top) || isAppealTo(top) || isDiscuss(top)) && isOfType(top, idiot))
        return { winner: ctx.currentPlayer } // TODO >2 multiplayer ends, when all of one side are finished
    },
    minPlayers: 2,
    disableUndo: true, // Disable undo feature for all the moves in the game
    ai: {
      enumerate: (G, ctx) => {
        const idiot = isIdiot(ctx.currentPlayer)
        const hand = G.hands[ctx.currentPlayer]
        const top = G.pile.length ? G.pile[G.pile.length-1] : undefined
        return allPossibleMoves(hand, idiot, top)
      }
    }
  }
}

function canBePlayedOn(top, card, idiot) {
  if (top && !top.length) top = false // empty string or array
  switch(cardType(card)) {
    case 'D': // Discuss
    case 'F': // Fallacy
    case 'L': // Label
    case 'P': // Pause
      return !top || !isStrawman(top)
    case 'R': // Research
      return top && (isArgument(top) || isAppealTo(top))
    case 'N': // strawmaN
      return top && isArgument(top)
    case 'A': // Appeal to
      return isOfType(card, !idiot) && isStrawman(top) 
      || isOfType(card, idiot) && 
        (!top || isArgument(top) || isAppealTo(top) || isFallacy(top) || isLabel(top))
    case 'I': // Idiot argument
    case 'S': // Sheep argument
      return top && isStrawman(top) && (isArgument(card) || isAppealTo(card)) && isOfType(card, !idiot)
        || isOfType(card, idiot) && (!top 
          || isAppealTo(top) 
          || ((isArgument(top) || isDiscuss(top)) && topicOf(card)===topicOf(top))
          || isFallacy(top) 
          || isLabel(top))
  }
}

function allPossibleMoves(hand, idiot, top) {
  const toPlayMove = (card, index) => ({ move: 'playCard', args: [index]})
  const canBePlayed = move => canBePlayedOn(top, hand[move.args[0]], idiot)
  return [ { move: 'drawCard', args: [] }, ...hand.map(toPlayMove).filter(canBePlayed) ]
}

function getAlternatives(id, decks, content) {
  const type = isOfType(id, true) ? 'idiot' : 'sheep'
  const deck = decks[type]
  const cards = content[type]
  if (isArgument(id)) return deck.filter(card => isArgument(card) && hasTopic(card, topicOf(id))) // TODO sort by id
  if (isAppealTo(id)) return cards.appealTos
  if (isFallacy(id)) return cards.fallacies
  if (isLabel(id)) return cards.labels
  if (isDiscuss(id)) return cards.discusses
  return [id]
}
    

/** check player for idiot */
function isIdiot(player) {
  return !!(player%2) // every second player is an idiot
}

/** check for all types of cards */
function cardType(id) { return id.includes(':') ? id.split(':')[1][0] : id[0] }
function isArgument(id) { return id.includes(':I') || id.includes(':S') }
function isAppealTo(id) { return id.startsWith('A') }
function isFallacy(id) { return id.startsWith('F') }
function isLabel(id) { return id.startsWith('L') }
function isStrawman(id) { return id.startsWith('N') }
function isResearch(id) { return id.startsWith('R') }
function isDiscuss(id) { return id.includes('D') }
function isPause(id) { return id.startsWith('P') }

/** check if type of card matches input */
function isOfType(id, idiot) {
  return (id.includes('I') && idiot) || (id.includes('S') && !idiot)
}

/** find topic of card */
function topicOf(id) {
  return isArgument(id)||isDiscuss(id) ? id.split(':')[0] : undefined
}

/** check for topic match */
function hasTopic(id, topic) {
  return isArgument(id)||isDiscuss(id) ? id.split(':')[0]===topic : false
}

/** check for wildcard */
function isWildcard(id) {
  return isArgument(id) && id.endsWith('*')
}

/** remove wildcard */
function argumentOnly(id) {
  return id.replace('*', '')
}



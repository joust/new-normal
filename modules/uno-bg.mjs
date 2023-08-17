import { shuffle, elementsFrom, randomElement } from './common.mjs'
import { Client, Local } from '../web_modules/boardgame.io.js'
import { P2P } from '../web_modules/@boardgame.io/p2p.js'

const INITIAL = 8
const INITIAL_ARGS = 5
const PERCENTAGE_APPEAL_TOS = 15 // e.g. 600 cards => 90 appeal to cards
const PERCENTAGE_DISCUSSES = 6
const PERCENTAGE_STRAWMANS = 20
const PERCENTAGE_RESEARCHS = 20
const PERCENTAGE_LABELS = 20
const PERCENTAGE_CANCELS = 8
const PERCENTAGE_FALLACIES = 20
const PERCENTAGE_PAUSES = 6
const PERCENTAGE_BANISHES = 10
const INVALID_MOVE = 'INVALID_MOVE'

export async function startLocal(locale, content, numPlayers, humanID) {
  const game = Uno(locale, content, humanID)
  const clients = [...Array(numPlayers).keys()].map(String).map(playerID =>
    Client({ game, playerID, numPlayers, multiplayer: Local(), debug: { collapseOnLoad: true } }))
  clients.forEach(client => client.start())
  return clients
}

export async function startClient(locale, content, isHost, numPlayers, playerID, matchID) {
  const game = Uno(locale, content, isHost ? playerID : undefined)
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
    }),
    debug: { collapseOnLoad: true }
  })
  client.start()
  return client
}

/**
Uno game engine. Game state: {
    locale: 'de-de', // opponents have to use the same locale!
    host: '0'/'1',
    decks: {
      idiot: ['I1', 'I2', ...],
      sheep: ['S1', 'S2', ...]
    },
    pile: [],
    hands: [[], ...],
    names: ['']
}

Content structure expected:
content = {
  idiot: {args, labels, cancels, fallacies, appealTos, discusses},
  sheep: {args, labels, cancels, fallacies, appealTos, discusses}
}
*/
export function Uno(locale, content, host) {
  /**
   * adds wildcard argument cards for topic of card to every player's hand,
   * removing possible existing arguments of given topic
   * @param {Array<Array>} hands All hands.
   * @param {{idiot: Array, sheep: Array}} decks Both decks.
   * @param {string} card card played
   */
  function resolveDiscuss(hands, decks, card) {
    const topic = topicOf(card)
    const withSameTopic = card => isArgument(card) && hasTopic(card, topic)
    const firstI = findLast(decks.idiot, withSameTopic)
    const firstS = findLast(decks.sheep, withSameTopic)
    hands.forEach((hand, index) => {
      const idiot = isIdiot(index)
      // first remove all matching cards of this players hand
      hand.filter(card => withSameTopic(card) && isOfType(card, idiot)).forEach(card => hand.splice(hand.indexOf(card), 1))
      // next add the wildcard argument to his hand
      if (idiot && firstI)
        hand.push(`${firstI}*`)
      else if (!idiot && firstS)
        hand.push(`${firstS}*`)
      // else do nothing for this player
    })
  }

    /**
   * removes all argument cards matching the topic of top from all hands and both decks
   * @param {Array<Array>} hands All hands.
   * @param {{idiot: Array, sheep: Array}} decks Both decks.
   * @param {string} top top card on the pile
   */
  function resolveBanish(hands, decks, top) {
    const topic = topicOf(top)
    const withSameTopic = card => isArgument(card) && hasTopic(card, topic)
    // remove all cards matching topic
    const clean = handOrDeck => handOrDeck.filter(withSameTopic).forEach(c => handOrDeck.splice(handOrDeck.indexOf(c), 1))
    hands.forEach(clean)
    clean(decks.idiot)
    clean(decks.sheep)
  }

  /**
   * look up cards matching the current argument on the pile and add to hand
   * gives you up to three argument cards
   * @param {Array} hand The players hand.
   * @param {{idiot: Array, sheep: Array}} decks The decks.
   * @param {string} top card to counter on the pile
   * @param {boolean} idiot idiot?
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
   * @param {Array} hand The players hand.
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
   * removes returns the top card to the previous players hand together with an own cancel card to retailiate.
   * @param {Array<Array>} hands All hands.
   * @param {Array} pile The pile
   * @param {number} prevPlayer The id of the prev player.
   */
  function resolveCancel(pile, hands, prevPlayer) {
    const top = pile.pop()
    hands[prevPlayer].push(top)
    hands[prevPlayer].push(isIdiot(prevPlayer) ? 'CI' : 'CS') // TODO: should it be removed from deck?
  }

  /**
   * draw a card from the given deck into the given hand
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
   * draw an argument card from the given deck into the given hand
   * side effect: will modify both the given deck and hand
   * @param {Array} hand The hand.
   * @param {Array} deck The deck.
   */
  function drawArgument(hand, deck) {
    const index = findLastIndex(deck, isArgument)
    const [card] = deck.splice(index, 1)
    hand.push(card)
  }

    /**
   * draw a non argument card from the given deck into the given hand
   * side effect: will modify both the given deck and hand
   * @param {Array} hand The hand.
   * @param {Array} deck The deck.
   */
  function drawNonArgument(hand, deck) {
    const index = findLastIndex(deck, c => !isArgument(c))
    const [card] = deck.splice(index, 1)
    hand.push(card)
  }

  /**
   * draw an initial hand of size from a given deck
   * side effect: will modify the given deck
   * @param {{idiot: Array, sheep: Array}} decks The decks.
   * @param {boolean} idiot if to use the idiot or sheep deck.
   * @return {Array} the hand
   */
  function drawHand(decks, idiot) {
    let size = INITIAL
    const deck = decks[idiot ? 'idiot' : 'sheep']
    const hand = []
    while (size--) if (size>=INITIAL_ARGS) drawNonArgument(hand, deck); else drawArgument(hand, deck)
    return hand
  }

  /**
   * generates decks for idiot and sheep
   * @return {{idiot: Array, sheep: Array}} The generated decks
   */
  function generateDecks(players) {
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
    const banishes = new Array(Math.round(PERCENTAGE_BANISHES*nargs/100)).fill(`B${type}`)
    const labels = elementsFrom(Math.round(PERCENTAGE_LABELS*nargs/100), cards.labels)
    const cancels = elementsFrom(Math.round(PERCENTAGE_CANCELS*nargs/100), cards.cancels)
    const fallacies = elementsFrom(Math.round(PERCENTAGE_FALLACIES*nargs/100), cards.fallacies)
    const appealTos = elementsFrom(Math.round(PERCENTAGE_APPEAL_TOS*nargs/100), cards.appealTos)
    const pauses = players > 2 ? new Array(Math.round(PERCENTAGE_PAUSES*nargs/100)).fill(`P${type}`) : []
    const discusses = elementsFrom(Math.round(PERCENTAGE_DISCUSSES*nargs/100), cards.discusses)
    return [...cards.args, ...labels, ...cancels, ...fallacies, ...appealTos, ...strawmans, ...researchs, ...banishes, ...pauses, ...discusses]
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

  function findLastIndex(array, finder) {
    return array.map(finder).map(result => !!result).lastIndexOf(true)
  }

  function findLast(array, finder) {
    const index = findLastIndex(array, finder)
    return index>=0 ? array[index] : undefined
  }

  return {
    name: 'newnormaluno',
    content,
    setup: ({ctx}) => {
      const decks = generateDecks(ctx.numPlayers)
      const hands = new Array(ctx.numPlayers).fill([]).map((p,i) => drawHand(decks, isIdiot(i)))
      const names = new Array(ctx.numPlayers).fill(undefined)
      const pile = [] // empty in the beginning
      return { locale, host, decks, pile, hands, names }
    },
    moves: {
      playCard: ({G, ctx, events}, index, alt) => { // alt = alternative card to put on the pile
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
          case 'C': // Cancel
            hand.splice(index, 1)
            resolveCancel(G.pile , G.hands, previousPlayer(ctx))
            G.pile.push(alt)
            break
          case 'D': // Discuss
            hand.splice(index, 1)
            resolveDiscuss(G.hands, G.decks, alt)
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
          case 'B': // Banish
            resolveBanish(G.hands, G.decks, top)
            hand.splice(index, 1)
            G.pile.push(alt)
            break
          case 'P': // Pause
            hand.splice(index, 1)
            G.pile.push(alt) // allows to play any argument card afterwards
            console.log(ctx)
            events.endTurn({ next: ctx.playOrder[(ctx.playOrderPos + 2) % ctx.numPlayers]})
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
      drawCard: ({G, ctx}) => {
        const hand = G.hands[ctx.currentPlayer]
        const type = isIdiot(ctx.currentPlayer) ? 'idiot' : 'sheep'
        const deck = G.decks[type]
        if (!deck.length) return INVALID_MOVE
        draw(hand, deck)
      },
      setName: ({G, ctx}, id, name) => {
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
        first: ({G, ctx}) => host==='0' ? 0 : 1,
        next: ({G, ctx}) => (ctx.playOrderPos + 1) % ctx.numPlayers
      },
      endIf: ({G, ctx}) => {
        const idiot = isIdiot(ctx.currentPlayer)
        const top = G.pile.length ? G.pile[G.pile.length-1] : undefined
        // only when a valid argument / appeal to card was played, the turn is over
        return top && isOfType(top, idiot) && (isAppealTo(top) || isArgument(top) || isDiscuss(top))
      }
    },
    endIf: ({G, ctx}) => {
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

export function canBePlayedOn(top, card, idiot) {
  if (top && !top.length) top = false // empty string or array
  switch(cardType(card)) {
    case 'D': // Discuss
    case 'F': // Fallacy
    case 'L': // Label
    case 'P': // Pause
      return !top || !isStrawman(top)
    case 'C': // Cancel
      return top && isAppealTo(top)
    case 'R': // Research
      return top && (isArgument(top) || isAppealTo(top))
    case 'N': // strawmaN
    case 'B': // Banish
      return top && (isArgument(top) || isDiscuss(top))
    case 'A': // Appeal to
      return isOfType(card, !idiot) && isStrawman(top)
      || isOfType(card, idiot) &&
        (!top || isArgument(top) || isAppealTo(top) || isFallacy(top) || isLabel(top) || isPause(top) || isBanish(top) || isCancel(top))
    case 'I': // Idiot argument
    case 'S': // Sheep argument
      return top && isStrawman(top) && (isArgument(card) || isAppealTo(card)) && isOfType(card, !idiot)
        || isOfType(card, idiot) && (!top
          || isAppealTo(top)
          || ((isArgument(top) || isDiscuss(top)) && topicOf(card)===topicOf(top))
          || isFallacy(top)
          || isPause(top)
          || isLabel(top)
          || isBanish(top)
          || isCancel(top))
  }
}

export function allPossibleMoves(hand, idiot, top) {
  const toPlayMove = (card, index) => ({ move: 'playCard', args: [index]})
  const canBePlayed = move => canBePlayedOn(top, hand[move.args[0]], idiot)
  return [ { move: 'drawCard', args: [] }, ...hand.map(toPlayMove).filter(canBePlayed) ]
}

export function getAlternatives(id, decks, content) {
  const type = isOfType(id, true) ? 'idiot' : 'sheep'
  const deck = decks[type]
  const cards = content[type]
  if (isArgument(id)) return deck.filter(card => isArgument(card) && hasTopic(card, topicOf(id))) // TODO sort by id
  if (isAppealTo(id)) return cards.appealTos
  if (isFallacy(id)) return cards.fallacies
  if (isLabel(id)) return cards.labels
  if (isCancel(id)) return cards.cancels
  if (isDiscuss(id)) return cards.discusses
  return [id]
}


/** check player for idiot */
export function isIdiot(player) {
  return !!(player%2) // every second player is an idiot
}

export function previousPlayer(ctx) {
  const prevPos = ctx.playOrderPos===0 ? ctx.playOrder.length-1 : ctx.playOrderPos-1
  return ctx.playOrder[prevPos]
}

/** check for all types of cards */
export function cardType(id) { return id.includes(':') ? id.split(':')[1][0] : id[0] }
export function isArgument(id) { return id.includes(':I') || id.includes(':S') }
export function isAppealTo(id) { return id.startsWith('A') }
export function isFallacy(id) { return id.startsWith('F') }
export function isLabel(id) { return id.startsWith('L') }
export function isCancel(id) { return id.startsWith('C') }
export function isStrawman(id) { return id.startsWith('N') }
export function isResearch(id) { return id.startsWith('R') }
export function isDiscuss(id) { return id.includes('D') }
export function isPause(id) { return id.startsWith('P') }
export function isBanish(id) { return id.startsWith('B') }

/** check if type of card matches input */
export function isOfType(id, idiot) {
  return (id.includes('I') && idiot) || (id.includes('S') && !idiot)
}

/** find topic of card */
export function topicOf(id) {
  return isArgument(id)||isDiscuss(id) ? id.split(':')[0] : undefined
}

/** check for topic match */
export function hasTopic(id, topic) {
  return isArgument(id)||isDiscuss(id) ? id.split(':')[0]===topic : false
}

/** check for wildcard */
export function isWildcard(id) {
  return isArgument(id) && id.endsWith('*')
}

/** remove wildcard */
export function argumentOnly(id) {
  return id.replace('*', '')
}

export function allowedToPlay(top, idiot) {
  return !top || top && (isOfType(top, !idiot) || isStrawman(top) || isFallacy(top) || isLabel(top) || isBanish(top) || isPause(top))
}

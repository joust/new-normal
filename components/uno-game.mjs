import { BaseComponent } from './base-component.mjs'
import { prompt } from './message-box.mjs'
import { startLocal, startClient, getAlternatives, canBePlayedOn, isIdiot, allowedToPlay, allPossibleMoves, isArgument, isWildcard, isFallacy } from '../modules/uno-bg.mjs'
import { locales, loadSources, loadContent, getMessage } from '../modules/content.mjs'

export class UnoGame extends BaseComponent {
  get css () {
    return `
    ${super.css}
    :host {
      display: flex;
      flex-direction: column;
      background: lightgrey;
    }

    #game {
      flex: 1;
      position: relative;
      width: 100%;
      transition: all ease 0.5s;
    }

    :host(.hidden) #game {
      margin-top: -150%;
    }

    #game.zoomed {
      flex: 8;
    }

    #game.zoomed #piles {
      height: 80%;
    }

    #hand {
      flex: 2;
      width: 100%;
      transition: margin ease 0.5s;
    }

    :host(.hidden) #hand {
      margin-bottom: -150%;
    }

    #players {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: flex-start;
    }

    #players.p10 opponent-hand:nth-child(1), #players.p10 opponent-hand:nth-child(9),
    #players.p8 opponent-hand:nth-child(1), #players.p8 opponent-hand:nth-child(7),
    #players.p6 opponent-hand:nth-child(1), #players.p6 opponent-hand:nth-child(5),
    #players.p4 opponent-hand:nth-child(1), #players.p4 opponent-hand:nth-child(3) {
      margin-top: 12%;
    }

    #players.p10 opponent-hand:nth-child(2), #players.p10 opponent-hand:nth-child(8),
    #players.p8 opponent-hand:nth-child(2), #players.p8 opponent-hand:nth-child(6),
    #players.p6 opponent-hand:nth-child(2), #players.p6 opponent-hand:nth-child(4) {
      margin-top: 5%;
    }

    #players.p10 opponent-hand:nth-child(3), #players.p10 opponent-hand:nth-child(7),
    #players.p8 opponent-hand:nth-child(3), #players.p8 opponent-hand:nth-child(5) {
      margin-top: 2%;
    }

    #players opponent-hand {
      position: relative;
      flex: 1 1 0;
      width: 0;
      height: 15vh;
    }

    #players opponent-hand.selectable {
      animation: pulse 0.4s ease infinite alternate;
    }

    #piles {
      position: absolute;
      width: 100%;
      height: 50%;
      bottom: 0;
    }

    :host(.hidden) {
      visibility: collapse;
    }

    opponent-hand.current {
      border-bottom: 5px solid #ff7f50;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      100% { transform: scale(1.05); }
    }

    @media (prefers-color-scheme: dark) {
      :host {
        background-color: #222;
      }
    }
    `
  }

  get html () {
    return `
    <div id="game">
      <div id="players"></div>
      <centered-cards id="piles">
        <card-pile id="draw-pile" top="I" draggable></card-pile>
        <card-pile id="pile" droppable></card-pile>
      </centered-cards>
    </div>
    <pyro-effect id="pyro"></pyro-effect>
    `
  }

  connectedCallback () {
    super.connectedCallback()
    this.element('piles').onclick = () => this.toggleZoom()
  }

  toggleZoom () {
    this.element('game').classList.toggle('zoomed')
  }

  async startWithBots (bots, { playerID, content, locale, labels, randomElement }) {
    const numPlayers = 1 + bots
    const botPlayerIds = [...Array(numPlayers).keys()].map(String).filter(id => id !== playerID)

    this.resetTable(numPlayers)

    const hand = document.createElement('player-hand')
    hand.id = 'hand'
    hand.setAttribute('nr', playerID)
    hand.setAttribute('cards', '[]')
    hand.setAttribute('name', 'Me')
    hand.setAttribute('droppable', '')
    this.shadowRoot.appendChild(hand)

    const clients = await startLocal(locale, content, numPlayers, playerID)
    botPlayerIds.forEach(botID => {
      const idiot = parseInt(botID) % 2
      const name = randomElement(labels[idiot])
      this.addOpponentHand(botID, name)
      clients[playerID].moves.setName(botID, name)
    })
    clients[playerID].moves.setName(playerID, 'Me')
    this.activateDrag(clients[playerID])
    clients[playerID].subscribe(state => this.updateTable(clients[playerID], state))
    botPlayerIds.forEach(botID => clients[botID].subscribe(state => this.makeBotMove(clients[botID], state)))

    this._clients = clients
  }

  async startNetworked (isHost, numPlayers, { playerID, matchID, content, locale, labels }) {
    this._setNameRequestSent = false

    this.resetTable(numPlayers)

    const client = await startClient(locale, content, isHost, numPlayers, playerID, matchID)
    const hostPlayerID = playerID

    if (isHost) {
      const hand = document.createElement('player-hand')
      hand.id = 'hand'
      hand.setAttribute('nr', '0')
      hand.setAttribute('cards', '[]')
      hand.setAttribute('droppable', '')
      this.shadowRoot.appendChild(hand)

      const message = getMessage('host-player.name.prompt').replace('PLAYERID', playerID)
      const name = await prompt(message, '')
      client.moves.setName(playerID, name)
      this.activateDrag(client)
      const opponentPlayerIds = [...Array(numPlayers).keys()].map(String).filter(id => id !== playerID)
      opponentPlayerIds.forEach(id => this.addOpponentHand(id, '?'))
    }

    const setNameRequest = msg => msg.payload.message === 'setName'
    const stateHandler = async state => {
      if (state) {
        if (client.playerID) {
          if (!isHost && !this._setNameRequestSent && state.ctx.currentPlayer === hostPlayerID) {
            await this.sendSetNameRequest(client, client.playerID)
          }
          this.updateTable(client, state)
          if (isHost && state.ctx.currentPlayer === hostPlayerID) {
            client.chatMessages.filter(setNameRequest).forEach(msg => {
              if (state.G.names[msg.sender] !== msg.payload.name) {
                client.moves.setName(msg.sender, msg.payload.name)
              }
            })
          }
        } else {
          const hostPID = state.G.host
          const takeSeat = (client, seatPlayerID) => {
            this.elements('opponent-hand').forEach(child => child.classList.remove('selectable'))
            client.updatePlayerID(seatPlayerID)
            this.updateTable(client, state)
            this.activateDrag(client)
          }

          if (!this.element('players').children.length) {
            this.element('players').classList.add(`p${state.ctx.numPlayers}`)
            await this.takeoverHostLocale(state.G.locale)

            const hand = document.createElement('player-hand')
            hand.id = 'hand'
            this.shadowRoot.appendChild(hand)

            if (state.ctx.numPlayers === 2) {
              this.addOpponentHand(hostPID, state.G.names[hostPID])
              takeSeat(client, hostPID === '0' ? '1' : '0')
            } else {
              const selectablePlayerIds = state.ctx.playOrder.filter(id => id !== hostPID)
              selectablePlayerIds.forEach(id => this.addOpponentHand(id, state.G.names[id]))
              this.elements('opponent-hand').forEach(child => child.classList.add('selectable'))
              this.elements('opponent-hand').forEach((child, index) => (child.onclick = async () => takeSeat(client, selectablePlayerIds[index])))
            }
          }
        }
      }
    }

    client.subscribe(stateHandler)
    this._clients = [client]
  }

  startFromHash (cards) {
    this.resetTable(0)
    const cardsString = JSON.stringify(cards.map(card => ({ card, playable: false })))
    const hand = document.createElement('player-hand')
    hand.id = 'hand'
    hand.setAttribute('nr', '0')
    hand.setAttribute('cards', '[]')
    this.shadowRoot.appendChild(hand)
    hand.setAttribute('cards', cardsString)
  }

  stop () {
    if (this._clients) {
      this._clients.forEach(client => client.stop())
      this._clients = null
    }
    const hand = this.element('hand')
    if (hand) hand.remove()
    this.element('players').innerHTML = ''
    this.element('players').className = ''
    this.element('game').classList.remove('zoomed')
    this.element('pyro').stop()
  }

  resetTable (numPlayers) {
    this.element('players').innerHTML = ''
    this.element('players').className = ''
    if (numPlayers) this.element('players').classList.add(`p${numPlayers}`)
    this.element('game').classList.remove('zoomed')
    const oldHand = this.element('hand')
    if (oldHand) oldHand.remove()
    this._clients = null
  }

  addOpponentHand (nr, name) {
    const hand = document.createElement('opponent-hand')
    hand.setAttribute('cards', '8')
    hand.setAttribute('nr', nr)
    if (name) hand.setAttribute('name', name)
    this.element('players').appendChild(hand)
  }

  cardsString (hand, decks, content, top, current, idiot) {
    return JSON.stringify(hand.map(card => ({
      card,
      alt: getAlternatives(card, decks, content),
      playable: current && canBePlayedOn(top, card, idiot)
    })))
  }

  updateTable (client, state) {
    const top = state.G.pile[state.G.pile.length - 1]
    this.element('draw-pile').setAttribute('top', '')
    this.element('pile').setAttribute('top', top)
    const opponentIds = [...Array(state.ctx.numPlayers).keys()].map(String).filter(id => id !== client.playerID)
    const name = state.G.names[client.playerID]
    const hand = state.G.hands[client.playerID]
    const idiot = !!(client.playerID % 2)
    const current = client.playerID === state.ctx.currentPlayer
    this.element('draw-pile').setAttribute('top', idiot ? 'I' : 'S')
    this.element('hand').setAttribute('cards', this.cardsString(hand, state.G.decks, client.game.content, top, current, idiot))
    this.element('hand').setAttribute('nr', client.playerID)
    this.element('hand').setAttribute('name', state.G.names[client.playerID])
    this.element('hand').classList.toggle('current', state.ctx.currentPlayer === client.playerID)
    if (name) this.element('hand').setAttribute('name', name)
    Array.from(this.element('players').children).forEach((hand, index) => {
      hand.setAttribute('nr', opponentIds[index])
      hand.classList.toggle('current', state.ctx.currentPlayer === opponentIds[index])
      if (state.G.names[opponentIds[index]]) { hand.setAttribute('name', state.G.names[opponentIds[index]]) }
      hand.setAttribute('cards', state.G.hands[opponentIds[index]].length)
    })
    if (state.ctx.gameover) {
      this.element('pyro').toggle(!!state.ctx.gameover.winner)
    }
  }

  makeBotMove (client, state) {
    const strategicallyChooseMove = (hand, possibleMoves) => {
      const wildcard = possibleMoves.findIndex(move => move.move === 'playCard' && isWildcard(hand[move.args[0]]))
      if (wildcard >= 0) return wildcard
      const argument = possibleMoves.findIndex(move => move.move === 'playCard' && isArgument(hand[move.args[0]]))
      if (argument >= 0) return argument
      const fallacy = possibleMoves.findIndex(move => move.move === 'playCard' && isFallacy(hand[move.args[0]]))
      if (fallacy >= 0) return fallacy
      return Math.floor(Math.random() * possibleMoves.length)
    }
    const botID = client.playerID
    const top = state.G.pile.length ? state.G.pile[state.G.pile.length - 1] : undefined
    const idiot = isIdiot(botID)
    if (botID == state.ctx.currentPlayer && allowedToPlay(top, idiot)) {
      const hand = state.G.hands[botID]
      const possibleMoves = allPossibleMoves(hand, idiot, top)
      const index = strategicallyChooseMove(hand, possibleMoves)
      const move = possibleMoves[index]
      setTimeout(() => client.moves[move.move](...move.args), 500)
    }
  }

  activateDrag (client) {
    this.element('hand').addEventListener('dropped', event => event.detail.draw && client.moves.drawCard())
    this.element('pile').addEventListener('dropped', event => event.detail.card && client.moves.playCard(event.detail.index, event.detail.card))
  }

  async sendSetNameRequest (client, playerID) {
    this._setNameRequestSent = true
    const message = getMessage('player.name.prompt').replace('PLAYERID', playerID)
    const name = await prompt(message, '')
    client.sendChatMessage({ message: 'setName', name })
  }

  async takeoverHostLocale (locale) {
    const [lang] = locale.split('-')
    document.body.lang = locales.includes(locale) ? locale : lang
    await loadSources()
    await loadContent()
  }
}

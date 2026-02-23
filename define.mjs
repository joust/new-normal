import { AppealToCard } from './components/appeal-to-card.mjs'
import { ArgumentCard } from './components/argument-card.mjs'
import { BanishCard } from './components/banish-card.mjs'
import { BingoCard } from './components/bingo-card.mjs'
import { BingoDetail } from './components/bingo-detail.mjs'
import { BingoGame } from './components/bingo-game.mjs'
import { CancelCard } from './components/cancel-card.mjs'
import { CardBack } from './components/card-back.mjs'
import { CardPile } from './components/card-pile.mjs'
import { CenteredCards } from './components/centered-cards.mjs'
import { DiscussCard } from './components/discuss-card.mjs'
import { EditableCard } from './components/editable-card.mjs'
import { FallacyCard } from './components/fallacy-card.mjs'
import { FlipArea } from './components/flip-area.mjs'
import { FlipCard } from './components/flip-card.mjs'
import { GameCard } from './components/game-card.mjs'
import { LabelCard } from './components/label-card.mjs'
import { LocaleSelector } from './components/locale-selector.mjs'
import { MessageBoxElement } from './components/message-box.mjs'
import { NoCard } from './components/no-card.mjs'
import { OpponentHand } from './components/opponent-hand.mjs'
import { PauseCard } from './components/pause-card.mjs'
import { PlayerHand } from './components/player-hand.mjs'
import { PyroEffect } from './components/pyro-effect.mjs'
import { ResearchCard } from './components/research-card.mjs'
import { SourcesBack } from './components/sources-back.mjs'
import { StrawmanCard } from './components/strawman-card.mjs'
import { TestCard } from './components/test-card.mjs'
import { TestCertificate } from './components/test-certificate.mjs'
import { TestGame } from './components/test-game.mjs'
import { TestPile } from './components/test-pile.mjs'
import { TopicManager } from './components/topic-manager.mjs'
import { UnoGame } from './components/uno-game.mjs'

export function defineElements () {
  for (const [tag, component] of [
    ['appeal-to-card', AppealToCard],
    ['argument-card', ArgumentCard],
    ['banish-card', BanishCard],
    ['bingo-card', BingoCard],
    ['bingo-detail', BingoDetail],
    ['bingo-game', BingoGame],
    ['cancel-card', CancelCard],
    ['card-back', CardBack],
    ['card-pile', CardPile],
    ['centered-cards', CenteredCards],
    ['discuss-card', DiscussCard],
    ['editable-card', EditableCard],
    ['fallacy-card', FallacyCard],
    ['flip-area', FlipArea],
    ['flip-card', FlipCard],
    ['game-card', GameCard],
    ['label-card', LabelCard],
    ['locale-selector', LocaleSelector],
    ['message-box', MessageBoxElement],
    ['no-card', NoCard],
    ['opponent-hand', OpponentHand],
    ['pause-card', PauseCard],
    ['player-hand', PlayerHand],
    ['pyro-effect', PyroEffect],
    ['research-card', ResearchCard],
    ['sources-back', SourcesBack],
    ['strawman-card', StrawmanCard],
    ['test-card', TestCard],
    ['test-certificate', TestCertificate],
    ['test-game', TestGame],
    ['test-pile', TestPile],
    ['topic-manager', TopicManager],
    ['uno-game', UnoGame]
  ]) {
    window.customElements.define(tag, component)
  }
}

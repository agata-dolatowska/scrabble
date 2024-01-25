<template lang="pug">
  div
    <PlayersSettings @updatePlayers="updatePlayers" v-if="playersSettingsVisible" />
    <div class="game-container" v-if="!playersSettingsVisible">
      <div>
        <Board :squares="squares" :currentTiles="currentTiles" :clearTypedWord="clearTypedWord" :savedWords="savedWords" :gameFinished="gameFinished" @addTurn="addTurn" @updateTiles="updateTiles" @removeTypedLetter="removeTypedLetter" @stopClearLastWord="clearTypedWord = false"/>
        <p v-if="!gameFinished">{{ $t('currentPlayer') }} {{ currentPlayerName }}</p>
        <Rack :key="tilesUpdate" v-if="tiles.length > 0 && !gameFinished" :tiles="tiles" :currentTiles="currentTiles" @setNewTiles="setNewTiles" @returnExchangedTiles="returnExchangedTiles" @skipTurn="createEmptyTurn"/>
        <button v-if="gameSaved || someUserHasPoints" @click="newGameConfirmation">{{ $t('startNewGame') }}</button>
      </div>
      <div>
        <Scoreboard :players="players" />
      </div>
      <ConfirmMessage v-if="confirmOpen" :message="confirmMessage" @close="confirmOpen = false" @accept="startNewGame(), confirmOpen = false"/>
    </div>
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Board from '@/components/Board.vue'
import Rack from '@/components/Rack.vue'
import Scoreboard from '@/components/Scoreboard.vue'
import PlayersSettings from '@/components/PlayersSettings.vue'
import ConfirmMessage from '@/components/ConfirmMessage.vue'
import TurnModel from '@/models/Turn'
import TileModel from '@/models/Tile'
import SquareModel from '@/models/Square'
import PlayerModel from '@/models/Player'
import defaultTiles from '@/game-assets/tiles'
import doubleLetterSquares from '@/game-assets/board-squares/double-letter'
import doubleWordSquares from '@/game-assets/board-squares/double-word'
import tripleLetterSquares from '@/game-assets/board-squares/triple-letter'
import tripleWordSquares from '@/game-assets/board-squares/triple-word'
import chooseRandomLetters from '@/utils/rack'
import { Watch } from 'vue-property-decorator'

@Component({
  components: {
    Board,
    Scoreboard,
    Rack,
    PlayersSettings,
    ConfirmMessage
  }
})
export default class Game extends Vue {
  private squares: SquareModel[] = []
  private tiles: TileModel[] = []
  private tilesUpdate = 0
  private players: PlayerModel[] = []
  private playersSettingsVisible = true
  private currentPlayer = 0
  private clearTypedWord = false
  private confirmOpen = false
  private confirmMessage = ''
  private gameFinished = false

  get gameSaved () {
    return localStorage.getItem('scrabble') !== null &&
    this.players.length
  }

  get someUserHasPoints () {
    return this.players.some(player => player.score.length > 0)
  }

  get savedWords () {
    const words = []

    for (const player of this.players) {
      for (const score of player.score) {
        for (const word of score.savedWords) {
          words.push(word)
        }
      }
    }

    return words
  }

  get currentTiles () {
    if (this.players.length > 0) {
      return this.players[this.currentPlayer].availableTiles
    } else {
      return []
    }
  }

  get availableTiles () {
    return this.tiles.reduce((sum, tile) => sum + tile.amount, 0)
  }

  get playerWithEmptyRackExists () {
    return this.players.some(player => player.availableTiles.length === 0)
  }

  @Watch('playerWithEmptyRackExists')
  checkAvailableTiles () {
    if (this.availableTiles === 0 &&
      this.playerWithEmptyRackExists) {
      this.finishGame()
    }
  }

  checkSkipTurnsAmount () {
    const twoTurnsPlayed = this.players[this.players.length - 1].score.length >= 2
    const lastTurns = []
    const maxSkippedTurns = 2
    const skippedTurnsForCurrentGame = this.players.length * maxSkippedTurns
    let turnsSkippedIn2LastMoves = 0

    if (twoTurnsPlayed) {
      for (const player of this.players) {
        lastTurns.push(...player.score.slice(-2))
      }
    }

    turnsSkippedIn2LastMoves = lastTurns.filter(turn => turn.skipped).length

    if (turnsSkippedIn2LastMoves === skippedTurnsForCurrentGame) {
      this.finishGame()
    }
  }

  mounted () {
    if (this.gameSaved) {
      this.startSavedGame()
    } else {
      this.startNewGame()
    }

    window.onbeforeunload = () => this.saveGame()
  }

  saveGame () {
    localStorage.setItem('scrabble', JSON.stringify({
      squares: this.squares,
      tiles: this.tiles,
      players: this.players,
      currentPlayer: this.currentPlayer
    })
    )
  }

  startSavedGame () {
    const savedGame = JSON.parse(localStorage.getItem('scrabble') as string)

    this.squares = savedGame.squares
    this.tiles = savedGame.tiles
    this.players = savedGame.players
    this.currentPlayer = savedGame.currentPlayer
    this.playersSettingsVisible = false
  }

  get currentPlayerName () {
    return this.players?.length && this.currentPlayer >= 0 ? this.players[this.currentPlayer].name : ''
  }

  updatePlayers (players: PlayerModel[]) {
    this.players = players
    this.playersSettingsVisible = false
    this.createAvailableTiles()
  }

  startNewGame (): void {
    localStorage.removeItem('scrabble')
    this.squares = []
    this.tiles = []
    this.currentPlayer = 0
    this.players = []
    this.createSquares()
    this.createNewSetOfTiles()
    this.playersSettingsVisible = true
  }

  createSquares (): void {
    const allBonusSquares: {[key: string]: string[]} = {
      'double-letter': doubleLetterSquares,
      'double-word': doubleWordSquares,
      'triple-letter': tripleLetterSquares,
      'triple-word': tripleWordSquares
    }
    let squareWithBonusId: number

    for (let rowNumber = 1; rowNumber <= 15; rowNumber += 1) {
      for (let columnNumber = 1; columnNumber <= 15; columnNumber += 1) {
        this.squares.push(new SquareModel(`${(rowNumber + 9).toString(36)}${columnNumber}`, rowNumber, columnNumber))
      }
    }

    for (const bonusType in allBonusSquares) {
      for (const bonusSquare in allBonusSquares[bonusType]) {
        squareWithBonusId = this.squares.findIndex(square => square.id === allBonusSquares[bonusType][bonusSquare])

        if (squareWithBonusId >= 0) {
          this.squares[squareWithBonusId].bonus = bonusType
        }
      }
    }
  }

  addTurn (turn: TurnModel) {
    const turnWithPoints = this.countScores(turn)

    this.players[this.currentPlayer].score.push(turnWithPoints)
    this.setTotalScore()
    this.setNextPlayer()
    this.fillAvailableTiles()
  }

  setTotalScore () {
    this.players[this.currentPlayer].totalScore = this.players[this.currentPlayer].score.reduce((prev, next) => prev + next.points, 0)
  }

  countScores (turn: TurnModel) {
    let sum = 0
    let point = 0
    let letterId = 0
    const wordBonuses = []
    const wordsPoints = []
    const allLettersUsedPoints = 50

    for (const word of turn.savedWords) {
      sum = 0

      for (const letter of word.letters) {
        letterId = defaultTiles.findIndex(tile => tile.letter === letter.letter.toUpperCase())

        if (letterId >= 0) {
          point = defaultTiles[letterId].points
        }

        if (letter.bonus === 'double-letter') {
          point = point * 2
        }

        if (letter.bonus === 'triple-letter') {
          point = point * 3
        }

        if (letter.bonus === 'double-word') {
          wordBonuses.push('double-word')
        }

        if (letter.bonus === 'triple-word') {
          wordBonuses.push('triple-word')
        }

        sum += point
      }

      for (const bonus of wordBonuses) {
        if (bonus === 'double-word') {
          sum = sum * 2
        }

        if (bonus === 'triple-word') {
          sum = sum * 3
        }
      }
      wordsPoints.push(sum)
    }

    if (turn.allLettersBonus) {
      wordsPoints.push(allLettersUsedPoints)
    }

    turn.points = wordsPoints.reduce((prev, current) => prev + current, 0)
    return turn
  }

  setNextPlayer () {
    if (this.currentPlayer === this.players.length - 1) {
      this.currentPlayer = 0
    } else {
      this.currentPlayer++
    }
  }

  fillAvailableTiles () {
    const newTiles = chooseRandomLetters(this.tiles, this.players[this.currentPlayer].availableTiles)
    this.players[this.currentPlayer].availableTiles = [...newTiles]
  }

  createEmptyTurn (skipped = false) {
    const newTurn = new TurnModel()
    newTurn.skipped = skipped

    this.clearTypedWord = true
    this.addTurn(newTurn)

    if (this.players[this.currentPlayer].totalScore === 0 && this.players[this.currentPlayer].availableTiles.length === 0) {
      this.tilesUpdate++
    }

    if (skipped) {
      this.checkSkipTurnsAmount()
    }
  }

  createNewSetOfTiles (): void {
    let newTile: TileModel

    for (const tile of defaultTiles) {
      newTile = new TileModel(tile.letter, tile.amount, tile.points)
      this.tiles.push(newTile)
    }
  }

  createAvailableTiles (): void {
    let chosenLetters: TileModel[] = []
    let tileId = 0

    for (const player of this.players) {
      chosenLetters = chooseRandomLetters(this.tiles)
      player.availableTiles.push(...chosenLetters)

      for (const chosenTile of chosenLetters) {
        tileId = this.tiles.findIndex(tile => tile.letter.toUpperCase() === chosenTile.letter.toUpperCase())

        if (tileId >= 0) {
          this.tiles[tileId].amount = this.tiles[tileId].amount - 1
        }
      }
    }
  }

  setNewTiles (tiles: TileModel[]): void {
    let tileId = 0
    this.players[this.currentPlayer].availableTiles = tiles

    for (const currentTile of this.currentTiles) {
      tileId = this.tiles.findIndex(tile => tile.letter.toUpperCase() === currentTile.letter.toUpperCase())

      if (tileId >= 0) {
        this.tiles[tileId].amount = this.tiles[tileId].amount - 1
      }
    }

    if (this.players[this.currentPlayer].totalScore === 0 && this.players[this.currentPlayer].availableTiles.length === 0) {
      this.tilesUpdate++
    }
  }

  updateTiles (typedLetters: SquareModel[]): void {
    let currentTileId = 0
    let blankId = 0

    for (const letter of typedLetters) {
      currentTileId = this.players[this.currentPlayer].availableTiles.findIndex(tile => tile.letter.toUpperCase() === letter.letter.toUpperCase())

      if (currentTileId >= 0) {
        this.players[this.currentPlayer].availableTiles.splice(currentTileId, 1)
      } else {
        blankId = this.players[this.currentPlayer].availableTiles.findIndex(tile => tile.letter.toUpperCase() === '')
        this.players[this.currentPlayer].availableTiles.splice(blankId, 1)
      }
    }

    this.tilesUpdate++
  }

  removeTypedLetter (squareId: number): void {
    this.squares[squareId].letter = ''
  }

  returnExchangedTiles (tilesToAdd: TileModel[]): void {
    let tileId = 0

    for (const tileToAdd of tilesToAdd) {
      tileId = this.tiles.findIndex(tile => tile.letter.toUpperCase() === tileToAdd.letter.toUpperCase())

      this.tiles[tileId].amount++
    }

    this.clearTypedWord = true
    this.createEmptyTurn()
  }

  newGameConfirmation () {
    this.confirmOpen = true
    this.confirmMessage = this.$t('newGameQuestion') as string
  }

  finishGame () {
    this.gameFinished = true
    this.blockAllSquares()
    this.subtractRemainingTiles()
    this.addPointsToPlayerWithEmptyRack()
  }

  blockAllSquares () {
    for (const square of this.squares) {
      square.isBlocked = true
    }
  }

  subtractRemainingTiles () {
    for (const player of this.players) {
      const additionalTurn = new TurnModel()
      additionalTurn.points = -player.availableTiles.reduce((sum, tile) => tile.points + sum, 0)
      player.score.push(additionalTurn)
    }
  }

  addPointsToPlayerWithEmptyRack () {
    const playerWithEmptyRackId = this.players.findIndex(player => player.availableTiles.length === 0)
    const playerWithEmptyRack = this.players[playerWithEmptyRackId]
    let lastTurnPoints = 0

    if (playerWithEmptyRackId >= 0) {
      for (const player of this.players) {
        lastTurnPoints += player.score[player.score.length - 1].points
      }

      playerWithEmptyRack.score[playerWithEmptyRack.score.length - 1].points = Math.abs(lastTurnPoints)
    }
  }
}
</script>
<style lang="scss" scoped>
.game-container {
  display: flex;
  gap: 50px;
}
</style>

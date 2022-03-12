<template lang="pug">
  div
   <Board :squares="squares" :currentTiles="currentTiles" @addTurn="addTurn" @updateTiles="updateTiles"/>
   <Scoreboard :scores="scores" />
   <Rack :key="tilesUpdate" v-if="tiles.length > 0" :tiles="tiles" :currentTiles="currentTiles" @setNewTiles="setNewTiles" @returnExchangedTiles="returnExchangedTiles"/>
   <button v-if="gameSaved || scores.length > 0" @click="startNewGame">Start new game</button>
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Board from '@/components/Board.vue'
import Rack from '@/components/Rack.vue'
import Scoreboard from '@/components/Scoreboard.vue'
import TurnModel from '@/models/Turn'
import TileModel from '@/models/Tile'
import SquareModel from '@/models/Square'
import defaultTiles from '@/game-assets/tiles'
import doubleLetterSquares from '@/game-assets/board-squares/double-letter'
import doubleWordSquares from '@/game-assets/board-squares/double-word'
import tripleLetterSquares from '@/game-assets/board-squares/triple-letter'
import tripleWordSquares from '@/game-assets/board-squares/triple-word'

@Component({
  components: {
    Board,
    Scoreboard,
    Rack
  }
})
export default class Game extends Vue {
  private squares: SquareModel[] = []
  private currentTiles: TileModel[] = []
  private tiles: TileModel[] = []
  private scores: TurnModel[] = []
  private tilesUpdate = 0

  get gameSaved () {
    return localStorage.getItem('scrabble') !== null
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
      currentTiles: this.currentTiles,
      tiles: this.tiles,
      scores: this.scores
    })
    )
  }

  startSavedGame () {
    const savedGame = JSON.parse(localStorage.getItem('scrabble') as string)

    this.squares = savedGame.squares
    this.currentTiles = savedGame.currentTiles
    this.tiles = savedGame.tiles
    this.scores = savedGame.scores
  }

  startNewGame (): void {
    localStorage.removeItem('scrabble')
    this.squares = []
    this.tiles = []
    this.scores = []
    this.currentTiles = []
    this.createSquares()
    this.createNewSetOfTiles()
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
    this.scores.push(turn)
  }

  createNewSetOfTiles (): void {
    let newTile: TileModel

    for (const tile of defaultTiles) {
      newTile = new TileModel(tile.letter, tile.amount, tile.points)
      this.tiles.push(newTile)
    }
  }

  setNewTiles (tiles: TileModel[]): void {
    let tileId = 0

    this.currentTiles = tiles

    for (const currentTile of this.currentTiles) {
      tileId = this.tiles.findIndex(tile => tile.letter.toUpperCase() === currentTile.letter.toUpperCase())

      if (tileId >= 0) {
        this.tiles[tileId].amount = this.tiles[tileId].amount - 1
      }
    }
  }

  updateTiles (typedLetters: SquareModel[]): void {
    let currentTileId = 0

    for (const letter of typedLetters) {
      currentTileId = this.currentTiles.findIndex(tile => tile.letter.toUpperCase() === letter.letter.toUpperCase())

      if (currentTileId >= 0) {
        this.currentTiles.splice(currentTileId, 1)
      }
    }

    this.tilesUpdate++
  }

  returnExchangedTiles (tilesToAdd: TileModel[]): void {
    let tileId = 0

    for (const tileToAdd of tilesToAdd) {
      tileId = this.tiles.findIndex(tile => tile.letter.toUpperCase() === tileToAdd.letter.toUpperCase())

      this.tiles[tileId].amount++
    }
  }
}
</script>

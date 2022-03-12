<template lang="pug">
  div
    div.board-container
      <Square v-for="(square, i) in squares" :ref="'square' + i" :key="square.id" :square="square" @addLetterToWord="addLetterToWord" @removeEmptyLetter="removeEmptyLetter" />
    button(@click="checkWord" :disabled="typedWord.letters.length === 0") check word
    <ErrorMessage v-if="errorOpen" :message="errorMessage" @close="errorOpen = false"/>
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import SquareModel from '@/models/Square'
import WordModel from '@/models/Word'
import Square from '@/components/Square.vue'
import TileModel from '@/models/Tile'
import TurnModel from '@/models/Turn'
import ErrorMessage from '@/components/ErrorMessage.vue'

@Component({
  components: {
    Square,
    ErrorMessage
  }
})
export default class Board extends Vue {
  @Prop() currentTiles!: TileModel[]
  @Prop() squares!: SquareModel[]
  private typedWord = new WordModel()
  private additionalWords: WordModel[] = []
  private savedWords: WordModel[] = []
  private maxTypedLetters = 7
  private wordCount = 0
  private errorOpen = false
  private errorMessage = ''

  get texts () {
    return this.$store.state.lang.texts
  }

  checkWord () {
    let wordOk = true
    const currentTurn = new TurnModel()
    currentTurn.typedLetters = this.typedWord.letters

    if (!this.wordLengthCorrect()) {
      wordOk = false
    }

    if (!this.wordOrientationCorrect()) {
      wordOk = false
    }

    if (this.typedWord.letters.length > 1) {
      this.correctLettersOrder(this.typedWord)
    }

    if (this.typedWord.letters.length === 6) {
      currentTurn.allLettersBonus = true
    }

    if (!this.lettersMatchTiles()) {
      wordOk = false
    }

    this.checkWordBeginning(this.typedWord.letters[0], this.typedWord.orientation)

    this.checkWordEnding(this.typedWord.letters[this.typedWord.letters.length - 1], this.typedWord.orientation)

    if (this.checkGaps()) {
      wordOk = false
    }

    if (!this.crossedWord() && !this.parallelWord()) {
      wordOk = false
    }

    if (this.typedWord.letters.length > 1) {
      this.correctLettersOrder(this.typedWord)
    }

    this.additionalWordsCheck()

    if (wordOk) {
      currentTurn.savedWords.push(this.typedWord, ...this.additionalWords)
      this.$emit('addTurn', currentTurn)
      this.wordCount++
      this.$emit('updateTiles', currentTurn.typedLetters)
    } else {
      this.removeWordFromBoard()
    }

    this.typedWord = new WordModel()
    this.additionalWords = []
    this.savedWords = []
  }

  lettersMatchTiles (): boolean {
    const tiles: TileModel[] = JSON.parse(JSON.stringify(this.currentTiles))
    let tileId = 0
    let match = true
    let blankCounter = tiles.filter(tile => tile.letter === '').length

    for (const letter of this.typedWord.letters) {
      tileId = tiles.findIndex(tile => tile.letter.toUpperCase() === letter.letter.toUpperCase())
      if (tileId >= 0) {
        tiles.splice(tileId, 1)
      } else if (blankCounter > 0) {
        blankCounter--
      } else {
        match = false
      }
    }

    return match
  }

  additionalWordsCheck (): void {
    let orientation = ''
    let additionalWordId = 0

    switch (this.typedWord.orientation) {
      case 'horizontal':
        orientation = 'vertical'
        break
      case 'vertical':
        orientation = 'horizontal'
        break
    }

    for (const letter in this.typedWord.letters) {
      this.checkWordBeginning(this.typedWord.letters[letter], orientation, additionalWordId)
      this.checkWordEnding(this.typedWord.letters[letter], orientation, additionalWordId)

      if (this.additionalWords[additionalWordId] !== undefined) {
        this.additionalWords[additionalWordId].letters.push(this.typedWord.letters[letter])
        this.correctLettersOrder(this.additionalWords[additionalWordId])
        additionalWordId++
      }
    }
  }

  parallelWord (): boolean {
    let isParallel = false
    let squareId = 0

    for (const letter of this.typedWord.letters) {
      squareId = this.squares.findIndex(square => square.id === letter.id)

      if (this.typedWord.orientation === 'horizontal' && (this.squares[squareId + 15].letter !== '' || this.squares[squareId - 15].letter !== '')) {
        isParallel = true
        break
      }

      if (this.typedWord.orientation === 'vertical' && (this.squares[squareId + 1].letter !== '' || this.squares[squareId - 1].letter !== '')) {
        isParallel = true
        break
      }
    }

    return isParallel
  }

  crossedWord (): boolean {
    let crossedWord = !!(this.wordCount === 0)
    const usedLetters = []

    for (const word of this.savedWords) {
      usedLetters.push(...word.letters)
    }

    for (const currentWordLetter of this.typedWord.letters) {
      if (usedLetters.some(letter => letter.id === currentWordLetter.id
      )) {
        crossedWord = true
      }
    }

    return crossedWord
  }

  removeWordFromBoard (): void {
    let squareId = 0
    let squareUsed = false

    for (const squareInWord of this.typedWord.letters) {
      squareUsed = this.savedWords.some(word =>
        word.letters.some(letter => letter.row === squareInWord.row && letter.column === squareInWord.column)
      )

      if (!squareUsed) {
        squareId = this.squares.findIndex(square => square.id === squareInWord.id)

        this.squares[squareId].letter = ''
      }
    }
  }

  wordLengthCorrect (): boolean {
    let wordOk = true
    const middleSquareId = this.squares.findIndex(square => square.column === 8 && square.row === 8)

    if (this.wordCount === 0) {
      if (this.squares[middleSquareId].letter === '') {
        this.errorMessage = this.texts.errors.emptyCenter
        this.errorOpen = true
        wordOk = false
      }

      if (this.typedWord.letters.length < 2) {
        this.errorMessage = this.texts.errors.firstWordTooShort
        this.errorOpen = true
        wordOk = false
      }
    }

    if (this.typedWord.letters.length > this.maxTypedLetters) {
      this.errorMessage = this.texts.errors.wordTooLong
      this.errorOpen = true
      wordOk = false
    }

    if (this.wordCount > 0 && this.typedWord.letters.length < 1) {
      this.errorMessage = this.texts.errors.wordTooShort
      this.errorOpen = true
      wordOk = false
    }

    return wordOk
  }

  checkWordBeginning (firstLetter: SquareModel, orientation: string, additionalId?: number): void {
    const firstLetterId = this.squares.findIndex(square => square.id === firstLetter.id)
    const newAdditionalWord = new WordModel()
    let letterId = firstLetterId

    if (orientation === 'horizontal' || orientation === 'both') {
      letterId -= 1

      for (letterId; this.squares[letterId].letter !== '' && this.squares[letterId].row === firstLetter.row && letterId >= 0; letterId -= 1) {
        if (additionalId !== undefined) {
          newAdditionalWord.letters.unshift(this.squares[letterId])
        } else {
          this.typedWord.letters.unshift(this.squares[letterId])
        }

        if (this.typedWord.orientation === 'both') {
          this.typedWord.orientation = 'horizontal'
        }
      }
    }

    if (orientation === 'vertical' || orientation === 'both') {
      letterId -= 15

      for (letterId; this.squares[letterId].letter !== '' && this.squares[letterId].column === firstLetter.column && letterId >= 0; letterId -= 15) {
        if (additionalId !== undefined) {
          newAdditionalWord.letters.unshift(this.squares[letterId])
        } else {
          this.typedWord.letters.unshift(this.squares[letterId])
        }

        if (this.typedWord.orientation === 'both') {
          this.typedWord.orientation = 'vertical'
        }
      }
    }

    if (newAdditionalWord.letters.length > 0 && additionalId !== undefined) {
      if (!this.additionalWords[additionalId]) {
        this.additionalWords[additionalId] = new WordModel()
      }

      this.additionalWords[additionalId].letters = newAdditionalWord.letters
      this.additionalWords[additionalId].orientation = orientation
    }
  }

  checkWordEnding (lastLetter: SquareModel, orientation: string, additionalId?: number): void {
    const lastLetterId = this.squares.findIndex(square => square.id === lastLetter.id)
    const newAdditionalWord = new WordModel()
    let letterId = lastLetterId

    if (orientation === 'horizontal' || orientation === 'both') {
      letterId = lastLetterId + 1

      for (letterId; this.squares[letterId].letter !== '' && this.squares[letterId].row === lastLetter.row && letterId <= this.squares.length - 1; letterId += 1) {
        if (additionalId !== undefined) {
          newAdditionalWord.letters.push(this.squares[letterId])
        } else {
          this.typedWord.letters.push(this.squares[letterId])
        }

        if (this.typedWord.orientation === 'both') {
          this.typedWord.orientation = 'horizontal'
        }
      }
    }

    if (orientation === 'vertical' || orientation === 'both') {
      letterId = lastLetterId + 15

      for (letterId; this.squares[letterId].letter !== '' && this.squares[letterId].column === lastLetter.column && letterId <= this.squares.length - 1; letterId += 15) {
        if (additionalId !== undefined) {
          newAdditionalWord.letters.push(this.squares[letterId])
        } else {
          this.typedWord.letters.push(this.squares[letterId])
        }

        if (this.typedWord.orientation === 'both') {
          this.typedWord.orientation = 'vertical'
        }
      }
    }

    if (newAdditionalWord.letters.length > 0 && additionalId !== undefined) {
      if (!this.additionalWords[additionalId]) {
        this.additionalWords[additionalId] = new WordModel()
      }

      this.additionalWords[additionalId].letters = newAdditionalWord.letters
      this.additionalWords[additionalId].orientation = orientation
    }
  }

  checkGaps (): boolean {
    let hasGaps = false
    let letterUsedInWord = false
    const squaresToAdd: SquareModel[] = []
    const firstLetterId = this.squares.findIndex(letter => letter === this.typedWord.letters[0])
    const lastLetterId = this.squares.findIndex(letter => letter === this.typedWord.letters[this.typedWord.letters.length - 1])
    const nextId = this.typedWord.orientation === 'horizontal' ? 1 : 15

    for (let letterId = firstLetterId; letterId < lastLetterId; letterId += nextId) {
      letterUsedInWord = this.typedWord.letters.some(letter => letter.id === this.squares[letterId].id)

      if (this.squares[letterId].letter !== '' && !letterUsedInWord
      ) {
        squaresToAdd.push(this.squares[letterId])
      }

      if (this.squares[letterId].letter === '' && !letterUsedInWord) {
        hasGaps = true
      }
    }

    this.typedWord.letters.push(...squaresToAdd)
    return hasGaps
  }

  correctLettersOrder (word: WordModel): void {
    if (word.orientation === 'horizontal') {
      word.letters.sort((letterA, letterB) => letterA.column - letterB.column)
    }

    if (word.orientation === 'vertical') {
      word.letters.sort((letterA, letterB) => letterA.row - letterB.row)
    }
  }

  wordOrientationCorrect (): boolean {
    const wordIsHorizontal = this.wordHorizontal()
    const wordIsVertical = this.wordVertical()
    let wordOrientationOk = true

    if (this.typedWord.letters.length > 1) {
      if (wordIsHorizontal) {
        this.typedWord.orientation = 'horizontal'
      }

      if (wordIsVertical) {
        this.typedWord.orientation = 'vertical'
      }

      if ((wordIsHorizontal && wordIsVertical) ||
    (!wordIsHorizontal && !wordIsVertical)
      ) {
        this.typedWord.orientation = ''
        this.errorMessage = this.texts.errors.orientation
        this.errorOpen = true
        wordOrientationOk = false
      }
    } else {
      this.typedWord.orientation = 'both'
    }

    return wordOrientationOk
  }

  wordHorizontal (): boolean {
    let isHorizontal = true
    const rowNumber = this.typedWord.letters[0].row

    for (const letter of this.typedWord.letters) {
      if (letter.row !== rowNumber) {
        isHorizontal = false
      }
    }

    return isHorizontal
  }

  wordVertical (): boolean {
    let isVertical = true
    const columnNumber = this.typedWord.letters[0].column

    for (const letter of this.typedWord.letters) {
      if (letter.column !== columnNumber) {
        isVertical = false
      }
    }

    return isVertical
  }

  addLetterToWord (newLetter: SquareModel): void {
    const letterId = this.typedWord.letters.findIndex(letter => letter.id === newLetter.id)
    const squareId = this.squares.findIndex(square => square.id === newLetter.id)
    let nextSquareId = ''

    if (letterId >= 0) {
      this.typedWord.letters[letterId] = newLetter
    }

    if (letterId === -1) {
      this.typedWord.letters.push(newLetter)
    }

    if (this.wordOrientationCorrect() && this.typedWord.orientation !== 'both') {
      if (this.typedWord.orientation === 'horizontal' && newLetter.column < 15) {
        nextSquareId = `square${squareId + 1}`
        const squareElement = this.$refs[nextSquareId] as Board[]
        const nextSquareItem = squareElement[0].$el as HTMLElement
        nextSquareItem.focus()
      }
      if (this.typedWord.orientation === 'vertical' && newLetter.row < 15) {
        nextSquareId = `square${squareId + 15}`
        const squareElement = this.$refs[nextSquareId] as Board[]
        const nextSquareItem = squareElement[0].$el as HTMLElement
        nextSquareItem.focus()
      }
    }
  }

  removeEmptyLetter (letterToDelete: SquareModel): void {
    const letterId = this.typedWord.letters.findIndex(letter => letter.id === letterToDelete.id)

    this.typedWord.letters.splice(letterId, 1)
  }
}
</script>

<style lang="scss" scoped>
.board-container {
  display: grid;
  grid-template-columns: repeat(15, 40px);
}
</style>

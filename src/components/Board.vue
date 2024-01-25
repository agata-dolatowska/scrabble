<template lang="pug">
  div
    div.board-container
      <Square v-for="(square, i) in squares" :ref="'square' + i" :key="square.id" :square="square" @addLetterToWord="addLetterToWord" @removeEmptyLetter="removeEmptyLetter" @goToPreviousSquare="goToPreviousSquare"/>
    button(v-if="!gameFinished" @click="checkWord" :disabled="typedWord.letters.length === 0") {{ $t('checkWord') }}
    <ErrorMessage v-if="errorOpen" :message="errorMessage" @close="errorOpen = false"/>
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
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
  @Prop() clearTypedWord!: boolean
  @Prop() savedWords!: WordModel[]
  @Prop() gameFinished!: boolean
  private typedWord = new WordModel()
  private additionalWords: WordModel[] = []
  private maxTypedLetters = 7
  private errorOpen = false
  private errorMessage = ''

  get wordCount () {
    return this.savedWords.length
  }

  @Watch('clearTypedWord')
  private clearLastWord (clearWord: boolean) {
    if (clearWord) {
      this.removeTypedLetters()
      this.typedWord = new WordModel()
      this.$emit('stopClearLastWord')
    }
  }

  private removeTypedLetters () {
    let squareArrId = null

    for (const letter of this.typedWord.letters) {
      squareArrId = this.squares.findIndex(square => square.id === letter.id)

      this.$emit('removeTypedLetter', squareArrId)
    }
  }

  checkWord () {
    let wordOk = true
    const currentTurn = new TurnModel()
    currentTurn.typedLetters = JSON.parse(JSON.stringify(this.typedWord.letters))

    if (!this.wordLengthCorrect()) {
      wordOk = false
    }

    if (!this.wordOrientationCorrect()) {
      wordOk = false
    }

    if (this.typedWord.letters.length > 1) {
      this.correctLettersOrder(this.typedWord)
    }

    if (this.typedWord.letters.length === 7) {
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

    this.checkAdditionalDuplicates(currentTurn.typedLetters)

    if (this.$i18n.locale === 'en') {
      this.wordsExsists(wordOk, currentTurn)
    } else {
      this.finishTurn(wordOk, currentTurn)
    }
  }

  finishTurn (wordOk: boolean, currentTurn: TurnModel) {
    if (wordOk) {
      this.blockDelete()
      currentTurn.savedWords.push(this.typedWord, ...this.additionalWords)
      this.$emit('updateTiles', currentTurn.typedLetters)
      this.$emit('addTurn', currentTurn)
    } else {
      this.removeWordFromBoard()
      this.$emit('createEmptyTurn')
    }

    this.typedWord = new WordModel()
    this.additionalWords = []
  }

  async wordsExsists (wordOk: boolean, currentTurn: TurnModel) {
    const wordsObjectsToCheck = [this.typedWord, ...this.additionalWords]
    const wordsToCheck = []
    const correctWords = []
    let wordsAreCorrect = true

    for (const word of wordsObjectsToCheck) {
      const newWord = []
      for (const wordLetter of word.letters) {
        newWord.push(wordLetter.letter)
      }
      wordsToCheck.push(newWord.join(''))
    }

    try {
      for (const word of wordsToCheck) {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        correctWords.push(res.ok)

        if (!res.ok) {
          wordsAreCorrect = false
        }
      }
    } catch (err) {
      wordsAreCorrect = false
    }

    wordsAreCorrect = correctWords.filter(word => word === false).length === 0

    this.finishTurn(wordsAreCorrect, currentTurn)
  }

  blockDelete (): void {
    for (const letter of this.typedWord.letters) {
      letter.isBlocked = true
    }

    if (this.additionalWords.length > 0) {
      for (const word of this.additionalWords) {
        for (const letter of word.letters) {
          letter.isBlocked = true
        }
      }
    }
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

  checkAdditionalDuplicates (typedLetters: SquareModel[]) {
    const correctAdditionalWords: WordModel[] = []

    for (const additionalWord of this.additionalWords) {
      for (const typedLetter of typedLetters) {
        if (additionalWord.letters.some(letter => JSON.stringify(letter) === JSON.stringify(typedLetter))) {
          correctAdditionalWords.push(additionalWord)
        }
      }
    }

    this.additionalWords = JSON.parse(JSON.stringify(correctAdditionalWords))
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
        this.errorMessage = this.$t('errors.emptyCenter') as string
        this.errorOpen = true
        wordOk = false
      }

      if (this.typedWord.letters.length < 2) {
        this.errorMessage = this.$t('errors.firstWordTooShort') as string
        this.errorOpen = true
        wordOk = false
      }
    }

    if (this.typedWord.letters.length > this.maxTypedLetters) {
      this.errorMessage = this.$t('errors.wordTooLong') as string
      this.errorOpen = true
      wordOk = false
    }

    if (this.wordCount > 0 && this.typedWord.letters.length < 1) {
      this.errorMessage = this.$t('errors.wordTooShort') as string
      this.errorOpen = true
      wordOk = false
    }

    return wordOk
  }

  checkWordBeginning (firstLetter: SquareModel, orientation: string, additionalId?: number): void {
    const firstLetterId = this.squares.findIndex(square => square.id === firstLetter.id)
    const newAdditionalWord = new WordModel()
    let letterId = firstLetterId
    let wordOrientation = orientation

    if (wordOrientation === 'horizontal' || wordOrientation === 'both') {
      letterId -= 1

      for (letterId; this.squares[letterId].letter !== '' && this.squares[letterId].row === firstLetter.row && letterId >= 0; letterId -= 1) {
        if (additionalId !== undefined) {
          newAdditionalWord.letters.unshift(this.squares[letterId])
        } else {
          this.typedWord.letters.unshift(this.squares[letterId])
        }

        if (this.typedWord.orientation === 'both') {
          this.typedWord.orientation = 'horizontal'
          wordOrientation = 'horizontal'
        }
      }
    }

    if (wordOrientation === 'both') {
      letterId++
    }

    if (letterId - 15 >= 0 && (wordOrientation === 'vertical' || wordOrientation === 'both')) {
      letterId -= 15

      for (letterId; this.squares[letterId].letter !== '' && this.squares[letterId].column === firstLetter.column && letterId >= 0; letterId -= 15) {
        if (additionalId !== undefined) {
          newAdditionalWord.letters.unshift(this.squares[letterId])
        } else {
          this.typedWord.letters.unshift(this.squares[letterId])
        }

        if (this.typedWord.orientation === 'both') {
          this.typedWord.orientation = 'vertical'
          wordOrientation = 'vertical'
        }
      }
    }

    if (newAdditionalWord.letters.length > 0 && additionalId !== undefined) {
      if (!this.additionalWords[additionalId]) {
        this.additionalWords[additionalId] = new WordModel()
      }

      this.additionalWords[additionalId].letters = newAdditionalWord.letters
      this.additionalWords[additionalId].orientation = wordOrientation
    }
  }

  checkWordEnding (lastLetter: SquareModel, orientation: string, additionalId?: number): void {
    const lastLetterId = this.squares.findIndex(square => square.id === lastLetter.id)
    const newAdditionalWord = new WordModel()
    const oneBeforeLastRowId = 209
    let letterId = lastLetterId
    let wordOrientation = orientation

    if (wordOrientation === 'horizontal' || wordOrientation === 'both') {
      letterId = lastLetterId + 1

      for (letterId; this.squares[letterId].letter !== '' && this.squares[letterId].row === lastLetter.row && letterId <= this.squares.length - 1; letterId += 1) {
        if (additionalId !== undefined) {
          newAdditionalWord.letters.push(this.squares[letterId])
        } else {
          this.typedWord.letters.push(this.squares[letterId])
        }

        if (this.typedWord.orientation === 'both') {
          this.typedWord.orientation = 'horizontal'
          wordOrientation = 'horizontal'
        }
      }
    }

    if ((letterId < oneBeforeLastRowId && wordOrientation === 'vertical') || wordOrientation === 'both') {
      letterId = lastLetterId + 15

      for (letterId; this.squares[letterId].letter !== '' && this.squares[letterId].column === lastLetter.column && letterId <= this.squares.length - 1; letterId += 15) {
        if (additionalId !== undefined) {
          newAdditionalWord.letters.push(this.squares[letterId])
        } else {
          this.typedWord.letters.push(this.squares[letterId])
        }

        if (this.typedWord.orientation === 'both') {
          this.typedWord.orientation = 'vertical'
          wordOrientation = 'vertical'
        }
      }
    }

    if (newAdditionalWord.letters.length > 0 && additionalId !== undefined) {
      if (!this.additionalWords[additionalId]) {
        this.additionalWords[additionalId] = new WordModel()
      }

      this.additionalWords[additionalId].letters = newAdditionalWord.letters
      this.additionalWords[additionalId].orientation = wordOrientation
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
        this.errorMessage = this.$t('errors.orientation') as string
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
    const lastColumnId = 15
    const lastRowId = 15
    let squareId = this.squares.findIndex(square => square.id === newLetter.id)
    let nextSquareId = ''
    let squareElement: Board[]
    let nextSquareItem: HTMLElement

    if (letterId >= 0) {
      this.typedWord.letters[letterId] = newLetter
    }

    if (letterId === -1) {
      this.typedWord.letters.push(newLetter)
    }

    if (this.wordOrientationCorrect() && this.typedWord.orientation !== 'both') {
      if (this.typedWord.orientation === 'horizontal' && newLetter.column < lastColumnId) {
        squareId = squareId + 1

        while (this.squares[squareId].isBlocked && this.squares[squareId].column < lastColumnId) {
          squareId++
        }

        nextSquareId = `square${squareId}`
        squareElement = this.$refs[nextSquareId] as Board[]
        nextSquareItem = squareElement[0].$el as HTMLElement

        if (!this.squares[squareId].isBlocked && this.squares[squareId].column <= lastColumnId) {
          nextSquareItem.focus()
        }
      }

      if (this.typedWord.orientation === 'vertical' && newLetter.row < lastRowId) {
        squareId = squareId + 15

        while (this.squares[squareId].isBlocked && this.squares[squareId].column < lastRowId) {
          squareId += 15
        }

        nextSquareId = `square${squareId}`
        squareElement = this.$refs[nextSquareId] as Board[]
        nextSquareItem = squareElement[0].$el as HTMLElement

        if (!this.squares[squareId].isBlocked && this.squares[squareId].row <= lastRowId) {
          nextSquareItem.focus()
        }
      }
    }
  }

  removeEmptyLetter (letterToDelete: SquareModel): void {
    const letterId = this.typedWord.letters.findIndex(letter => letter.id === letterToDelete.id)

    this.typedWord.letters.splice(letterId, 1)
  }

  goToPreviousSquare (currentSquare: SquareModel): void {
    let previousSquareId = ''
    let squareElement: Board[]
    let previousSquareItem: HTMLElement
    let squareId = this.squares.findIndex(square => square.id === currentSquare.id)
    const currentSquareId = this.squares.findIndex(square => square.id === currentSquare.id)

    if (this.typedWord.orientation !== 'both' && this.typedWord.orientation !== '' && this.typedWord.letters.length > 0) {
      if (this.typedWord.orientation === 'horizontal' && currentSquare.column > 1) {
        squareId--

        while (this.squares[squareId].isBlocked && this.squares[squareId].column > 0) {
          squareId--
        }

        previousSquareId = `square${squareId}`
        squareElement = this.$refs[previousSquareId] as Board[]
        previousSquareItem = squareElement[0].$el as HTMLElement

        if (!this.squares[squareId].isBlocked && this.squares[squareId].column > 0) {
          previousSquareItem.focus()
        }
      }
      if (this.typedWord.orientation === 'vertical' && currentSquare.row > 0) {
        squareId -= 15

        while (this.squares[squareId].isBlocked && this.squares[squareId].row > 0) {
          squareId -= 15
        }

        previousSquareId = `square${squareId}`
        squareElement = this.$refs[previousSquareId] as Board[]
        previousSquareItem = squareElement[0].$el as HTMLElement

        if (!this.squares[squareId].isBlocked && this.squares[squareId].row > 0) {
          previousSquareItem.focus()
        }
      }
    }

    if (this.typedWord.orientation === 'both' && currentSquare.row > 1 && currentSquare.column > 1 && this.typedWord.letters.length > 0) {
      squareId = this.squares.findIndex(square => square.id === this.typedWord.letters[0].id)
      previousSquareId = `square${squareId}`
      squareElement = this.$refs[previousSquareId] as Board[]
      previousSquareItem = squareElement[0].$el as HTMLElement
      previousSquareItem.focus()
    }
  }
}
</script>

<style lang="scss" scoped>
.board-container {
  display: grid;
  grid-template-columns: repeat(15, 40px);
}
</style>

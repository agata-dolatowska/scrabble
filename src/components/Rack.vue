<template lang="pug">
  div
    <p v-if="exchangeActive">{{  $t('selectLettersToExchange') }}</p>
    .rack-container
        <Tile v-for="(tile, id) in currentTilesCopy" :id="id" :tile="tile" :exchangeActive="exchangeActive" :clearExchange="clearExchange" @addToExchange="addToExchange" @removeFromExchange="removeFromExchange" :class="{'tile-used': tile.typed}"/>
    <Button @click="skipConfirmation">{{ $t('skipTurn') }}</Button>
    <button v-if="!exchangeActive" @click="exchangeActive = true">{{ $t('exchange') }}</button>
    <button v-if="exchangeActive" @click="cancelExchange">{{ $t('cancel') }}</button>
    <button v-if="exchangeActive" :disabled="tilesToExchange.length === 0" @click="acceptExchange">{{ $t('acceptExchange') }}</button>
    <ConfirmMessage v-if="confirmOpen" :message="confirmMessage" @close="confirmOpen = false" @accept="$emit('skipTurn', true), confirmOpen = false"/>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import Tile from '@/components/Tile.vue'
import TileModel from '@/models/Tile'
import WordModel from '@/models/Word'
import chooseRandomLetters from '@/utils/rack'
import ConfirmMessage from './ConfirmMessage.vue'

@Component({
  components: {
    Tile,
    ConfirmMessage
  }
})
export default class Rack extends Vue {
  @Prop() tiles!: TileModel[]
  @Prop() currentTiles!: TileModel[]
  @Prop() typedWord!: WordModel
  private exchangeActive = false
  private tilesToExchange: TileModel[] = []
  private clearExchange = 0
  private confirmOpen = false
  private confirmMessage = ''
  private currentTilesCopy: TileModel[] = JSON.parse(JSON.stringify(this.currentTiles))

  @Watch('currentTiles', { immediate: true, deep: true })
  updateCurrentTiles () {
    this.currentTilesCopy = JSON.parse(JSON.stringify(this.currentTiles))
  }

  @Watch('typedWord', { immediate: true, deep: true })
  updateTypedLetters () {
    const lettersToCheck = this.typedWord.letters.map(typedLetter => typedLetter.letter.toUpperCase())
    const currentLetters = this.currentTilesCopy.map(currentTile => currentTile.letter.toUpperCase())
    const otherLetters = lettersToCheck.filter(letterToCheck => {
      const currentLetterId = currentLetters.findIndex(letter => letter === letterToCheck)
      currentLetters.splice(currentLetterId, 1)
      return currentLetterId < 0
    })

    for (const currentLetter of this.currentTilesCopy) {
      currentLetter.typed = false
    }

    for (const currentLetter of this.currentTilesCopy) {
      const tileId = lettersToCheck.findIndex(typedLetter => typedLetter.toUpperCase() === currentLetter.letter.toUpperCase())

      if (tileId >= 0 && currentLetter.typed === false) {
        lettersToCheck.splice(tileId, 1)
        currentLetter.typed = true
      }

      if (currentLetter.letter === '' &&
      currentLetter.typed === false &&
      otherLetters.length > 0) {
        otherLetters.shift()
        currentLetter.typed = true
      }
    }
  }

  addToExchange (tile: TileModel): void {
    this.tilesToExchange.push(tile)
  }

  skipConfirmation () {
    this.confirmMessage = this.$t('skipQuestion') as string
    this.confirmOpen = true
  }

  removeFromExchange (tileToRemove: TileModel): void {
    const tileId = this.tilesToExchange.findIndex(tile => tile.letter.toUpperCase() === tileToRemove.letter.toUpperCase())

    this.tilesToExchange.splice(tileId, 1)
    this.clearExchange++
  }

  cancelExchange () {
    this.exchangeActive = false
    this.clearExchange++
  }

  acceptExchange (): void {
    let tileId = 0

    for (const tile of this.tilesToExchange) {
      tileId = this.currentTilesCopy.findIndex(currentTile => currentTile.letter.toUpperCase() === tile.letter.toUpperCase())
      this.currentTilesCopy.splice(tileId, 1)
    }

    this.exchangeActive = false
    this.$emit('setNewTiles', chooseRandomLetters(this.tiles, this.currentTilesCopy))
    this.$emit('returnExchangedTiles', this.tilesToExchange)
    this.tilesToExchange = []
    this.clearExchange++
  }
}
</script>

<style lang="scss" scoped>
.rack-container {
  display: flex;
  flex-wrap: wrap;
}

.tile-used {
  background: lightgreen;
}
</style>

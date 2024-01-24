<template lang="pug">
  div
    <p v-if="exchangeActive">{{  $t('selectLettersToExchange') }}</p>
    .rack-container
        <Tile v-for="(tile, id) in currentTiles" :id="id" :tile="tile" :exchangeActive="exchangeActive" :clearExchange="clearExchange" @addToExchange="addToExchange" @removeFromExchange="removeFromExchange"/>
    <Button @click="skipConfirmation">{{ $t('skipTurn') }}</Button>
    <button v-if="!exchangeActive" @click="exchangeActive = true">{{ $t('exchange') }}</button>
    <button v-if="exchangeActive" @click="cancelExchange">{{ $t('cancel') }}</button>
    <button v-if="exchangeActive" :disabled="tilesToExchange.length === 0" @click="acceptExchange">{{ $t('acceptExchange') }}</button>
    <ConfirmMessage v-if="confirmOpen" :message="confirmMessage" @close="confirmOpen = false" @accept="$emit('skipTurn'), confirmOpen = false"/>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Tile from '@/components/Tile.vue'
import TileModel from '@/models/Tile'
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
  private exchangeActive = false
  private tilesToExchange: TileModel[] = []
  private clearExchange = 0
  private confirmOpen = false
  private confirmMessage = ''

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
      tileId = this.currentTiles.findIndex(currentTile => currentTile.letter.toUpperCase() === tile.letter.toUpperCase())
      this.currentTiles.splice(tileId, 1)
    }

    this.exchangeActive = false
    this.$emit('setNewTiles', chooseRandomLetters(this.tiles, this.currentTiles))
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
</style>

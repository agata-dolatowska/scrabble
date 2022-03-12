<template lang="pug">
  div
    <p v-if="exchangeActive">Select letters to exchange</p>
    .rack-container
        <Tile v-for="tile in currentTiles" :key="tile.id" :tile="tile" :exchangeActive="exchangeActive" @addToExchange="addToExchange" @removeFromExchange="removeFromExchange"/>
    <button v-if="!exchangeActive" @click="exchangeActive = true">Exchange</button>
    <button v-if="exchangeActive" @click="cancelExchange">Cancel</button>
    <button v-if="exchangeActive" :disabled="tilesToExchange.length === 0" @click="acceptExchange">Accept exchange</button>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Tile from '@/components/Tile.vue'
import TileModel from '@/models/Tile'

@Component({
  components: {
    Tile
  }
})
export default class Rack extends Vue {
  @Prop() tiles!: TileModel[]
  @Prop() currentTiles!: TileModel[]
  private exchangeActive = false
  private tilesToExchange: TileModel[] = []

  mounted () {
    this.chooseRandomLetters()
  }

  addToExchange (tile: TileModel): void {
    this.tilesToExchange.push(tile)
  }

  removeFromExchange (tileToRemove: TileModel): void {
    const tileId = this.tilesToExchange.findIndex(tile => tile.letter.toUpperCase() === tileToRemove.letter.toUpperCase())
    const tileRackId = this.currentTiles.findIndex(tile => tile.letter.toUpperCase() === tileToRemove.letter.toUpperCase())

    this.tilesToExchange.splice(tileId, 1)
    this.currentTiles[tileRackId].chosenForExchange = false
  }

  cancelExchange () {
    this.exchangeActive = false
    this.tilesToExchange = []

    for (const tile of this.currentTiles) {
      tile.chosenForExchange = false
    }
  }

  acceptExchange (): void {
    let tileId = 0

    for (const tile of this.tilesToExchange) {
      tileId = this.currentTiles.findIndex(currentTile => currentTile.letter.toUpperCase() === tile.letter.toUpperCase())
      this.currentTiles.splice(tileId, 1)
    }

    this.exchangeActive = false
    this.chooseRandomLetters()
    this.$emit('returnExchangedTiles', this.tilesToExchange)
    this.tilesToExchange = []
  }

  chooseRandomLetters (): void {
    let randomIndex = 0
    const newSetOfTiles: TileModel[] = JSON.parse(JSON.stringify(this.currentTiles))

    while (newSetOfTiles.length <= 6) {
      randomIndex = Math.floor(Math.random() * (this.tiles.length - 0))
      if (this.tiles[randomIndex].amount > 0) {
        newSetOfTiles.push(this.tiles[randomIndex])
      }
    }

    this.$emit('setNewTiles', newSetOfTiles)
  }
}
</script>

<style lang="scss" scoped>
.rack-container {
  display: flex;
  flex-wrap: wrap;
}
</style>

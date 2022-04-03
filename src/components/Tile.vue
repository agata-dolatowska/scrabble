<template lang="pug">
    .tile(:draggable="!exchangeActive && !isBlank" @dragstart="startDrag($event, tile)" :class="{'exchange-mode': exchangeActive, exchange: tile.chosenForExchange && exchangeActive, blank: isBlank}" @click="chooseForExchange")
        p.tile-letter {{ tile.letter }}
        p.tile-points {{ tile.points }}
</template>

<script lang="ts">
import Vue from 'vue'
import { Prop, Component } from 'vue-property-decorator'
import TileModel from '@/models/Tile'

@Component
export default class Tile extends Vue {
    @Prop() tile!: TileModel
    @Prop() exchangeActive!: boolean

    get isBlank () {
      return this.tile.letter === ''
    }

    chooseForExchange (): void {
      if (this.exchangeActive) {
        this.tile.chosenForExchange = !this.tile.chosenForExchange

        if (this.tile.chosenForExchange) {
          this.$emit('addToExchange', this.tile)
        } else {
          this.$emit('removeFromExchange', this.tile)
        }
      }
    }

    startDrag (e: any, tile: TileModel): void {
      if (!this.isBlank) {
        e.dataTransfer.setData('letter', tile.letter)
      }
    }
}
</script>

<style lang="scss" scoped>
.tile {
    min-width: 50px;
    height: 50px;
    font-size: 30px;
    border: 1px solid black;
    position: relative;
    padding: 10px;
    transition: background-color .5s;

    &:not(.blank):hover {
        cursor: move;
    }

    &.exchange-mode:hover {
        background-color: gray;
        cursor: pointer;
    }

    &.exchange {
        background-color: gray;
    }
}

.tile-letter {
    margin: 0;
    text-align: center;
    line-height: 50px;
}

.tile-points {
    position: absolute;
    bottom: 2px;
    right: 5px;
    font-size: 15px;
    margin: 0;
}
</style>

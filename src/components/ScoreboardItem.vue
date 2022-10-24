<template lang="pug">
    td {{ points }}
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import WordModel from '@/models/Word'
import tiles from '@/game-assets/tiles'

@Component
export default class ScoreboardItem extends Vue {
    @Prop({ required: true }) words!: WordModel[]

    get points () {
      let sum = 0
      let point = 0
      let letterId = 0
      const wordBonuses = []
      const wordsPoints = []

      for (const word of this.words) {
        sum = 0

        for (const letter of word.letters) {
          letterId = tiles.findIndex(tile => tile.letter === letter.letter.toUpperCase())

          if (letterId >= 0) {
            point = tiles[letterId].points
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

      return wordsPoints.reduce((prev, current) => prev + current, 0)
    }
}
</script>

<template lang="pug">
    div
        table
            thead
                tr
                    th turn
                    th(v-for="player in players") {{ player.name }}
            tbody(v-if="someUserHasPoints")
                tr
                    td
                        table
                            tr(v-for="(turn, i) in players[0].score.length" :key="i")
                                td {{ i + 1 }}
                    td(v-for="player in players")
                        tr(v-for="turn in player.score")
                            <ScoreboardItem :words="turn.savedWords"/>
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import ScoreboardItem from '@/components/ScoreboardItem.vue'
import PlayerModel from '@/models/Player'

@Component({
  components: {
    ScoreboardItem
  }
})
export default class Scoreboard extends Vue {
    @Prop({ required: true }) players!: PlayerModel[]

    get someUserHasPoints () {
      return this.players.some(player => player.score.length > 0)
    }
}
</script>
<style lang="scss" scoped>
  td {
    vertical-align: top;
  }
</style>

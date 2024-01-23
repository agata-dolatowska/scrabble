<template lang="pug">
    div.scoreboard
        table
            thead
                tr
                    th {{ $t('turn') }}
                    th(v-for="player in players") {{ player.name }}
            tbody(v-if="someUserHasPoints")
                tr
                    td.main-td
                        table
                            tr(v-for="(turn, i) in players[0].score.length" :key="i")
                                td {{ i + 1 }}
                    td.main-td(v-for="player in players")
                        tr(v-for="turn in player.score")
                            td {{ turn.points }}
            tfoot
                tr
                  td {{ $t('total') }}
                  td(v-for="player in players") {{ player.totalScore }}
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import PlayerModel from '@/models/Player'

@Component
export default class Scoreboard extends Vue {
    @Prop({ required: true }) players!: PlayerModel[]

    get someUserHasPoints () {
      return this.players.some(player => player.score.length > 0)
    }
}
</script>
<style lang="scss" scoped>
  .scoreboard {
    max-height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  table {
    border-collapse: collapse
  }

  td {
    vertical-align: top;
  }

  th,
  .main-td {
    border-bottom: 1px solid black;
  }

  th,
  td {
    padding: 5px;
  }

  thead,
  tfoot {
    position: sticky;
    background-color: white;
  }

  thead {
    top: 0;
  }

  tfoot {
    bottom: 0;
  }
</style>

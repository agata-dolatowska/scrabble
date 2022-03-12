<template lang="pug">
    div
        table
            tbody
                tr(v-for="(turn, i) in scores"  :key="i")
                  <ScoreboardItem v-for="(word, i) in turn.savedWords" :key="i" :word="word"/>
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Turn from '@/models/Turn'
import ScoreboardItem from '@/components/ScoreboardItem.vue'

@Component({
  components: {
    ScoreboardItem
  }
})
export default class Scoreboard extends Vue {
    @Prop({ required: true }) scores!: Turn[]
}
</script>

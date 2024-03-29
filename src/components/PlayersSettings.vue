<template lang="pug">
    .players-container
        p {{ $t('players') }}
        .player(v-for="player in players" :key="player.id")
            <Input v-model="player.name" :placeholder="$t('addPlayersName')" :class="{'error': player.name === '' && showEmptyNames}" />
            <Button v-if="players.length > 1" @click="removePlayer(player.id)">{{ $t('delete') }}</Button>
        <Button @click="addPlayer" :disabled="players.length === maxPlayers">{{ $t('addPlayer') }}</Button>
        <Button @click="savePlayers">{{ $t('savePlayers') }}</Button>
        <ErrorMessage v-if="errorOpen" :message="errorMessage" @close="errorOpen = false"/>
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import PlayerModel from '@/models/Player'
import Input from '@/components/Input.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'

@Component({
  components: {
    Input,
    ErrorMessage
  }
})
export default class PlayersSettings extends Vue {
    private players: PlayerModel[] = []
    private maxPlayers = 4
    private errorOpen = false
    private showEmptyNames = false
    errorMessage = ''

    mounted () {
      this.addPlayer()
    }

    private addPlayer () {
      const nextId = this.players[this.players.length - 1]?.id + 1 || 0

      if (this.players.length === this.maxPlayers) {
        return
      }

      this.players.push(new PlayerModel(nextId))
    }

    private removePlayer (id: number) {
      const playerId = this.players.findIndex(player => player.id === id)

      this.players.splice(playerId, 1)
    }

    private savePlayers () {
      if (this.playerHasEmptyName()) {
        this.showEmptyNames = true
        this.errorMessage = this.$t('errors.namesCantBeEmpty') as string
        this.errorOpen = true
        return
      }

      this.showEmptyNames = false

      this.$emit('updatePlayers', this.players)
    }

    private playerHasEmptyName (): boolean {
      return this.players.some(player => player.name === '')
    }
}
</script>

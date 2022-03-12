<template lang="pug">
  input(type="text" class="square" v-model="square.letter" :class="[square.bonus]" :disabled="square.isDisabled" @input="changeLetter" @dragover="allowDrop($event)" @drop="dropTile($event)")
</template>
<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import SquareModel from '@/models/Square'

@Component
export default class Square extends Vue {
  @Prop({ required: true }) square!: SquareModel

  allowDrop (e: any): void {
    e.preventDefault()
  }

  dropTile (e: any): void {
    e.preventDefault()
    this.square.letter = e.dataTransfer.getData('letter')
    this.$emit('addLetterToWord', this.square)
  }

  changeLetter () {
    if (/^[a-zA-Z]$/.test(this.square.letter)) {
      this.square.letter = this.square.letter.slice(-1)
      this.$emit('addLetterToWord', this.square)
    } else {
      this.square.letter = ''
      this.$emit('removeEmptyLetter', this.square)
    }
  }
}
</script>
<style lang="scss" scoped>
.square {
    font-size: 30px;
    text-transform: uppercase;
    text-align: center;
    width: 100%;
    background-color: white;
}
.double-letter {
  background-color: lightblue;
}
.triple-letter {
  background-color: lightgreen;
}
.double-word {
  background-color: lightcoral;
}
.triple-word {
  background-color: red;
}
</style>

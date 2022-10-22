<template lang="pug">
    input(v-model="inputValue" @input="$emit('input', inputValue)" type="text" :placeholder="placeholder")
</template>
<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component
export default class Input extends Vue {
  @Prop({ required: false }) value!: string
  @Prop({ required: false }) placeholder!: string

  private inputValue = this.value
}
</script>
<style lang="scss" scoped>
.error {
    border: 1px solid red;
}

</style>

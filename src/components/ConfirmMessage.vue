<template lang="pug">
    .message-container
      .message-wrapper
        p {{ message }}
        button(@click="$emit('accept')") {{ $t('ok') }}
        button(@click="$emit('close')") {{ $t('cancel') }}
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component
export default class ConfirmMessage extends Vue {
  @Prop({ required: true }) message!: string
}
</script>
<style lang="scss" scoped>
.message-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .message-wrapper {
    padding: 20px;
    border: 1px solid black;
    background-color: white;
  }
}
</style>

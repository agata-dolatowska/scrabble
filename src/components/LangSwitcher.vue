<template lang="pug">
    div
        p {{ $t('chooseLanguage') }}
        button(v-for="lang in availableLanguages" @click="changeLanguage(lang)" :class="{'chosen-language': lang === $i18n.locale}") {{ lang }}
</template>
<script lang="ts">
import Vue from 'vue'

export default class LangSwitcher extends Vue {
    private availableLanguages = ['en', 'pl']

    changeLanguage (lang: string) {
      this.$i18n.locale = lang
    }
}
</script>
<style lang="scss" scoped>
.chosen-language {
  background: gray;
}
</style>

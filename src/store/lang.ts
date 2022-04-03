import Vue from 'vue'
import Vuex from 'vuex'
import textsEn from '../texts/en.json'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    lang: 'en',
    texts: textsEn
  },
  mutations: {
    changeLanguage (state, langName) {
      state.lang = langName
    }
  },
  actions: {
  },
  modules: {
  }
})

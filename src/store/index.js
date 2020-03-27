/*
 * Created Date: Wednesday, March 4th 2020, 10:04:22 am
 * Author: Timotej Ecimovic
 *
 * Copyright (c) 2020 Silicon Labs
 */
import Vue from 'vue'
import Vuex from 'vuex'

// we first import the module
import zap from './zap'

Vue.use(Vuex)

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store({
    modules: {
      // then we reference it
      zap
    },

    // enable strict mode (adds overhead!)
    // for dev mode only
    strict: process.env.DEV
  })

  /*
    if we want some HMR magic for it, we handle
    the hot update like below. Notice we guard this
    code with "process.env.DEV" -- so this doesn't
    get into our production build (and it shouldn't).
  */

  if (process.env.DEV && module.hot) {
    module.hot.accept(['./zap'], () => {
      const newZap = require('./zap').default
      Store.hotUpdate({ modules: { zap: newZap } })
    })
  }

  return Store
}

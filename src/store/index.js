/**
 *
 *    Copyright (c) 2020 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
/*
 * Created Date: Wednesday, March 4th 2020, 10:04:22 am
 * Author: Timotej Ecimovic
 *
 * Copyright (c) 2020 Silicon Labs
 */
import Vue from 'vue'
import Vuex from 'vuex'
import VueTour from 'vue-tour'

require('vue-tour/dist/vue-tour.css')
// we first import the module
import zap from './zap'

Vue.use(VueTour).use(Vuex)

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store({
    modules: {
      // then we reference it
      zap,
    },

    // enable strict mode (adds overhead!)
    // for dev mode only
    strict: process.env.DEV,
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

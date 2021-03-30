<!--
Copyright (c) 2008,2020 Silicon Labs.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

<template>
  <div id="q-app">
    <q-ajax-bar />
    <router-view />
  </div>
</template>

<script>
import Vue from 'vue'
import { QSpinnerGears } from 'quasar'
const restApi = require(`../src-shared/rest-api.js`)
const util = require('./util/util.js')

function initLoad(store) {
  store.dispatch('zap/loadInitialData')
  store.dispatch('zap/loadOptions', {
    key: 'defaultResponsePolicy',
    type: 'string',
  })
  store.dispatch('zap/loadOptions', {
    key: 'manufacturerCodes',
    type: 'object',
  })
  store.dispatch('zap/loadSessionKeyValues')

  let promises = []
  promises.push(
    Vue.prototype.$serverGet('/zcl/cluster/all').then((response) => {
      let arg = response.data
      store.dispatch('zap/updateClusters', arg.data)
    })
  )
  promises.push(
    Vue.prototype.$serverGet('/zcl/deviceType/all').then((response) => {
      let arg = response.data
      store.dispatch('zap/updateZclDeviceTypes', arg.data || [])
    })
  )
  promises.push(store.dispatch(`zap/getProjectPackages`))
  return Promise.all(promises)
}

export default {
  name: 'App',
  methods: {
    pollUcComponentState() {
      console.log('Initialize polling for Uc Component state.')

      // Start polling Studio component state
      const UC_COMPONENT_STATE_POLLING_INTERVAL_MS = 4000
      let ucComponentStateIntervalId = setInterval(() => {
        this.$store.dispatch(
          'zap/updateUcComponentState',
          this.$store.state.zap.studio.projectPath
        )
      }, UC_COMPONENT_STATE_POLLING_INTERVAL_MS)
    },
    setThemeMode() {
      const theme = document.documentElement.getAttribute('data-theme')
      if (theme === 'com.silabs.ss.platform.theme.dark') {
        this.$q.dark.set(true)
      } else {
        this.$q.dark.set(false)
      }
    },
    setGenerationInProgress() {
      const progressMessage = document.documentElement.getAttribute(
        restApi.progress_attribute
      )
      if (progressMessage != null && progressMessage.length > 0) {
        this.$q.loading.show({
          spinner: QSpinnerGears,
          messageColor: 'white',
          message: progressMessage,
          spinnerSize: 300,
        })
      } else {
        this.$q.loading.hide()
      }
    },
  },
  mounted() {
    this.$q.loading.show({
      spinner: QSpinnerGears,
      messageColor: 'white',
      message: 'Please wait while zap is loading...',
      spinnerSize: 300,
    })

    // Parse the query string into the front end.
    const querystring = require('querystring')
    let search = global.location.search

    if (search[0] === '?') {
      search = search.substring(1)
    }

    let query = querystring.parse(search)
    if (query[`uiMode`]) {
      this.$store.dispatch('zap/setDefaultUiMode', query[`uiMode`])
    }

    if (`embeddedMode` in query) {
      this.$store.dispatch('zap/setEmbeddedMode', query[`embeddedMode`])
    }

    if (query['studioProject']) {
      this.$store.dispatch('zap/setStudioConfigPath', query['studioProject'])
      // this.pollUcComponentState()
    }

    this.zclDialogTitle = 'ZCL tab!'
    this.zclDialogText = 'Welcome to ZCL tab. This is just a test of a dialog.'
    this.zclDialogFlag = false

    util.observeAttribute('data-theme', () => {
      this.setThemeMode()
    })

    util.observeAttribute(restApi.progress_attribute, () => {
      this.setGenerationInProgress()
    })

    initLoad(this.$store).then(() => {
      this.$q.loading.hide()
    })
  },
}
</script>

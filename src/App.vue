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
    <router-view />
  </div>
</template>

<script>
import restApi from '../src-shared/rest-api.js'
export default {
  name: 'App',
  methods: {
    setThemeMode(bodyElement) {
      const theme = bodyElement.getAttribute('data-theme')
      if (theme === 'com.silabs.ss.platform.theme.dark') {
        this.$q.dark.set(true)
      } else {
        this.$q.dark.set(false)
      }
    },
  },
  mounted() {
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

    if (query['studioProject']) {
      this.$store.dispatch('zap/setStudioConfigPath', query['studioProject'])
    }

    this.zclDialogTitle = 'ZCL tab!'
    this.zclDialogText = 'Welcome to ZCL tab. This is just a test of a dialog.'
    this.zclDialogFlag = false
    var html = document.documentElement
    this.setThemeMode(html)
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          this.setThemeMode(html)
        }
      })
    }).observe(html, {
      attributes: true,
      attributeFilter: ['data-theme'],
      subtree: false,
    })
    this.$store.dispatch('zap/loadInitialData')
    this.$store.dispatch('zap/loadOptions', {
      key: 'defaultResponsePolicy',
      type: 'string',
    })
    this.$store.dispatch('zap/loadOptions', {
      key: 'manufacturerCodes',
      type: 'object',
    })
    this.$store.dispatch('zap/loadSessionKeyValues')

    this.$serverOn('zcl-item-list', (event, arg) => {
      if (arg.type === 'cluster') {
        this.$store.dispatch('zap/updateClusters', arg.data)
      }
    })
    this.$serverGet('/zcl/cluster/all')
    this.$serverOn('zcl-item-list', (event, arg) => {
      if (arg.type === 'device_type') {
        this.$store.dispatch('zap/updateZclDeviceTypes', arg.data || [])
      }
    })
    this.$serverGet('/zcl/deviceType/all')
  },
}
</script>

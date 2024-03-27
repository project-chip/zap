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
  <div>
    <q-ajax-bar color="grey" />
    <router-view />
    <q-btn
      @click="viewExceptions"
      class="fixed-bottom-right q-ma-lg"
      flat
      v-if="showExceptionIcon"
    >
      <q-icon name="warning" style="font-size: 2.5em; color: red" />
    </q-btn>
    <zcl-tour />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { QSpinnerGears } from 'quasar'
import ZclTour from './tutorials/ZclTour.vue'
import CommonMixin from './util/common-mixin'

const rendApi = require(`../src-shared/rend-api.js`)
const restApi = require(`../src-shared/rest-api.js`)
const observable = require('./util/observable.js')
const dbEnum = require(`../src-shared/db-enum.js`)
const storage = require('./util/storage.js')

window.addEventListener(
  'message',
  (event) => {
    const eventData = event?.data?.eventData
    switch (event?.data?.eventId) {
      case 'theme':
        window[rendApi.GLOBAL_SYMBOL_EXECUTE](
          rendApi.id.setDarkTheme,
          eventData.theme === 'dark'
        )
        break
      case 'save':
        if (eventData.shouldSave) {
          window[rendApi.GLOBAL_SYMBOL_EXECUTE](rendApi.id.save)
        }
        break
    }
  },
  false
)

async function initLoad(store) {
  let promises = []
  promises.push(store.dispatch('zap/loadInitialData'))
  promises.push(
    store.dispatch('zap/loadOptions', {
      key: 'coreSpecification',
      type: 'string',
    })
  )
  promises.push(
    store.dispatch('zap/loadOptions', {
      key: 'clusterSpecification',
      type: 'string',
    })
  )
  promises.push(
    store.dispatch('zap/loadOptions', {
      key: 'deviceTypeSpecification',
      type: 'string',
    })
  )
  promises.push(
    store.dispatch('zap/loadOptions', {
      key: 'defaultResponsePolicy',
      type: 'string',
    })
  )
  promises.push(
    store.dispatch('zap/loadOptions', {
      key: 'manufacturerCodes',
      type: 'object',
    })
  )
  promises.push(
    store.dispatch('zap/loadOptions', {
      key: 'profileCodes',
      type: 'object',
    })
  )
  promises.push(
    store.dispatch('zap/loadOptions', {
      key: 'generator',
      type: 'object',
    })
  )
  promises.push(store.dispatch('zap/loadSessionKeyValues'))

  if (
    localStorage.getItem('showDevTools') &&
    localStorage.getItem('showDevTools') == 'true'
  ) {
    promises.push(store.dispatch('zap/updateShowDevTools'))
  }
  promises.push(store.dispatch('zap/updateClusters'))
  promises.push(store.dispatch('zap/updateAtomics'))
  promises.push(store.dispatch('zap/updateZclDeviceTypes'))
  promises.push(store.dispatch(`zap/getProjectPackages`))
  promises.push(store.dispatch(`zap/loadZclClusterToUcComponentDependencyMap`))
  return Promise.all(promises)
}

export default defineComponent({
  name: 'App',
  components: {
    ZclTour,
  },
  mixins: [CommonMixin],
  computed: {
    showExceptionIcon() {
      return this.$store.state.zap.showExceptionIcon
    },
    uiThemeCategory: {
      get() {
        return this.$store.state.zap.selectedZapConfig?.zclProperties.category
      },
    },
  },
  methods: {
    setGenerationInProgress(progressMessage) {
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
    viewExceptions() {
      this.$router.push('/')
      if (!this.$store.state.zap.showDevTools)
        this.$store.dispatch('zap/updateShowDevTools')
      if (!this.$store.state.zap.isExceptionsExpanded)
        this.$store.commit('zap/expandedExceptionsToggle')
      this.$store.dispatch('zap/setDefaultUiMode', 'general')
      this.$store.commit('zap/toggleShowExceptionIcon', false)
    },
    getAppData() {
      if (this.$serverGet != null) {
        this.$serverGet(restApi.uri.uiOptions).then((res) => {
          this.$store.commit(
            'zap/updateIsProfileIdShown',
            res.data.showProfileId
          )
        })
      }

      // Parse the query string into the front end.
      const querystring = require('querystring')
      let search = window.location.search

      if (search[0] === '?') {
        search = search.substring(1)
      }

      let query = querystring.parse(search)
      if (query[`uiMode`]) {
        this.$store.dispatch('zap/setDefaultUiMode', query[`uiMode`])
      }

      if (`debugNavBar` in query) {
        this.$store.dispatch(
          'zap/setDebugNavBar',
          query[`debugNavBar`] === 'true'
        )
      } else {
        // If we don't specify it, default is on.
        this.$store.dispatch('zap/setDebugNavBar', true)
      }

      if ('standalone' in query) {
        this.$store.dispatch('zap/setStandalone', query['standalone'])
      }

      if (`setSaveButtonVisible` in query) {
        this.$store.dispatch(
          'zap/setSaveButtonVisible',
          query[`setSaveButtonVisible`] === 'true'
        )
      } else {
        // If we don't specify it, default is off.
        this.$store.dispatch('zap/setSaveButtonVisible', false)
      }

      this.zclDialogTitle = 'ZCL tab!'
      this.zclDialogText =
        'Welcome to ZCL tab. This is just a test of a dialog.'
      this.zclDialogFlag = false

      observable.observeAttribute(
        rendApi.observable.progress_attribute,
        (message) => {
          this.setGenerationInProgress(message)
        }
      )

      initLoad(this.$store).then(() => {
        this.$q.loading.hide()
      })

      // load initial UC component state
      this.$store.dispatch(`zap/loadUcComponentState`)

      // handles UC component state change events
      this.$onWebSocket(
        dbEnum.wsCategory.updateSelectedUcComponents,
        (resp) => {
          this.$store.dispatch('zap/updateSelectedUcComponentState', resp)
        }
      )

      this.$onWebSocket(dbEnum.wsCategory.dirtyFlag, (resp) => {
        this.$store.dispatch('zap/setDirtyState', resp)
      })
    },
    addClassToBody() {
      if (this.uiThemeCategory === 'zigbee') {
        document.body.classList.remove('matter')
        document.body.classList.add('zigbee')
      } else {
        document.body.classList.remove('zigbee')
        document.body.classList.add('matter')
      }
    },
  },
  created() {
    // Parse the query string into the front end.
    const querystring = require('querystring')
    let search = window.location.search

    if (search[0] === '?') {
      search = search.substring(1)
    }
    let query = querystring.parse(search)
    if (query[`stsApplicationId`]) {
      window.sessionStorage.setItem('session_uuid', query[`stsApplicationId`])
    }
    window[rendApi.GLOBAL_SYMBOL_EXECUTE](
      rendApi.id.setDarkTheme,
      storage.getItem(rendApi.storageKey.isDarkThemeActive)
    )
    if (window.location.hash == '#/preferences/about') {
      this.$router.push({ path: '/preferences/about' })
    } else if (this.isZapConfigSelected != true) {
      this.$router.push({ path: '/config' })
    } else {
      this.$router.push({ path: '/' })
      this.getAppData()
    }
  },
  mounted() {
    this.addClassToBody()
    window?.parent?.postMessage(
      {
        eventId: 'mounted',
        eventData: {
          hasMounted: true,
        },
      },
      '*'
    )
  },
  unmounted() {
    if (this.uiThemeCategory === 'zigbee') {
      document.body.classList.remove('zigbee')
    } else {
      document.body.classList.remove('matter')
    }
  },
  watch: {
    isZapConfigSelected(val) {
      if (window.location.hash == '#/preferences/about') {
        this.$router.push({ path: '/preferences/about' })
      } else if (val != true) {
        this.$router.push({ path: '/config' })
      } else {
        this.$router.push({ path: '/' })
        this.getAppData()
      }
    },
    uiThemeCategory() {
      this.addClassToBody()
    },
  },
})
</script>
<style lang="scss" scoped>
.slide-left-leave-active,
.slide-left-enter-active {
  transition: all 0.25s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}
</style>

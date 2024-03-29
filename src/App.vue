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

async function loadInitialData(store) {
  return store.dispatch('zap/loadInitialData')
}

async function loadOptions(store, options) {
  let promises = options.map((option) => {
    return store.dispatch('zap/loadOptions', option)
  })
  return Promise.all(promises)
}

async function loadSessionKeyValues(store) {
  return store.dispatch('zap/loadSessionKeyValues')
}
async function updateShowDevTools(store) {
  if (
    localStorage.getItem('showDevTools') &&
    localStorage.getItem('showDevTools') == 'true'
  ) {
    return store.dispatch('zap/updateShowDevTools')
  }
}

async function updateData(store) {
  let promises = [
    store.dispatch('zap/updateClusters'),
    store.dispatch('zap/updateAtomics'),
    store.dispatch('zap/updateZclDeviceTypes'),
    store.dispatch(`zap/getProjectPackages`),
    store.dispatch(`zap/loadZclClusterToUcComponentDependencyMap`),
  ]
  return Promise.all(promises)
}

async function initLoad(store) {
  let options = [
    { key: 'coreSpecification', type: 'string' },
    { key: 'clusterSpecification', type: 'string' },
    { key: 'deviceTypeSpecification', type: 'string' },
    { key: 'defaultResponsePolicy', type: 'string' },
    { key: 'manufacturerCodes', type: 'object' },
    { key: 'profileCodes', type: 'object' },
    { key: 'generator', type: 'object' },
  ]

  let promises = [
    loadInitialData(store),
    loadOptions(store, options),
    loadSessionKeyValues(store),
    updateShowDevTools(store),
    updateData(store),
  ]

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
    setTheme() {
      window[rendApi.GLOBAL_SYMBOL_EXECUTE](
        rendApi.id.setDarkTheme,
        storage.getItem(rendApi.storageKey.isDarkThemeActive)
      )
    },

    navigateToPage() {
      if (window.location.hash == '#/preferences/about') {
        this.$router.push({ path: '/preferences/about' })
      } else if (this.isZapConfigSelected != true) {
        this.$router.push({ path: '/config' })
      } else {
        this.$router.push({ path: '/' })
        this.getAppData()
      }
    },
    updateProfileId() {
      if (this.$serverGet != null) {
        this.$serverGet(restApi.uri.uiOptions).then((res) => {
          this.$store.commit(
            'zap/updateIsProfileIdShown',
            res.data.showProfileId
          )
        })
      }
    },

    parseQueryString() {
      const querystring = require('querystring')
      let search = window.location.search

      if (search[0] === '?') {
        search = search.substring(1)
      }

      this.query = querystring.parse(search)
    },

    updateUiMode() {
      if (this.query[`uiMode`]) {
        this.$store.dispatch('zap/setDefaultUiMode', this.query[`uiMode`])
      }
    },

    updateDebugNavBar() {
      if (`debugNavBar` in this.query) {
        this.$store.dispatch(
          'zap/setDebugNavBar',
          this.query[`debugNavBar`] === 'true'
        )
      } else {
        this.$store.dispatch('zap/setDebugNavBar', true)
      }
    },

    updateStandalone() {
      if ('standalone' in this.query) {
        this.$store.dispatch('zap/setStandalone', this.query['standalone'])
      }
    },
    updateSaveButtonVisible() {
      if (`setSaveButtonVisible` in this.query) {
        this.$store.dispatch(
          'zap/setSaveButtonVisible',
          this.query[`setSaveButtonVisible`] === 'true'
        )
      } else {
        this.$store.dispatch('zap/setSaveButtonVisible', false)
      }
    },

    setZclDialog() {
      this.zclDialogTitle = 'ZCL tab!'
      this.zclDialogText =
        'Welcome to ZCL tab. This is just a test of a dialog.'
      this.zclDialogFlag = false
    },

    observeProgressAttribute() {
      observable.observeAttribute(
        rendApi.observable.progress_attribute,
        (message) => {
          this.setGenerationInProgress(message)
        }
      )
    },

    loadInitialUcComponentState() {
      initLoad(this.$store).then(() => {
        this.$q.loading.hide()
      })

      this.$store.dispatch(`zap/loadUcComponentState`)
    },

    handleUcComponentStateChange() {
      this.$onWebSocket(
        dbEnum.wsCategory.updateSelectedUcComponents,
        (resp) => {
          this.$store.dispatch('zap/updateSelectedUcComponentState', resp)
        }
      )
    },

    handleDirtyFlag() {
      this.$onWebSocket(dbEnum.wsCategory.dirtyFlag, (resp) => {
        this.$store.dispatch('zap/setDirtyState', resp)
      })
    },
  },
  created() {
    this.setTheme()
    this.navigateToPage()
    this.updateProfileId()
    this.parseQueryString()
    this.updateUiMode()
    this.updateDebugNavBar()
    this.updateStandalone()
    this.updateSaveButtonVisible()
    this.setZclDialog()
    this.observeProgressAttribute()
    this.loadInitialUcComponentState()
    this.handleUcComponentStateChange()
    this.handleDirtyFlag()
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

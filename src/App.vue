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
    <v-tour name="ZclTour" :steps="tutorialSteps"></v-tour>
  </div>
</template>

<script>
import { QSpinnerGears } from 'quasar'
import CommonMixin from './util/common-mixin'
const rendApi = require(`../src-shared/rend-api.js`)
const observable = require('./util/observable.js')
const dbEnum = require(`../src-shared/db-enum.js`)
const storage = require('./util/storage.js')
const _ = require('lodash')

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
  store.dispatch('zap/loadOptions', {
    key: 'profileCodes',
    type: 'object',
  })
  store.dispatch('zap/loadOptions', {
    key: 'generator',
    type: 'object',
  })
  store.dispatch('zap/loadSessionKeyValues')
  if (
    localStorage.getItem('showDevTools') &&
    localStorage.getItem('showDevTools') == 'true'
  ) {
    store.dispatch('zap/updateShowDevTools')
  }

  let promises = []
  promises.push(store.dispatch('zap/updateClusters'))
  promises.push(store.dispatch('zap/updateAtomics'))
  promises.push(store.dispatch('zap/updateZclDeviceTypes'))
  promises.push(store.dispatch(`zap/getProjectPackages`))
  promises.push(store.dispatch(`zap/loadZclClusterToUcComponentDependencyMap`))
  return Promise.all(promises)
}

export default {
  name: 'App',
  computed: {
    showExceptionIcon() {
      return this.$store.state.zap.showExceptionIcon
    },
    endpoints: {
      get() {
        return Array.from(this.endpointIdListSorted.keys()).map((id) => ({
          id: id,
        }))
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
    createNewEndpointForTour(resolve) {
      let endpointIdentifier = 1
      let profileIdentifier = "0x0107"
      let networkIdentifier = 0
      let deviceVersion = 1
      let deviceTypeRef = "80"
      let deviceIdentifier = 515
      if(this.endpoints.length < 1) {
          this.$store.dispatch('zap/createNewEndPoint')
          this.$store
            .dispatch(`zap/addEndpointType`, {
              name: 'Anonymous Endpoint Type',
              deviceTypeRef: deviceTypeRef,
            })
            .then((response) => {
              this.$store
                .dispatch(`zap/addEndpoint`, {
                  endpointId: endpointIdentifier,
                  networkId: networkIdentifier,
                  profileId: parseInt(profileIdentifier),
                  endpointType: response.id,
                  endpointVersion: deviceVersion,
                  deviceIdentifier: deviceIdentifier,
                })
                .then((res) => {
                  if (this.shareClusterStatesAcrossEndpoints()) {
                    this.$store.dispatch('zap/shareClusterStatesAcrossEndpoints', {
                      endpointTypeIdList: this.endpointTypeIdList,
                    })
                  }

                  this.$store.dispatch('zap/updateSelectedEndpointType', {
                    endpointType: this.endpointType[res.id],
                    deviceTypeRef:
                      this.endpointDeviceTypeRef[this.endpointType[res.id]],
                  })

                  // collect all cluster id from new endpoint
                  this.selectionClients.forEach((id) => {
                    this.updateSelectedComponentRequest({
                      clusterId: id,
                      side: ['client'],
                      added: true,
                    })
                  })

                  this.selectionServers.forEach((id) => {
                    this.updateSelectedComponentRequest({
                      clusterId: id,
                      side: ['server'],
                      added: true,
                    })
                  })

                  this.$store.dispatch('zap/updateSelectedEndpoint', res.id)
                  resolve()
                })
            })
        }
      else {
        resolve()
      }
    }
  },
  mixins: [CommonMixin],
  data() {
    return {
      tutorialSteps: [
        {
          target: '.v-step-0',
          header: {
            title: 'Adding Endpoints'
          },
          content: `A Zigbee application can have multiple endpoints. Each endpoint contains a device configuration made up of Clusters on that endpoint.
Add a new endpoint to your application by clicking <strong>ADD NEW ENDPOINT</strong> in the top left corner of the Zigbee Cluster Configurator interface`,
          before: () => new Promise(resolve => {
            this.$store.commit('zap/toggleEndpointModal', false)
            resolve()
          })
        },
        {
          target: '.v-step-1',
          content: 'A dialog opens in which you can select the device type for the endpoint.',
          before: () => new Promise((resolve, reject) => {
            this.$store.commit('zap/toggleEndpointModal', true)
            setTimeout(() => {
              resolve()
            }, 250)
          }),
          params: {
            placement: 'top',
          },
        },
        {
          target: '.v-step-2',
          content: `From here you can select whether you would like the endpoint to represent something like a Light or a Door Lock. You can find the Zigbee
device type by entering the name of the device in the <strong>Device</strong> field`,
          params: {
            placement: 'right',
          },
        },
        {
          target: '.v-step-3',
          content: `To change the number of the endpoint on which you would like this device to appear, change the <strong>Endpoint</strong> setting`,
          params: {
            placement: 'left',
          },
        },
        {
          target: '.v-step-4',
          content: `Once you have configured the endpoint, click <strong>CREATE</strong> to add the endpoint to your configuration.`,
          params: {
            placement: 'right',
          },
          before: () => new Promise( resolve => {
            this.$store.commit('zap/toggleEndpointModal', true)
            setTimeout(() => {
              resolve()
            }, 300)
          })
        },
        {
          header: {
            title: 'Modifying an Endpoint'
          },
          target: '.v-step-5',
          content: `Select an endpoint to modify by clicking on the endpoint configuration on the left side of the Zigbee Cluster Configurator. The Endpoint
highlighted with a blue border is the endpoint that you are in the process of modifying.`,
          params: {
            placement: 'right',
          },
          before: () => new Promise((resolve, reject) => {
            this.createNewEndpointForTour(resolve)
            this.$store.commit('zap/toggleEndpointModal', false)
          }),
        },
      ],
    }
  },
  mounted() {
    this.$tours['ZclTour'].start()
    window[rendApi.GLOBAL_SYMBOL_EXECUTE](
      rendApi.id.setDarkTheme,
      storage.getItem(rendApi.storageKey.isDarkThemeActive)
    )

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

    this.zclDialogTitle = 'ZCL tab!'
    this.zclDialogText = 'Welcome to ZCL tab. This is just a test of a dialog.'
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

    this.$onWebSocket(dbEnum.wsCategory.ucComponentStateReport, (resp) => {
      this.$store.dispatch('zap/updateUcComponentState', resp)
    })
  },
}
</script>

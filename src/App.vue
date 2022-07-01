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
    <v-tour name="ZclTour" :steps="tutorialSteps" :callbacks='{ onFinish: disableTutorial, onSkip: disableTutorial}'></v-tour>
    <q-dialog
      v-model="deletingTutorialEndpoint"
      class="background-color:transparent"
    >
      <q-card>
        <q-card-section>
          <div class="text-h6">Delete Endpoint Created With Tutorial</div>

          Do you want to delete the endpoint created for the tutorial?
        </q-card-section>
        <q-card-actions>
          <q-btn label="Cancel" v-close-popup class="col" />
          <q-btn
            :label="'Delete'"
            color="primary"
            class="col"
            v-close-popup="deleteEndpointDialog"
            @click="deleteEndpoint()"
            id="delete_tutorial_endpoint"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { QSpinnerGears } from 'quasar'
import CommonMixin from './util/common-mixin'
import tutorialConfig from './tutorials/tutorialConfig.json'
import * as Storage from './util/storage'
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
      if(this.endpoints.length < 1) {
          this.$store.dispatch('zap/createNewEndPoint')
          this.$store
            .dispatch(`zap/addEndpointType`, {
              name: 'Anonymous Endpoint Type',
              deviceTypeRef: "75",
            })
            .then((response) => {
              this.$store
                .dispatch(`zap/addEndpoint`, {
                  endpointId: 1,
                  networkId: 0,
                  profileId: parseInt("0x0107"),
                  endpointType: response.id,
                  endpointVersion: 1,
                  deviceIdentifier: 515,
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
        this.$store.dispatch('zap/updateSelectedEndpointType', {
          endpointType: this.endpointType[this.endpoints[0].id],
          deviceTypeRef:
            this.endpointDeviceTypeRef[this.endpointType[this.endpoints[0].id]],
        })
        this.$store.dispatch('zap/updateSelectedEndpoint', this.endpoints[0].id)
        resolve()
      }
    },
    getStorageParam() {
      return Storage.getItem('confirmDeleteEndpointDialog')
    },
    handleDeletionDialog() {
      if (this.getStorageParam() == 'true') {
        this.deleteEpt()
      } else {
        this.deleteEndpointDialog = !this.deleteEndpointDialog
      }
    },
    deleteEpt() {
      if (this.endpoints.length == 1) {
        this.deletingTutorialEndpoint = true
      } else {
        this.deleteEndpoint()
      }
    },

    //  ----------  Vue Tour Functions ----------  //
    deleteEndpoint() {
      this.$store.dispatch('zap/deleteEndpoint', this.endpoints[0].id).then(() => {
        this.$store.dispatch(
          'zap/deleteEndpointType',
          this.endpointType[this.endpoints[0].id]
        )
      })
      this.deletingTutorialEndpoint = false
      this.deleteEndpointDialog = false
    },
    disableTutorial() {
      this.$store.commit('zap/toggleTutorial', false)
      this.$store.commit('zap/triggerExpanded', false)
      this.$store.commit('zap/openZclExtensionsDialogForTutorial', false)
      this.handleDeletionDialog()
    },
    startTutorialAndCloseTheEndpointModal() {
      return new Promise(resolve => {
        this.$store.commit('zap/toggleEndpointModal', false)
        this.$store.commit('zap/toggleTutorial', true)
        resolve()
      })
    },
    openEndpointModal() {
      return new Promise((resolve) => {
        this.$store.commit('zap/toggleEndpointModal', true)
        setTimeout(() => {
          resolve()
        }, 250)
      })
    },
    createMockEndpoint() {
      return new Promise( resolve => {
        this.$store.commit('zap/toggleEndpointModal', true)
        setTimeout(() => {
          resolve()
        }, 300)
      })
    },
    generateEndpointCard() {
      return new Promise((resolve) => {
        this.createNewEndpointForTour(resolve)
        this.$store.commit('zap/toggleEndpointModal', false)
      })
    },
    expendCluster() {
      return new Promise( (resolve) => {
        this.$store.commit('zap/triggerExpanded', true)
        resolve()
      })
    },
    comeBackToHomePage() {
      return new Promise( resolve => {
        if(this.$router.currentRoute.path !== "/") {
          this.$router.push({ name: "Home" }).then(() => {
            this.$store.commit('zap/triggerExpanded', true)
            resolve()
          })
        } else {
          resolve()
        }
      })
    },
    openConfigure() {
      return new Promise( resolve => {
        if(this.$router.currentRoute.path === "/") {
          this.$store.commit('zap/triggerExpanded', false)
          let payload = {
            caption: "Attributes for determining basic information about a device, setting user device information such as location, and enabling a device.",
            code: 0,
            define: "BASIC_CLUSTER",
            domainName: "General",
            id: 22,
            isSingleton: true,
            label: "Basic",
            manufacturerCode: null,
            name: "Basic",
            revision: null
          }
          this.$store.dispatch('zap/updateSelectedCluster', payload).then(() => {
            this.$store.dispatch(
              'zap/refreshEndpointTypeCluster',
              this.selectedEndpointTypeId
            )
            this.$store.dispatch('zap/setLastSelectedDomain', "General")
          })
          this.$router.push({name: "cluster"}).then(() => {
            resolve()
          })
        } else {
          resolve()
        }
      } )
    },
    backToAttributesTab() {
      return new Promise( resolve => {
        this.$store.commit('zap/openReportTabInCluster', "attributes")
        resolve()
      })
    },
    openReportTabInCluster() {
      return new Promise( resolve => {
        this.$store.commit('zap/openReportTabInCluster', "reporting")
        resolve()
      })
    },
    openCommandsTabInCluster() {
      return new Promise( resolve => {
        if(this.$router.currentRoute.path === "/") {
          this.$router.push({name: "cluster"}).then(() => {
            setTimeout(() => {
              this.$store.commit('zap/openReportTabInCluster', "commands")
              resolve()
            },200)
          })
        } else {
          this.$store.commit('zap/openReportTabInCluster', "commands")
          setTimeout(() => {
            resolve()
          },200)
        }
      })
    },
    backToHomePage() {
      return new Promise( resolve => {
        if(this.$router.currentRoute.path !== "/") {
          this.$store.commit('zap/openReportTabInCluster', "attributes")
          this.$router.push({name: "Home"}).then(() => {
            resolve()
          })
        } else {
          this.$store.commit('zap/openZclExtensionsDialogForTutorial', false)
          resolve()
        }
      })
    },
    openZclExtensionDialog() {
      return new Promise( resolve => {
        this.$store.commit('zap/openZclExtensionsDialogForTutorial', true)
        setTimeout(() => {
          resolve()
        },300)
      })
    }
  },
  mixins: [CommonMixin],
  data() {
    return {
      tutorialSteps: [],
      deletingTutorialEndpoint: false,
      deleteEndpointDialog: false,
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
  created() {
    let config = []
    tutorialConfig.tutorialSteps.forEach( item => {
      config.push({
        target: item.target,
        header: {
          title: item.title,
        },
        params: {
          placement: item.placement,
          enableScrolling: item.enableScrolling,
          highlight: item.highlight
        },
        content: item.content,
        before: () => item.before !== "" ? this[item.before]() : ''
      })
    })
    this.tutorialSteps = config
  }
}
</script>

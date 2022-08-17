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
    <v-tour
      name="ZclTour"
      :steps="tutorialSteps"
      :callbacks="{ onFinish: disableTutorial, onSkip: disableTutorial }"
    ></v-tour>
    <q-dialog
      v-model="deletingTutorialEndpoint"
      class="background-color:transparent"
    >
      <q-card>
        <q-card-section>
          <div class="text-h6">Delete Endpoint</div>

          Do you want to delete the endpoint used for the tutorial?
        </q-card-section>
        <q-card-actions>
          <q-btn label="Cancel" v-close-popup class="col" />
          <q-btn
            :label="'Delete'"
            color="primary"
            class="col"
            v-close-popup="deleteEndpointDialog"
            @click="deleteEndpoint()"
            id="delete_last_endpoint"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
import tutorialConfig from './tutorialConfig.json'
import CommonMixin from '../util/common-mixin'
export default {
  name: 'VueTour',
  computed: {
    endpoints: {
      get() {
        return Array.from(this.endpointIdListSorted.keys()).map((id) => ({
          id: id,
        }))
      },
    },
    tourCluster: {
      get() {
        return this.$store.state.zap.clusterDataForTutorial
      },
    },
    zclDeviceTypeOptions: {
      get() {
        let dt = this.$store.state.zap.zclDeviceTypes
        let keys = Object.keys(dt).sort((a, b) => {
          return dt[a].description.localeCompare(dt[b].description)
        })
        return keys.map((item) => {
          return { deviceTypeRef: item, deviceIdentifier: dt[item].code }
        })
      },
    },
  },
  methods: {
    deviceType() {
      return this.zclDeviceTypeOptions.find(
        (item) => item.deviceIdentifier == 515
      ).deviceTypeRef
    },
    createNewEndpointForTour(resolve) {
      if (this.endpoints.length < 1) {
        this.$store
          .dispatch(`zap/addEndpointType`, {
            name: 'Anonymous Endpoint Type',
            deviceTypeRef: this.deviceType(),
          })
          .then((response) => {
            this.$store
              .dispatch(`zap/addEndpoint`, {
                endpointId: 1,
                networkId: 0,
                profileId: parseInt('0x0107'),
                endpointType: response.id,
                endpointVersion: 1,
                deviceIdentifier: 515,
              })
              .then((res) => {
                if (this.shareClusterStatesAcrossEndpoints()) {
                  this.$store.dispatch(
                    'zap/shareClusterStatesAcrossEndpoints',
                    {
                      endpointTypeIdList: this.endpointTypeIdList,
                    }
                  )
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
      } else {
        this.$store.dispatch('zap/updateSelectedEndpointType', {
          endpointType: this.endpointType[this.endpoints[0].id],
          deviceTypeRef:
            this.endpointDeviceTypeRef[this.endpointType[this.endpoints[0].id]],
        })
        this.$store.dispatch('zap/updateSelectedEndpoint', this.endpoints[0].id)
        resolve()
      }
    },
    handleDeletionDialog() {
      this.deletingTutorialEndpoint = true
      this.deleteEndpointDialog = !this.deleteEndpointDialog
    },
    //  ----------  Vue Tour Functions ----------  //
    deleteEndpoint() {
      this.$store
        .dispatch('zap/deleteEndpoint', this.endpoints[0].id)
        .then(() => {
          this.$store.dispatch(
            'zap/deleteEndpointType',
            this.endpointType[this.endpoints[0].id]
          )
        })
      this.deletingTutorialEndpoint = false
      this.deleteEndpointDialog = false
      this.$store.commit('zap/openZclExtensionsDialogForTutorial', false)
    },
    disableTutorial() {
      if (this.$router.currentRoute.path === '/') {
        this.$store.commit('zap/toggleTutorial', false)
        this.$store.commit('zap/triggerExpanded', false)
        this.endpoints.length > 0 ? this.handleDeletionDialog() : ''
        this.$store.commit('zap/toggleEndpointModal', false)
      } else {
        this.$router
          .push({ name: 'Home' })
          .then(() => {})
          .then(() => {
            this.endpoints.length > 0 ? this.handleDeletionDialog() : ''
          })
      }
    },
    startTutorialAndCloseTheEndpointModal() {
      return new Promise((resolve) => {
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
    setDeviceEndpoint() {
      return new Promise((resolve) => {
        this.$store.commit('zap/setDeviceTypeRefAndDeviceIdPair', {
          deviceTypeRef: this.deviceType(),
          deviceIdentifier: 515,
        })
        resolve()
      })
    },
    createMockEndpoint() {
      return new Promise((resolve) => {
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
      return new Promise((resolve) => {
        this.$store.commit('zap/triggerExpanded', true)
        resolve()
      })
    },
    comeBackToHomePage() {
      return new Promise((resolve) => {
        if (this.$router.currentRoute.path !== '/') {
          this.$router.push({ name: 'Home' }).then(() => {
            this.$store.commit('zap/triggerExpanded', true)
            resolve()
          })
        } else {
          resolve()
        }
      })
    },
    openConfigure() {
      return new Promise((resolve) => {
        if (this.$router.currentRoute.path === '/') {
          console.log(this.tourCluster)
          this.$store.commit('zap/triggerExpanded', false)
          this.$store
            .dispatch('zap/updateSelectedCluster', this.tourCluster)
            .then(() => {
              this.$store.dispatch(
                'zap/refreshEndpointTypeCluster',
                this.selectedEndpointTypeId
              )
              this.$store.dispatch('zap/setLastSelectedDomain', 'General')
            })
          this.$router.push({ name: 'cluster' }).then(() => {
            resolve()
          })
        } else {
          resolve()
        }
      })
    },
    backToAttributesTab() {
      return new Promise((resolve) => {
        this.$store.commit('zap/openReportTabInCluster', 'attributes')
        resolve()
      })
    },
    openReportTabInCluster() {
      return new Promise((resolve) => {
        this.$store.commit('zap/openReportTabInCluster', 'reporting')
        resolve()
      })
    },
    openCommandsTabInCluster() {
      return new Promise((resolve) => {
        if (this.$router.currentRoute.path === '/') {
          this.$router.push({ name: 'cluster' }).then(() => {
            setTimeout(() => {
              this.$store.commit('zap/openReportTabInCluster', 'commands')
              resolve()
            }, 200)
          })
        } else {
          this.$store.commit('zap/openReportTabInCluster', 'commands')
          setTimeout(() => {
            resolve()
          }, 200)
        }
      })
    },
    backToHomePage() {
      return new Promise((resolve) => {
        if (this.$router.currentRoute.path !== '/') {
          this.$store.commit('zap/openReportTabInCluster', 'attributes')
          this.$router.push({ name: 'Home' }).then(() => {
            resolve()
          })
        } else {
          this.$store.commit('zap/openZclExtensionsDialogForTutorial', false)
          resolve()
        }
      })
    },
    openZclExtensionDialog() {
      return new Promise((resolve) => {
        this.$store.commit('zap/openZclExtensionsDialogForTutorial', true)
        setTimeout(() => {
          resolve()
        }, 300)
      })
    },
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
    if (this.$store.state.zap.showDevTools) {
      this.$tours['ZclTour'].start()
    }
  },
  created() {
    let config = []
    tutorialConfig.tutorialSteps.forEach((item) => {
      config.push({
        target: item.target,
        header: {
          title: item.title,
        },
        params: {
          placement: item.placement,
          enableScrolling: item.enableScrolling,
          highlight: item.highlight,
        },
        content: item.content,
        before: () => (item.before !== '' ? this[item.before]() : ''),
      })
    })
    this.tutorialSteps = config
  },
}
</script>

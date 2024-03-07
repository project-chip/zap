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
      ref="zcl-tour"
      :steps="tutorialSteps"
      @onTourEnd="disableTutorial"
      data-cy="tour-window"
    />
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
          <q-btn
            label="Cancel"
            v-close-popup
            class="col"
            @click="setDefaultTourState"
            data-cy="cancel-end-tour-endpoint"
          />
          <q-btn
            :label="'Delete'"
            color="primary"
            class="col"
            @click="deleteEndpoint"
            id="delete_last_endpoint"
            data-cy="delete-end-tour-endpoint"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
import tutorialConfig from './tutorialConfig.json'
import CommonMixin from '../util/common-mixin'
import { setStartTour } from '../boot/tour'

export default {
  name: 'ZclTour',
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
          return {
            deviceTypeRef: item,
            deviceIdentifier: dt[item].code,
            deviceVersion: dt[item].version,
          }
        })
      },
    },
  },
  methods: {
    startTour() {
      this.$refs['zcl-tour'].resetTour()
    },
    // This function will create a endpoint for tutorial
    createNewEndpointForTour(resolve) {
      const deviceTypeRef = []
      const deviceIdentifier = []
      const deviceVersion = []
      deviceTypeRef.push(this.zclDeviceTypeOptions[0].deviceTypeRef)
      deviceIdentifier.push(this.zclDeviceTypeOptions[0].deviceIdentifier)
      deviceVersion.push(
        this.zclDeviceTypeOptions[0].deviceVersion
          ? this.zclDeviceTypeOptions[0].deviceVersion
          : 1
      )
      // if (this.endpoints.length < 1) {
      this.$store
        .dispatch(`zap/addEndpointType`, {
          name: 'Anonymous Endpoint Type',
          deviceTypeRef: deviceTypeRef,
          deviceIdentifier: deviceIdentifier,
          deviceVersion: deviceVersion,
        })
        .then((response) => {
          let profileId = this.asHex(
            this.zclDeviceTypes[this.zclDeviceTypeOptions[0].deviceTypeRef]
              .profileId,
            4
          )
          this.tourEndpointType = response.id

          this.$store
            .dispatch(`zap/addEndpoint`, {
              endpointId: parseInt(this.getSmallestUnusedEndpointId()),
              networkId: 0,
              profileId: parseInt(profileId),
              endpointType: response.id,
            })
            .then((res) => {
              this.tourEndpointId = res.id
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
              this.$store
                .dispatch(
                  `zap/endpointTypeClustersInfo`,
                  this.endpointType[res.id]
                )
                .then((res) => {
                  if (res?.data) {
                    const clusterStates = res.data
                    const enabledClusterStates = clusterStates.filter(
                      (x) => x.enabled
                    )
                    for (const states of enabledClusterStates) {
                      const { endpointTypeRef, clusterRef, side, enabled } =
                        states

                      const arg = {
                        side: [side],
                        clusterId: clusterRef,
                        added: enabled,
                      }

                      console.log(
                        `Enabling UC component ${JSON.stringify(arg)}`
                      )
                      this.updateSelectedComponentRequest(arg)
                    }
                  }
                })
              this.$store.dispatch('zap/updateSelectedEndpoint', res.id)
              resolve()
            })
        })
    },
    // This function will show the delete modal to the user
    handleDeletionDialog() {
      this.deletingTutorialEndpoint = true
      this.deleteEndpointDialog = !this.deleteEndpointDialog
    },
    //  ----------  Vue Tour Functions ----------  //
    // This function will delete the endpoint that tutorial created for you
    async deleteEndpoint() {
      await this.$store.dispatch('zap/deleteEndpoint', this.tourEndpointId)
      await this.$store.dispatch(
        'zap/deleteEndpointType',
        this.endpointType[this.tourEndpointId]
      )
      this.setDefaultTourState()
    },
    setDefaultTourState() {
      this.deletingTutorialEndpoint = false
      this.deleteEndpointDialog = false
      this.tourEndpointId = null
      this.tourEndpointType = null
      this.$store.commit('zap/openZclExtensionsDialogForTutorial', false)
    },
    // This function will disable tutorial
    disableTutorial() {
      if (this.$route.path === '/') {
        this.$store.commit('zap/toggleTutorial', false)
        this.$store.commit('zap/triggerExpanded', false)
        this.tourEndpointId ? this.handleDeletionDialog() : ''
        this.$store.commit('zap/toggleEndpointModal', false)
      } else {
        this.$router
          .push('/')
          .then(() => {})
          .then(() => {
            this.tourEndpointId ? this.handleDeletionDialog() : ''
          })
      }
    },
    // This function will set isTutorialRunning to true
    startTutorialAndCloseTheEndpointModal() {
      return new Promise((resolve) => {
        this.$store.commit('zap/toggleEndpointModal', false)
        this.$store.commit('zap/toggleTutorial', true)
        resolve()
      })
    },
    // This function will open the create endpoint modal
    openEndpointModal() {
      return new Promise((resolve) => {
        this.$store.commit('zap/toggleEndpointModal', true)
        setTimeout(() => {
          resolve()
        }, 250)
      })
    },
    // This function will set Device inpute in the create endpoint modal
    setDeviceEndpoint() {
      return new Promise((resolve) => {
        this.$store.commit('zap/setDeviceTypeRefAndDeviceIdPair', {
          deviceTypeRef: this.zclDeviceTypeOptions[0].deviceTypeRef,
          deviceIdentifier: this.zclDeviceTypeOptions[0].deviceIdentifier,
        })
        resolve()
      })
    },
    // This function will create a mock endpoint for tutorial
    createMockEndpoint() {
      return new Promise((resolve) => {
        this.$store.commit('zap/toggleEndpointModal', true)
        setTimeout(() => {
          resolve()
        }, 300)
      })
    },
    // This function will create a endpoint card for that mock endpoint
    generateEndpointCard() {
      return new Promise((resolve) => {
        this.createNewEndpointForTour(resolve)
        this.$store.commit('zap/toggleEndpointModal', false)
      })
    },
    // This function will expand first cluster and show the next step of vue tour to the user
    expandCluster() {
      return new Promise((resolve) => {
        this.$store.commit('zap/triggerExpanded', true)
        document
          .getElementsByClassName(
            ' q-icon notranslate material-icons q-expansion-item__toggle-icon'
          )[1]
          .click()
        resolve()
      })
    },
    showFilter() {
      return new Promise((resolve) => {
        document
          .getElementsByClassName(
            ' q-icon material-icons q-select__dropdown-icon'
          )[0]
          .click()
        resolve()
      })
    },
    // This function will move user to the home page
    comeBackToHomePage() {
      return new Promise((resolve) => {
        if (this.$route.path !== '/') {
          this.$router.push('/').then(() => {
            this.$store.commit('zap/triggerExpanded', true)
            setTimeout(() => {
              resolve()
            }, 1000)
          })
        } else {
          resolve()
        }
      })
    },
    // This function will open the cluster configuration page
    openConfigure() {
      return new Promise((resolve) => {
        if (this.$route.path === '/') {
          this.$store.commit('zap/triggerExpanded', false)
          this.$store
            .dispatch('zap/updateSelectedCluster', this.tourCluster)
            .then(() => {
              this.$store.dispatch(
                'zap/refreshEndpointTypeCluster',
                this.selectedEndpointTypeId
              )
              this.$store.dispatch(
                'zap/setLastSelectedDomain',
                this.$store.state.zap.domains[0]
              )
            })
          this.$router.push('/cluster').then(() => {
            setTimeout(() => {
              resolve()
            }, 1000)
          })
        } else {
          resolve()
        }
      })
    },
    // This function will change the tab of configuration page to attribute
    backToAttributesTab() {
      return new Promise((resolve) => {
        this.$store.commit('zap/openReportTabInCluster', 'attributes')
        resolve()
      })
    },
    // This function will change the tab of configuration page to report
    openReportTabInCluster() {
      return new Promise((resolve) => {
        this.$store.commit('zap/openReportTabInCluster', 'reporting')
        resolve()
      })
    },
    // This function will change the tab of configuration page to commands
    openCommandsTabInCluster() {
      return new Promise((resolve) => {
        if (this.$route.path === '/') {
          this.$router.push('/cluster').then(() => {
            setTimeout(() => {
              this.$store.commit('zap/openReportTabInCluster', 'commands')
              resolve()
            }, 1000)
          })
        } else {
          this.$store.commit('zap/openReportTabInCluster', 'commands')
          setTimeout(() => {
            resolve()
          }, 200)
        }
      })
    },
    // This function will move user to the home page
    backToHomePage() {
      return new Promise((resolve) => {
        if (this.$route.path !== '/') {
          this.$store.commit('zap/openReportTabInCluster', 'attributes')
          this.$router.push('/').then(() => {
            resolve()
          })
        } else {
          this.$store.commit('zap/openZclExtensionsDialogForTutorial', false)
          resolve()
        }
      })
    },
    // This function will open extension modal
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
      tourEndpointType: null,
      tourEndpointId: null,
    }
  },
  mounted() {
    setStartTour(() => this.startTour())
  },
  created() {
    let config = []

    const stepsCount = tutorialConfig.tutorialSteps.length
    for (let i = 0; i < stepsCount; i++) {
      const step = tutorialConfig.tutorialSteps[i]
      const prevStep = i > 0 ? tutorialConfig.tutorialSteps[i - 1].before : null
      const nextStep =
        i + 1 < stepsCount ? tutorialConfig.tutorialSteps[i + 1].before : null
      config.push({
        target: step.target,
        // header: {
        //   title: step.title,
        // },
        content: step.title
          ? '<strong>' + step.title + '</strong><br/>' + step.content
          : step.content,
        placement: step.placement,
        // params: {
        //   enableScrolling: step.enableScrolling,
        //   highlight: step.highlight,
        // },
        onNext: async () =>
          nextStep !== null ? await this[nextStep]() : void 0,
        onPrev: async () =>
          prevStep !== null ? await this[prevStep]() : void 0,
      })
    }

    this.tutorialSteps = config
  },
}
</script>

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
      ref="zcl-cmp-tour"
      :steps="tutorialSteps"
      @onTourEnd="disableTutorial"
      data-cy="tour-cmp-window"
    />
  </div>
</template>
<script>
import tutorialConfig from './cmpTutorialConfig.json'
import CommonMixin from '../util/common-mixin'

export default {
  name: 'CmpTour',
  mixins: [CommonMixin],
  data() {
    return {
      tutorialSteps: [],
    }
  },
  computed: {
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
      this.$store.commit('zap/toggleTutorial', true)
      this.$refs['zcl-cmp-tour'].resetTour()
    },
    disableTutorial() {
      this.$store.commit('zap/toggleTutorial', false)
    },
    // Tour controlling steps
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
    createMockRootNodeEndpoint() {
      return new Promise((resolve) => {
        this.$store.commit('zap/toggleEndpointModal', false)
        const selectedDevice = this.filteredZclDeviceTypes(22, 0) // 22 is the root node id
        this.createNewEndpointForTour(resolve, selectedDevice, 0)
        setTimeout(() => {
          resolve()
        }, 300)
      })
    },
    createMockMatterEndpoint() {
      return new Promise((resolve) => {
        this.$store.commit('zap/toggleEndpointModal', false)
        const selectedDevice = this.filteredZclDeviceTypes(257, 3) // 4th element of the 257 id array is the matter dimmable light
        this.createNewEndpointForTour(resolve, selectedDevice, 1)
        setTimeout(() => {
          resolve()
        }, 300)
      })
    },
    createMockZigbeeEndpoint() {
      return new Promise((resolve) => {
        this.$store.commit('zap/toggleEndpointModal', false)
        const selectedDevice = this.filteredZclDeviceTypes(257, 2) // 3rd element of the 257 id array is the LO dimmable light
        this.createNewEndpointForTour(resolve, selectedDevice, 1)
        setTimeout(() => {
          resolve()
        }, 300)
      })
    },
    showFilter() {
      return new Promise((resolve) => {
        document
          .getElementsByClassName(
            ' q-icon material-icons q-select__dropdown-icon'
          )[0]
          .click()
        this.$store.dispatch('zap/setDomainFilter', {
          filter: {
            label: 'Enabled Clusters',
            domainFilterFn: (domain, currentOpenDomains, context) =>
              context.enabledClusters.map((a) => a.domainName).includes(domain),
            clusterFilterFn: (cluster, context) =>
              context.enabledClusters.find((a) => cluster.id == a.id) !=
              undefined,
          },
          enabledClusters: this.$store.state.zap.enabledClusters,
        })
        resolve()
      })
    },
    // End of tour controlling steps

    createNewEndpointForTour(resolve, selectedDevice, endpointID) {
      const deviceTypeRef = []
      const deviceIdentifier = []
      const deviceVersion = []
      deviceTypeRef.push(selectedDevice.deviceTypeRef)
      deviceIdentifier.push(selectedDevice.deviceIdentifier)
      deviceVersion.push(
        selectedDevice.deviceVersion ? selectedDevice.deviceVersion : 1
      )
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
              endpointId: endpointID,
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
              this.$store.dispatch('zap/updateClusters')
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
    filteredZclDeviceTypes(deviceId, index) {
      const possibleDevices = this.zclDeviceTypeOptions.filter(
        (endpoint) => endpoint.deviceIdentifier === deviceId
      )
      const selectedDevice = possibleDevices[index ? index : 0]
      return selectedDevice
    },
  },
  mounted() {
    this.startTour()
  },
  created() {
    let config = []

    const stepsCount = tutorialConfig.tutorialSteps.length
    for (let i = 0; i < stepsCount; i++) {
      const step = tutorialConfig.tutorialSteps[i]
      const prevStep = i > 0 ? tutorialConfig.tutorialSteps[i - 1].before : null
      const nextStep =
        i + 1 < stepsCount ? tutorialConfig.tutorialSteps[i + 1].before : null
      const element = {
        target: step.target,
        content: step.title
          ? '<strong>' + step.title + '</strong><br/>' + step.content
          : step.content,
        placement: step.placement,
        onNext: async () =>
          nextStep !== null ? await this[nextStep]() : void 0,
        onPrev: async () =>
          prevStep !== null ? await this[prevStep]() : void 0,
      }
      config.push(element)
    }

    this.tutorialSteps = config
  },
}
</script>

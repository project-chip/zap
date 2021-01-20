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

import * as Util from './util'
const http = require('http-status-codes')

/**
 * This module provides common computed properties used across various vue components
 */
export default {
  computed: {
    selectedEndpointTypeId: {
      get() {
        return this.$store.state.zap.endpointTypeView.selectedEndpointType
      },
    },
    endpointDeviceTypeRef: {
      get() {
        return this.$store.state.zap.endpointTypeView.deviceTypeRef
      },
    },
    selectedEndpointId: {
      get() {
        return this.$store.state.zap.endpointView.selectedEndpoint
      },
    },
    endpointIdSorted: {
      get() {
        // return sorted endpoint (by endpoint id value, in ascending order) for display
        // parseInt is used as endpoint id value can be int or strings
        // NOTE: a Map is returned to maintain the order of the keys.
        //       coversion to an Object will reshuffle the entries.
        const endpointIds = new Map(
          Object.entries(this.$store.state.zap.endpointView.endpointId)
        )

        return new Map(
          [...endpointIds.entries()].sort((a, b) => {
            return parseInt(a[1], 16) - parseInt(b[1], 16)
          })
        )
      },
    },
    endpointId: {
      get() {
        return this.$store.state.zap.endpointView.endpointId
      },
    },
    endpointType: {
      get() {
        return this.$store.state.zap.endpointView.endpointType
      },
    },
    selectedCluster: {
      get() {
        return this.$store.state.zap.clustersView.selected[0] || {}
      },
    },
    selectedClusterId: {
      get() {
        return this.selectedCluster.id
      },
    },
    selectionClients: {
      get() {
        return this.$store.state.zap.clustersView.selectedClients
      },
      set(val) {},
    },
    selectionServers: {
      get() {
        return this.$store.state.zap.clustersView.selectedServers
      },
      set(val) {},
    },
    zclDeviceTypes: {
      get() {
        return this.$store.state.zap.zclDeviceTypes
      },
    },
    packages: {
      get() {
        return this.$store.state.zap.packages
      },
    },
  },
  methods: {
    asHex(value, padding) {
      return Util.asHex(value, padding)
    },
    setSelectedEndpointType(endpointReference) {
      this.$store.dispatch('zap/updateSelectedEndpointType', {
        endpointType: this.endpointType[endpointReference],
        deviceTypeRef: this.endpointDeviceTypeRef[
          this.endpointType[endpointReference]
        ],
      })
      this.$store.dispatch('zap/updateSelectedEndpoint', endpointReference)
    },
    updateComponent(params) {
      if (this.$store.state.zap.studioProject) {
        params['studioProject'] = this.$store.state.zap.studioProject
        this.$store
          .dispatch('zap/updateSelectedComponent', params)
          .then((res) => {
            if (res.status == http.StatusCodes.OK) {
              let { componentIds, added } = res.data
              if (Array.isArray(componentIds) && componentIds) {
                let action = added ? 'added' : 'removed'
                let msg = `<div><strong>The following components were successfully ${action}.</strong></div>`
                componentIds.forEach(function (id, index) {
                  let name = id.replace(/_/g, ' ')
                  msg += `<div>The <span style="text-transform: capitalize">${name}</span> was ${action}.</div>`
                })

                this.$q.notify({
                  message: msg,
                  color: 'positive',
                  position: 'top',
                  html: true,
                })
              }
            }
          })
          .catch((err) => {
            console.log('Error', err)
            this.$q.notify({
              message: `Unable to update following components: ${params.componentId}`,
              color: 'negative',
              position: 'top',
            })
          })
      } else {
        console.log(
          'Unable to update selected component due to invalid "studioProject" path'
        )
      }
    },
  },
}

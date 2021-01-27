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

    /**
     * Update UI to reflect required components are NOT enabled!
     *
     * @param {*} actionSuccessful - true/false
     * @param {*} componentIds - list of strings
     */
    notifyComponentStatus(executedAction, action, componentIds) {
      if (Array.isArray(componentIds) && componentIds.length) {
        let color = executedAction ? 'positive' : 'negative'
        let verb = executedAction ? 'were' : "couldn't be"

        let msg = `<div><strong>The following components ${verb} ${action}.</strong></div>`
        msg += `<div><span style="text-transform: capitalize"><ul>`
        msg += componentIds
          .map((id) => `<li>${id.replace(/_/g, ' ')}</li>`)
          .join(' ')
        msg += `</ul></span></div>`

        // notify ui
        this.$q.notify({
          message: msg,
          color,
          position: 'top',
          html: true,
        })
      }
    },

    /**
     * Enable components by pinging backend, which pings Studio jetty server.
     * @param {*} params
     */
    updateComponent(params) {
      if (this.$store.state.zap.studioProject) {
        params['studioProject'] = this.$store.state.zap.studioProject
        this.$store
          .dispatch('zap/updateSelectedComponent', params)
          .then((res) => {
            if (
              'status' in res.data &&
              res.data.status == http.StatusCodes.BAD_REQUEST
            ) {
              this.notifyComponentStatus(false, 'added', res.data.componentIds)
            } else if (res.status == http.StatusCodes.OK) {
              this.notifyComponentStatus(true, 'added', res.data.componentIds)
            }
          })
      } else {
        console.log(
          'Unable to update selected component due to invalid "studioProject" path'
        )
      }
    },
  },
}

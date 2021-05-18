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
    <q-card>
      <q-card-section>
        <div class="text-h6 text-align:left">
          {{ this.endpointReference ? 'Edit Endpoint' : 'Create New Endpoint' }}
        </div>
        <q-form>
          <q-input
            v-model="shownEndpoint.endpointIdentifier"
            label="Endpoint"
            filled
            type="number"
            class="col"
            :rules="[
              (val) => val.toString().length > 0 || '* Required',
              (val) => val >= 0 || '* Positive integer required',
            ]"
          />
          <q-input
            outlined
            filled
            type="number"
            v-model="zclProfileIdString"
            label="Profile ID"
            class="col"
            disable
            :rules="[
              (val) => val.toString().length > 0 || '* Required',
              (val) => val >= 0 || '* Positive integer required',
            ]"
          />
          <q-select
            outlined
            filled
            class="col"
            label="Device"
            use-input
            hide-selected
            fill-input
            :options="deviceTypeOptions"
            v-model="shownEndpoint.deviceTypeRef"
            :rules="[
              (val) => val.toString().length > 0 || '* Required',
            ]"
            :option-label="
              (item) =>
                item == null
                  ? ''
                  : zclDeviceTypes[item].description +
                    ' (' +
                    asHex(zclDeviceTypes[item].code, 4) +
                    ')'
            "
            @filter="filterDeviceTypes"
          >
          </q-select>

          <div class="q-gutter-md row">
            <q-input
              v-model="shownEndpoint.networkIdentifier"
              outlined
              label="Network"
              type="number"
              filled
              stack-label
              :rules="[
                (val) => val.toString().length > 0 || '* Required',
                (val) => val >= 0 || '* Positive integer required',
              ]"
            />

            <q-input
              v-model="shownEndpoint.deviceVersion"
              outlined
              filled
              type="number"
              label="Version"
              stack-label
              :rules="[
                (val) => val.toString().length > 0 || '* Required',
                (val) => val >= 0 || '* Positive integer required',
              ]"
            />
          </div>
        </q-form>
      </q-card-section>
      <q-card-actions>
        <q-btn label="Cancel" v-close-popup class="col" />
        <q-btn
          :label="endpointReference ? 'Save' : 'Create'"
          color="primary"
          v-close-popup
          class="col"
          @click="
            endpointReference
              ? editEpt(shownEndpoint, endpointReference)
              : newEpt(shownEndpoint)
          "
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script>
import * as RestApi from '../../src-shared/rest-api'
import CommonMixin from '../util/common-mixin'
const _ = require('lodash')

export default {
  name: 'ZclCreateModifyEndpoint',
  props: ['endpointReference'],
  mixins: [CommonMixin],
  mounted() {
    if (this.endpointReference != null) {
      this.shownEndpoint.endpointIdentifier = parseInt(
        this.endpointId[this.endpointReference]
      )
      this.shownEndpoint.networkIdentifier = parseInt(
        this.networkId[this.endpointReference]
      )
      this.shownEndpoint.deviceVersion = parseInt(
        this.endpointVersion[this.endpointReference]
      )
      this.shownEndpoint.deviceTypeRef = this.endpointDeviceTypeRef[
        this.endpointType[this.endpointReference]
      ]
    }
  },
  data() {
    return {
      deviceTypeOptions: this.zclDeviceTypeOptions,
      shownEndpoint: {
        endpointIdentifier: 1,
        networkIdentifier: 0,
        deviceTypeRef: null,
        deviceVersion: 1,
      },
    }
  },
  computed: {
    zclDeviceTypeOptions: {
      get() {
        let dt = this.$store.state.zap.zclDeviceTypes
        let keys = Object.keys(dt).sort((a, b) => {
          return dt[a].description.localeCompare(dt[b].description)
        })
        return keys
      },
    },
    zclProfileIdString: {
      get() {
        return this.shownEndpoint.deviceTypeRef
          ? this.asHex(
              this.zclDeviceTypes[this.shownEndpoint.deviceTypeRef].profileId,
              4
            )
          : ''
      },
    },
    networkId: {
      get() {
        return this.$store.state.zap.endpointView.networkId
      },
    },
    endpointVersion: {
      get() {
        return this.$store.state.zap.endpointView.endpointVersion
      },
    },
    endpointDeviceTypeRef: {
      get() {
        return this.$store.state.zap.endpointTypeView.deviceTypeRef
      },
    },
  },
  methods: {
    newEpt(shownEndpoint) {
      this.$store
        .dispatch(`zap/addEndpointType`, {
          name: 'Anonymous Endpoint Type',
          deviceTypeRef: shownEndpoint.deviceTypeRef,
        })
        .then((response) => {
          this.$store
            .dispatch(`zap/addEndpoint`, {
              endpointId: parseInt(this.shownEndpoint.endpointIdentifier),
              networkId: this.shownEndpoint.networkIdentifier,
              endpointType: response.id,
              endpointVersion: this.shownEndpoint.deviceVersion,
              deviceIdentifier: this.zclDeviceTypes[
                this.shownEndpoint.deviceTypeRef
              ].code,
            })
            .then((res) => {
              this.$store.dispatch('zap/updateSelectedEndpointType', {
                endpointType: this.endpointType[res.id],
                deviceTypeRef: this.endpointDeviceTypeRef[
                  this.endpointType[res.id]
                ],
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
            })
        })
    },
    editEpt(shownEndpoint, endpointReference) {
      let endpointTypeReference = this.endpointType[this.endpointReference]

      this.$store.dispatch('zap/updateEndpointType', {
        endpointTypeId: endpointTypeReference,
        updatedKey: RestApi.updateKey.deviceTypeRef,
        updatedValue: shownEndpoint.deviceTypeRef,
      })

      this.$store.dispatch('zap/updateEndpoint', {
        id: endpointReference,
        changes: [
          {
            updatedKey: RestApi.updateKey.endpointId,
            value: parseInt(shownEndpoint.endpointIdentifier),
          },
          {
            updatedKey: RestApi.updateKey.networkId,
            value: shownEndpoint.networkIdentifier,
          },
          {
            updatedKey: RestApi.updateKey.endpointVersion,
            value: shownEndpoint.deviceVersion,
          },
        ],
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

      this.$store.dispatch('zap/updateSelectedEndpointType', {
        endpointType: endpointReference,
        deviceTypeRef: this.endpointDeviceTypeRef[
          this.endpointType[this.endpointReference]
        ],
      })
      this.$store.dispatch('zap/updateSelectedEndpoint', this.endpointReference)
    },

    filterDeviceTypes(val, update) {
      if (val === '') {
        update(() => {
          this.deviceTypeOptions = this.zclDeviceTypeOptions
        })
      }
      update(() => {
        let dt = this.$store.state.zap.zclDeviceTypes
        const needle = val.toLowerCase()
        this.deviceTypeOptions = this.zclDeviceTypeOptions.filter((v) => {
          return dt[v].description.toLowerCase().indexOf(needle) > -1
        })
      })
    },
  },
}
</script>

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
          {{ this.endpointReference ? 'Create New Endpoint' : 'Edit Endpoint' }}
        </div>
        <q-form>
          <q-field label="Endpoint" stack-label>
            <q-input
              v-model="shownEndpoint.endpointIdentifier"
              outlined
              dense
              filled
              type="number"
              class="col"
            />
          </q-field>
          <q-field label="Profile ID" stack-label>
            <q-input
              outlined
              filled
              type="number"
              v-model="zclProfileIdString"
              class="col"
            />
          </q-field>
          <q-field label="Device" stack-label>
            <q-select
              outlined
              filled
              class="col"
              use-input
              hide-selected
              fill-input
              :options="deviceTypeOptions"
              v-model="shownEndpoint.deviceTypeRef"
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
          </q-field>

          <div class="q-gutter-md row">
            <q-field label="Network" stack-label>
              <q-input
                v-model="shownEndpoint.networkIdentifier"
                outlined
                type="number"
                filled
                stack-label
              />
            </q-field>

            <q-field label="Version" stack-label>
              <q-input
                v-model="shownEndpoint.deviceVersion"
                outlined
                filled
                type="number"
                stack-label
              />
            </q-field>
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

export default {
  name: 'ZclCreateModifyEndpoint',
  props: ['endpointReference'],
  mixins: [CommonMixin],
  mounted() {
    if (this.endpointReference != null) {
      this.shownEndpoint.endpointIdentifier = this.endpointId[
        this.endpointReference
      ]
      this.shownEndpoint.networkIdentifier = this.networkId[
        this.endpointReference
      ]
      this.shownEndpoint.deviceVersion = this.endpointVersion[
        this.endpointReference
      ]
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

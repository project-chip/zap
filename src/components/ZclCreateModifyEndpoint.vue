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
          {{ this.endpointRefernce ? 'Create New Endpoint' : 'Edit Endpoint' }}
        </div>
        <q-form>
          <q-field label="Endpoint" stack-label>
            <q-input
              v-model="newEndpoint.newEndpointId"
              prefix="0x"
              mask="XXXX"
              fill-mask="0"
              maxlength="6"
              reverse-fill-mask
              outlined
              dense
              class="col"
            />
          </q-field>
          <q-field label="Profile ID" stack-label>
            <q-input outlined v-model="zclProfileId" disable class="col" />
          </q-field>
          <q-field label="Device Type" stack-label>
            <q-select
              outlined
              class="col"
              use-input
              hide-selected
              fill-input
              :options="deviceTypeOptions"
              v-model="newEndpoint.newDeviceTypeRef"
              :option-label="
                (item) =>
                  item == null
                    ? ''
                    : zclDeviceTypes[item].description +
                      ' (' +
                      zclDeviceTypes[item].code +
                      ')'
              "
              @filter="filterDeviceTypes"
            >
            </q-select>
          </q-field>

          <div class="q-gutter-md row">
            <q-field label="Network" stack-label>
              <q-input
                v-model="newEndpoint.newNetworkId"
                outlined
                stack-label
              />
            </q-field>

            <q-field label="Version" stack-label>
              <q-input v-model="newEndpoint.newVersion" outlined stack-label />
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
              ? editEpt(newEndpoint, endpointReference)
              : newEpt(newEndpoint)
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
      this.newEndpoint.newEndpointId = this.endpointId[this.endpointReference]
      this.newEndpoint.newNetworkId = this.networkId[this.endpointReference]
      this.newEndpoint.newDeviceTypeRef = this.endpointDeviceTypeRef[
        this.endpointType[this.endpointReference]
      ]
    }
  },
  data() {
    return {
      deviceTypeOptions: this.zclDeviceTypeOptions,
      newEndpoint: {
        newEndpointId: '0001',
        newNetworkId: 1,
        newDeviceTypeRef: null,
        newVersion: 1,
      },
    }
  },
  computed: {
    zclDeviceTypeOptions: {
      get() {
        var dt = this.$store.state.zap.zclDeviceTypes
        let keys = Object.keys(dt).sort((a, b) => {
          return dt[a].description.localeCompare(dt[b].description)
        })
        return keys
      },
    },
    zclProfileId: {
      get() {
        return this.newEndpoint.newDeviceTypeRef
          ? this.zclDeviceTypes[this.newEndpoint.newDeviceTypeRef].profileId
          : ''
      },
    },
    networkId: {
      get() {
        return this.$store.state.zap.endpointView.networkId
      },
    },
    endpointDeviceTypeRef: {
      get() {
        return this.$store.state.zap.endpointTypeView.deviceTypeRef
      },
    },
  },
  methods: {
    newEpt(newEndpoint) {
      let deviceTypeRef = newEndpoint.newDeviceTypeRef

      this.$store
        .dispatch(`zap/addEndpointType`, {
          name: 'Anonymous Endpoint Type',
          deviceTypeRef: deviceTypeRef,
        })
        .then((response) => {
          let eptId = this.newEndpoint.newEndpointId
          let nwkId = this.newEndpoint.newNetworkId
          this.$store
            .dispatch(`zap/addEndpoint`, {
              endpointId: eptId,
              networkId: nwkId,
              endpointType: response.id,
            })
            .then((res) => {
              this.$store.dispatch('zap/updateSelectedEndpointType', {
                endpointType: this.endpointType[res.id],
                deviceTypeRef: this.endpointDeviceTypeRef[res.id],
              })
              this.$store.dispatch('zap/updateSelectedEndpoint', res.id)
            })
        })
    },
    editEpt(newEndpoint, endpointReference) {
      let endpointTypeReference = this.endpointType[this.endpointReference]

      this.$store.dispatch('zap/updateEndpointType', {
        action: RestApi.action.update,
        endpointTypeId: endpointTypeReference,
        updatedKey: RestApi.updateKey.deviceTypeRef,
        updatedValue: newEndpoint.newDeviceTypeRef,
      })

      this.$store.dispatch('zap/updateEndpoint', {
        context: {
          id: endpointReference,
          changes: [
            {
              updatedKey: RestApi.updateKey.endpointId,
              value: newEndpoint.newEndpointId,
            },
            {
              updatedKey: RestApi.updateKey.networkId,
              value: newEndpoint.newNetworkId,
            },
          ],
        },
      })
      this.$store.dispatch('zap/updateSelectedEndpointType', {
        endpointType: endpointReference,
        deviceTypeRef: this.endpointDeviceTypeRef[endpointReference],
      })
      this.$store.dispatch('zap/updateSelectedEndpoint', endpointReference)
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

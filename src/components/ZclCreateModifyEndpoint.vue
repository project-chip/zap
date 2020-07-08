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
          Create New Endpoint
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
            <q-input outlined v-model="zclProfileId" disabled class="col" />
          </q-field>
          <q-field label="Device Type" stack-label>
            <q-select
              v-model="newEndpoint.newDeviceTypeRef"
              outlined
              class="col"
              :options="zclDeviceTypeOptions"
              :option-label="
                (item) =>
                  item === null ? '' : zclDeviceTypes[item].description
              "
            />
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
          label="Create"
          color="primary"
          v-close-popup
          class="col"
          @click="newEpt(newEndpoint)"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script>
import * as RestApi from '../../src-shared/rest-api'

export default {
  name: 'ZclCreateModifyEndpoint',
  data() {
    return {
      newEndpoint: {
        newEndpointId: '0001',
        newNetworkId: 'Primary',
        newDeviceTypeRef: null,
        newVersion: 1,
      },
    }
  },
  computed: {
    zclDeviceTypeOptions: {
      get() {
        var dt = this.$store.state.zap.zclDeviceTypes
        return Object.keys(dt).sort((a, b) => {
          return dt[a].description.localeCompare(dt[b].description)
        })
      },
    },
    zclDeviceTypes: {
      get() {
        return this.$store.state.zap.zclDeviceTypes
      },
    },
    zclProfileId: {
      get() {
        return this.newEndpoint.newDeviceTypeRef
          ? this.zclDeviceTypes[this.newEndpoint.newDeviceTypeRef].profileId
          : ''
      },
    },
  },
  methods: {
    newEpt(newEndpoint) {
      let deviceTypeRef = newEndpoint.newDeviceTypeRef

      this.$serverPost(`/endpointType`, {
        action: RestApi.action.create,
        context: {
          name: 'Anonymous Endpoint Type',
          deviceTypeRef: deviceTypeRef,
        },
      }).then((response) => {
        let eptId = this.newEndpoint.newEndpointId
        let nwkId = this.newEndpoint.newNetworkId
        this.$serverPost(`/endpoint`, {
          action: RestApi.action.create,
          context: {
            eptId: eptId,
            nwkId: nwkId,
            endpointType: response.data.id,
          },
        })
      })
    },
  },
}
</script>

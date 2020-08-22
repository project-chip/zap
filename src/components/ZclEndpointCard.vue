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
      <div class="vertical-align:middle q-pa-md">
        <b>Endpoint - &nbsp; {{ getFormattedEndpointId(endpointReference) }}</b>
      </div>
      <q-list dense bordered>
        <br />
        <q-item class="row">
          <div class="col-md-6">
            <b>Device Type</b>
          </div>
          <div class="col-md-6">
            {{
              (deviceTypes[
                endpointDeviceTypeRef[endpointType[endpointReference]]
              ]
                ? deviceTypes[
                    endpointDeviceTypeRef[endpointType[endpointReference]]
                  ].description
                : ''
              ).padStart(4, '0')
            }}
          </div>
        </q-item>
        <q-item class="row">
          <div class="col-md-6">
            <b>Network</b>
          </div>
          <div class="col-md-6">
            {{ networkId[endpointReference] }}
          </div>
        </q-item>
        <q-item class="row">
          <div class="col-md-6">
            <b>Profile ID</b>
          </div>
          <div class="col-md-6">
            {{
              (deviceTypes[
                endpointDeviceTypeRef[endpointType[endpointReference]]
              ]
                ? deviceTypes[
                    endpointDeviceTypeRef[endpointType[endpointReference]]
                  ].profileId.toString(16)
                : ''
              ).padStart(4, '0')
            }}
          </div>
        </q-item>
        <q-item class="row">
          <div class="col-md-6">
            <b>Version</b>
          </div>
          <div class="col-md-6">
            1
          </div>
        </q-item>
      </q-list>
      <q-card-actions class="q-gutter-xs">
        <q-btn
          flat
          dense
          label="Delete"
          color="primary"
          v-close-popup
          size="sm"
          icon="delete"
          @click="deleteEpt()"
        />
        <div>
          <q-btn
            flat
            dense
            label="Edit"
            color="primary"
            icon="edit"
            size="sm"
            v-close-popup
            @click="modifyEndpointDialog = !modifyEndpointDialog"
          />
          <q-btn
            flat
            dense
            label="Configure"
            color="primary"
            icon="settings"
            size="sm"
            @click="setSelectedEndpointType()"
          />
        </div>
      </q-card-actions>
    </q-card>
    <q-dialog
      v-model="modifyEndpointDialog"
      class="background-color:transparent"
    >
      <zcl-create-modify-endpoint
        v-bind:endpointReference="endpointReference"
      />
    </q-dialog>
  </div>
</template>

<script>
import * as RestApi from '../../src-shared/rest-api'
import ZclCreateModifyEndpoint from './ZclCreateModifyEndpoint.vue'

export default {
  name: 'ZclEndpointCard',
  props: ['endpointReference'],
  components: { ZclCreateModifyEndpoint },
  data() {
    return {
      modifyEndpointDialog: false,
    }
  },
  methods: {
    getFormattedEndpointId(endpointRef) {
      return '0x' + this.endpointId[endpointRef].toString(16).padStart(4, '0')
    },
    deleteEpt() {
      let endpointReference = this.endpointReference
      this.$store
        .dispatch('zap/deleteEndpoint', {
          action: RestApi.action.delete,
          context: {
            id: endpointReference,
          },
        })
        .then(() => {
          let context = {
            action: RestApi.action.delete,
            context: {
              id: this.endpointType[endpointReference],
            },
          }
          this.$store.dispatch('zap/removeEndpointType', context)
        })
    },
    setSelectedEndpointType() {
      this.$store.dispatch('zap/updateSelectedEndpointType', {
        endpointType: this.endpointType[this.endpointReference],
        deviceTypeRef: this.endpointDeviceTypeRef[this.endpointReference],
      })
      this.$store.dispatch('zap/updateSelectedEndpoint', this.endpointReference)
    },
  },
  computed: {
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
    networkId: {
      get() {
        return this.$store.state.zap.endpointView.networkId
      },
    },
    endpointTypeName: {
      get() {
        return this.$store.state.zap.endpointTypeView.name
      },
    },
    deviceTypes: {
      get() {
        return this.$store.state.zap.zclDeviceTypes
      },
    },
    endpointDeviceTypeRef: {
      get() {
        return this.$store.state.zap.endpointTypeView.deviceTypeRef
      },
    },
    zclDeviceTypeOptions: {
      get() {
        return Object.keys(this.$store.state.zap.zclDeviceTypes).map((key) => {
          return key
        })
      },
    },
  },
}
</script>

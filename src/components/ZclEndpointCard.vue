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
    <q-card
      :bordered="isSelectedEndpoint"
      @click="setSelectedEndpointType(endpointReference)"
    >
      <div style='display: flex; justify-content: space-around'>
        <div class="vertical-align:middle q-pa-sm col-4">
          <strong
          >Endpoint - {{ getFormattedEndpointId(endpointReference) }}</strong
          >
        </div>
        <div class='q-gutter-sm' style='display: flex; align-items: center;'>
          <q-btn
            flat
            dense
            label="Delete"
            color="primary"
            v-close-popup
            size="sm"
            icon="delete"
            @click="handleDeletionDialog"
          />
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
            v-if='showAllInformationOfEndpoint'
            @click.stop='toggleShowAllInformationOfEndpoint'
            flat
            dense
            icon="arrow_downward"
            size='xs'
          />
          <q-btn
            v-else
            flat
            dense
            icon="arrow_upward"
            @click.stop='toggleShowAllInformationOfEndpoint'
            size='xs'
          />
        </div>
      </div>
      <q-list dense bordered v-if="showAllInformationOfEndpoint">
        <br />
        <q-item class="row">
          <div class="col-6">
            <strong>Device</strong>
          </div>
          <div class="col-6">
            {{ getDeviceOptionLabel() }}
          </div>
        </q-item>
        <q-item class="row">
          <div class="col-6">
            <strong>Network</strong>
          </div>
          <div class="col-6">
            {{ networkId[endpointReference] }}
          </div>
        </q-item>
        <q-item class="row">
          <div class="col-6">
            <strong>Profile ID</strong>
          </div>
          <div class="col-6">
            {{ asHex(profileId[endpointReference], 4) }}
          </div>
        </q-item>
        <q-item class="row">
          <div class="col-6">
            <strong>Version</strong>
          </div>
          <div class="col-6">{{ endpointVersion[endpointReference] }}</div>
        </q-item>
        <q-item class="row">
          <div class="col-6">
            <strong>Enabled Clusters</strong>
          </div>
          <div class="col-6">{{ selectedservers.length }}</div>
        </q-item>
        <q-item class="row">
          <div class="col-6">
            <strong>Enabled Attributes</strong>
          </div>
          <div class="col-6">
            {{ selectedAttributes.length }}
          </div>
        </q-item>
        <q-item class="row">
          <div class="col-6">
            <strong>Enabled Reporting</strong>
          </div>
          <div class="col-6">
            {{ selectedReporting.length }}
          </div>
        </q-item>
      </q-list>
    </q-card>
    <q-dialog
      v-model="modifyEndpointDialog"
      class="background-color:transparent"
    >
      <zcl-create-modify-endpoint
        v-bind:endpointReference="endpointReference"
        v-on:saveOrCreateValidated="modifyEndpointDialog = false"
        @updateData="getEndpointCardData()"
      />
    </q-dialog>
    <q-dialog
      v-model="deleteEndpointDialog"
      class="background-color:transparent"
    >
      <q-card>
        <q-card-section>
          <div class="text-h6">Delete Endpoint</div>

          This action is irreversible and you will loose all the data under the
          endpoint.
        </q-card-section>
        <q-card-section>
          <q-checkbox
            class="q-mt-xs"
            label="Don't show this dialog again"
            :value="confirmDeleteEndpointDialog"
            @input="confirmDeleteEndpointDialog = !confirmDeleteEndpointDialog"
          />
        </q-card-section>
        <q-card-actions>
          <q-btn label="Cancel" v-close-popup class="col" />
          <q-btn
            :label="'Delete'"
            color="primary"
            class="col"
            v-close-popup="deleteEndpointDialog"
            @click="updateDialogStateAndDeleteEndpoint()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="deleteingleEndpointDialog"
      class="background-color:transparent"
    >
      <q-card>
        <q-card-section>
          <div class="text-h6">Delete last Endpoint</div>

          Deleting the only remaining endpoint may cause the ZCL configuration
          to go into an invalid state. Are you sure want to delete this
          endpoint?
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
import ZclCreateModifyEndpoint from './ZclCreateModifyEndpoint.vue'
import CommonMixin from '../util/common-mixin'
import * as Storage from '../util/storage'
import Vue from 'vue'
import restApi from '../../src-shared/rest-api'
import { setAttributeStateLists, setClusterList } from '../store/zap/actions'
import * as Util from '../util/util'

export default {
  name: 'ZclEndpointCard',
  props: ['endpointReference'],
  mixins: [CommonMixin],
  components: { ZclCreateModifyEndpoint },
  data() {
    return {
      modifyEndpointDialog: false,
      deleteEndpointDialog: false,
      confirmDeleteEndpointDialog: false,
      deleteingleEndpointDialog: false,
      showAllInformationOfEndpoint: false,
      selectedservers: [],
      selectedAttributes: [],
      selectedReporting: [],
    }
  },
  methods: {
    getFormattedEndpointId(endpointRef) {
      return this.endpointId[endpointRef]
    },
    getStorageParam() {
      return Storage.getItem('confirmDeleteEndpointDialog')
    },
    updateDialogStateAndDeleteEndpoint() {
      Storage.setItem(
        'confirmDeleteEndpointDialog',
        this.confirmDeleteEndpointDialog
      )
      this.deleteEpt()
    },
    getDeviceOptionLabel() {
      if (this.deviceType == null) return ''
      if (this.deviceId[this.endpointReference] != this.deviceType.code) {
        return this.asHex(this.deviceId[this.endpointReference], 4)
      } else {
        return (
          this.deviceType.description +
          ' (' +
          this.asHex(this.deviceType.code, 4) +
          ')'
        )
      }
    },
    handleDeletionDialog() {
      if (this.getStorageParam() == 'true') {
        this.deleteEpt()
      } else {
        this.deleteEndpointDialog = !this.deleteEndpointDialog
      }
    },
    deleteEpt() {
      if (this.endpoints.length == 1) {
        this.deleteingleEndpointDialog = true
      } else {
        this.deleteEndpoint()
      }
    },
    deleteEndpoint() {
      let endpointReference = this.endpointReference
      this.$store.dispatch('zap/deleteEndpoint', endpointReference).then(() => {
        this.$store.dispatch(
          'zap/deleteEndpointType',
          this.endpointType[endpointReference]
        )
      })
    },
    toggleShowAllInformationOfEndpoint() {
      this.showAllInformationOfEndpoint = !this.showAllInformationOfEndpoint
    },
    getEndpointCardData() {
      Vue.prototype
        .$serverGet(
          `${restApi.uri.endpointTypeClusters}${this.endpointType[this.endpointReference]}`
        )
        .then((res) => {
          let enabledClients = []
          let enabledServers = []
          res.data.forEach((record) => {
            if (record.enabled) {
              if (record.side === 'client') {
                enabledClients.push(record.clusterRef)
              } else {
                enabledServers.push(record.clusterRef)
              }
            }
          })
          this.selectedservers = [...enabledServers, ...enabledServers]
        })

      Vue.prototype
        .$serverGet(
          `${restApi.uri.endpointTypeAttributes}${this.endpointType[this.endpointReference]}`
        )
        .then((res) => {
          this.selectedAttributes = []
          this.selectedReporting = []
          res.data.forEach((record) => {
            let resolvedReference = Util.cantorPair(
              record.attributeRef,
              record.clusterRef
            )
            if (record.included) this.selectedAttributes.push(resolvedReference)
            if (record.includedReportable)
              this.selectedReporting.push(resolvedReference)
          })
        })
    },
  },
  computed: {
    endpoints: {
      get() {
        return Array.from(this.endpointIdListSorted.keys()).map((id) => ({
          id: id,
        }))
      },
    },
    deviceType: {
      get() {
        return this.zclDeviceTypes[
          this.endpointDeviceTypeRef[this.endpointType[this.endpointReference]]
          ]
      },
    },
    networkId: {
      get() {
        return this.$store.state.zap.endpointView.networkId
      },
    },
    profileId: {
      get() {
        return this.$store.state.zap.endpointView.profileId
      },
    },
    deviceId: {
      get() {
        return this.$store.state.zap.endpointView.deviceId
      },
    },
    endpointVersion: {
      get() {
        return this.$store.state.zap.endpointView.endpointVersion
      },
    },
    endpointTypeName: {
      get() {
        return this.$store.state.zap.endpointTypeView.name
      },
    },
    endpointDeviceTypeRef: {
      get() {
        return this.$store.state.zap.endpointTypeView.deviceTypeRef
      },
    },
    zclDeviceTypeOptions: {
      get() {
        return Object.keys(this.$store.state.zap.zclDeviceTypes)
      },
    },
    isSelectedEndpoint: {
      get() {
        return this.selectedEndpointId == this.endpointReference
      },
    },
  },
  watch: {
    isSelectedEndpoint(newValue) {
      if(newValue) {
        this.showAllInformationOfEndpoint = true
      }
    }
  },
  created() {
    this.getEndpointCardData()
  }
}
</script>

<style scoped lang="sass">
.q-card
  border-width: 1px
  border-color: $primary
</style>

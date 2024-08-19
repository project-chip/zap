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
  <div class="q-mx-md q-mb-sm">
    <q-card
      :class="{ 'active v-step-5': isSelectedEndpoint }"
      @click="setSelectedEndpointType(endpointReference)"
      flat
    >
      <div
        class="q-mx-sm"
        style="display: flex; justify-content: space-between"
      >
        <div class="flex q-pa-sm col-4 q-gutter-sm">
          <img
            v-if="$store.state.zap.isMultiConfig"
            :src="
              createLogoSrc(
                true,
                getDeviceCategory(deviceType[0]?.packageRef),
                isSelectedEndpoint
              )
            "
            alt=""
          />
          <strong>
            Endpoint - {{ getFormattedEndpointId(endpointReference) }}</strong
          >
        </div>
        <div class="q-gutter-sm" style="display: flex; align-items: center">
          <q-btn
            flat
            dense
            icon="o_edit"
            size="sm"
            v-close-popup
            @click="modifyEndpointDialog = !modifyEndpointDialog"
            data-test="edit-endpoint"
          >
            <q-tooltip> Edit </q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            icon="list_alt"
            size="sm"
            v-close-popup
            to="/feature"
          >
            <q-tooltip> Features </q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            v-close-popup
            size="sm"
            icon="o_content_copy"
            @click.stop="duplicateEndpoint()"
          >
            <q-tooltip> Copy </q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            v-close-popup
            size="sm"
            icon="o_delete"
            @click="handleDeletionDialog"
            data-test="delete-endpoint"
          >
            <q-tooltip> Delete </q-tooltip>
          </q-btn>

          <q-btn
            v-if="getEndpointInformation"
            @click.stop="toggleShowAllInformationOfEndpoint(false)"
            flat
            dense
            icon="mdi-chevron-up"
            size="sm"
            data-test="endpoint-body-toggler-hide"
          />
          <q-btn
            v-else
            flat
            dense
            icon="mdi-chevron-down"
            @click.stop="toggleShowAllInformationOfEndpoint(true)"
            size="sm"
            data-test="endpoint-body-toggler-show"
          />
        </div>
      </div>
      <q-slide-transition>
        <q-list class="cursor-pointer" dense v-if="getEndpointInformation">
          <q-item class="row justify-between">
            <div v-if="isDeviceTypeArray" class="col">
              <strong
                >Device
                <q-btn
                  v-if="isDeviceLibraryDocumentationAvailable"
                  flat
                  :color="primary"
                  dense
                  icon="sym_o_quick_reference"
                  size="sm"
                  @click="openDeviceLibraryDocumentation"
                >
                  <q-tooltip> Device Type Specification </q-tooltip>
                </q-btn>
              </strong>
              <li
                v-for="(dev, index) in deviceType"
                :key="dev.id"
                class="q-pl-md"
                style="list-style-type: none"
              >
                <strong>{{
                  `${dev.description} (${asHex(dev.code, 4)}) v${
                    deviceVersion[index]
                  }`
                }}</strong>
              </li>
            </div>
            <div v-else class="col row justify-between">
              <div class="col-6">
                <strong
                  >Device
                  <q-btn
                    v-if="isDeviceLibraryDocumentationAvailable"
                    flat
                    :color="primary"
                    dense
                    icon="sym_o_quick_reference"
                    size="sm"
                    @click="openDeviceLibraryDocumentation"
                  >
                    <q-tooltip> Device Type Specification </q-tooltip>
                  </q-btn>
                </strong>
              </div>
              <div class="col-6">
                <strong>{{
                  `${deviceType[0]?.description} (${asHex(
                    deviceType[0]?.code,
                    4
                  )})`
                }}</strong>
              </div>
            </div>
          </q-item>
          <q-item class="row" v-if="isDeviceTypeArray">
            <div class="col-6">
              <strong>Primary Device</strong>
            </div>
            <div class="col-6">
              <strong>{{
                `${deviceType[0]?.description} (${asHex(
                  deviceType[0]?.code,
                  4
                )})`
              }}</strong>
            </div>
          </q-item>
          <q-item class="row">
            <div class="col-6">
              <strong>Network</strong>
            </div>
            <div class="col-6">
              <strong>{{ networkId[endpointReference] }}</strong>
            </div>
          </q-item>
          <q-item class="row">
            <div class="col-6" v-if="enableParentEndpoint">
              <strong>Parent Endpoint</strong>
            </div>
            <div class="col-6" v-if="enableParentEndpoint">
              <strong>{{ parentEndpointIdentifier[endpointReference] }}</strong>
            </div>
          </q-item>
          <q-item class="row" v-if="showProfileId">
            <div class="col-6">
              <strong>Profile ID</strong>
            </div>
            <div class="col-6">
              <strong>{{ asHex(profileId[endpointReference], 4) }}</strong>
            </div>
          </q-item>
          <q-item v-if="!isDeviceTypeArray" class="row">
            <div class="col-6">
              <strong>Version</strong>
            </div>
            <div class="col-6">
              <strong>{{ deviceVersion[0] }}</strong>
            </div>
          </q-item>
        </q-list>
      </q-slide-transition>
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

          This action is irreversible and you will lose all the data under the
          endpoint.
        </q-card-section>
        <q-card-section>
          <q-checkbox
            class="q-mt-xs"
            label="Don't show this dialog again"
            :model-value="confirmDeleteEndpointDialog"
            @update:model-value="
              confirmDeleteEndpointDialog = !confirmDeleteEndpointDialog
            "
          />
        </q-card-section>
        <q-card-actions>
          <q-btn label="Cancel" v-close-popup class="col" />
          <q-btn
            id="delete_endpoint"
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
import uiOptions from '../util/ui-options'
import * as Storage from '../util/storage'
import restApi from '../../src-shared/rest-api'
import * as Util from '../util/util'
import * as dbEnum from '../../src-shared/db-enum.js'

export default {
  name: 'ZclEndpointCard',
  props: ['endpointReference'],
  mixins: [CommonMixin, uiOptions],
  components: { ZclCreateModifyEndpoint },
  data() {
    return {
      modifyEndpointDialog: false,
      deleteEndpointDialog: false,
      confirmDeleteEndpointDialog: false,
      deleteingleEndpointDialog: false,
      showAllInformationOfEndpoint: false,
      selectedServers: [],
      selectedAttributes: [],
      selectedReporting: []
    }
  },
  methods: {
    openDeviceLibraryDocumentation() {
      if (
        this.$store.state.zap.genericOptions[
          dbEnum.sessionOption.deviceTypeSpecification
        ].length > 0
      ) {
        window.open(
          this.$store.state.zap.genericOptions[
            dbEnum.sessionOption.deviceTypeSpecification
          ][0]['optionLabel'],
          '_blank'
        )
      }
    },
    duplicateEndpoint() {
      this.$store
        .dispatch('zap/duplicateEndpointType', {
          endpointTypeId: this.endpointType[this.endpointReference]
        })
        .then((res) => {
          this.$store
            .dispatch('zap/duplicateEndpoint', {
              endpointId: this.endpointReference,
              endpointIdentifier: this.getSmallestUnusedEndpointId(),
              endpointTypeId: res.id
            })
            .then(() => {
              this.$store.dispatch('zap/loadInitialData')
            })
        })
    },
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
    toggleShowAllInformationOfEndpoint(value) {
      this.$store.commit('zap/toggleShowEndpoint', {
        id: this.endpointReference,
        value: value
      })
    },
    getEndpointCardData() {
      this.$serverGet(
        `${restApi.uri.endpointTypeClusters}${
          this.endpointType[this.endpointReference]
        }`
      ).then((res) => {
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
        this.selectedServers = [...enabledServers, ...enabledClients]
      })

      this.$serverGet(
        `${restApi.uri.endpointTypeAttributes}${
          this.endpointType[this.endpointReference]
        }`
      ).then((res) => {
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
    }
  },
  computed: {
    isDeviceLibraryDocumentationAvailable() {
      return (
        this.$store.state.zap.genericOptions[
          dbEnum.sessionOption.deviceTypeSpecification
        ] &&
        this.$store.state.zap.genericOptions[
          dbEnum.sessionOption.deviceTypeSpecification
        ].length > 0
      )
    },
    endpoints: {
      get() {
        return Array.from(this.endpointIdListSorted.keys()).map((id) => ({
          id: id
        }))
      }
    },
    deviceType: {
      get() {
        let refs =
          this.endpointDeviceTypeRef[this.endpointType[this.endpointReference]]
        let deviceTypes = []
        if (refs?.length > 0) {
          refs.forEach((ref) => deviceTypes.push(this.zclDeviceTypes[ref]))
          return deviceTypes
        } else {
          return [
            this.zclDeviceTypes[
              this.endpointDeviceTypeRef[
                this.endpointType[this.endpointReference]
              ]
            ]
          ]
        }
      }
    },
    getPrimaryDeviceOptionLabel() {
      if (this.deviceType == null) return ''
      if (Array.isArray(this.deviceType)) {
        return (
          this.deviceType[0].description +
          ' (' +
          this.asHex(this.deviceType[0].code, 4) +
          ')'
        )
      } else {
        return (
          this.deviceType.description +
          ' (' +
          this.asHex(this.deviceType.code, 4) +
          ')'
        )
      }
    },
    isDeviceTypeArray: {
      get() {
        return Array.isArray(this.deviceType) && this.deviceType.length > 1
      }
    },
    networkId: {
      get() {
        return this.$store.state.zap.endpointView.networkId
      }
    },
    parentEndpointIdentifier: {
      get() {
        return this.$store.state.zap.endpointView.parentEndpointIdentifier
      }
    },
    profileId: {
      get() {
        return this.$store.state.zap.endpointView.profileId
      }
    },
    showProfileId: {
      get() {
        return (
          this.getDeviceCategory(this.deviceType[0].packageRef) === 'zigbee' &&
          this.$store.state.zap.isProfileIdShown &&
          this.enableProfileId
        )
      }
    },
    deviceId: {
      get() {
        return this.$store.state.zap.endpointTypeView.deviceIdentifier
      }
    },
    deviceVersion: {
      get() {
        let versions =
          this.endpointDeviceVersion[this.endpointType[this.endpointReference]]
        if (versions?.length > 0) {
          return versions
        } else {
          return [versions]
        }
      }
    },
    endpointTypeName: {
      get() {
        return this.$store.state.zap.endpointTypeView.name
      }
    },
    endpointDeviceTypeRef: {
      get() {
        return this.$store.state.zap.endpointTypeView.deviceTypeRef
      }
    },
    zclDeviceTypeOptions: {
      get() {
        return Object.keys(this.$store.state.zap.zclDeviceTypes)
      }
    },
    isSelectedEndpoint: {
      get() {
        return this.selectedEndpointId == this.endpointReference
      }
    },
    isClusterOptionChanged: {
      get() {
        return this.$store.state.zap.isClusterOptionChanged
      }
    },
    getEndpointInformation: {
      get() {
        return this.$store.state.zap.showEndpointData[this.endpointReference]
      }
    }
  },
  watch: {
    isSelectedEndpoint(newValue) {
      if (newValue) {
        this.$store.commit('zap/toggleShowEndpoint', {
          id: this.endpointReference,
          value: true
        })
      }
    },
    isClusterOptionChanged(val) {
      if (val) {
        this.getEndpointCardData()
        this.$store.commit('zap/updateIsClusterOptionChanged', false)
      }
    },
    $route(to, from) {
      if (from.fullPath === '/cluster' && to.fullPath === '/') {
        this.getEndpointCardData()
      }
    }
  },

  created() {
    if (this.$serverGet != null) {
      this.selectedServers = []
      this.selectedAttributes = []
      this.selectedReporting = []
      this.getEndpointCardData()
      //only show Matter features if Matter is selected
    }
  }
}
</script>

<style scoped lang="scss">
.q-card {
  color: $grey;
  border-radius: 8px;
  .q-list {
    font-size: 12px;
    .q-item {
      min-height: 0;
      padding: 3px 16px;
    }
  }
  &.active {
    color: #fff;
    background: var(--q-primary);
  }
}
</style>

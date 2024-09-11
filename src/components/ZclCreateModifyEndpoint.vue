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
    <q-card style="min-width: 450px" class="z-top">
      <q-card-section>
        <div
          class="text-h6 flex text-align:left q-mb-sm"
          data-test="endpoint-title"
        >
          <img
            class="q-my-auto q-mr-sm"
            v-if="deviceTypeTmp[0]"
            :src="createLogoSrc(true, deviceTypeTmp[0].category)"
          />
          {{ this.endpointReference ? 'Edit Endpoint' : 'Create New Endpoint' }}
        </div>
        <q-form>
          <q-input
            label="Endpoint"
            type="number"
            v-model="shownEndpoint.endpointIdentifier"
            ref="endpoint"
            outlined
            class="col v-step-1"
            :rules="[reqInteger, reqPosInt]"
            min="0"
          />
          <q-input
            v-if="enableProfileId"
            label="Profile ID"
            v-model="computedProfileId"
            ref="profile"
            outlined
            class="col"
            :rules="[reqInteger, reqPosInt]"
            @update:model-value="setProfileId"
          />

          <q-select
            v-if="!$store.state.zap.isMultiConfig"
            label="Device"
            ref="device"
            outlined
            class="col v-step-2"
            use-input
            :multiple="enableMultipleDevice"
            use-chips
            :options="deviceTypeOptions"
            v-model="deviceType"
            :rules="[
              (val) => !(val == null || val?.length == 0) || '* Required'
            ]"
            option-value="deviceTypeRef"
            :option-label="getDeviceOptionLabel"
            @filter="filterDeviceTypes"
            data-test="select-endpoint-input"
          >
            <template v-slot:after>
              <q-btn
                v-if="isDeviceLibraryDocumentationAvailable"
                dense
                flat
                :color="primary"
                icon="sym_o_quick_reference"
                title="Device Type Specification"
                @click="openDeviceLibraryDocumentation"
              />
            </template>
          </q-select>

          <!-- Multi config version -->
          <q-select
            v-else
            ref="device"
            use-input
            v-model="deviceType"
            :options="createDeviceOptions(deviceTypeOptions)"
            :option-label="getDeviceOptionLabel"
            option-value="deviceTypeRef"
            label="Device"
            style="min-width: 100px"
            :multiple="enableMultipleDevice"
            use-chips
            @filter="filterDeviceTypes"
            outlined
            class="col v-step-2 q-pb-md"
            data-test="select-endpoint-input"
          >
            <template v-slot:option="scope">
              <q-item
                :clickable="scope.opt.children.length !== 0"
                :disable="scope.opt.children.length == 0"
                dense
                expand-separator
                group="somegroup"
                header-class="text-weight-bold"
                :label="scope.opt.label"
              >
                <q-item-section>
                  {{ scope.opt.label }} ({{ scope.opt.children.length }})
                </q-item-section>
                <q-item-section side>
                  <q-icon name="keyboard_arrow_right" />
                </q-item-section>
                <q-menu max-height="200px" :offset="[-100, -30]">
                  <q-list style="min-width: 100px">
                    <template
                      v-for="child in scope.opt.children"
                      :key="child.deviceTypeRef"
                    >
                      <q-item
                        dense
                        clickable
                        v-ripple
                        v-close-popup
                        @click="setSelectOption(child)"
                        :class="{ 'bg-light-blue-1': false }"
                      >
                        <q-item-section>
                          <q-item-label class="q-ml-md">{{
                            getDeviceOptionLabel(child)
                          }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-list>
                </q-menu>
              </q-item>
            </template>
          </q-select>
          <!-- end-->
          <q-select
            v-if="enablePrimaryDevice"
            label="Primary Device"
            ref="primary-device"
            outlined
            class="col v-step-2"
            use-input
            hide-selected
            fill-input
            :options="deviceType"
            v-model="primaryDeviceType"
            :rules="[(val) => val != null || '* Required']"
            :option-label="getDeviceOptionLabel"
            @filter="filterDeviceTypes"
            data-test="endpoint-primary-device"
          />
          <!-- Multi device version -->
          <q-markup-table
            v-if="enableMultipleDevice"
            flat
            bordered
            dense
            wrap-cells
            class="q-mb-md"
          >
            <thead>
              <tr>
                <th scope="col" style="text-align: left">Device</th>
                <th scope="col" style="width: 100px">Version</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-if="
                  !deviceType ||
                  !Array.isArray(deviceType) ||
                  deviceType?.length == 0
                "
              >
                <td col="2"></td>
              </tr>
              <template v-else>
                <tr v-for="(dt, index) in deviceType" :key="index">
                  <td style="text-align: left">
                    {{ getDeviceOptionLabel(dt) }}
                  </td>
                  <td>
                    <q-input
                      type="number"
                      v-model.number="dt.deviceVersion"
                      ref="version"
                      outlined
                      dense
                      @beforeinput="nonnegativeIntegersOnlyInput"
                    />
                  </td>
                </tr>
              </template>
            </tbody>
          </q-markup-table>

          <div class="q-gutter-md row">
            <q-input
              v-if="enableNetworkId"
              label="Network"
              type="number"
              v-model="shownEndpoint.networkIdentifier"
              ref="network"
              outlined
              class="col v-step-3"
              stack-label
              :rules="[reqInteger, reqPosInt]"
              min="0"
            >
            </q-input>
            <q-select
              v-if="enableParentEndpoint"
              label="Parent Endpoint"
              v-model="shownEndpoint.parentReference"
              ref="parent"
              :options="endpointIds"
              use-input
              hide-selected
              fill-input
              outlined
              class="col v-step-3"
              stack-label
              min="0"
            >
            </q-select>
            <q-input
              v-if="!enableMultipleDevice"
              label="Version"
              type="number"
              v-model="shownEndpoint.deviceVersion"
              ref="version"
              outlined
              stack-label
              :rules="[reqInteger, reqPosInt]"
              min="0"
            />
          </div>
        </q-form>
      </q-card-section>
      <q-card-actions>
        <q-btn
          label="Cancel"
          @click="toggleCreateEndpointModal"
          v-close-popup
          class="col"
        />
        <q-btn
          :label="endpointReference ? 'Save' : 'Create'"
          color="primary"
          class="col v-step-4 w-step-3"
          @click="saveOrCreateHandler()"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script>
import * as RestApi from '../../src-shared/rest-api'
import * as DbEnum from '../../src-shared/db-enum'
import CommonMixin from '../util/common-mixin'
import uiOptions from '../util/ui-options'
const _ = require('lodash')
import * as dbEnum from '../../src-shared/db-enum.js'

export default {
  name: 'ZclCreateModifyEndpoint',
  props: ['endpointReference'],
  emits: ['saveOrCreateValidated', 'updateData'],
  mixins: [CommonMixin, uiOptions],
  watch: {
    deviceTypeRefAndDeviceIdPair(val) {
      this.setDeviceTypeCallback(val)
    }
  },
  mounted() {
    if (this.endpointReference != null) {
      this.shownEndpoint.endpointIdentifier = parseInt(
        this.endpointId[this.endpointReference]
      )
      this.shownEndpoint.networkIdentifier = parseInt(
        this.networkId[this.endpointReference]
      )
      this.shownEndpoint.parentReference = parseInt(
        this.parentEndpointIdentifier[this.endpointReference]
      )
      this.shownEndpoint.profileIdentifier = this.asHex(
        parseInt(this.profileId[this.endpointReference]),
        4
      )

      const deviceVersion =
        this.deviceVersion[this.endpointType[this.endpointReference]]
      const deviceTypeRefs =
        this.endpointDeviceTypeRef[this.endpointType[this.endpointReference]]
      const deviceTypes = []
      if (Array.isArray(deviceTypeRefs)) {
        for (let i = 0; i < deviceTypeRefs.length; i++) {
          deviceTypes.push({
            deviceTypeRef: deviceTypeRefs[i],
            deviceIdentifier: this.zclDeviceTypes[deviceTypeRefs[i]].code,
            deviceVersion: deviceVersion[i]
          })
        }
      } else {
        deviceTypes.push({
          deviceTypeRef: deviceTypeRefs,
          deviceIdentifier: this.zclDeviceTypes[deviceTypeRefs].code,
          deviceVersion: deviceVersion
        })
      }

      // Set device types only in edit mode
      this.deviceTypeTmp = deviceTypes
      this.primaryDeviceTypeTmp = deviceTypes[0] ?? null // First item is the primary device type
    } else {
      this.shownEndpoint.endpointIdentifier = this.getSmallestUnusedEndpointId()
    }
  },
  data() {
    return {
      deviceTypeOptions: null,
      shownEndpoint: {
        endpointIdentifier: 1,
        profileIdentifier: null,
        parentReference: null,
        networkIdentifier: 0,
        deviceVersion: 1
      },
      saveOrCreateCloseFlag: false,
      deviceTypeTmp: [], // Temp store for the selected device types
      primaryDeviceTypeTmp: null, // Temp store for the selected primary device type
      endpointIds: [],
      tmpSelectedOptions: []
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
    zclDeviceTypeOptions: {
      get() {
        let dt = this.$store.state.zap.zclDeviceTypes
        let keys = Object.keys(dt).sort((a, b) => {
          return dt[a].description.localeCompare(dt[b].description)
        })

        return keys.map((item) => {
          return {
            deviceTypeRef: parseInt(item),
            deviceIdentifier: dt[item].code,
            category: this.getDeviceCategory(dt[item].packageRef)
          }
        })
      }
    },
    zclProfileIdString: {
      get() {
        return this.$store.state.zap.endpointView.profileId
      }
    },
    networkId: {
      get() {
        return this.$store.state.zap.endpointView.networkId
      }
    },
    profileId: {
      get() {
        return this.$store.state.zap.endpointView.profileId
      }
    },
    parentEndpointIdentifier: {
      get() {
        return this.$store.state.zap.endpointView.parentEndpointIdentifier
      }
    },
    customDeviceIdReference: {
      get() {
        let dt = this.$store.state.zap.zclDeviceTypes
        let val = Object.keys(dt).find((a) => {
          return parseInt(dt[a].code) == parseInt(DbEnum.customDevice.code)
        })
        return val
      }
    },
    deviceVersion: {
      get() {
        return this.$store.state.zap.endpointTypeView.deviceVersion
      }
    },
    endpointDeviceId: {
      get() {
        return this.$store.state.zap.endpointTypeView.deviceIdentifier
      }
    },
    computedProfileId: {
      get() {
        let profileOption =
          this.profileCodesOptions == null
            ? null
            : this.profileCodesOptions.find(
                (o) => o.optionCode === this.shownEndpoint.profileIdentifier
              )

        return profileOption
          ? profileOption.optionCode + ' (' + profileOption.optionLabel + ')'
          : this.shownEndpoint.profileIdentifier
      }
    },
    profileCodesOptions: {
      get() {
        return this.$store.state.zap.genericOptions[
          DbEnum.sessionOption.profileCodes
        ]
      }
    },
    deviceType: {
      get() {
        // New temporary variable
        return this.enableMultipleDevice
          ? this.deviceTypeTmp
          : this.deviceTypeTmp[0]
      },
      set(newValue) {
        const value = !Array.isArray(newValue) ? [newValue] : newValue

        // New temporary variable
        this.deviceTypeTmp = value

        // Get first item package reference
        const packageRefTmp =
          this.zclDeviceTypes[this.deviceTypeTmp[0].deviceTypeRef]?.packageRef

        // Get readable device category by packageRef
        const categoryTmp = this.getDeviceCategory(packageRefTmp)

        // Set / unset multiple device option in mcp
        if (this.$store.state.zap.isMultiConfig) {
          if (categoryTmp === DbEnum.helperCategory.zigbee) {
            this.$store.state.zap.cmpEnableZigbeeFeatures = true
            this.$store.state.zap.cmpEnableMatterFeatures = false
          } else {
            this.$store.state.zap.cmpEnableZigbeeFeatures = false
            this.$store.state.zap.cmpEnableMatterFeatures = true
          }
        }
        // Create default device version if not exists
        for (const dt of value) {
          if (dt && dt.deviceVersion === undefined) {
            dt.deviceVersion = 1
          }
        }

        // Existing logic
        this.setDeviceTypeCallback(value)

        // Set primary device if necessary
        const newPrimaryDeviceType =
          Array.isArray(value) && value.length > 0 ? value[0] : null
        if (this.enablePrimaryDevice) {
          if (this.primaryDeviceTypeTmp === null) {
            this.primaryDeviceTypeTmp = newPrimaryDeviceType
          } else {
            if (
              !value.includes(
                (deviceType) =>
                  deviceType.deviceTypeRef ===
                    this.primaryDeviceTypeTmp.deviceTypeRef &&
                  deviceType.deviceIdentifier ===
                    this.primaryDeviceTypeTmp.deviceIdentifier
              )
            ) {
              this.primaryDeviceTypeTmp = newPrimaryDeviceType
            }
          }
        }
      }
    },
    primaryDeviceType: {
      get() {
        return this.primaryDeviceTypeTmp
      },
      set(value) {
        if (this.primaryDeviceTypeTmp?.deviceTypeRef == value?.deviceTypeRef) {
          return
        }
        const newPrimaryDevice = value
        let tempDeviceType = this.deviceType
        tempDeviceType = tempDeviceType.filter(
          (d) => d.deviceTypeRef !== newPrimaryDevice.deviceTypeRef
        )
        tempDeviceType.unshift(newPrimaryDevice)
        this.deviceType = tempDeviceType
      }
    }
  },
  methods: {
    setSelectOption(val) {
      const i = this.tmpSelectedOptions.findIndex(
        (e) => e.deviceTypeRef === val.deviceTypeRef
      )
      if (i > -1) {
        this.tmpSelectedOptions.splice(i, 1)
      } else {
        if (val.category === 'matter' && this.enableMultipleDevice) {
          this.tmpSelectedOptions.push(val)
        } else {
          this.tmpSelectedOptions = []
          this.tmpSelectedOptions.push(val)
        }
      }
      this.deviceType = [...this.tmpSelectedOptions]
    },

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
    getEndpointIds() {
      if (this.$serverGet != null) {
        this.$serverGet(RestApi.uri.endpointIds).then((resp) => {
          this.endpointIds = resp.data
        })
      }
    },
    // This function will close the endpoint modal
    toggleCreateEndpointModal() {
      this.$store.commit('zap/toggleEndpointModal', false)
    },
    setProfileId(value) {
      this.shownEndpoint.profileIdentifier = value
    },
    setDeviceTypeCallback(value) {
      const firstValue = Array.isArray(value) ? value[0] : value
      // Check deviceTypreRef truthy - at least 1 item selected
      if (firstValue) {
        const { deviceTypeRef } = firstValue
        let profileId = this.shownEndpoint.profileIdentifier
        // On change of device type, reset the profileId to the current deviceType _unless_ the default profileId is custom
        if (this.shownEndpoint.profileIdentifier != null) {
          profileId =
            this.zclDeviceTypes[deviceTypeRef].profileId ==
            DbEnum.customDevice.profileId
              ? this.asHex(profileId, 4)
              : this.asHex(this.zclDeviceTypes[deviceTypeRef].profileId, 4)
        } else {
          profileId = this.asHex(
            this.zclDeviceTypes[deviceTypeRef].profileId,
            4
          )
        }
        this.shownEndpoint.profileIdentifier = profileId
      }
    },
    saveOrCreateHandler() {
      let profile = this.enableProfileId ? this.$refs.profile.validate() : true
      if (
        this.$refs.endpoint.validate() &&
        this.$refs.device.validate() &&
        (this.$refs.version?.validate?.() ??
          !this.$refs.version?.includes((v) => !(v >= 0))) &&
        profile
      ) {
        this.$emit('saveOrCreateValidated')
        if (this.endpointReference) {
          this.editEpt(this.shownEndpoint, this.endpointReference)
          this.$emit('updateData')
        } else {
          this.newEpt()
        }
      }
    },
    reqValue(value) {
      return !_.isEmpty(value) || '* Required'
    },
    reqInteger(value) {
      return Number.isInteger(parseFloat(value)) || '* Integer required'
    },
    reqPosInt(value) {
      return parseInt(value) >= 0 || '* Positive integer required'
    },
    nonnegativeIntegersOnlyInput(e) {
      if (e.data != null && !(parseInt(e.data) >= 0)) {
        e.preventDefault()
      }
    },
    reqUniqueEndpoint(value) {
      return (
        _.isNil(_.findKey(this.endpointId, (a) => a == value)) ||
        this.endpointReference ==
          _.findKey(this.endpointId, (a) => a == value) ||
        'Endpoint identifier must be unique'
      )
    },
    newEpt() {
      const deviceTypeRef = []
      const deviceIdentifier = []
      const deviceVersion = []
      this.deviceTypeTmp.forEach((dt, index) => {
        deviceTypeRef.push(dt.deviceTypeRef)
        deviceIdentifier.push(dt.deviceIdentifier)
        deviceVersion.push(dt.deviceVersion)
      })
      this.$store
        .dispatch(`zap/addEndpointType`, {
          name: 'Anonymous Endpoint Type',
          deviceTypeRef,
          deviceIdentifier,
          deviceVersion
        })
        .then((response) => {
          const deviceIdentifier = []
          this.deviceTypeTmp.forEach((dt) =>
            deviceIdentifier.push(dt.deviceIdentifier)
          )
          this.$store
            .dispatch(`zap/addEndpoint`, {
              endpointId: parseInt(this.shownEndpoint.endpointIdentifier),
              networkId: this.shownEndpoint.networkIdentifier,
              profileId: parseInt(this.shownEndpoint.profileIdentifier),
              parentEndpointIdentifier: this.shownEndpoint.parentReference,
              endpointType: response.id
            })
            .then((res) => {
              if (this.shareClusterStatesAcrossEndpoints()) {
                this.$store.dispatch('zap/shareClusterStatesAcrossEndpoints', {
                  endpointTypeIdList: this.endpointTypeIdList
                })
              }
              this.$store.dispatch('zap/updateSelectedEndpointType', {
                endpointType: this.endpointType[res.id],
                deviceTypeRef:
                  this.endpointDeviceTypeRef[this.endpointType[res.id]]
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
                        added: enabled
                      }

                      console.log(
                        `Enabling UC component ${JSON.stringify(arg)}`
                      )
                      this.updateSelectedComponentRequest(arg)
                    }
                  }
                })

              this.$store.dispatch(
                'zap/updateSelectedEndpoint',
                res.endpointType
              )
              this.$store.commit('zap/toggleEndpointModal', false)
              this.$store.dispatch('zap/setDeviceTypeFeatures', {
                deviceTypeRefs: deviceTypeRef,
                endpointTypeRef: res.id
              })
            })
        })
        .catch((err) => console.log('Error in newEpt: ' + err.message))
    },
    editEpt(shownEndpoint, endpointReference) {
      let endpointTypeReference = this.endpointType[this.endpointReference]

      const deviceTypeRef = []
      const deviceIdentifier = []
      const deviceVersion = []

      this.deviceTypeTmp.forEach((dt) => {
        deviceTypeRef.push(dt.deviceTypeRef)
        deviceIdentifier.push(parseInt(dt.deviceIdentifier))
        deviceVersion.push(parseInt(dt.deviceVersion))
      })

      this.$store.dispatch('zap/updateEndpointType', {
        endpointTypeId: endpointTypeReference,
        changes: [
          {
            updatedKey: RestApi.updateKey.deviceTypeRef,
            value: deviceTypeRef
          },
          {
            updatedKey: RestApi.updateKey.deviceVersion,
            value: deviceVersion
          },
          {
            updatedKey: RestApi.updateKey.deviceId,
            value: deviceIdentifier
          }
        ]
      })

      this.$store.dispatch('zap/updateEndpoint', {
        id: endpointReference,
        parentEndpointIdentifier: this.shownEndpoint.parentReference,
        changes: [
          {
            updatedKey: RestApi.updateKey.endpointId,
            value: parseInt(shownEndpoint.endpointIdentifier)
          },
          {
            updatedKey: RestApi.updateKey.networkId,
            value: shownEndpoint.networkIdentifier
          },
          {
            updatedKey: RestApi.updateKey.profileId,
            value: parseInt(shownEndpoint.profileIdentifier)
          }
        ]
      })

      // collect all cluster id from new endpoint
      this.selectionClients.forEach((id) => {
        this.updateSelectedComponentRequest({
          clusterId: id,
          side: ['client'],
          added: true
        })
      })

      this.selectionServers.forEach((id) => {
        this.updateSelectedComponentRequest({
          clusterId: id,
          side: ['server'],
          added: true
        })
      })

      this.$store.dispatch('zap/updateSelectedEndpointType', {
        endpointType: endpointReference,
        deviceTypeRef: deviceTypeRef
      })
      this.$store.dispatch('zap/updateSelectedEndpoint', this.endpointReference)
      this.$store.dispatch('zap/updateClusters')
      this.$store.dispatch('zap/setDeviceTypeFeatures', {
        deviceTypeRefs: deviceTypeRef,
        endpointTypeRef: this.endpointReference
      })
    },
    getDeviceOptionLabel(item) {
      if (item == null || item.deviceTypeRef == null) return ''
      if (
        item.deviceIdentifier != this.zclDeviceTypes[item.deviceTypeRef].code
      ) {
        return this.asHex(item.deviceIdentifier, 4)
      } else {
        return (
          this.zclDeviceTypes[item.deviceTypeRef].description +
          ' (' +
          this.asHex(this.zclDeviceTypes[item.deviceTypeRef].code, 4) +
          ')'
        )
      }
      // }
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
          return (
            dt[v.deviceTypeRef].description.toLowerCase().indexOf(needle) > -1
          )
        })
      })
    },
    /**
     *  Create an options array for device types selection in MCP
     *
     * @param {*} tmpDeviceTypeOptions
     * @returns Returns an object value for separated device types
     */

    createDeviceOptions(tmpDeviceTypeOptions) {
      let tmpZigbeeDevices = []
      let tmpMatterDevices = []

      tmpDeviceTypeOptions.forEach((item) => {
        if (item.category === dbEnum.helperCategory.zigbee)
          tmpZigbeeDevices.push(item)
        else if (item.category === dbEnum.helperCategory.matter)
          tmpMatterDevices.push(item)
        else console.log('Error: unknown category')
      })

      return [
        {
          label: dbEnum.helperCategory.zigbee,
          children: [...tmpZigbeeDevices]
        },
        {
          label: dbEnum.helperCategory.matter,
          children: [...tmpMatterDevices]
        }
      ]
    }
  },
  created() {
    this.getEndpointIds()
  },
  beforeMount() {
    this.deviceTypeOptions = this.zclDeviceTypeOptions
  },
  unmounted() {
    // This function will empty the deviceTypeRef state
    this.$store.commit('zap/setDeviceTypeRefAndDeviceIdPair', {
      deviceTypeRef: null,
      deviceIdentifier: null
    })
  }
}
</script>

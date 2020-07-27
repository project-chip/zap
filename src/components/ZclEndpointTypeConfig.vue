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
    <div>
      <!-- this section is for Title -->
      <p style="text-align: left; font-size: 2vw;">Endpoint Type Manager</p>
    </div>
    <div class="row">
      <!-- this section is the input for "Enpoint Type Name" -->
      <div class="col">
        <q-select
          dark
          dense
          v-model="selectedEndpointType"
          :options="zclEndpointTypeOptions"
          :option-label="
            (item) => (item === null ? '' : zclEndpointTypeName[item])
          "
          label="Endpoint Type Name"
          @input="setSelectedEndpointType($event)"
        />
      </div>
    </div>
    <div class="row">
      <!-- this section is the input for "ZCL Device Type" -->
      <div class="col">
        <q-select
          dark
          dense
          v-model="zclDeviceType"
          :options="zclDeviceTypeOptions"
          :option-label="
            (item) => (item === null ? '' : zclDeviceTypes[item].description)
          "
          label="ZCL Device Type"
          @input="showConfirmZclDeviceTypeChangeDialog($event)"
        />
      </div>
    </div>
    <div>
      <!-- this section is for buttons delete/new endpoint type -->
      <p align="right">
        <q-btn
          color="primary"
          size="0.8vw"
          label="Delete Endpoint Type"
          @click="deleteEptType(selectedEndpointType)"
        />
        <q-btn
          color="primary"
          size="0.8vw"
          style="margin-left: 5px;"
          label="New Endpoint Type"
          @click="newEptTypeDialog = true"
        />
      </p>
      <q-dialog v-model="newEptTypeDialog">
        <q-card>
          <q-card-section>
            <div>
              <p style="text-align: center; font-size: 1vw;">
                New Endpoint Type
              </p>
            </div>
          </q-card-section>
          <q-card-section>
            <div>
              <q-form
                @submit="newEptType()"
                @reset="onReset"
                class="q-gutter-md"
              >
                <q-input
                  filled
                  v-model="newEndpointType.name"
                  label="Endpoint Type Name"
                />
                <q-select
                  filled
                  v-model="newEndpointType.deviceTypeRef"
                  :options="zclDeviceTypeOptions"
                  :option-label="
                    (item) =>
                      item === null ? '' : zclDeviceTypes[item].description
                  "
                  label="ZCL Device Type"
                />
              </q-form>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn
              flat
              label="Create Endpoint Type"
              color="primary"
              style="margin-left: 5px;"
              v-close-popup
              @click="addEndpointType(newEndpointType)"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-dialog v-model="confirmEptTypeUpdate">
        <q-card>
          <q-card-section>
            <div class="text-h6">Please confirm</div>
          </q-card-section>
          <q-card-section>
            You are trying to change the device type! This will reset all
            settings to the default required for the device type. You will lose
            data!
          </q-card-section>
          <q-card-section align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn
              flat
              label="Confirm"
              color="primary"
              style="margin-left: 5px;"
              v-close-popup
              @click="setZclDeviceType(desiredZclEndpointType)"
            />
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<script>
import * as RestApi from '../../src-shared/rest-api'

export default {
  name: 'ZclEndpointTypeConfig',
  mounted() {
    this.$serverOn(RestApi.replyId.zclEndpointTypeResponse, (event, arg) => {
      switch (arg.action) {
        case RestApi.action.create:
          this.$store.dispatch('zap/addEndpointType', {
            id: arg.id,
            name: arg.name,
            deviceTypeRef: arg.deviceTypeRef,
          })
          break
        case RestApi.action.delete:
          if (arg.successful) {
            this.$store.dispatch(`zap/removeEndpointType`, {
              id: arg.id,
            })
          }
          break
        case RestApi.action.update:
          if (arg.updatedKey === 'deviceTypeRef') {
            this.$store.dispatch('zap/setDeviceTypeReference', {
              endpointId: arg.endpointTypeId,
              deviceTypeRef: arg.updatedValue,
            })
          }
          break
        default:
          break
      }
    })
  },
  methods: {
    showConfirmZclDeviceTypeChangeDialog(value) {
      this.desiredZclEndpointType = value
      this.confirmEptTypeUpdate = true
    },
    setZclDeviceType(value) {
      this.$serverPost(`/endpointType/update`, {
        action: RestApi.action.update,
        endpointTypeId: this.selectedEndpointType,
        updatedKey: 'deviceTypeRef',
        updatedValue: value,
      })
    },
    addEndpointType(newEndpointType) {
      let name = newEndpointType.name
      let deviceTypeRef = newEndpointType.deviceTypeRef

      this.$serverPost(`/endpointType`, {
        action: RestApi.action.create,
        context: {
          name: name,
          deviceTypeRef: deviceTypeRef,
        },
      })
    },
    setSelectedEndpointType(id) {
      this.$store.dispatch('zap/updateSelectedEndpointType', {
        endpointType: id,
        deviceTypeRef: this.zclDeviceTypesRecord[id],
      })
    },
    deleteEptType(selectedEndpointType) {
      this.$serverPost(`/endpointType`, {
        action: RestApi.action.delete,
        context: {
          id: selectedEndpointType,
        },
      })
    },
  },
  computed: {
    zclDeviceTypeOptions: {
      get() {
        var dt = this.$store.state.zap.zclDeviceTypes
        return Object.keys(dt).sort((a, b) =>
          dt[a].description.localeCompare(dt[b].description)
        )
      },
    },
    zclDeviceTypes: {
      get() {
        return this.$store.state.zap.zclDeviceTypes
      },
    },
    zclEndpointTypeName: {
      get() {
        return this.$store.state.zap.endpointTypeView.name
      },
    },
    zclDeviceType: {
      get() {
        return this.$store.state.zap.endpointTypeView.deviceTypeRef[
          this.selectedEndpointType
        ]
      },
    },
    zclDeviceTypesRecord: {
      get() {
        return this.$store.state.zap.endpointTypeView.deviceTypeRef
      },
    },
    selectedEndpointType: {
      get() {
        return this.$store.state.zap.endpointTypeView.selectedEndpointType
      },
    },
    zclEndpointTypeOptions: {
      get() {
        return Object.keys(this.zclEndpointTypeName).map((key) => {
          return key
        })
      },
    },
  },
  data() {
    return {
      item: {},
      newEndpointType: {
        name: '',
        deviceTypeRef: null,
      },
      title: '',
      model: [],
      newEptTypeDialog: [],
      confirmEptTypeUpdate: [],
      desiredZclEndpointType: [],
      type: '',
    }
  },
}
</script>

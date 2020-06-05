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
  <div class="bg-grey-10 text-white">
    <div>
      <div>
        <!-- this section is for Title -->
        <br />
        <p style="text-align: center; font-size: 2vw;">
          Endpoint Configuration
        </p>
      </div>
      <div>
        <!-- this section is for the table -->
        <q-table
          title="Endpoint Manager"
          :data.sync="endpoints"
          :columns="columns"
          row-key="id"
          dense
          wrap-cells
          dark
          binary-state-sort
          :selected.sync="activeIndex"
          :pagination.sync="pagination"
        >
          <template v-slot:body="props">
            <q-tr
              :props="props"
              clickable
              @click="setActiveIndex(props.row)"
              dark
            >
              <q-td key="eptId" :props="props" auto-width>
                <q-badge
                  :color="
                    !isValueValid(endpointIdValidation, props.row.id)
                      ? 'red'
                      : 'primary'
                  "
                >
                  {{ getFormattedEndpointId(props.row.id) }}
                </q-badge>
                <q-popup-edit dark dense>
                  <q-input
                    debounce="300"
                    type="text"
                    v-model="endpointId[props.row.id]"
                    dark
                    dense
                    prefix="0x"
                    mask="XXXX"
                    fill-mask="0"
                    reverse-fill-mask
                    @input="
                      handleEndpointChange(
                        props.row.id,
                        'endpointId',
                        endpointId[props.row.id]
                      )
                    "
                    :error="!isValueValid(endpointIdValidation, props.row.id)"
                    :error-message="
                      getValueErrorMessage(endpointIdValidation, props.row.id)
                    "
                  />
                </q-popup-edit>
              </q-td>
              <q-td key="profileId" :props="props" auto-width>
                {{
                  (deviceTypes[
                    endpointDeviceTypeRef[endpointType[props.row.id]]
                  ]
                    ? deviceTypes[
                        endpointDeviceTypeRef[endpointType[props.row.id]]
                      ].profileId.toString(16)
                    : ''
                  ).padStart(4, '0')
                }}
              </q-td>
              <q-td key="deviceId" :props="props" auto-width>
                {{
                  (deviceTypes[
                    endpointDeviceTypeRef[endpointType[props.row.id]]
                  ]
                    ? deviceTypes[
                        endpointDeviceTypeRef[endpointType[props.row.id]]
                      ].code.toString(16)
                    : ''
                  ).padStart(4, '0')
                }}
              </q-td>
              <q-td key="version" :props="props" auto-width>
                1
              </q-td>
              <q-td key="endpointType" :props="props" auto-width>
                <q-badge :color="'primary'">
                  {{ endpointTypeName[endpointType[props.row.id]] }}
                </q-badge>
                <q-popup-edit dark dense>
                  <q-select
                    filled
                    v-model="endpointType[props.row.id]"
                    :options="Object.keys(endpointTypeName)"
                    :option-label="
                      (item) => (item === null ? '' : endpointTypeName[item])
                    "
                    label="Endpoint Type"
                    dense
                    dark
                    @input="
                      handleEndpointChange(props.row.id, 'endpointType', $event)
                    "
                  />
                </q-popup-edit>
              </q-td>
              <q-td key="nwkId" :props="props" auto-width>
                <q-badge
                  :color="
                    !isValueValid(networkIdValidation, props.row.id)
                      ? 'red'
                      : 'primary'
                  "
                >
                  {{ networkId[props.row.id] }}
                </q-badge>
                <q-popup-edit dark dense>
                  <q-input
                    debounce="300"
                    type="text"
                    v-model="networkId[props.row.id]"
                    dark
                    dense
                    :error="!isValueValid(networkIdValidation, props.row.id)"
                    :error-message="
                      getValueErrorMessage(networkIdValidation, props.row.id)
                    "
                    @input="
                      handleEndpointChange(
                        props.row.id,
                        'networkId',
                        networkId[props.row.id]
                      )
                    "
                  />
                </q-popup-edit>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
      <div>
        <!-- this section is for buttons delete/copy/new endpoint  -->
        <p align="right">
          <q-btn
            color="primary"
            size="12px"
            label="Delete Endpoint"
            @click="deleteEpt(activeIndex)"
          />
          <q-btn
            color="primary"
            size="12px"
            label="Copy Endpoint"
            @click="copyEpt()"
            v-show="activeIndex.length > 0"
          />
          <q-btn
            color="primary"
            size="12px"
            label="New Endpoint"
            @click="newEptDialog = true"
          />
        </p>
      </div>
      <q-dialog v-model="newEptDialog">
        <q-card>
          <q-card-section>
            <div>
              <p style="text-align: center; font-size: 1vw;">New Endpoint</p>
            </div>
          </q-card-section>

          <q-card-section>
            <div>
              <q-form @submit="newEpt()" @reset="onReset" class="q-gutter-md">
                <q-input
                  filled
                  v-model="newEndpoint.newEptId"
                  label="Endpoint Id*"
                />
                <q-select
                  filled
                  v-model="newEndpoint.newEndpointType"
                  :options="Object.keys(endpointTypeName)"
                  :option-label="
                    (item) => (item === null ? '' : endpointTypeName[item])
                  "
                  label="Endpoint Type"
                />
                <q-input
                  filled
                  v-model="newEndpoint.newNetworkId"
                  label="Network Id"
                />
              </q-form>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn
              flat
              label="Create Endpoint"
              color="primary"
              v-close-popup
              @click="newEpt(newEndpoint)"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ZclEndpointConfig',
  mounted() {
    this.$serverOn('zcl-endpoint-response', (event, arg) => {
      switch (arg.action) {
        case 'c':
          console.log(arg.validationIssues)
          this.$store.dispatch('zap/addEndpoint', {
            id: arg.id,
            eptId: arg.eptId,
            endpointType: arg.endpointType,
            network: arg.nwkId,
            endpointIdValidationIssues: arg.validationIssues.endpointId,
            networkIdValidationIssues: arg.validationIssues.networkId,
          })
          break
        case 'd':
          this.activeIndex = []
          this.$store.dispatch('zap/deleteEndpoint', {
            id: arg.id,
          })
          break
        case 'u':
          console.log(arg.validationIssues)
          this.$store.dispatch('zap/updateEndpoint', {
            id: arg.endpointId,
            updatedKey: arg.updatedKey,
            updatedValue: arg.updatedValue,
            endpointIdValidationIssues: arg.validationIssues.endpointId,
            networkIdValidationIssues: arg.validationIssues.networkId,
          })
          break
        default:
          break
      }
    })
  },
  computed: {
    endpoints: {
      get() {
        return Object.keys(this.$store.state.zap.endpointView.endpointId).map(
          (endpointId) => {
            return {
              id: endpointId,
            }
          }
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
    endpointIdValidation: {
      get() {
        return this.$store.state.zap.endpointView.endpointIdValidationIssues
      },
    },
    networkIdValidation: {
      get() {
        return this.$store.state.zap.endpointView.networkIdValidationIssues
      },
    },
  },

  data() {
    return {
      pagination: {
        rowsPerPage: 0,
      },
      activeIndex: [],
      newEptDialog: [],
      newEndpoint: {
        newEndpointId: '',
        newEndpointType: '',
        newNetworkId: '',
      },
      columns: [
        {
          name: 'eptId',
          label: 'Endpoint ID',
          field: 'eptId',
          align: 'left',
          sortable: true,
        },
        {
          name: 'profileId',
          label: 'Profile Id',
          field: 'profileId',
          align: 'left',
          sortable: true,
        },
        {
          name: 'deviceId',
          align: 'left',
          label: 'Device Id',
          field: 'deviceId',
          sortable: true,
        },
        {
          name: 'version',
          align: 'left',
          label: 'Version',
          field: 'version',
          sortable: true,
        },
        {
          name: 'endpointType',
          align: 'left',
          label: 'Endpoint Type',
          field: 'endpointType',
          sortable: true,
        },
        {
          name: 'nwkId',
          align: 'left',
          label: 'Network Id',
          field: 'nwkId',
          sortable: true,
        },
      ],
    }
  },
  methods: {
    newEpt(newEndpoint) {
      let eptId = this.newEndpoint.newEptId
      let nwkId = this.newEndpoint.newNetworkId
      let endpointType = this.newEndpoint.newEndpointType

      this.$serverPost(`/endpoint`, {
        action: 'c',
        context: {
          eptId: eptId,
          nwkId: nwkId,
          endpointType: endpointType,
        },
      })
    },
    deleteEpt() {
      if (this.activeIndex.length > 0) {
        this.$serverPost('/endpoint', {
          action: 'd',
          context: {
            id: this.activeIndex[0].id,
          },
        })
      }
    },
    copyEpt() {
      this.$serverPost(`/endpoint`, {
        action: 'c',
        context: {
          nwkId: this.networkId[
            this.$store.state.zap.endpointView.selectedEndpoint
          ],
          eptId: this.endpointId[
            this.$store.state.zap.endpointView.selectedEndpoint
          ],
          endpointType: this.endpointType[
            this.$store.state.zap.endpointView.selectedEndpoint
          ],
        },
      })
    },
    setActiveIndex(index) {
      if (this.activeIndex.length === 1 && this.activeIndex[0] === index) {
        this.activeIndex = []
        this.$store.dispatch('zap/updateSelectedEndpoint', null)
      } else {
        this.activeIndex = [index]
        this.$store.dispatch('zap/updateSelectedEndpoint', index.id)
        this.$store.dispatch('zap/updateSelectedEndpointType', {
          endpointType: this.endpointType[index.id],
          deviceTypeRef: this.endpointDeviceTypeRef[
            this.endpointType[index.id]
          ],
        })
      }
    },
    getFormattedEndpointId(endpointRef) {
      return '0x' + this.endpointId[endpointRef].toString(16).padStart(4, '0')
    },
    handleEndpointChange(id, changeId, value) {
      this.$serverPost('/endpoint', {
        action: 'e',
        context: {
          id: id,
          updatedKey: changeId,
          value: value,
        },
      })
    },
    isValueValid(validationArray, id) {
      return validationArray[id] != null
        ? validationArray[id].length === 0
        : true
    },
    getValueErrorMessage(validationArray, id) {
      return validationArray[id] != null
        ? validationArray[id].reduce((validationIssueString, currentVal) => {
            return validationIssueString + '\n' + currentVal
          }, '')
        : ''
    },
  },
}
</script>

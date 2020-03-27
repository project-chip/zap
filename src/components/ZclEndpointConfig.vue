<template>
  <div class="bg-grey-10 text-white">
    <div>
      <q-btn color="primary" label="New Endpoint" @click="newEptDialog = true" />
      <q-btn color="primary" label="Delete Endpoint" @click="deleteEpt(activeIndex)" />
      <q-btn color="primary" label="Copy Endpoint" @click="copyEpt()" v-show="activeIndex.length>0" />

      <q-dialog v-model="newEptDialog">
        <q-card>
          <q-card-section>
            <div>
              New Endpoint
            </div>
          </q-card-section>

          <q-card-section>
            <div>
              <q-form @submit="newEpt()" @reset="onReset" class="q-gutter-md">
                <q-input filled v-model="newEndpoint.newEptId" label="Endpoint Id*"/>
                <q-select
                  filled
                  v-model="newEndpoint.newEndpointType"
                  :options="Object.keys(endpointTypeName)"
                  :option-label="(item) => item === null ? '' : endpointTypeName[item]"
                  label="Endpoint Type"
                />
                <q-input filled v-model="newEndpoint.newNetworkId" label="Network Id"/>
              </q-form>
            </div>
          </q-card-section>
          <q-card-actions align="right">
          <q-btn flat label="Create Endpoint" color="primary" v-close-popup @click="newEpt(newEndpoint)"/>
          <q-btn flat label="Cancel" color="primary" v-close-popup />
        </q-card-actions>
        </q-card>
      </q-dialog>

    </div>
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
        <q-tr :props="props" clickable @click="setActiveIndex(props.row)" dark>
          <q-td key="eptId" :props="props" auto-width>
            0x{{ endpointId[props.row.id].toString(16).padStart(4, "0") }}
          </q-td>
          <q-td key="profileId" :props="props" auto-width>
            {{ (deviceTypes[endpointDeviceTypeRef[endpointType[props.row.id]]] ? deviceTypes[endpointDeviceTypeRef[endpointType[props.row.id]]].profileId.toString(16) : "").padStart(4, "0") }}
          </q-td>
          <q-td key="deviceId" :props="props" auto-width>
            {{ (deviceTypes[endpointDeviceTypeRef[endpointType[props.row.id]]] ? deviceTypes[endpointDeviceTypeRef[endpointType[props.row.id]]].code.toString(16) : "").padStart(4, "0") }}
          </q-td>
          <q-td key="version" :props="props" auto-width>
            1
          </q-td>
          <q-td key="endpointType" :props="props" auto-width>
            {{ endpointTypeName[endpointType[props.row.id]] }}
          </q-td>
          <q-td key="nwkId" :props="props" auto-width>
            {{ networkId[props.row.id] }}
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
export default {
  name: 'ZclEndpointConfig',
  mounted () {
    this.$serverOn('zcl-endpoint-response', (event, arg) => {
      switch (arg.action) {
        case 'c':
          this.$store.dispatch('zap/addEndpoint', {
            id: arg.id,
            eptId: arg.eptId,
            endpointType: arg.endpointType,
            network: arg.nwkId
          })
          break
        case 'd':
          this.activeIndex = []
          this.$store.dispatch('zap/deleteEndpoint', {
            id: arg.id
          })
          break
        default:
          break
      }
    })
  },
  computed: {
    endpoints: {
      get () {
        return Object.keys(this.$store.state.zap.endpointView.endpointId).map(endpointId => {
          return {
            id: endpointId
          }
        })
      }
    },
    endpointId: {
      get () {
        return this.$store.state.zap.endpointView.endpointId
      }
    },
    endpointType: {
      get () {
        return this.$store.state.zap.endpointView.endpointType
      }
    },
    networkId: {
      get () {
        return this.$store.state.zap.endpointView.networkId
      }
    },
    endpointTypeName: {
      get () {
        return this.$store.state.zap.endpointTypeView.name
      }
    },
    deviceTypes: {
      get () {
        return this.$store.state.zap.zclDeviceTypes
      }
    },
    endpointDeviceTypeRef: {
      get () {
        return this.$store.state.zap.endpointTypeView.deviceTypeRef
      }
    },
    zclDeviceTypeOptions: {
      get () {
        return Object.keys(this.$store.state.zap.zclDeviceTypes).map(key => {
          return key
        })
      }
    }

  },

  data () {
    return {
      pagination: {
        rowsPerPage: 0
      },
      activeIndex: [],
      newEptDialog: [],
      newEndpoint: {
        newEndpointId: '',
        newEndpointType: '',
        newNetworkId: ''
      },
      columns: [
        {
          name: 'eptId',
          label: 'Endpoint ID',
          field: 'eptId',
          align: 'left',
          sortable: true
        },
        {
          name: 'profileId',
          label: 'Profile Id',
          field: 'profileId',
          align: 'left',
          sortable: true
        },
        {
          name: 'deviceId',
          align: 'left',
          label: 'Device Id',
          field: 'deviceId',
          sortable: true
        },
        {
          name: 'version',
          align: 'left',
          label: 'Version',
          field: 'version',
          sortable: true
        },
        {
          name: 'endpointType',
          align: 'left',
          label: 'Endpoint Type',
          field: 'endpointType',
          sortable: true
        },
        {
          name: 'nwkId',
          align: 'left',
          label: 'Network Id',
          field: 'nwkId',
          sortable: true
        }
      ]
    }
  },
  methods: {
    newEpt (newEndpoint) {
      let eptId = this.newEndpoint.newEptId
      let nwkId = this.newEndpoint.newNetworkId
      let endpointType = this.newEndpoint.newEndpointType

      this.$serverPost(`/endpoint`,
        {
          action: 'c',
          context: {
            eptId: eptId,
            nwkId: nwkId,
            endpointType: endpointType
          }
        }
      )
    },
    deleteEpt () {
      if (this.activeIndex.length > 0) {
        this.$serverPost('/endpoint', {
          action: 'd',
          context: {
            id: this.activeIndex[0].id
          }
        })
      }
    },
    copyEpt () {
      this.$serverPost(`/endpoint`, {
        action: 'c',
        context: {
          nwkId: this.networkId[this.$store.state.zap.endpointView.selectedEndpoint],
          eptId: this.endpointId[this.$store.state.zap.endpointView.selectedEndpoint],
          endpointType: this.endpointType[this.$store.state.zap.endpointView.selectedEndpoint]
        }
      })
    },
    setActiveIndex (index) {
      if (this.activeIndex.length === 1 && this.activeIndex[0] === index) {
        this.activeIndex = []
        this.$store.dispatch('zap/updateSelectedEndpoint', null)
      } else {
        this.activeIndex = [index]
        this.$store.dispatch('zap/updateSelectedEndpoint', index.id)
        this.$store.dispatch('zap/updateSelectedEndpointType', this.endpointType[index.id])
      }
    }
  }
}
</script>

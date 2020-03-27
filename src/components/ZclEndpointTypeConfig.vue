<template>
  <div>
      <div class="row">
        <font size="4">
        Endpoint Type Manager
        </font>
      </div>
    <div class="row">
      <q-btn color="primary" label="New Endpoint Type"  @click="newEptTypeDialog = true"/>
      <q-btn color="primary" label="Delete Endpoint Type"  @click="deleteEptType(selectedEndpointType)"/>
      <q-dialog v-model="newEptTypeDialog">
        <q-card>
          <q-card-section>
            <div>
              New Endpoint Type
            </div>
          </q-card-section>
          <q-card-section>
            <div>
              <q-form @submit="newEptType()" @reset="onReset" class="q-gutter-md">
                <q-input filled v-model="newEndpointType.name" label="Endpoint Type Name"/>
                <q-select
                  filled
                  v-model="newEndpointType.deviceTypeRef"
                  :options="zclDeviceTypeOptions"
                  :option-label="(item) => item === null ? '' : zclDeviceTypes[item].label"
                  label="ZCL Device Type"
                />
              </q-form>
            </div>
          </q-card-section>
          <q-card-actions align="right">
          <q-btn flat label="Create Endpoint Type" color="primary" v-close-popup @click="addEndpointType(newEndpointType)"/>
          <q-btn flat label="Cancel" color="primary" v-close-popup />
        </q-card-actions>
        </q-card>
      </q-dialog>
    </div>

  <div class="row">
      <div class="col">
        <q-select
          dark
          dense
          v-model="selectedEndpointType"
          :options="zclEndpointTypeOptions"
          :option-label="(item) => item === null ? '' : zclEndpointTypeName[item]"
          label="Endpoint Type Name"
          @input="setSelectedEndpointType($event)"
        />
      </div>
    </div>
      <div class="row">
      <div class="col">
        <q-select
          dark
          dense
          v-model="zclDeviceType"
          :options="zclDeviceTypeOptions"
          :option-label="(item) => item === null ? '' : zclDeviceTypes[item].label"
          label="ZCL Device Type"
          @input="setZclDeviceType($event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ZclEndpointTypeConfig',
  mounted () {
    this.$serverOn('zcl-item-list', (event, arg) => {
      if (arg.type === 'device_type') {
        this.$store.dispatch('zap/updateZclDeviceTypes', arg.data || [])

        var indexOnOff = -1
        var indexDoorLock = -1
        // We kick start everything by having automatically adding a centralized endpointType using the HA-onoff deviceType
        for (var x in this.zclDeviceTypes) {
          if (this.zclDeviceTypes[x]['label'] === 'HA-onoff') { indexOnOff = x }
          if (this.zclDeviceTypes[x]['label'] === 'HA-doorlock') { indexDoorLock = x }
        }
        let onOffEptType = {
          name: 'Centralized',
          deviceTypeRef: indexOnOff !== -1 ? indexOnOff : 1
        }

        let doorlockEptType = {
          name: 'Primary',
          deviceTypeRef: indexDoorLock !== -1 ? indexDoorLock : 1
        }
        this.addEndpointType(onOffEptType)
        this.addEndpointType(doorlockEptType)
      }
    })

    this.$serverOn('zcl-endpointType-response', (event, arg) => {
      switch (arg.action) {
        case 'c':
          this.$store.dispatch('zap/addEndpointType', {
            id: arg.id,
            name: arg.name,
            deviceTypeRef: arg.deviceTypeRef
          })
          break
        case 'd':
        // delete
          if (arg.successful) {
            this.$store.dispatch(`zap/removeEndpointType`, {
              id: arg.id
            })
          }
          break
        default:
          break
      }
    })

    this.$serverGet('/deviceType/all')
  },
  methods: {
    setZclDeviceType (value) {
      this.$store.dispatch('zap/setDeviceTypeReference', {
        endpointId: this.selectedEndpointType,
        deviceTypeRef: value
      })
    },
    addEndpointType (newEndpointType) {
      let name = newEndpointType.name
      let deviceTypeRef = newEndpointType.deviceTypeRef

      this.$serverPost(`/endpointType`,
        {
          action: 'c',
          context: {
            name: name,
            deviceTypeRef: deviceTypeRef
          }
        }
      )
    },
    setSelectedEndpointType (event) {
      this.$store.dispatch('zap/updateSelectedEndpointType', event)
    },
    deleteEptType (selectedEndpointType) {
      this.$serverPost(`/endpointType`, {
        action: 'd',
        context: {
          id: selectedEndpointType
        }
      })
    }
  },
  computed: {
    zclDeviceTypeOptions: {
      get () {
        return Object.keys(this.$store.state.zap.zclDeviceTypes).map(key => {
          return key
        })
      }
    },
    zclDeviceTypes: {
      get () {
        return this.$store.state.zap.zclDeviceTypes
      }
    },
    zclEndpointTypeName: {
      get () {
        return this.$store.state.zap.endpointTypeView.name
      }
    },
    zclDeviceType: {
      get () {
        return this.$store.state.zap.endpointTypeView.deviceTypeRef[this.selectedEndpointType]
      }
    },
    selectedEndpointType: {
      get () {
        return this.$store.state.zap.endpointTypeView.selectedEndpointType
      }
    },
    zclEndpointTypeOptions: {
      get () {
        return Object.keys(this.zclEndpointTypeName).map(key => {
          return key
        })
      }
    }
  },
  data () {
    return {
      item: {},
      newEndpointType: {
        name: '',
        deviceTypeRef: null },
      title: '',
      model: [],
      newEptTypeDialog: [],
      type: ''
    }
  }
}
</script>

<!-- Copyright (c) 2019 Silicon Labs. All rights reserved. -->

<template>
  <div class="q-pa-md bg-grey-10 text-white">
    <q-table
      title="Clusters"
      :data="items"
      :columns="columns"
      row-key="label"
      dense
      wrap-cells
      dark
      binary-state-sort
      :selected.sync="selected"
      :pagination.sync="pagination"
    >
      <template v-slot:body="props">
        <q-tr :props="props" clickable @click="getSingleEntity(props.row)" dark>
          <q-td key="client" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              :disable="selectedEndpointId == 0"
              v-model="selectionClient"
              keep-color
              :val="props.row.id"
              :color="handleColorSelection(selectionClient, recommendedClients, props.row.id)"
              indeterminate-value="false"
              @input="handleClusterSelection(props.row.id, true)"
            />
          </q-td>
          <q-td key="server" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              keep-color
              :disable="selectedEndpointId.length == 0"
              v-model="selectionServer"
              :val="props.row.id"
              indeterminate-value="false"
              :color="handleColorSelection(selectionServer, recommendedServers, props.row.id)"
              @input="handleClusterSelection(props.row.id, false)"
            />
          </q-td>
          <q-td key="code" :props="props" auto-width>
            {{ props.row.code }}
          </q-td>
          <q-td key="manufacturerCode" :props="props" auto-width>
            {{ props.row.manufacturerCode }}
          </q-td>
          <q-td key="label" :props="props" auto-width>
            {{ props.row.label }}
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>
<script>
export default {
  name: 'ZclClusterist',
  computed: {
    items: {
      get () {
        return this.$store.state.zap.clusters
      }
    },
    selected: {
      get () {
        return this.$store.state.zap.clustersView.selected
      }
    },
    selectionClient: {
      get () {
        return this.$store.state.zap.clustersView.selectedClients
      },
      set (val) {}
    },
    selectionServer: {
      get () {
        return this.$store.state.zap.clustersView.selectedServers
      },
      set (val) {}
    },
    selectedEndpointId: {
      get () {
        return this.$store.state.zap.endpointTypeView.selectedEndpointType
      }
    },
    recommendedClients: {
      get () {
        return this.$store.state.zap.clustersView.recommendedClients
      }
    },
    recommendedServers: {
      get () {
        return this.$store.state.zap.clustersView.recommendedServers
      }
    }
  },

  methods: {
    getSingleEntity (id) {
      this.$serverGet(`/${this.type}/${id.id}`)
      this.$store.dispatch('zap/updateSelectedCluster', [id])
    },
    handleClusterSelection (id, isClient) {
      var clusterList = isClient ? this.selectionClient : this.selectionServer
      var indexOfValue = clusterList.indexOf(id)
      var addedValue = false
      if (indexOfValue === -1) {
        addedValue = true
      } else {
        addedValue = false
      }
      if (isClient) {
        this.$store.dispatch('zap/updateSelectedClients', { endpointTypeId: this.selectedEndpointId, id: id, added: addedValue, listType: 'selectedClients', view: 'clustersView' })
      } else {
        this.$store.dispatch('zap/updateSelectedServers', { endpointTypeId: this.selectedEndpointId, id: id, added: addedValue, listType: 'selectedServers', view: 'clustersView' })
      }
    },
    handleColorSelection (selectedList, recommendedList, id) {
      if (recommendedList.includes(id)) {
        if (selectedList.includes(id)) return 'green'
        else return 'red'
      }
      return 'primary'
    }
  },

  mounted () {
    this.$serverOn('zcl-item-list', (event, arg) => {
      this.title = arg.title
      this.type = arg.type
    })
    this.$serverOn('zcl-item', (event, arg) => {
      if (arg.type === 'endpointTypeClusters') {
        this.$store.dispatch('zap/setClusterList', arg.data)
      }
      if (arg.type === `deviceTypeClusters`) {
        this.$store.dispatch('zap/setRecommendedClusterList', arg.data)
      }
    })
  },
  data () {
    return {
      title: 'unknown',
      type: 'unknown',
      selection: [],
      pagination: {
        rowsPerPage: 0
      },
      columns: [
        {
          name: 'client',
          label: 'Client',
          field: 'client',
          align: 'left',
          sortable: true
        },
        {
          name: 'server',
          label: 'Server',
          field: 'server',
          align: 'left',
          sortable: true
        },
        {
          name: 'code',
          align: 'left',
          label: 'Cluster Code',
          field: 'code',
          sortable: true
        },
        {
          name: 'manufacturerCode',
          align: 'left',
          label: 'Manufacturer Code',
          field: 'manufacturerCode',
          sortable: true
        },
        {
          name: 'label',
          align: 'left',
          label: 'Name',
          field: 'label',
          sortable: true
        }
      ]
    }
  }
}
</script>

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
              v-model="selectionClient"
              :val="props.row.id"
              indeterminate-value="false"
              @input="handleClusterSelection(props.row.id, true)"
            />
          </q-td>
          <q-td key="server" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              v-model="selectionServer"
              :val="props.row.id"
              indeterminate-value="false"
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
        this.$store.dispatch('zap/updateSelectedClients', { id: id, added: addedValue, listType: 'selectedClients', view: 'clustersView' })
      } else {
        this.$store.dispatch('zap/updateSelectedServers', { id: id, added: addedValue, listType: 'selectedServers', view: 'clustersView' })
      }
    }
  },

  mounted () {
    this.$serverOn('zcl-item-list', (event, arg) => {
      this.title = arg.title
      this.type = arg.type
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

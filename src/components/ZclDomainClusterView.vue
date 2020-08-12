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
    <q-table
      :data="clusters"
      :columns="columns"
      :rows-per-page-options="[0]"
      hide-pagination
      row-key="code"
      flat
      square
      bordered
      :table-header-style="{ backgroundColor: '#cccccc' }"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="label" :props="props" auto-width>
            {{ props.row.label }}
          </q-td>
          <q-td key="requiredCluster" :props="props">
            {{ isClusterRequired(props.row.id) }}
          </q-td>
          <q-td key="clusterId" :props="props">
            {{ props.row.code }}
          </q-td>
          <q-td key="manufacturerId" :props="props">
            {{
              props.row.manufacturerCode ? props.row.manufacturerCode : '---'
            }}
          </q-td>
          <q-td key="options" :props="props">
            <q-select
              :v-model="getClusterEnabledStatus(props.row.id)"
              :display-value="`${getClusterEnabledStatus(props.row.id)}`"
              :options="clusterSelectionOptions"
              dense
              outlined
              @input="handleClusterSelection(props.row.id, $event)"
            />
          </q-td>
          <q-td key="configure" :props="props">
            <q-btn
              flat
              :color="isClusterEnabled(props.row.id) ? 'primary' : 'grey'"
              dense
              :disable="!isClusterEnabled(props.row.id)"
              icon="settings"
              to="/cluster"
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>
<script>
export default {
  name: 'ZclDomainClusterView',
  props: ['domainName', 'clusters'],
  computed: {
    recommendedClients: {
      get() {
        return this.$store.state.zap.clustersView.recommendedClients
      },
    },
    recommendedServers: {
      get() {
        return this.$store.state.zap.clustersView.recommendedServers
      },
    },
    selectionClients: {
      get() {
        return this.$store.state.zap.clustersView.selectedClients
      },
      set(val) {},
    },
    selectionServers: {
      get() {
        return this.$store.state.zap.clustersView.selectedServers
      },
      set(val) {},
    },
    selectedEndpointTypeId: {
      get() {
        return this.$store.state.zap.endpointTypeView.selectedEndpointType
      },
    },
  },
  methods: {
    isClusterRequired(id) {
      let clientRequired = this.recommendedClients.includes(id)
      let serverRequired = this.recommendedServers.includes(id)
      if (clientRequired && serverRequired) return 'Client & Server'
      if (clientRequired) return 'Client'
      if (serverRequired) return 'Server'
      return ''
    },
    isClusterEnabled(id) {
      return (
        this.selectionClients.includes(id) || this.selectionServers.includes(id)
      )
    },
    getClusterEnabledStatus(id) {
      let hasClient = this.selectionClients.includes(id)
      let hasServer = this.selectionServers.includes(id)
      if (hasClient && hasServer) return 'Client & Server'
      if (hasClient) return 'Client'
      if (hasServer) return 'Server'
      return '---'
    },

    handleClusterSelection(id, event) {
      let clientSelected = event.client
      let serverSelected = event.server

      this.$store.dispatch('zap/updateSelectedClients', {
        endpointTypeId: this.selectedEndpointTypeId,
        id: id,
        added: clientSelected,
        listType: 'selectedClients',
        view: 'clustersView',
      })

      this.$store.dispatch('zap/updateSelectedServers', {
        endpointTypeId: this.selectedEndpointTypeId,
        id: id,
        added: serverSelected,
        listType: 'selectedServers',
        view: 'clustersView',
      })
    },
  },
  data() {
    return {
      clusterSelectionOptions: [
        { label: '---', client: false, server: false },
        { label: 'Client', client: true, server: false },
        { label: 'Server', client: false, server: true },
        { label: 'Client & Server', client: true, server: true },
      ],
      columns: [
        {
          name: 'label',
          requiried: true,
          label: 'Cluster',
          align: 'left',
          field: (row) => row.label,
          style: 'width:30%',
        },
        {
          name: 'requiredCluster',
          requiried: true,
          label: 'Required Cluster',
          align: 'center',
          field: (row) => this.isClusterRequired(row.id),
          style: 'width:20%',
        },
        {
          name: 'clusterId',
          requiried: false,
          label: 'Cluster Id',
          align: 'left',
          field: (row) => row.code,
          style: 'width:10%',
        },
        {
          name: 'manufacturerId',
          requiried: false,
          label: 'Manufacturer ID',
          align: 'left',
          field: (row) => (row.manufacturerCode ? row.manufacturerCode : '---'),
          style: 'width:10%',
        },
        {
          name: 'options',
          requiried: false,
          label: 'Options',
          align: 'left',
          field: (row) => 'test',
          style: 'width:20%',
        },
        {
          name: 'configure',
          required: true,
          label: 'Configure',
          align: 'center',
          style: 'width: 10%',
        },
      ],
    }
  },
}
</script>

<!-- Notice lang="scss" -->
<style lang="scss">
.bar {
  background-color: $grey-4;
  padding: 15px 15px 15px 15px;
}
</style>

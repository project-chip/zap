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
    <!-- <q-btn label="hide calories" @click="toggleStatus" /> -->
    <q-table
      :data="clusters"
      :columns="columns"
      :visible-columns="visibleColumns"
      :rows-per-page-options="[0]"
      hide-pagination
      row-key="id"
      flat
      square
      bordered
      :table-header-style="{ backgroundColor: '#cccccc' }"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="status" :props="props" class="q-px-none">
            <q-icon
              name="warning"
              class="text-amber"
              style="font-size: 1.5rem"
              @click="selectCluster(props.row)"
            ></q-icon>
            <q-popup-edit
              :cover="false"
              :offset="[0, -54]"
              v-model="uc_label"
              content-class="bg-white text-black"
              style="overflow-wrap: break-word; padding: 0px"
            >
              <div class="row items-center" items-center style="padding: 0px">
                <q-icon
                  name="warning"
                  class="text-amber q-mr-sm"
                  style="font-size: 1.5rem"
                ></q-icon>
                <div class="vertical-middle text-subtitle1">
                  Clusters not installed
                </div>
              </div>
              <div class="row no-wrap">
                Install cluster in universal components<br />
                to continue endpoint configuration.
              </div>
              <div class="row justify-end">
                <q-btn unelevated text-color="primary">Install</q-btn>
              </div>
            </q-popup-edit>
          </q-td>
          <q-td key="label" :props="props" auto-width>
            {{ props.row.label }}
          </q-td>
          <q-td key="requiredCluster" :props="props">
            {{ isClusterRequired(props.row.id) }}
          </q-td>
          <q-td key="clusterId" :props="props">
            {{ asHex(props.row.code, 4) }}
          </q-td>
          <q-td key="manufacturerId" :props="props">
            {{
              props.row.manufacturerCode
                ? asHex(props.row.manufacturerCode, 4)
                : '---'
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
              @click="selectCluster(props.row)"
              to="/cluster"
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>
<script>
import CommonMixin from '../util/common-mixin'

export default {
  name: 'ZclDomainClusterView',
  props: ['domainName', 'clusters'],
  mixins: [CommonMixin],
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
    visibleColumns: function () {
      let names = this.columns.map((x) => x.name)

      // show/hide 'status' column depending on this.showStatus
      let statusColumn = 'status'
      let statusShown = names.indexOf(statusColumn) > -1
      if (this.showStatus && !statusShown) {
        names.push(statusColumn)
      } else if (!this.showStatus && statusShown) {
        let i = names.indexOf(statusColumn)
        names.splice(i, 1)
      }
      return names
    },
  },
  methods: {
    toggleStatus: function () {
      this.showStatus = !this.showStatus
    },
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

      this.$store
        .dispatch('zap/updateSelectedClients', {
          endpointTypeId: this.selectedEndpointTypeId,
          id: id,
          added: clientSelected,
          listType: 'selectedClients',
          view: 'clustersView',
        })
        .then(() =>
          this.$store.dispatch('zap/updateSelectedServers', {
            clusterId: this.selectedClusterId,
            endpointTypeId: this.selectedEndpointTypeId,
            id: id,
            added: serverSelected,
            listType: 'selectedServers',
            view: 'clustersView',
          })
        )

      // NOTE: only turn on components when cluster is selected.
      let side = []
      if (clientSelected) {
        side.push('client')
      }
      if (serverSelected) {
        side.push('server')
      }

      this.updateSelectedComponentRequest({
        clusterId: id,
        side: side,
        added: true,
      })
    },
    selectCluster(cluster) {
      this.$store
        .dispatch('zap/updateSelectedCluster', cluster)
        .then(
          this.$store.dispatch(
            'zap/refreshEndpointTypeCluster',
            this.selectedEndpointTypeId
          )
        )
    },
  },
  data() {
    return {
      uc_label: 'uc label',
      clusterSelectionOptions: [
        { label: '---', client: false, server: false },
        { label: 'Client', client: true, server: false },
        { label: 'Server', client: false, server: true },
        { label: 'Client & Server', client: true, server: true },
      ],
      showStatus: false,
      columns: [
        {
          name: 'status',
          required: false,
          label: '',
          align: 'left',
          field: (row) => row.code,
          style: 'width: 100px;padding-left: 10px;padding-right: 0px;',
        },
        {
          name: 'label',
          required: true,
          label: 'Cluster',
          align: 'left',
          field: (row) => row.label,
          style: 'width:28%',
        },
        {
          name: 'requiredCluster',
          required: true,
          label: 'Required Cluster',
          align: 'center',
          field: (row) => this.isClusterRequired(row.id),
          style: 'width:20%',
        },
        {
          name: 'clusterId',
          required: false,
          label: 'Cluster Id',
          align: 'left',
          field: (row) => row.code,
          style: 'width:10%',
        },
        {
          name: 'manufacturerId',
          required: false,
          label: 'Manufacturer ID',
          align: 'left',
          field: (row) => (row.manufacturerCode ? row.manufacturerCode : '---'),
          style: 'width:10%',
        },
        {
          name: 'options',
          required: false,
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

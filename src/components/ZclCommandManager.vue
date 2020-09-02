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
  <div v-show="commandData.length > 0">
    <q-table
      :data="commandData"
      :columns="columns"
      row-key="<b>name</b>"
      dense
      flat
      binary-state-sort
      :pagination.sync="pagination"
    >
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
            style="background: #eeeeee;"
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props" style="">
          <q-td key="in" :props="props" auto-width>
            <q-checkbox
              class="q-mt-xs"
              v-model="selectionIn"
              :val="hashCommandIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              keep-color
              @input="
                handleCommandSelection(
                  selectionIn,
                  'selectedIn',
                  props.row,
                  selectedCluster.id
                )
              "
            />
          </q-td>
          <q-td key="out" :props="props" auto-width>
            <q-checkbox
              class="q-mt-xs"
              v-model="selectionOut"
              :val="hashCommandIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              keep-color
              @input="
                handleCommandSelection(
                  selectionOut,
                  'selectedOut',
                  props.row,
                  selectedCluster.id
                )
              "
            />
          </q-td>
          <q-td key="direction" :props="props" auto-width>{{
            props.row.source === 'client' ? 'C ➞ S' : 'S ➞ C'
          }}</q-td>
          <q-td key="commandId" :props="props" auto-width>{{
            props.row.code
          }}</q-td>
          <q-td key="commandName" :props="props" auto-width>{{
            props.row.label
          }}</q-td>
          <q-td key="required" :props="props" auto-width>
            {{ isCommandRequired(props.row) ? 'Yes' : '' }}
          </q-td>
          <q-td key="mfgId" :props="props" auto-width
            >{{
              selectedCluster.manufacturerCode
                ? selectedCluster.manufacturerCode
                : props.row.manufacturerCode
                ? props.row.manufacturerCode
                : '-'
            }}
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
import * as Util from '../util/util.js'
import * as RestApi from '../../src-shared/rest-api'

export default {
  name: 'ZclCommandManager',
  computed: {
    commandData: {
      get() {
        return this.$store.state.zap.commands
      },
    },
    selectionIn: {
      get() {
        return this.$store.state.zap.commandView.selectedIn
      },
    },
    selectionOut: {
      get() {
        return this.$store.state.zap.commandView.selectedOut
      },
    },
    selectedEndpointId: {
      get() {
        return this.$store.state.zap.endpointTypeView.selectedEndpointType
      },
    },
    requiredCommands: {
      get() {
        return this.$store.state.zap.commandView.requiredCommands
      },
    },
    selectionClusterClient: {
      get() {
        return this.$store.state.zap.clustersView.selectedClients
      },
    },
    selectionClusterServer: {
      get() {
        return this.$store.state.zap.clustersView.selectedServers
      },
    },
    selectedCluster: {
      get() {
        return this.$store.state.zap.clustersView.selected[0] || {}
      },
    },
  },
  methods: {
    handleCommandSelection(list, listType, commandData, clusterId) {
      // We determine the ID that we need to toggle within the list.
      // This ID comes from hashing the base Command ID and cluster data.

      var indexOfValue = list.indexOf(
        this.hashCommandIdClusterId(commandData.id, clusterId)
      )

      var addedValue = false
      if (indexOfValue === -1) {
        addedValue = true
      } else {
        addedValue = false
      }
      let editContext = {
        action: 'boolean',
        endpointTypeId: this.selectedEndpointId,
        id: commandData.id,
        value: addedValue,
        listType: listType,
        clusterRef: clusterId,
        commandSide: commandData.source,
      }
      this.$store.dispatch('zap/updateSelectedCommands', editContext)
    },
    isCommandRequired(command) {
      return this.requiredCommands.includes(command.id) || !command.isOptional
    },
    hashCommandIdClusterId(commandId, clusterId) {
      return Util.cantorPair(commandId, clusterId)
    },
  },
  data() {
    return {
      pagination: {
        rowsPerPage: 0,
      },
      columns: [
        {
          name: 'in',
          label: 'In',
          field: 'in',
          align: 'left',
          sortable: true,
          style: 'width:1%',
        },
        {
          name: 'out',
          label: 'Out',
          field: 'out',
          align: 'left',
          sortable: true,
          style: 'width:1%',
        },
        {
          name: 'direction',
          label: 'Direction',
          field: 'direction',
          align: 'left',
          sortable: true,
          style: 'width:1%',
        },
        {
          name: 'commandId',
          align: 'left',
          label: 'ID',
          field: 'commandId',
          sortable: true,
          style: 'width:1%',
        },
        {
          name: 'commandName',
          align: 'left',
          label: 'Command',
          field: 'commandName',
          sortable: true,
          style: 'width:20%',
        },
        {
          name: 'required',
          align: 'left',
          label: 'Required',
          field: 'required',
          sortable: true,
          style: 'width:10%',
        },
        {
          name: 'mfgId',
          align: 'left',
          label: 'Manufacturing Id',
          field: 'mfgId',
          sortable: true,
          style: 'width:10%',
        },
      ],
    }
  },
}
</script>

<style scoped>
tr:nth-child(even) {
  background-color: #dddddd;
}
th {
  background-color: #dddddd;
}
</style>

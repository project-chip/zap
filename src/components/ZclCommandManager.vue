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
      class="my-sticky-header-table"
      :data="commandData"
      :columns="columns"
      row-key="<b>name</b>"
      dense
      virtual-scroll
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
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="out" :props="props" auto-width>
            <q-checkbox
              class="q-mt-xs"
              v-model="selectionOut"
              :val="hashCommandIdClusterId(props.row.id, selectedCluster.id)"
              v-show="
                (selectionClients.includes(selectedCluster.id) &&
                  props.row.source == 'client') ||
                (selectionServers.includes(selectedCluster.id) &&
                  props.row.source == 'server')
              "
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
          <q-td key="in" :props="props" auto-width>
            <q-checkbox
              class="q-mt-xs"
              v-model="selectionIn"
              :val="hashCommandIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              keep-color
              v-show="
                (selectionServers.includes(selectedCluster.id) &&
                  props.row.source == 'client') ||
                (selectionClients.includes(selectedCluster.id) &&
                  props.row.source == 'server')
              "
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
          <q-td key="direction" :props="props" auto-width>{{
            props.row.source === 'client'
              ? 'Client ➞ Server'
              : 'Server ➞ Client'
          }}</q-td>
          <q-td key="commandId" :props="props" auto-width>{{
            asHex(props.row.code, 2)
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
                ? asHex(selectedCluster.manufacturerCode, 4)
                : props.row.manufacturerCode
                ? asHex(props.row.manufacturerCode, 4)
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
import EditableAttributesMixin from '../util/editable-attributes-mixin.js'

export default {
  name: 'ZclCommandManager',
  mixins: [EditableAttributesMixin],
  computed: {
    commandData: {
      get() {
        return this.$store.state.zap.commands.filter((command) => {
          return this.individualClusterFilterString == ''
            ? true
            : command.name
                .toLowerCase()
                .includes(this.individualClusterFilterString.toLowerCase())
        })
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
    requiredCommands: {
      get() {
        return this.$store.state.zap.commandView.requiredCommands
      },
    },
  },
  methods: {
    handleCommandSelection(list, listType, commandData, clusterId) {
      // We determine the ID that we need to toggle within the list.
      // This ID comes from hashing the base Command ID and cluster data.
      let indexOfValue = list.indexOf(
        this.hashCommandIdClusterId(commandData.id, clusterId)
      )

      let addedValue
      if (indexOfValue === -1) {
        addedValue = true
      } else {
        addedValue = false
      }
      let editContext = {
        action: 'boolean',
        endpointTypeId: this.selectedEndpointTypeId,
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
          name: 'out',
          label: 'Out',
          field: 'out',
          align: 'left',
          sortable: true,
          style: 'width:1%',
        },
        {
          name: 'in',
          label: 'In',
          field: 'in',
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

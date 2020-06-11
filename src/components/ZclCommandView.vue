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
      title="Commands"
      :data="commandData"
      :columns="columns"
      row-key="name"
      dense
      wrap-cells
      dark
      binary-state-sort
      :pagination.sync="pagination"
    >
      <template v-slot:body="props">
        <q-tr :props="props" dark>
          <q-td key="out" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              v-model="selectionOut"
              :val="hashCommandIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              keep-color
              :color="
                handleColorSelection(
                  selectionOut,
                  requiredCommands,
                  props.row,
                  selectedCluster.id
                )
              "
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
              dark
              class="q-mt-xs"
              v-model="selectionIn"
              :val="hashCommandIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              keep-color
              :color="'primary'"
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
            props.row.source === 'client' ? 'C ➞ S' : 'S ➞ C'
          }}</q-td>
          <q-td key="opt" :props="props" auto-width>{{
            props.row.isOptional
          }}</q-td>
          <q-td key="commandName" :props="props" auto-width>{{
            props.row.label
          }}</q-td>
          <q-td key="commandId" :props="props" auto-width>{{
            props.row.code
          }}</q-td>
          <q-td key="mfgId" :props="props" auto-width>{{
            props.row.manufacturerCode
          }}</q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
import * as Util from '../util/util.js'
import * as RestApi from '../../src-shared/rest-api'

export default {
  name: 'ZclCommandView',
  mounted() {
    this.$serverOn('zcl-item', (event, arg) => {
      if (arg.type === 'cluster') {
        this.$store.dispatch('zap/updateCommands', arg.commandData || [])
      }
      if (arg.type === 'endpointTypeCommands') {
        this.$store.dispatch('zap/setCommandStateLists', arg.data)
      }
      if (arg.type === 'deviceTypeCommands') {
        this.$store.dispatch('zap/setRequiredCommands', arg.data)
      }
    })
    this.$serverOn(RestApi.replyId.singleCommandState, (event, arg) => {
      if (arg.action === 'boolean') {
        this.$store.dispatch('zap/updateSelectedCommands', {
          id: this.hashCommandIdClusterId(arg.id, arg.clusterRef),
          added: arg.added,
          listType: arg.listType,
          view: 'commandView',
        })
      }
    })
  },
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

      this.$serverPost(`/command/update`, {
        action: 'boolean',
        endpointTypeId: this.selectedEndpointId,
        id: commandData.id,
        value: addedValue,
        listType: listType,
        clusterRef: clusterId,
        commandSide: commandData.source,
      })
    },
    handleColorSelection(selectedList, recommendedList, command, clusterId) {
      let relevantClusterList =
        command.source === 'client'
          ? this.selectionClusterClient
          : this.selectionClusterServer

      let isClusterIncluded = relevantClusterList.includes(clusterId)
      let isCommandRecommended =
        recommendedList.includes(command.id) || !command.isOptional
      let isCommandIncluded = selectedList.includes(
        this.hashCommandIdClusterId(command.id, clusterId)
      )

      if (isCommandRecommended && isCommandIncluded && isClusterIncluded) {
        return 'green'
      } else if (
        isCommandRecommended &&
        !isCommandIncluded &&
        isClusterIncluded
      ) {
        return 'red'
      } else if (
        isCommandRecommended &&
        isCommandIncluded &&
        !isClusterIncluded
      ) {
        return 'orange'
      } else {
        return 'primary'
      }
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
        },
        {
          name: 'in',
          label: 'In',
          field: 'in',
          align: 'left',
          sortable: true,
        },
        {
          name: 'direction',
          label: 'Direction',
          field: 'direction',
          align: 'left',
          sortable: true,
        },
        {
          name: 'opt',
          align: 'left',
          label: 'Opt',
          field: 'opt',
          sortable: true,
        },
        {
          name: 'commandName',
          align: 'left',
          label: 'Command Name',
          field: 'commandName',
          sortable: true,
        },
        {
          name: 'commandId',
          align: 'left',
          label: 'Command ID',
          field: 'commandId',
          sortable: true,
        },
        {
          name: 'mfgId',
          align: 'left',
          label: 'Manufacturing Id',
          field: 'mfgId',
          sortable: true,
        },
      ],
    }
  },
}
</script>

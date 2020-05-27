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
              :val="props.row.id"
              indeterminate-value="false"
              keep-color
              :color="
                handleColorSelection(
                  selectionOut,
                  requiredCommands,
                  props.row.id
                )
              "
              @input="
                handleCommandSelection(
                  props.row.id,
                  selectionOut,
                  'selectedOut'
                )
              "
            />
          </q-td>
          <q-td key="in" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              v-model="selectionIn"
              :val="props.row.id"
              indeterminate-value="false"
              keep-color
              :color="handleColorSelection(selectionOut, [], props.row.id)"
              @input="
                handleCommandSelection(props.row.id, selectionIn, 'selectedIn')
              "
            />
          </q-td>
          <q-td key="direction" :props="props" auto-width>
            {{ props.row.source }}
          </q-td>
          <q-td key="opt" :props="props" auto-width>
            {{ props.row.isOptional }}
          </q-td>
          <q-td key="commandName" :props="props" auto-width>
            {{ props.row.label }}
          </q-td>
          <q-td key="commandId" :props="props" auto-width>
            {{ props.row.code }}
          </q-td>
          <q-td key="mfgId" :props="props" auto-width>
            {{ props.row.manufacturerCode }}
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
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
    this.$serverOn('singleCommandState', (event, arg) => {
      if (arg.action === 'boolean') {
        this.$store.dispatch('zap/updateSelectedCommands', {
          id: arg.id,
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
  },
  methods: {
    handleCommandSelection(id, list, listType) {
      var indexOfValue = list.indexOf(id)
      var addedValue = false
      if (indexOfValue === -1) {
        addedValue = true
      } else {
        addedValue = false
      }
      this.$serverPost(`/command/update`, {
        action: 'boolean',
        endpointTypeId: this.selectedEndpointId,
        id: id,
        value: addedValue,
        listType: listType,
      })
      // this.$store.dispatch('zap/updateSelectedCommands', {
      //   id: id,
      //   added: addedValue,
      //   listType: listType,
      //   view: 'commandView'
      // })
    },
    handleColorSelection(selectedList, recommendedList, id) {
      if (recommendedList.includes(id)) {
        if (selectedList.includes(id)) return 'green'
        else return 'red'
      }
      return 'primary'
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

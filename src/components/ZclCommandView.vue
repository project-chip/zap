<!-- Copyright (c) 2019 Silicon Labs. All rights reserved. -->
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
              v-model="selectionIn"
              :val="props.row.id"
              indeterminate-value="false"
              @input="handleCommandSelection(props.row.id, selectionIn,'selectedIn')"

            />
          </q-td>
          <q-td key="in" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              v-model="selectionOut"
              :val="props.row.id"
              indeterminate-value="false"
              @input="handleCommandSelection(props.row.id, selectionOut,'selectedOut')"

            />
          </q-td>
          <q-td key="direction" :props="props" auto-width>
            {{props.row.source}}
          </q-td>
          <q-td key="opt" :props="props" auto-width>
            {{props.row.isOptional}}
          </q-td>
          <q-td key="commandName" :props="props" auto-width>
            {{ props.row.label }}
          </q-td>
          <q-td key="commandId" :props="props" auto-width>
            {{ props.row.code }}
          </q-td>
          <q-td key="mfgId" :props="props" auto-width>
            {{ props.row.manufacturerCode}}
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
export default {
  name: 'ZclCommandView',
  mounted () {
    this.$serverOn('zcl-item', (event, arg) => {
      if (arg.type === 'cluster') {
        this.$store.dispatch('zap/updateCommands', arg.commandData || [])
      }
    })
  },
  computed: {
    commandData: {
      get () {
        return this.$store.state.zap.commands
      }
    },
    selectionIn: {
      get () {
        return this.$store.state.zap.commandView.selectedIn
      }
    },
    selectionOut: {
      get () {
        return this.$store.state.zap.commandView.selectedOut
      }
    }
  },
  methods: {
    handleCommandSelection (id, list, listType) {
      var indexOfValue = list.indexOf(id)
      var addedValue = false
      if (indexOfValue === -1) {
        addedValue = true
      } else {
        addedValue = false
      }
      this.$store.dispatch('zap/updateSelectedCommands', {
        id: id,
        added: addedValue,
        listType: listType,
        view: 'commandView'
      })
    }
  },
  data () {
    return {
      pagination: {
        rowsPerPage: 0
      },
      columns: [
        {
          name: 'out',
          label: 'Out',
          field: 'out',
          align: 'left',
          sortable: true
        },
        {
          name: 'in',
          label: 'In',
          field: 'in',
          align: 'left',
          sortable: true
        },
        {
          name: 'direction',
          label: 'Direction',
          field: 'direction',
          align: 'left',
          sortable: true
        },
        {
          name: 'opt',
          align: 'left',
          label: 'Opt',
          field: 'opt',
          sortable: true
        },
        {
          name: 'commandName',
          align: 'left',
          label: 'Command Name',
          field: 'commandName',
          sortable: true
        },
        {
          name: 'commandId',
          align: 'left',
          label: 'Command ID',
          field: 'commandId',
          sortable: true
        },
        {
          name: 'mfgId',
          align: 'left',
          label: 'Manufacturing Id',
          field: 'mfgId',
          sortable: true
        }
      ]
    }
  }
}
</script>

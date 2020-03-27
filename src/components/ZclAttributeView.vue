<!-- Copyright (c) 2019 Silicon Labs. All rights reserved. -->
<template>
  <div v-show="attributeData.length > 0">
    <q-table
      title="Attributes"
      :data.sync="attributeData"
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
          <q-td key="included" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              v-model="selection"
              :val="props.row.id"
              indeterminate-value="false"
              @input="handleAttributeSelection(props.row.id, selection, 'selectedAttributes')"
            />
          </q-td>
          <q-td key="clientServer" :props="props" auto-width>
            {{props.row.side}}
          </q-td>
          <q-td key="attrName" :props="props" auto-width>
            {{ props.row.label }}
          </q-td>
          <q-td key="attrID" :props="props" auto-width>
            {{ props.row.code }}
          </q-td>
          <q-td key="mfgID" :props="props" auto-width>
            {{ props.row.manufacturerCode}}
          </q-td>

          <q-td key="external" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              v-model="selectionExternal"
              :val="props.row.id"
              indeterminate-value="false"
              @input="handleAttributeSelection(props.row.id, selectionExternal,'selectedExternal')"
            />
          </q-td>

          <q-td key="flash" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              v-model="selectionFlash"
              :val="props.row.id"
              indeterminate-value="false"
              @input="handleAttributeSelection(props.row.id, selectionFlash,'selectedFlash')"
            />
          </q-td>
          <q-td key="flash" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              v-model="selectionSingleton"
              :val="props.row.id"
              indeterminate-value="false"
              @input="handleAttributeSelection(props.row.id, selectionSingleton,'selectedSingleton')"

            />
          </q-td>

          <q-td key="type" :props="props" auto-width>
            {{ props.row.type }}
          </q-td>
          <q-td key="bounded" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              v-model="selectionBounded"
              :val="props.row.id"
              indeterminate-value="false"
              @input="handleAttributeSelection(props.row.id, selectionBounded,'selectedBounded')"

            />
          </q-td>
          <q-td key="default" :props="props" auto-width>
            <q-input v-model="selectionDefault[props.row.id]" dark dense @input="handleAttributeDefaultChange(props.row.id, selectionDefault[props.row.id])"/>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
export default {
  name: 'ZclAttributeView',
  mounted () {
    this.$serverOn('zcl-item', (event, arg) => {
      if (arg.type === 'cluster') {
        this.$store.dispatch('zap/updateAttributes', arg.attributeData || [])
      }
    })
  },
  methods: {
    handleAttributeSelection (id, list, listType) {
      var indexOfValue = list.indexOf(id)
      var addedValue = false
      if (indexOfValue === -1) {
        addedValue = true
      } else {
        addedValue = false
      }
      this.$store.dispatch('zap/updateSelectedAttributes', {
        id: id,
        added: addedValue,
        listType: listType,
        view: 'attributeView'
      })
    },
    handleAttributeDefaultChange (id, newValue) {
      this.$store.dispatch('zap/updateAttributeDefaults', {
        id: id,
        newDefaultValue: newValue
      })
    }
  },

  computed: {
    attributeData: {
      get () {
        return this.$store.state.zap.attributes
      }
    },
    selection: {
      get () {
        return this.$store.state.zap.attributeView.selectedAttributes
      }
    },
    selectionExternal: {
      get () {
        return this.$store.state.zap.attributeView.selectedExternal
      }
    },
    selectionFlash: {
      get () {
        return this.$store.state.zap.attributeView.selectedFlash
      }
    },
    selectionSingleton: {
      get () {
        return this.$store.state.zap.attributeView.selectedSingleton
      }
    },
    selectionBounded: {
      get () {
        return this.$store.state.zap.attributeView.selectedBounded
      }
    },
    selectionDefault: {
      get () {
        return this.$store.state.zap.attributeView.defaultValues
      }
    }
  },
  data () {
    return {
      pagination: {
        rowsPerPage: 0
      },
      columns: [
        {
          name: 'included',
          label: 'Included',
          field: 'included',
          align: 'left',
          sortable: true
        },
        {
          name: 'clientServer',
          label: 'Client/Server',
          field: 'clientServer',
          align: 'left',
          sortable: true
        },
        {
          name: 'attrName',
          label: 'Attribute Name',
          field: 'attrName',
          align: 'left',
          sortable: true
        },
        {
          name: 'attrID',
          align: 'left',
          label: 'Attribute ID',
          field: 'attrID',
          sortable: true
        },
        {
          name: 'mfgID',
          align: 'left',
          label: 'Manufacturing ID',
          field: 'mfgID',
          sortable: true
        },
        {
          name: 'external',
          align: 'left',
          label: 'External',
          field: 'external',
          sortable: true
        },
        {
          name: 'flash',
          align: 'left',
          label: 'Flash',
          field: 'flash',
          sortable: true
        },
        {
          name: 'singleton',
          align: 'left',
          label: 'Singleton',
          field: 'singleton',
          sortable: true
        },
        {
          name: 'type',
          align: 'left',
          label: 'Type',
          field: 'type',
          sortable: true
        },
        {
          name: 'bounded',
          align: 'left',
          label: 'Bounded',
          field: 'bounded',
          sortable: true
        },
        {
          name: 'default',
          align: 'left',
          label: 'Default',
          field: 'default',
          sortable: true
        }
      ]
    }
  }
}
</script>

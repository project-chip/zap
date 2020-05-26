<!-- Copyright (c) 2019 Silicon Labs. All rights reserved. -->
<template>
  <div v-show="attributeData.length > 0">
    <q-table
      title="Attributes"
      :data="attributeData"
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
              v-model="selectedReporting"
              :val="props.row.id"
              indeterminate-value="false"
              keep-color
              :color="
                handleColorSelection(
                  selectedReporting,
                  requiredReporting,
                  props.row.id
                )
              "
              @input="
                handleSelection(
                  props.row.id,
                  selectedReporting,
                  'selectedReporting'
                )
              "
            />
          </q-td>
          <q-td key="clientServer" :props="props" auto-width>
            {{ props.row.side }}
          </q-td>
          <q-td key="attrName" :props="props" auto-width>
            {{ props.row.label }}
          </q-td>
          <q-td key="attrID" :props="props" auto-width>
            {{ props.row.code }}
          </q-td>
          <q-td key="mfgID" :props="props" auto-width>
            {{ props.row.manufacturerCode }}
          </q-td>
          <q-td key="min" :props="props" auto-width>
            <q-input
              type="number"
              v-model.number="selectionMin[props.row.id]"
              dark
              dense
              @input="
                handleAttributeDefaultChange(
                  props.row.id,
                  selectionMin[props.row.id],
                  'reportingMin'
                )
              "
            />
          </q-td>

          <q-td key="max" :props="props" auto-width>
            <q-input
              type="number"
              v-model.number="selectionMax[props.row.id]"
              @input="
                handleAttributeDefaultChange(
                  props.row.id,
                  selectionMax[props.row.id],
                  'reportingMax'
                )
              "
              dark
              dense
            />
          </q-td>

          <q-td key="reportable" :props="props" auto-width>
            <q-input
              v-model.number="selectionReportableChange[props.row.id]"
              @input="
                handleAttributeDefaultChange(
                  props.row.id,
                  selectionReportableChange[props.row.id],
                  'reportableChange'
                )
              "
              dark
              type="number"
              dense
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
export default {
  name: 'ZclReportingView',
  mounted() {
    this.$serverOn('zcl-item', (event, arg) => {
      if (arg.type === 'endpointTypeReportableAttributes') {
        this.$store.dispatch('zap/setReportableAttributeStateLists', arg.data)
      }
    })
    this.$serverOn('singleReportableAttributeState', (event, arg) => {
      if (arg.action === 'boolean') {
        this.$store.dispatch('zap/updateSelectedAttributes', {
          id: arg.id,
          added: arg.added,
          listType: arg.listType,
          view: 'reportingView',
        })
      } else if (arg.action === 'text') {
        this.$store.dispatch('zap/updateAttributeDefaults', {
          id: arg.id,
          newDefaultValue: arg.added,
          listType: arg.listType,
          view: 'reportingView',
        })
      }
    })
  },
  computed: {
    attributeData: {
      get() {
        return this.$store.state.zap.attributes.filter((attribute) => {
          if (
            this.$store.state.zap.attributeView.selectedAttributes.includes(
              attribute.id
            )
          ) {
            return true
          } else {
            return false
          }
        })
      },
    },
    selection: {
      get() {
        return this.$store.state.zap.attributeView.selectedAttributes
      },
    },
    selectedReporting: {
      get() {
        return this.$store.state.zap.reportingView.selectedReporting
      },
    },
    selectionMin: {
      get() {
        return this.$store.state.zap.reportingView.reportingMin
      },
    },
    selectionMax: {
      get() {
        return this.$store.state.zap.reportingView.reportingMax
      },
    },
    selectionReportableChange: {
      get() {
        return this.$store.state.zap.reportingView.reportableChange
      },
    },
    selectedEndpointId: {
      get() {
        return this.$store.state.zap.endpointTypeView.selectedEndpointType
      },
    },
    requiredReporting: {
      get() {
        return this.attributeData
          .filter((attribute) => attribute.isReportable)
          .map((attribute) => attribute.id)
      },
    },
  },
  methods: {
    handleSelection(id, list, listType) {
      var indexOfValue = list.indexOf(id)
      var addedValue = false
      if (indexOfValue === -1) {
        addedValue = true
      } else {
        addedValue = false
      }

      this.$serverPost(`/reportableAttribute/update`, {
        action: 'boolean',
        endpointTypeId: this.selectedEndpointId,
        id: id,
        value: addedValue,
        listType: listType,
      })
    },
    handleAttributeDefaultChange(id, newValue, listType) {
      this.$serverPost(`/reportableAttribute/update`, {
        action: 'text',
        endpointTypeId: this.selectedEndpointId,
        id: id,
        value: newValue,
        listType: listType,
      })
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
      item: {},
      title: '',
      type: '',
      pagination: {
        rowsPerPage: 0,
      },
      columns: [
        {
          name: 'included',
          label: 'Included',
          field: 'included',
          align: 'left',
          sortable: true,
        },
        {
          name: 'clientServer',
          label: 'Client/Server',
          field: 'clientServer',
          align: 'left',
          sortable: true,
        },
        {
          name: 'attrName',
          label: 'Attribute Name',
          field: 'attrName',
          align: 'left',
          sortable: true,
        },
        {
          name: 'attrID',
          align: 'left',
          label: 'Attribute ID',
          field: 'attrID',
          sortable: true,
        },
        {
          name: 'mfgID',
          align: 'left',
          label: 'Manufacturing ID',
          field: 'mfgID',
          sortable: true,
        },
        {
          name: 'min',
          align: 'left',
          label: 'Min Interval (s)',
          field: 'min',
          sortable: true,
        },
        {
          name: 'max',
          align: 'left',
          label: 'Max Interval (s)',
          field: 'max',
          sortable: true,
        },
        {
          name: 'reportable',
          align: 'left',
          label: 'Reportable Change',
          field: 'reportable',
          sortable: true,
        },
      ],
    }
  },
}
</script>

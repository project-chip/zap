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
              :val="hashAttributeIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              keep-color
              :color="'primary'"
              @input="
                handleSelection(
                  selectedReporting,
                  'selectedReporting',
                  props.row,
                  selectedCluster.id
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
              v-model.number="
                selectionMin[
                  hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                ]
              "
              dark
              dense
              @input="
                handleAttributeDefaultChange(
                  selectionMin[
                    hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                  ],
                  'reportingMin',
                  props.row,
                  selectedCluster.id
                )
              "
            />
          </q-td>

          <q-td key="max" :props="props" auto-width>
            <q-input
              type="number"
              v-model.number="
                selectionMax[
                  hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                ]
              "
              @input="
                handleAttributeDefaultChange(
                  selectionMax[
                    hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                  ],
                  'reportingMax',
                  props.row,
                  selectedCluster.id
                )
              "
              dark
              dense
            />
          </q-td>

          <q-td key="reportable" :props="props" auto-width>
            <q-input
              v-model.number="
                selectionReportableChange[
                  hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                ]
              "
              @input="
                handleAttributeDefaultChange(
                  selectionReportableChange[
                    hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                  ],
                  'reportableChange',
                  props.row,
                  selectedCluster.id
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
import * as Util from '../util/util.js'
export default {
  name: 'ZclReportingView',
  mounted() {
    this.$serverOn('zcl-item', (event, arg) => {
      if (arg.type === 'endpointTypeAttributes') {
        this.$store.dispatch('zap/setAttributeStateLists', arg.data)
      }
    })
    this.$serverOn('singleAttributeState', (event, arg) => {
      if (arg.action === 'boolean') {
        this.$store.dispatch('zap/updateSelectedAttributes', {
          id: this.hashAttributeIdClusterId(arg.id, arg.clusterRef),
          added: arg.added,
          listType: arg.listType,
          view: 'attributeView',
        })
      } else if (arg.action === 'text') {
        this.$store.dispatch('zap/updateAttributeDefaults', {
          id: this.hashAttributeIdClusterId(arg.id, arg.clusterRef),
          newDefaultValue: arg.added,
          listType: arg.listType,
          view: 'attributeView',
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
              this.hashAttributeIdClusterId(
                attribute.id,
                this.selectedCluster.id
              )
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
        return this.$store.state.zap.attributeView.selectedReporting
      },
    },
    selectionMin: {
      get() {
        return this.$store.state.zap.attributeView.reportingMin
      },
    },
    selectionMax: {
      get() {
        return this.$store.state.zap.attributeView.reportingMax
      },
    },
    selectionReportableChange: {
      get() {
        return this.$store.state.zap.attributeView.reportableChange
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
    selectedCluster: {
      get() {
        return this.$store.state.zap.clustersView.selected[0] || {}
      },
    },
  },
  methods: {
    handleSelection(list, listType, attributeData, clusterId) {
      // We determine the ID that we need to toggle within the list.
      // This ID comes from hashing the base ZCL attribute and cluster data.

      var indexOfValue = list.indexOf(
        this.hashAttributeIdClusterId(attributeData.id, clusterId)
      )
      var addedValue = false
      if (indexOfValue === -1) {
        addedValue = true
      } else {
        addedValue = false
      }

      this.$serverPost(`/attribute/update`, {
        action: 'boolean',
        endpointTypeId: this.selectedEndpointId,
        id: attributeData.id,
        value: addedValue,
        listType: listType,
        clusterRef: clusterId,
        attributeSide: attributeData.side,
      })
    },
    handleAttributeDefaultChange(newValue, listType, attributeData, clusterId) {
      this.$serverPost(`/attribute/update`, {
        action: 'text',
        endpointTypeId: this.selectedEndpointId,
        id: attributeData.id,
        value: newValue,
        listType: listType,
        clusterRef: clusterId,
        attributeSide: attributeData.side,
      })
    },
    hashAttributeIdClusterId(attributeId, clusterId) {
      return Util.cantorPair(attributeId, clusterId)
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

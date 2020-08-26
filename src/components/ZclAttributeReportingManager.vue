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
      :data.sync="attributeData"
      :columns="columns"
      row-key="<b>name</b>"
      dense
      flat
      binary-state-sort
      :pagination.sync="pagination"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="included" :props="props" auto-width>
            <q-toggle
              class="q-mt-xs"
              v-model="selectedReporting"
              :val="hashAttributeIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              keep-color
              @input="
                toggleAttributeSelection(
                  selectedReporting,
                  'selectedReporting',
                  props.row,
                  selectedCluster.id
                )
              "
            />
          </q-td>
          <q-td key="attrName" :props="props" auto-width>{{
            props.row.label
          }}</q-td>
          <q-td key="clientServer" :props="props" auto-width>{{
            props.row.side === 'client' ? 'Client' : 'Server'
          }}</q-td>
          <q-td key="min" :props="props" auto-width>
            <q-input
              dense
              :borderless="!editableAttributes[props.row.id]"
              :outlined="editableAttributes[props.row.id]"
              :disable="!editableAttributes[props.row.id]"
              :value="
                !editableAttributes[props.row.id]
                  ? selectionMin[
                      hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                    ]
                  : editableMin[
                      hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                    ]
              "
              @input="
                handleLocalChange(
                  $event,
                  'editableMin',
                  hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                )
              "
            />
          </q-td>
          <q-td key="max" :props="props" auto-width>
            <q-input
              dense
              :borderless="!editableAttributes[props.row.id]"
              :outlined="editableAttributes[props.row.id]"
              :disable="!editableAttributes[props.row.id]"
              :value="
                !editableAttributes[props.row.id]
                  ? selectionMax[
                      hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                    ]
                  : editableMax[
                      hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                    ]
              "
              @input="
                handleLocalChange(
                  $event,
                  'editableMax',
                  hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                )
              "
            />
          </q-td>
          <q-td key="reportable" :props="props" auto-width>
            <q-input
              dense
              :borderless="!editableAttributes[props.row.id]"
              :outlined="editableAttributes[props.row.id]"
              :disable="!editableAttributes[props.row.id]"
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
              type="number"
            />
          </q-td>
          <q-td key="edit" :props="props" auto-width>
            <q-btn
              dense
              flat
              icon="close"
              color="blue"
              :style="{
                visibility: editableAttributes[props.row.id]
                  ? 'visible'
                  : 'hidden',
              }"
              @click="resetAttribute(props.row.id)"
            />
            <q-btn
              densex
              flat
              :icon="editableAttributes[props.row.id] ? 'done' : 'create'"
              color="blue"
              @click="
                editableAttributes[props.row.id]
                  ? commitEdittedAttribute(props.row, selectedCluster.id)
                  : setEditableAttribute(props.row.id, selectedCluster.id)
              "
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
import * as Util from '../util/util'
import * as RestApi from '../../src-shared/rest-api'
import Vue from 'vue'

export default {
  name: 'ZclAttributeReportingManager',
  methods: {
    handleLocalSelection(list, attributeDataId, clusterId) {
      let hash = this.hashAttributeIdClusterId(attributeDataId, clusterId)
      var indexOfValue = list.indexOf(hash)
      var addedValue = false
      if (indexOfValue === -1) {
        list.push(hash)
      } else {
        list.splice(indexOfValue, 1)
      }
    },
    handleLocalChange(value, list, hash) {
      Vue.set(this[list], hash, value)
      this[list] = Object.assign({}, this[list])
    },
    toggleAttributeSelection(list, listType, attributeData, clusterId, enable) {
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

      let editContext = {
        action: 'boolean',
        endpointTypeId: this.selectedEndpointId,
        id: attributeData.id,
        value: addedValue,
        listType: listType,
        clusterRef: clusterId,
        attributeSide: attributeData.side,
      }
      this.$store.dispatch('zap/updateSelectedAttribute', editContext)
    },
    setAttributeSelection(listType, attributeData, clusterId, enable) {
      let editContext = {
        action: 'boolean',
        endpointTypeId: this.selectedEndpointId,
        id: attributeData.id,
        value: enable,
        listType: listType,
        clusterRef: clusterId,
        attributeSide: attributeData.side,
      }
      this.$store.dispatch('zap/updateSelectedAttribute', editContext)
    },
    handleAttributeDefaultChange(newValue, listType, attributeData, clusterId) {
      let editContext = {
        action: 'text',
        endpointTypeId: this.selectedEndpointId,
        id: attributeData.id,
        value: newValue,
        listType: listType,
        clusterRef: clusterId,
        attributeSide: attributeData.side,
      }
      this.$store.dispatch('zap/updateSelectedAttribute', editContext)
    },
    isDefaultValueValid(id) {
      return this.defaultValueValidation[id] != null
        ? this.defaultValueValidation[id].length === 0
        : true
    },
    getDefaultValueErrorMessage(id) {
      return this.defaultValueValidation[id] != null
        ? this.defaultValueValidation[id].reduce(
            (validationIssueString, currentVal) => {
              return validationIssueString + '\n' + currentVal
            },
            ''
          )
        : ''
    },
    hashAttributeIdClusterId(attributeId, clusterId) {
      return Util.cantorPair(attributeId, clusterId)
    },

    initializeTextEditableList(originatingList, editableList, attrClusterHash) {
      let data = originatingList[attrClusterHash]
      editableList[attrClusterHash] = data
    },

    setEditableAttribute(attributeId, selectedClusterId) {
      let attrClusterHash = this.hashAttributeIdClusterId(
        attributeId,
        selectedClusterId
      )

      this.initializeTextEditableList(
        this.selectionMin,
        this.editableMin,
        attrClusterHash
      )

      this.initializeTextEditableList(
        this.selectionMax,
        this.editableMax,
        attrClusterHash
      )

      this.initializeTextEditableList(
        this.selectionReportableChange,
        this.editableReportable,
        attrClusterHash
      )

      this.$store.dispatch('zap/setAttributeEditting', {
        attributeId: attributeId,
        editState: true,
      })
    },

    resetAttribute(attributeId) {
      this.$store.dispatch('zap/setAttributeEditting', {
        attributeId: attributeId,
        editState: false,
      })
    },

    commitEdittedAttribute(attributeData, clusterId) {
      let hash = this.hashAttributeIdClusterId(attributeData.id, clusterId)

      this.handleAttributeDefaultChange(
        this.editableMin[hash],
        'reportingMin',
        attributeData,
        clusterId
      )
      this.handleAttributeDefaultChange(
        this.editableMax[hash],
        'reportingMax',
        attributeData,
        clusterId
      )

      this.$store.dispatch('zap/setAttributeEditting', {
        attributeId: attributeData.id,
        editState: false,
      })
    },
  },

  computed: {
    attributeData: {
      get() {
        return this.$store.state.zap.attributes
      },
    },
    selectionDefault: {
      get() {
        return this.$store.state.zap.attributeView.defaultValue
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
    defaultValueValidation: {
      get() {
        return this.$store.state.zap.attributeView.defaultValueValidationIssues
      },
    },
    selectedCluster: {
      get() {
        return this.$store.state.zap.clustersView.selected[0] || {}
      },
    },
    editableAttributes: {
      get() {
        return this.$store.state.zap.attributeView.editableAttributes
      },
    },
  },
  data() {
    return {
      editableMin: {},
      editableMax: {},
      editableReportable: {},
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
          name: 'attrName',
          label: 'Attribute',
          field: 'attrName',
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
          name: 'min',
          align: 'left',
          label: 'Min Interval',
          field: 'min',
          sortable: true,
        },
        {
          name: 'max',
          align: 'left',
          label: 'Max Interval',
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
        {
          name: 'edit',
          align: 'left',
          label: 'Edit',
          field: 'edit',
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

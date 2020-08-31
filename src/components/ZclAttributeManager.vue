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
<!-- TODO 
  needs to be connected to the new UI .vue file 
  connect Storage Option column to a real list
  make sure Required column is the correct list
  add action to edit button
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
              v-model="selection"
              :val="hashAttributeIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              keep-color
              @input="
                toggleAttributeSelection(
                  selection,
                  'selectedAttributes',
                  props.row,
                  selectedCluster.id
                )
              "
            />
          </q-td>
          <q-td key="attrID" :props="props" auto-width>{{
            props.row.code
          }}</q-td>
          <q-td key="attrName" :props="props" auto-width>{{
            props.row.label
          }}</q-td>
          <q-td key="required" :props="props" auto-width>
            {{ isAttributeRequired(props.row) ? 'Yes' : '' }}
          </q-td>
          <q-td key="clientServer" :props="props" auto-width>{{
            props.row.side === 'client' ? 'Client' : 'Server'
          }}</q-td>
          <q-td key="mfgID" :props="props" auto-width>{{
            selectedCluster.manufacturerCode
              ? selectedCluster.manufacturerCode
              : props.row.manufacturerCode
              ? props.row.manufacturerCode
              : ''
          }}</q-td>
          <q-td key="storageOption" :props="props" auto-width>
            <q-select
              :value="
                !editableAttributes[props.row.id]
                  ? selectionStorageOption[
                      hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                    ]
                  : editableStorage[
                      hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                    ]
              "
              class="col"
              :options="storageOptions"
              dense
              bottom-slots
              :borderless="!editableAttributes[props.row.id]"
              :outlined="editableAttributes[props.row.id]"
              :disable="!editableAttributes[props.row.id]"
              @input="
                handleLocalStorageChange(
                  $event,
                  editableStorage,
                  hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                )
              "
            />
          </q-td>
          <q-td key="singleton" :props="props" auto-width>
            <q-checkbox
              class="q-mt-xs"
              :value="
                !editableAttributes[props.row.id]
                  ? selectionSingleton
                  : edittedData['singleton']
              "
              :val="hashAttributeIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              :disable="!editableAttributes[props.row.id]"
              :dimmed="!editableAttributes[props.row.id]"
              @input="
                handleLocalSelection(
                  edittedData['singleton'],
                  props.row.id,
                  selectedCluster.id
                )
              "
            />
          </q-td>
          <q-td key="bounded" :props="props" auto-width>
            <q-checkbox
              class="q-mt-xs"
              :value="
                !editableAttributes[props.row.id]
                  ? selectionBounded
                  : edittedData['bounded']
              "
              :val="hashAttributeIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              :disable="!editableAttributes[props.row.id]"
              :dimmed="!editableAttributes[props.row.id]"
              @input="
                handleLocalSelection(
                  edittedData['bounded'],
                  props.row.id,
                  selectedCluster.id
                )
              "
            />
          </q-td>
          <q-td key="type" :props="props" auto-width>{{
            props.row.type ? props.row.type.toUpperCase() : 'UNKNOWN'
          }}</q-td>
          <q-td key="default" :props="props" auto-width>
            <q-input
              dense
              bottom-slots
              :borderless="!editableAttributes[props.row.id]"
              :outlined="editableAttributes[props.row.id]"
              :disable="!editableAttributes[props.row.id]"
              :value="
                !editableAttributes[props.row.id]
                  ? selectionDefault[
                      hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                    ]
                  : editableDefaults[
                      hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                    ]
              "
              :error="
                !isDefaultValueValid(
                  hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                )
              "
              :error-message="
                getDefaultValueErrorMessage(
                  hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                )
              "
              @input="
                handleLocalDefaultChange(
                  $event,
                  editableDefaults,
                  hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                )
              "
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
import * as DbEnum from '../../src-shared/db-enum'
import Vue from 'vue'

export default {
  name: 'ZclAttributeManager',
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
    handleLocalDefaultChange(value, list, hash) {
      Vue.set(list, hash, value)
      this.editableDefaults = Object.assign({}, this.editableDefaults)
    },
    handleLocalStorageChange(value, list, hash) {
      Vue.set(list, hash, value)
      this.editableStorage = Object.assign({}, this.editableStorage)
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

    isAttributeRequired(attribute) {
      return this.requiredAttributes.includes(attribute.id)
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

    initializeBooleanEditableList(
      originatingList,
      editableList,
      attrClusterHash
    ) {
      if (originatingList.includes(attrClusterHash)) {
        if (!editableList.includes(attrClusterHash)) {
          editableList.push(attrClusterHash)
        }
      } else {
        if (editableList.includes(attrClusterHash)) {
          let index = editableList.indexOf(attrClusterHash)
          editableList.splice(index, 1)
        }
      }
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
      this.initializeBooleanEditableList(
        this.selectionBounded,
        this.edittedData['bounded'],
        attrClusterHash
      )
      this.initializeBooleanEditableList(
        this.selectionSingleton,
        this.edittedData['singleton'],
        attrClusterHash
      )

      this.initializeTextEditableList(
        this.selectionDefault,
        this.editableDefaults,
        attrClusterHash
      )

      this.initializeTextEditableList(
        this.selectionStorageOption,
        this.editableStorage,
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
        this.editableDefaults[hash],
        'defaultValue',
        attributeData,
        clusterId
      )
      console.log(this.editableStorage[hash])
      this.handleAttributeDefaultChange(
        this.editableStorage[hash],
        'storageOption',
        attributeData,
        clusterId
      )

      this.setAttributeSelection(
        'selectedSingleton',
        attributeData,
        clusterId,
        this.edittedData['singleton'].includes(hash)
      )
      this.setAttributeSelection(
        'selectedBounded',
        attributeData,
        clusterId,
        this.edittedData['bounded'].includes(hash)
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
    selection: {
      get() {
        return this.$store.state.zap.attributeView.selectedAttributes
      },
    },
    selectionSingleton: {
      get() {
        return this.$store.state.zap.attributeView.selectedSingleton
      },
    },
    selectionBounded: {
      get() {
        return this.$store.state.zap.attributeView.selectedBounded
      },
    },
    selectionDefault: {
      get() {
        return this.$store.state.zap.attributeView.defaultValue
      },
    },
    selectionStorageOption: {
      get() {
        return this.$store.state.zap.attributeView.storageOption
      },
    },
    selectedEndpointId: {
      get() {
        return this.$store.state.zap.endpointTypeView.selectedEndpointType
      },
    },
    requiredDeviceTypeAttributes: {
      get() {
        return this.$store.state.zap.attributeView.requiredAttributes
      },
    },
    requiredAttributes: {
      get() {
        return this.attributeData
          .filter(
            (attribute) =>
              !attribute.isOptional ||
              this.requiredDeviceTypeAttributes.includes(attribute.id)
          )
          .map((attribute) => attribute.id)
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
    storageOptions: {
      get() {
        return Object.values(DbEnum.storageOption)
      },
    },
  },
  data() {
    return {
      edittedData: {
        bounded: [],
        singleton: [],
      },
      editableDefaults: {},
      editableStorage: {},
      pagination: {
        rowsPerPage: 0,
      },
      columns: [
        {
          name: 'included',
          label: 'On/Off',
          field: 'included',
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
          name: 'attrName',
          label: 'Attribute',
          field: 'attrName',
          align: 'left',
          sortable: true,
        },
        {
          name: 'required',
          label: 'Required',
          field: 'required',
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
          name: 'mfgID',
          label: 'Mfg Code',
          align: 'left',
          field: 'mfgID',
          sortable: true,
        },
        {
          name: 'storageOption',
          label: 'Storage Option',
          align: 'left',
          field: 'storageOption',
          sortable: true,
        },
        {
          name: 'singleton',
          align: 'left',
          label: 'Singleton',
          field: 'singleton',
          sortable: true,
        },
        {
          name: 'bounded',
          align: 'left',
          label: 'Bounded',
          field: 'bounded',
          sortable: true,
        },
        {
          name: 'type',
          align: 'left',
          label: 'Type',
          field: 'type',
          sortable: true,
        },
        {
          name: 'default',
          align: 'left',
          label: 'Default',
          field: 'default',
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

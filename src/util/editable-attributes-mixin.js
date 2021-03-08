/**
 *
 *    Copyright (c) 2020 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
import Vue from 'vue'
import CommonMixin from '../util/common-mixin'

/**
 * This module provides common properties used across various vue components related to attribute editting.
 */
export default {
  mixins: [CommonMixin],
  data() {
    return {
      edittedData: {
        bounded: [],
        singleton: [],
      },
      editableDefaults: {},
      editableStorage: {},
      editableMin: {},
      editableMax: {},
      editableReportable: {},
    }
  },
  computed: {
    relevantAttributeData: {
      get() {
        return this.$store.state.zap.attributes.filter((a) => {
          let relevantList =
            a.side === 'client' ? this.selectionClients : this.selectionServers
          return relevantList.includes(this.selectedClusterId)
        })
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
    selectionStorageOption: {
      get() {
        return this.$store.state.zap.attributeView.storageOption
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
    defaultValueValidation: {
      get() {
        return this.$store.state.zap.attributeView.defaultValueValidationIssues
      },
    },
  },
  methods: {
    handleLocalChange(value, list, hash) {
      Vue.set(this[list], hash, value)
      this[list] = Object.assign({}, this[list])
    },
    setAttributeSelection(listType, attributeData, clusterId, enable) {
      let editContext = {
        action: 'boolean',
        endpointTypeId: this.selectedEndpointTypeId,
        id: attributeData.id,
        value: enable,
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
    handleLocalSelection(list, attributeDataId, clusterId) {
      let hash = this.hashAttributeIdClusterId(attributeDataId, clusterId)
      let indexOfValue = list.indexOf(hash)
      if (indexOfValue === -1) {
        list.push(hash)
      } else {
        list.splice(indexOfValue, 1)
      }
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
    handleAttributeDefaultChange(newValue, listType, attributeData, clusterId) {
      let editContext = {
        action: 'text',
        endpointTypeId: this.selectedEndpointTypeId,
        id: attributeData.id,
        value: newValue,
        listType: listType,
        clusterRef: clusterId,
        attributeSide: attributeData.side,
      }
      this.$store.dispatch('zap/updateSelectedAttribute', editContext)
    },
    toggleAttributeSelection(list, listType, attributeData, clusterId) {
      // We determine the ID that we need to toggle within the list.
      // This ID comes from hashing the base ZCL attribute and cluster data.
      let indexOfValue = list.indexOf(
        this.hashAttributeIdClusterId(attributeData.id, clusterId)
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
        id: attributeData.id,
        value: addedValue,
        listType: listType,
        clusterRef: clusterId,
        attributeSide: attributeData.side,
      }
      this.$store.dispatch('zap/updateSelectedAttribute', editContext)
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
    setEditableAttributeReporting(attributeId, selectedClusterId) {
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

      this.$store.dispatch('zap/setAttributeReportingEditting', {
        attributeId: attributeId,
        editState: true,
      })
    },

    resetAttributeReporting(attributeId) {
      this.$store.dispatch('zap/setAttributeReportingEditting', {
        attributeId: attributeId,
        editState: false,
      })
    },
    resetAttribute(attributeId) {
      this.$store.dispatch('zap/setAttributeEditting', {
        attributeId: attributeId,
        editState: false,
      })
    },

    commitEdittedAttributeReporting(attributeData, clusterId) {
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

      this.$store.dispatch('zap/setAttributeReportingEditting', {
        attributeId: attributeData.id,
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
}

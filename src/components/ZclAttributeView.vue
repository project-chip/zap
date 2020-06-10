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
              :val="hashAttributeIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              keep-color
              :color="
                handleColorSelection(
                  selection,
                  requiredAttributes,
                  props.row,
                  selectedCluster.id
                )
              "
              @input="
                handleAttributeSelection(
                  selection,
                  'selectedAttributes',
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

          <q-td key="external" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              v-model="selectionExternal"
              :val="hashAttributeIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              @input="
                handleAttributeSelection(
                  selectionExternal,
                  'selectedExternal',
                  props.row,
                  selectedCluster.id
                )
              "
            />
          </q-td>

          <q-td key="flash" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              v-model="selectionFlash"
              :val="hashAttributeIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              @input="
                handleAttributeSelection(
                  selectionFlash,
                  'selectedFlash',
                  props.row,
                  selectedCluster.id
                )
              "
            />
          </q-td>
          <q-td key="flash" :props="props" auto-width>
            <q-checkbox
              dark
              class="q-mt-xs"
              v-model="selectionSingleton"
              :val="hashAttributeIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              @input="
                handleAttributeSelection(
                  selectionSingleton,
                  'selectedSingleton',
                  props.row,
                  selectedCluster.id
                )
              "
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
              :val="hashAttributeIdClusterId(props.row.id, selectedCluster.id)"
              indeterminate-value="false"
              @input="
                handleAttributeSelection(
                  selectionBounded,
                  'selectedBounded',
                  props.row,
                  selectedCluster.id
                )
              "
            />
          </q-td>
          <q-td key="default" :props="props" auto-width>
            <q-input
              v-model="
                selectionDefault[
                  hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                ]
              "
              dark
              dense
              bottom-slots
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
                handleAttributeDefaultChange(
                  selectionDefault[
                    hashAttributeIdClusterId(props.row.id, selectedCluster.id)
                  ],
                  props.row,
                  selectedCluster.id
                )
              "
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
  name: 'ZclAttributeView',
  mounted() {
    this.$serverOn('zcl-item', (event, arg) => {
      if (arg.type === 'cluster') {
        this.$store.dispatch('zap/updateAttributes', arg.attributeData || [])
      }
      if (arg.type === 'endpointTypeAttributes') {
        this.$store.dispatch('zap/setAttributeStateLists', arg.data)
      }
      if (arg.type === 'deviceTypeAttributes') {
        this.$store.dispatch('zap/setRequiredAttributes', arg.data)
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
          id: this.hashAttributeIdClusterId(arg.id, this.selectedCluster.id),
          newDefaultValue: arg.added,
          defaultValueValidationIssues: arg.validationIssues.defaultValue,
        })
      }
    })
  },
  methods: {
    handleAttributeSelection(list, listType, attributeData, clusterId) {
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

    handleAttributeDefaultChange(newValue, attributeData, clusterId) {
      this.$serverPost(`/attribute/update`, {
        action: 'text',
        endpointTypeId: this.selectedEndpointId,
        id: attributeData.id,
        value: newValue,
        listType: 'defaultValue',
        clusterRef: clusterId,
        attributeSide: attributeData.side,
      })
    },
    handleColorSelection(
      selectedList,
      recommendedList,
      attributeData,
      clusterId
    ) {
      var resolvedId = this.hashAttributeIdClusterId(
        attributeData.id,
        clusterId
      )
      let relevantAttributeList =
        attributeData.side === 'client'
          ? this.selectionClusterClient
          : this.selectionClusterServer

      let isClusterIncluded = relevantAttributeList.includes(clusterId)
      let isAttributeRecommended = recommendedList.includes(attributeData.id)
      let isAttributeSelected = selectedList.includes(resolvedId)

      if (isClusterIncluded && isAttributeRecommended && isAttributeSelected) {
        return 'green'
      } else if (
        isClusterIncluded &&
        isAttributeRecommended &&
        !isAttributeSelected
      ) {
        return 'red'
      } else if (
        !isClusterIncluded &&
        isAttributeRecommended &&
        isAttributeSelected
      ) {
        return 'orange'
      } else {
        return 'primary'
      }
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
    selectionExternal: {
      get() {
        return this.$store.state.zap.attributeView.selectedExternal
      },
    },
    selectionFlash: {
      get() {
        return this.$store.state.zap.attributeView.selectedFlash
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
        return this.$store.state.zap.attributeView.defaultValues
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
  },
  data() {
    return {
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
          name: 'external',
          align: 'left',
          label: 'External',
          field: 'external',
          sortable: true,
        },
        {
          name: 'flash',
          align: 'left',
          label: 'Flash',
          field: 'flash',
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
          name: 'type',
          align: 'left',
          label: 'Type',
          field: 'type',
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
          name: 'default',
          align: 'left',
          label: 'Default',
          field: 'default',
          sortable: true,
        },
      ],
    }
  },
}
</script>

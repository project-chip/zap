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
      class="my-sticky-header-table"
      :data.sync="attributeData"
      :columns="columns"
      row-key="<b>name</b>"
      dense
      flat
      virtual-scroll
      binary-state-sort
      :pagination.sync="pagination"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="enabled" :props="props" auto-width>
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
              @click="resetAttributeReporting(props.row.id)"
            />
            <q-btn
              dense
              flat
              :icon="editableAttributes[props.row.id] ? 'done' : 'create'"
              color="blue"
              @click="
                editableAttributes[props.row.id]
                  ? commitEdittedAttributeReporting(
                      props.row,
                      selectedCluster.id
                    )
                  : setEditableAttributeReporting(
                      props.row.id,
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
//This mixin derives from common-mixin.
import EditableAttributeMixin from '../util/editable-attributes-mixin'

export default {
  name: 'ZclAttributeReportingManager',
  mixins: [EditableAttributeMixin],
  computed: {
    attributeData: {
      get() {
        return this.$store.state.zap.attributes
          .filter((attribute) => {
            return this.$store.state.zap.attributeView.selectedAttributes.includes(
              this.hashAttributeIdClusterId(
                attribute.id,
                this.selectedCluster.id
              )
            )
          })
          .filter((a) => {
            let relevantList =
              a.side === 'client'
                ? this.selectionClients
                : this.selectionServers
            return relevantList.includes(this.selectedClusterId)
          })
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
    editableAttributes: {
      get() {
        return this.$store.state.zap.attributeView.editableAttributesReporting
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
          name: 'enabled',
          label: 'Enabled',
          field: 'enabled',
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

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
  <div v-show="relevantAttributeData.length > 0">
    <q-table
      class="my-sticky-header-table"
      :data.sync="relevantAttributeData"
      :columns="columns"
      row-key="<b>name</b>"
      dense
      flat
      virtual-scroll
      binary-state-sort
      :pagination.sync="pagination"
      :sort-method="customAttributeSort"
      data-cy="Attributes"
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
            asHex(props.row.code, 4)
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
              ? asHex(selectedCluster.manufacturerCode, 4)
              : props.row.manufacturerCode
              ? asHex(props.row.manufacturerCode, 4)
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
              :borderless="!editableAttributes[props.row.id]"
              :outlined="editableAttributes[props.row.id]"
              :disable="!editableAttributes[props.row.id]"
              @input="
                handleLocalChange(
                  $event,
                  'editableStorage',
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
              hide-bottom-space
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
                handleLocalChange(
                  $event,
                  'editableDefaults',
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
              dense
              flat
              :icon="editableAttributes[props.row.id] ? 'done' : 'create'"
              color="blue"
              @click="
                editableAttributes[props.row.id]
                  ? commitEdittedAttribute(props.row, selectedCluster.id)
                  : setEditableAttribute(props.row, selectedCluster.id)
              "
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
import * as DbEnum from '../../src-shared/db-enum'

//This mixin derives from common-mixin.
import EditableAttributeMixin from '../util/editable-attributes-mixin'

export default {
  name: 'ZclAttributeManager',
  mixins: [EditableAttributeMixin],
  destroyed() {
    Object.keys(this.editableAttributes).forEach((attrId) => {
      this.commitEdittedAttribute(
        this.getAttributeById(attrId),
        this.selectedCluster.id
      )
    })
  },
  methods: {
    isAttributeRequired(attribute) {
      return this.requiredAttributes.includes(attribute.id)
    },
    customAttributeSort(rows, sortBy, descending) {
      const data = [...rows]

      if (sortBy) {
        data.sort((a, b) => {
          const x = descending ? b : a
          const y = descending ? a : b
          switch (sortBy) {
            case 'attrName':
              return this.sortByText(x['label'], y['label'], a, b)
            case 'attrID':
            case 'mfgId':
              return this.sortByClusterAndManufacturerCode(x, y)
            case 'required': {
              if (this.isAttributeRequired(x) == this.isAttributeRequired(y)) {
                //This uses a,b in order to main ascending order.
                return this.sortByClusterAndManufacturerCode(a, b)
              } else {
                if (this.isAttributeRequired(x)) return 1
                else if (this.isAttributeRequired(y)) return -1
                else return 0
              }
            }
            case 'clientServer':
              return this.sortByText(
                x['side'],
                y['side'],
                a,
                b,
                this.sortByClusterAndManufacturerCode
              )
            case 'storageOption': {
              let i = this.selectionStorageOption[
                this.hashAttributeIdClusterId(x.id, this.selectedCluster.id)
              ]
              i = i ? i : ''
              let j = this.selectionStorageOption[
                this.hashAttributeIdClusterId(y.id, this.selectedCluster.id)
              ]
              j = j ? j : ''
              return this.sortByText(
                i,
                j,
                a,
                b,
                this.sortByClusterAndManufacturerCode
              )
            }
            case 'singleton':
              return this.sortByBoolean(
                x,
                y,
                a,
                b,
                this.selectionSingleton,
                this.sortByClusterAndManufacturerCode
              )
            case 'bounded':
              return this.sortByBoolean(
                x,
                y,
                a,
                b,
                this.selectionBounded,
                this.sortByClusterAndManufacturerCode
              )
            case 'type':
              return this.sortByText(
                x['type'],
                y['type'],
                a,
                b,
                this.sortByClusterAndManufacturerCode
              )
            case 'default':
              return 0
          }
        })
      }
      return data
    },
  },

  computed: {
    requiredDeviceTypeAttributes: {
      get() {
        return this.$store.state.zap.attributeView.requiredAttributes
      },
    },
    requiredAttributes: {
      get() {
        return this.relevantAttributeData
          .filter(
            (attribute) =>
              !attribute.isOptional ||
              this.requiredDeviceTypeAttributes.includes(attribute.id)
          )
          .map((attribute) => attribute.id)
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
      pagination: {
        rowsPerPage: 0,
        sortBy: 'clientServer',
      },
      columns: [
        {
          name: 'included',
          label: 'On/Off',
          field: 'included',
          align: 'left',
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

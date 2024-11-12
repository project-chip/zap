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
  <div>
    <div v-if="eventData.length > 0">
      <q-table
        class="my-sticky-header-table"
        :rows="eventData"
        :columns="columns"
        row-key="<b>name</b>"
        dense
        virtual-scroll
        flat
        binary-state-sort
        v-model:pagination="pagination"
      >
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props" class="table_body">
            <q-td key="status" :props="props" class="q-px-none">
              <q-icon
                v-show="displayEventWarning(props.row)"
                name="warning"
                class="text-amber"
                style="font-size: 1.5rem"
              />
              <q-tooltip
                v-if="displayEventWarning(props.row)"
                anchor="top middle"
                self="bottom middle"
                :offset="[10, 10]"
              >
                <div
                  v-for="(warning, index) in getEventWarning(props.row)"
                  :key="index"
                >
                  {{ warning }}
                </div>
              </q-tooltip>
            </q-td>
            <q-td key="included" :props="props" auto-width>
              <q-toggle
                class="q-mt-xs"
                v-model="selectedEvents"
                :val="hashEventIdClusterId(props.row.id, selectedCluster.id)"
                indeterminate-value="false"
                keep-color
                @update:model-value="
                  handleEventSelection(
                    selectedEvents,
                    'selectedEvents',
                    props.row,
                    selectedCluster.id
                  )
                "
              />
            </q-td>
            <q-td key="eventId" :props="props" auto-width>{{
              asHex(props.row.code, 2)
            }}</q-td>
            <q-td key="mfgId" :props="props" auto-width
              >{{
                selectedCluster.manufacturerCode
                  ? asHex(selectedCluster.manufacturerCode, 4)
                  : props.row.manufacturerCode
                    ? asHex(props.row.manufacturerCode, 4)
                    : '-'
              }}
            </q-td>
            <q-td key="name" :props="props" auto-width>{{
              props.row.name
            }}</q-td>
            <q-td key="side" :props="props" auto-width>{{
              props.row.side === 'client'
                ? 'Client ➞ Server'
                : 'Server ➞ Client'
            }}</q-td>
            <q-td key="priority" :props="props" auto-width>{{
              props.row.priority
            }}</q-td>
            <q-td key="required" :props="props" auto-width>{{
              props.row.isOptional ? '' : 'Yes'
            }}</q-td>
            <q-td key="description" :props="props" auto-width>{{
              props.row.description
            }}</q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
    <div v-else><br />{{ noEventsMessage }}</div>
  </div>
</template>

<script>
import * as Util from '../util/util.js'
import EditableAttributesMixin from '../util/editable-attributes-mixin.js'
import uiOptions from '../util/ui-options'

export default {
  name: 'ZclEventManager',
  mixins: [EditableAttributesMixin, uiOptions],
  computed: {
    selectedEvents: {
      get() {
        return this.$store.state.zap.eventView.selectedEvents
      }
    },
    eventData: {
      get() {
        return this.$store.state.zap.events.filter((event) => {
          return this.individualClusterFilterString == ''
            ? true
            : event.name
                .toLowerCase()
                .includes(this.individualClusterFilterString.toLowerCase())
        })
      }
    },
    eventsRequiredByConformance: {
      get() {
        return this.$store.state.zap.eventView.mandatory
      }
    },
    eventsNotSupportedByConformance: {
      get() {
        return this.$store.state.zap.eventView.notSupported
      }
    }
  },
  methods: {
    handleEventSelection(list, listType, eventData, clusterId) {
      // We determine the ID that we need to toggle within the list.
      // This ID comes from hashing the base event ID and cluster data.
      let indexOfValue = list.indexOf(
        this.hashEventIdClusterId(eventData.id, clusterId)
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
        id: eventData.id,
        value: addedValue,
        listType: listType,
        clusterRef: clusterId,
        eventSide: eventData.side
      }
      this.$store.dispatch('zap/updateSelectedEvents', editContext)
    },
    hashEventIdClusterId(eventId, clusterId) {
      return Util.cantorPair(eventId, clusterId)
    },
    /* Display warnings if event is mandatory and disabled,
       or if event state does not match mandatory or notSupported conformance.
       Two types of warnings can be displayed at the same time. */
    displayEventWarning(row) {
      return (
        (this.enableFeature &&
          ((this.eventsRequiredByConformance[row.id] &&
            !this.isEventSelected(row.id)) ||
            (this.eventsNotSupportedByConformance[row.id] &&
              this.isEventSelected(row.id)))) ||
        (row.conformance == 'M' && !this.isEventSelected(row.id))
      )
    },
    getEventWarning(row) {
      let warnings = []
      if (
        this.eventsRequiredByConformance[row.id] &&
        !this.isEventSelected(row.id) &&
        this.enableFeature
      ) {
        warnings.push(this.eventsRequiredByConformance[row.id])
      }
      if (
        this.eventsNotSupportedByConformance[row.id] &&
        this.isEventSelected(row.id) &&
        this.enableFeature
      ) {
        warnings.push(this.eventsNotSupportedByConformance[row.id])
      }
      if (row.conformance == 'M' && !this.isEventSelected(row.id)) {
        warnings.push(this.defaultWarning)
      }
      return warnings
    },
    isEventSelected(eventId) {
      return this.selectedEvents.includes(
        this.hashEventIdClusterId(eventId, this.selectedCluster.id)
      )
    }
  },
  data() {
    return {
      noEventsMessage: 'No events available for this cluster.',
      pagination: {
        rowsPerPage: 0
      },
      defaultWarning:
        'This event is mandatory for the cluster and device type configuration you have enabled',
      columns: [
        {
          name: 'status',
          required: false,
          label: '',
          align: 'left',
          style: 'width:1%'
        },
        {
          name: 'included',
          label: 'On/Off',
          field: 'included',
          align: 'left',
          style: 'width:1%'
        },
        {
          name: 'eventId',
          align: 'left',
          label: 'ID',
          field: 'eventId',
          sortable: true,
          style: 'width:1%'
        },
        {
          name: 'mfgId',
          align: 'left',
          label: 'Manufacturing Id',
          field: 'mfgId',
          sortable: true,
          style: 'width:1%'
        },
        {
          name: 'name',
          label: 'Name',
          field: 'name',
          align: 'left',
          sortable: true,
          style: 'width:1%'
        },
        {
          name: 'side',
          label: 'Side',
          field: 'side',
          align: 'left',
          sortable: true,
          style: 'width:1%'
        },
        {
          name: 'priority',
          label: 'Priority',
          field: 'priority',
          align: 'left',
          sortable: true,
          style: 'width:1%'
        },
        {
          name: 'required',
          label: 'Required',
          field: 'isOptional',
          align: 'left',
          sortable: true,
          style: 'width:1%'
        },
        {
          name: 'description',
          label: 'Description',
          field: 'description',
          align: 'left',
          sortable: true,
          style: 'width:10%'
        }
      ]
    }
  }
}
</script>

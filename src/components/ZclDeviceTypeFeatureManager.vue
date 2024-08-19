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
  <div class="col q-px-lg">
    <div class="row q-py-md text-h4">
      <span class="v-step-6"
        >Endpoint {{ this.endpointId[this.selectedEndpointId] }} Device Type
        Features</span
      >
    </div>
    <div class="col column linear-border-wrap">
      <div v-if="deviceTypeFeatures.length > 0">
        <q-table
          :rows="deviceTypeFeatures"
          :columns="columns"
          flat
          v-model:pagination="pagination"
          separator="horizontal"
          id="ZclDeviceTypeFeatureManager"
        >
          <template v-slot:body="props">
            <q-tr :props="props" class="table_body attribute_table_body">
              <q-td key="deviceType" :props="props" auto-width>
                {{ props.row.deviceType }}
              </q-td>
              <q-td key="cluster" :props="props" auto-width>
                {{ props.row.cluster }}
              </q-td>
              <q-td key="featureName" :props="props" auto-width>
                {{ props.row.name }}
              </q-td>
              <q-td key="code" :props="props" auto-width>
                {{ props.row.code }}
              </q-td>
              <q-td key="conformance" :props="props" auto-width>
                {{ props.row.conformance }}
              </q-td>
              <q-td key="bit" :props="props" auto-width>
                {{ props.row.bit }}
              </q-td>
              <q-td key="description" :props="props" auto-width>
                {{ props.row.description }}
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
      <div v-else class="q-pa-md">
        <div class="text-body1">
          {{ nodataMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CommonMixin from '../util/common-mixin'

export default {
  name: 'ZclDeviceTypeFeatureManager',
  mixins: [CommonMixin],
  methods: {},
  computed: {
    deviceTypeFeatures() {
      return this.$store.state.zap.deviceTypeFeatures
    },
  },
  data() {
    return {
      nodataMessage: 'No device type features available for this endpoint',
      pagination: {
        rowsPerPage: 10,
      },
      columns: [
        {
          name: 'deviceType',
          required: true,
          label: 'Device Type',
          align: 'left',
        },
        {
          name: 'cluster',
          required: true,
          label: 'Cluster',
          align: 'left',
        },
        {
          name: 'featureName',
          required: true,
          label: 'Feature Name',
          align: 'left',
        },
        {
          name: 'code',
          required: true,
          label: 'Code',
          align: 'left',
        },
        {
          name: 'conformance',
          required: true,
          label: 'Conformance',
          align: 'left',
        },
        {
          name: 'bit',
          required: true,
          label: 'Bit',
          align: 'left',
        },
        {
          name: 'description',
          required: false,
          label: 'Description',
          align: 'left',
        },
      ],
    }
  },
}
</script>

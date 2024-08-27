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
    <div class="row q-py-md text-h5">
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
              <q-td key="clusterSide" :props="props" auto-width>
                {{ getClusterSide(props.row) }}
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
import dbEnum from '../../src-shared/db-enum'

export default {
  name: 'ZclDeviceTypeFeatureManager',
  mixins: [CommonMixin],
  methods: {
    getClusterSide(row) {
      if (row.includeClient == 1 && row.includeServer == 1) {
        return 'Client & Server'
      } else if (row.includeClient == 1) {
        return 'Client'
      } else if (row.includeServer == 1) {
        return 'Server'
      } else {
        return 'none'
      }
    }
  },
  computed: {
    deviceTypeFeatures() {
      return this.$store.state.zap.deviceTypeFeatures
    }
  },
  data() {
    return {
      nodataMessage: 'No device type features available for this endpoint',
      pagination: {
        rowsPerPage: 10
      },
      columns: [
        {
          name: dbEnum.deviceTypeFeature.name.deviceType,
          required: true,
          label: dbEnum.deviceTypeFeature.label.deviceType,
          align: 'left'
        },
        {
          name: dbEnum.deviceTypeFeature.name.cluster,
          required: true,
          label: dbEnum.deviceTypeFeature.label.cluster,
          align: 'left'
        },
        {
          name: dbEnum.deviceTypeFeature.name.clusterSide,
          required: true,
          label: dbEnum.deviceTypeFeature.label.clusterSide,
          align: 'left'
        },
        {
          name: dbEnum.deviceTypeFeature.name.featureName,
          required: true,
          label: dbEnum.deviceTypeFeature.label.featureName,
          align: 'left'
        },
        {
          name: dbEnum.deviceTypeFeature.name.code,
          required: true,
          label: dbEnum.deviceTypeFeature.label.code,
          align: 'left'
        },
        {
          name: dbEnum.deviceTypeFeature.name.conformance,
          required: true,
          label: dbEnum.deviceTypeFeature.label.conformance,
          align: 'left'
        },
        {
          name: dbEnum.deviceTypeFeature.name.bit,
          required: true,
          label: dbEnum.deviceTypeFeature.label.bit,
          align: 'left'
        },
        {
          name: dbEnum.deviceTypeFeature.name.description,
          required: false,
          label: dbEnum.deviceTypeFeature.label.description,
          align: 'left'
        }
      ]
    }
  }
}
</script>

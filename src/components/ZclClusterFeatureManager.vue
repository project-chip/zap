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
    <div v-if="featureData.length > 0">
      <q-table
        class="my-sticky-header-table"
        :rows="featureData"
        :columns="columns"
        row-key="<b>name</b>"
        dense
        flat
        v-model:pagination="pagination"
        separator="horizontal"
        id="ZclAttributeManager"
      >
        <template v-slot:top>
          <div class="row items-center q-pb-lg q-pt-sm q-pl-sm">
            <div class="col-auto text-bold q-mr-md">
              Server FeatureMap Attribute Value:
            </div>
            <div class="col-2">
              <q-input v-model="featureMapValue" dense outlined disable />
            </div>
          </div>
        </template>
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props" class="table_body">
            <q-td key="enabled" :props="props" auto-width>
              <q-toggle
                :disable="isToggleDisabled(props.row.conformance)"
                class="q-mt-xs v-step-14"
                v-model="enabledFeatures"
                :val="props.row.id"
                indeterminate-value="false"
                keep-color
              />
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
    <div v-else><br />{{ noFeaturesMessage }}</div>
  </div>
</template>

<script>
import EditableAttributesMixin from '../util/editable-attributes-mixin.js'
import uiOptions from '../util/ui-options'
import CommonMixin from '../util/common-mixin'
import dbEnum from '../../src-shared/db-enum'

export default {
  name: 'ZclClusterFeatureManager',
  mixins: [EditableAttributesMixin, uiOptions, CommonMixin],
  computed: {
    featureData() {
      return this.$store.state.zap.features
        .filter((feature) => {
          return this.individualClusterFilterString == ''
            ? true
            : feature.name
                .toLowerCase()
                .includes(this.individualClusterFilterString.toLowerCase())
        })
        .map((feature) => {
          // override feature conformance from device type features if available
          const matchingDeviceTypeFeature = this.deviceTypeFeatures.find(
            (deviceTypeFeature) =>
              deviceTypeFeature.featureId === feature.id &&
              deviceTypeFeature.clusterRef === feature.clusterId
          )
          if (matchingDeviceTypeFeature) {
            feature.conformance = matchingDeviceTypeFeature.conformance
          }
          return feature
        })
    },
    featureMapValue() {
      return this.$store.state.zap.featureMapValue
    },
    enabledFeatures() {
      return this.featureData
        .filter((feature) => {
          return this.getEnabledBitsFromFeatureMapValue(
            this.featureMapValue
          ).includes(feature.bit)
        })
        .map((feature) => feature.id)
    }
  },
  methods: {
    isToggleDisabled(conformance) {
      // disable toggling features for now, will support in future PR
      return true
    },
    getEnabledBitsFromFeatureMapValue(featureMapValue) {
      let enabledBits = []
      for (let i = 0; i < 32; i++) {
        if ((featureMapValue & (1 << i)) != 0) {
          enabledBits.push(i)
        }
      }
      return enabledBits
    }
  },
  data() {
    return {
      noFeaturesMessage: 'No features available for this cluster.',
      pagination: {
        rowsPerPage: 0
      },
      columns: [
        {
          name: dbEnum.feature.name.enabled,
          required: true,
          label: dbEnum.feature.label.enabled,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.featureName,
          required: true,
          label: dbEnum.feature.label.featureName,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.code,
          required: true,
          label: dbEnum.feature.label.code,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.conformance,
          required: true,
          label: dbEnum.feature.label.conformance,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.bit,
          required: true,
          label: dbEnum.feature.label.bit,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.description,
          required: false,
          label: dbEnum.feature.label.description,
          align: 'left'
        }
      ]
    }
  }
}
</script>

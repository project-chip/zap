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
      <span class="v-step-6">
        Endpoint
        {{ this.endpointId[this.selectedEndpointId] }}
        Device Type Features
      </span>
    </div>
    <div class="col column linear-border-wrap">
      <div v-if="deviceTypeFeatures.length > 0">
        <q-table
          class="my-striped-table"
          :rows="deviceTypeFeatures"
          :columns="filteredColumns"
          flat
          v-model:pagination="pagination"
          separator="horizontal"
          id="ZclDeviceTypeFeatureManager"
        >
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th v-for="col in props.cols" :key="col.name" :props="props">
                <div>
                  <template v-if="col.name === 'conformance'">
                    <a
                      :href="documentSource"
                      class="text-primary cursor-pointer"
                      target="_blank"
                      style="text-decoration: none"
                    >
                      {{ col.label }}
                    </a>
                    <q-icon
                      name="info"
                      class="q-pl-sm q-pb-xs"
                      style="font-size: 1rem"
                      color="primary"
                    >
                      <q-tooltip>
                        {{ conformanceSourceTip }}
                      </q-tooltip>
                    </q-icon>
                  </template>
                  <template v-else>
                    {{ col.label }}
                  </template>
                </div>
              </q-th>
            </q-tr>
          </template>
          <template v-slot:body="props">
            <q-tr
              :props="props"
              class="table_body attribute_table_body"
              data-test="feature-row"
            >
              <q-td
                v-if="hasFeatureWithDisabledCluster"
                key="status"
                :props="props"
                class="q-px-none"
                style="width: 30px; max-width: 30px"
              >
                <q-icon
                  v-show="isClusterDisabled(props.row)"
                  name="warning"
                  class="text-amber"
                  style="font-size: 1.5rem"
                />
                <q-tooltip
                  v-if="isClusterDisabled(props.row)"
                  anchor="top middle"
                  self="bottom middle"
                  :offset="[10, 10]"
                >
                  <div
                    v-for="(line, index) in generateDisabledClusterWarning(
                      props.row
                    )"
                    :key="index"
                  >
                    {{ line }}
                  </div>
                </q-tooltip>
              </q-td>
              <q-td key="enabled" :props="props" auto-width>
                <q-toggle
                  :disable="isToggleDisabled(props.row)"
                  class="q-mt-xs v-step-14"
                  v-model="enabledDeviceTypeFeatures"
                  :val="props.row.featureId"
                  indeterminate-value="false"
                  keep-color
                  @update:model-value="(val) => onToggleFeature(props.row, val)"
                  data-test="feature-toggle"
                />
              </q-td>
              <q-td key="deviceType" :props="props" auto-width>
                <div
                  v-for="deviceType in props.row.deviceTypes"
                  :key="deviceType"
                >
                  {{ deviceType }}
                </div>
              </q-td>
              <q-td key="cluster" :props="props" auto-width>
                {{ props.row.cluster }}
              </q-td>
              <q-td key="clusterSide" :props="props" auto-width>
                {{ getClusterSide(props.row) }}
              </q-td>
              <q-td
                key="featureName"
                :props="props"
                auto-width
                data-test="feature-name"
              >
                {{ props.row.name }}
              </q-td>
              <q-td
                key="code"
                :props="props"
                auto-width
                data-test="feature-code"
              >
                {{ props.row.code }}
              </q-td>
              <q-td
                key="conformance"
                :props="props"
                auto-width
                data-test="feature-conformance"
              >
                <span class="text-primary">
                  {{ props.row.conformance }}
                  <q-tooltip>
                    {{ props.row.translation }}
                  </q-tooltip>
                </span>
              </q-td>
              <q-td key="bit" :props="props" auto-width data-test="feature-bit">
                {{ props.row.bit }}
              </q-td>
              <q-td key="description" :props="props" auto-width>
                {{ props.row.description }}
              </q-td>
            </q-tr>
          </template>
        </q-table>
        <q-dialog
          v-model="showDialog"
          persistent
          data-test="feature-update-dialog"
        >
          <q-card>
            <q-card-section>
              <div class="row items-center">
                <div class="text-h6 col">Elements to be updated</div>
              </div>
              <div v-if="attributesToUpdate.length > 0">
                <div
                  class="text-body1"
                  style="margin-top: 15px; padding-left: 20px"
                >
                  Attributes
                </div>
                <ul data-test="attributes-to-update">
                  <li
                    v-for="(attribute, index) in processElementsForDialog(
                      attributesToUpdate
                    )"
                    :key="'attribute' + index"
                    style="margin-bottom: 10px"
                  >
                    {{ attribute }}
                  </li>
                </ul>
              </div>
              <div v-if="commandsToUpdate.length > 0">
                <div
                  class="text-body1"
                  style="margin-top: 15px; padding-left: 20px"
                >
                  Commands
                </div>
                <ul data-test="commands-to-update">
                  <li
                    v-for="(command, index) in processElementsForDialog(
                      commandsToUpdate
                    )"
                    :key="'command' + index"
                    style="margin-bottom: 10px"
                  >
                    {{ command }}
                  </li>
                </ul>
              </div>
              <div v-if="eventsToUpdate.length > 0">
                <div
                  class="text-body1"
                  style="margin-top: 15px; padding-left: 20px"
                >
                  Events
                </div>
                <ul data-test="events-to-update">
                  <li
                    v-for="(event, index) in processElementsForDialog(
                      eventsToUpdate
                    )"
                    :key="'event' + index"
                    style="margin-bottom: 10px"
                  >
                    {{ event }}
                  </li>
                </ul>
              </div>
            </q-card-section>
            <q-card-actions>
              <q-btn label="Cancel" v-close-popup class="col" />
              <q-btn
                label="Confirm"
                color="primary"
                @click="
                  confirmFeatureUpdate(selectedFeature, updatedEnabledFeatures)
                "
                class="col v-step-4 w-step-3"
                data-test="confirm-feature-update"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>
      <div v-else class="q-pa-md">
        <div class="text-body1">
          {{ noDataMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CommonMixin from '../util/common-mixin'
import EditableAttributeMixin from '../util/editable-attributes-mixin'
import featureMixin from '../util/feature-mixin'
import dbEnum from '../../src-shared/db-enum'

export default {
  name: 'ZclDeviceTypeFeatureManager',
  mixins: [CommonMixin, EditableAttributeMixin, featureMixin],
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
    },
    isToggleDisabled(feature) {
      // disable toggling features with unsupported conformance and disabled clusters
      return (
        feature.conformance == dbEnum.conformanceTag.disallowed ||
        feature.conformance == dbEnum.conformanceTag.deprecated ||
        this.isClusterDisabled(feature)
      )
    },
    isClusterDisabled(feature) {
      return this.getMissingClusterSide(feature).length > 0
    },
    getMissingClusterSide(feature) {
      let sides = []
      let clusterId = feature.clusterRef
      if (
        !this.selectionClients.includes(clusterId) &&
        feature.includeClient == 1
      ) {
        sides.push(dbEnum.clusterSide.client)
      }
      if (
        !this.selectionServers.includes(clusterId) &&
        feature.includeServer == 1
      ) {
        sides.push(dbEnum.clusterSide.server)
      }
      return sides
    },
    generateDisabledClusterWarning(feature) {
      let sides = this.getMissingClusterSide(feature).join(' and ')
      return [
        `This feature cannot be toggled because its associated cluster: 
        ${feature.cluster} ${sides} is disabled.`,
        'Enable the cluster to allow toggling this feature.'
      ]
    }
  },
  computed: {
    filteredColumns() {
      return this.hasFeatureWithDisabledCluster
        ? this.columns
        : this.columns.filter(
            (column) => column.name != dbEnum.feature.name.status
          )
    },
    hasFeatureWithDisabledCluster() {
      return this.deviceTypeFeatures.some((feature) =>
        this.isClusterDisabled(feature)
      )
    }
  },
  data() {
    return {
      noDataMessage: 'No device type features available for this endpoint',
      pagination: {
        rowsPerPage: 10
      },
      columns: [
        {
          name: dbEnum.feature.name.status,
          required: false,
          label: dbEnum.feature.label.status,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.enabled,
          required: true,
          label: dbEnum.feature.label.enabled,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.deviceType,
          required: true,
          label: dbEnum.feature.label.deviceType,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.cluster,
          required: true,
          label: dbEnum.feature.label.cluster,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.clusterSide,
          required: true,
          label: dbEnum.feature.label.clusterSide,
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

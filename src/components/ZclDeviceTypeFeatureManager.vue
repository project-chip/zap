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
          <template v-slot:body="props">
            <q-tr :props="props" class="table_body attribute_table_body">
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
                  :val="
                    hashDeviceTypeClusterIdFeatureId(
                      props.row.deviceTypeClusterId,
                      props.row.featureId
                    )
                  "
                  indeterminate-value="false"
                  keep-color
                  @update:model-value="
                    (val) => {
                      onToggleDeviceTypeFeature(props.row, val)
                    }
                  "
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
        <q-dialog v-model="showDialog" :persistent="!noElementsToUpdate">
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
                <ul>
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
                <ul>
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
                <ul>
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
              <div v-if="noElementsToUpdate">
                <div class="text-body1" style="margin-top: 15px">
                  {{ noElementsToUpdateMessage }}
                </div>
              </div>
            </q-card-section>
            <q-card-actions class="row justify-between">
              <q-btn
                flat
                :label="noElementsToUpdate ? 'Close' : 'Cancel Updates'"
                color="primary"
                v-close-popup
              />
              <q-btn
                v-if="!noElementsToUpdate"
                flat
                label="Confirm Updates"
                color="primary"
                @click="
                  confirmFeatureUpdate(selectedFeature, updatedEnabledFeatures)
                "
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
import dbEnum from '../../src-shared/db-enum'
import restApi from '../../src-shared/rest-api'
import { Notify } from 'quasar'

export default {
  name: 'ZclDeviceTypeFeatureManager',
  mixins: [CommonMixin, EditableAttributeMixin],
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
        feature.conformance == 'X' ||
        feature.conformance == 'D' ||
        this.isClusterDisabled(feature)
      )
    },
    onToggleDeviceTypeFeature(featureData, inclusionList) {
      let featureMap = this.buildFeatureMap(featureData, inclusionList)
      this.$serverPost(restApi.uri.checkConformOnFeatureUpdate, {
        featureData: featureData,
        featureMap: featureMap,
        endpointId: this.endpointId[this.selectedEndpointId],
        changeConfirmed: false
      }).then((res) => {
        // store backend response and frontend data for reuse if updates are confirmed
        let {
          attributesToUpdate,
          commandsToUpdate,
          eventsToUpdate,
          displayWarning,
          warningMessage,
          disableChange
        } = res.data

        Object.assign(this, {
          attributesToUpdate,
          commandsToUpdate,
          eventsToUpdate,
          displayWarning,
          warningMessage,
          disableChange
        })

        this.selectedFeature = featureData
        this.updatedEnabledFeatures = inclusionList

        // if change disabled, display warning and do not show confirm dialog
        if (this.disableChange) {
          if (this.displayWarning) {
            this.displayPopUpWarnings(this.warningMessage)
          }
        } else {
          this.showDialog = true
        }
      })
    },
    confirmFeatureUpdate(featureData, inclusionList) {
      let featureMap = this.buildFeatureMap(featureData, inclusionList)
      this.$store
        .dispatch('zap/setRequiredElements', {
          featureMap: featureMap,
          deviceTypeClusterId: featureData.deviceTypeClusterId,
          endpointTypeClusterId: featureData.endpointTypeClusterId
        })
        .then(() => {
          // toggle attributes, commands, and events for correct conformance,
          // and set their conformance warnings
          this.attributesToUpdate.forEach((attribute) => {
            let editContext = {
              action: 'boolean',
              endpointTypeIdList: this.endpointTypeIdList,
              selectedEndpoint: this.selectedEndpointTypeId,
              id: attribute.id,
              value: attribute.value,
              listType: 'selectedAttributes',
              clusterRef: attribute.clusterRef,
              attributeSide: attribute.side,
              reportMinInterval: attribute.reportMinInterval,
              reportMaxInterval: attribute.reportMaxInterval
            }
            this.setRequiredElementNotifications(
              attribute,
              attribute.value,
              'attributes'
            )
            this.$store.dispatch('zap/updateSelectedAttribute', editContext)
          })
          this.commandsToUpdate.forEach((command) => {
            let listType =
              command.source == 'client' ? 'selectedIn' : 'selectedOut'
            let editContext = {
              action: 'boolean',
              endpointTypeIdList: this.endpointTypeIdList,
              id: command.id,
              value: command.value,
              listType: listType,
              clusterRef: command.clusterRef,
              commandSide: command.source
            }
            this.setRequiredElementNotifications(
              command,
              command.value,
              'commands'
            )
            this.$store.dispatch('zap/updateSelectedCommands', editContext)
          })
          this.eventsToUpdate.forEach((event) => {
            let editContext = {
              action: 'boolean',
              endpointTypeId: this.selectedEndpointTypeId,
              id: event.id,
              value: event.value,
              listType: 'selectedEvents',
              clusterRef: event.clusterRef,
              eventSide: event.side
            }
            this.setRequiredElementNotifications(event, event.value, 'events')
            this.$store.dispatch('zap/updateSelectedEvents', editContext)
          })

          // update enabled device type features
          let added = this.featureIsEnabled(featureData, inclusionList)
          let hashedVal = this.hashDeviceTypeClusterIdFeatureId(
            featureData.deviceTypeClusterId,
            featureData.featureId
          )
          this.$store.commit('zap/updateInclusionList', {
            id: hashedVal,
            added: added,
            listType: 'enabledDeviceTypeFeatures',
            view: 'featureView'
          })
        })

      // set notifications and pop-up warnings for the updated feature
      this.$serverPost(restApi.uri.checkConformOnFeatureUpdate, {
        featureData: featureData,
        featureMap: featureMap,
        endpointId: this.endpointId[this.selectedEndpointId],
        changeConfirmed: true
      })
      if (this.displayWarning) {
        this.displayPopUpWarnings(this.warningMessage)
      }

      // update featureMap attribute value for the updated cluster
      this.setFeatureMapAttribute(featureData)

      // close the dialog
      this.showDialog = false
    },
    setFeatureMapAttribute(featureData) {
      let featureMapAttributeId = featureData.featureMapAttributeId
      let bit = featureData.bit
      let featureMapValue = featureData.featureMapValue
      let newValue = parseInt(featureMapValue) ^ (1 << bit)
      newValue = newValue.toString()
      this.$serverPatch(restApi.uri.updateBitOfFeatureMapAttribute, {
        featureMapAttributeId: featureMapAttributeId,
        newValue: newValue
      })
      this.$store.commit('zap/updateFeatureMapAttributeOfFeature', {
        featureMapAttributeId: featureMapAttributeId,
        featureMapValue: newValue
      })
    },
    processElementsForDialog(elementData) {
      return (elementData || [])
        .map((item) =>
          item.value ? 'enabled ' + item.name : 'disabled ' + item.name
        )
        .sort(
          // sort enabled elements before disabled ones
          (a, b) => {
            let aIsEnabled = a.includes('enabled')
            let bIsEnabled = b.includes('enabled')
            if (aIsEnabled && !bIsEnabled) return -1
            if (!aIsEnabled && bIsEnabled) return 1
            return 0
          }
        )
    },
    displayPopUpWarnings(warningMessage) {
      if (!Array.isArray(warningMessage)) {
        warningMessage = [warningMessage]
      }
      for (let warning of warningMessage) {
        Notify.create({
          message: warning,
          type: 'warning',
          classes: 'custom-notification notification-warning',
          position: 'top',
          html: true
        })
      }
    },
    buildFeatureMap(featureData, inclusionList) {
      let featureMap = {}
      this.deviceTypeFeatures.forEach((feature) => {
        if (feature.deviceTypeClusterId === featureData.deviceTypeClusterId) {
          let enabled = this.featureIsEnabled(feature, inclusionList)
          featureMap[feature.code] = enabled ? 1 : 0
        }
      })
      return featureMap
    },
    featureIsEnabled(featureData, inclusionList) {
      return inclusionList.includes(
        this.hashDeviceTypeClusterIdFeatureId(
          featureData.deviceTypeClusterId,
          featureData.featureId
        )
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
        sides.push('client')
      }
      if (
        !this.selectionServers.includes(clusterId) &&
        feature.includeServer == 1
      ) {
        sides.push('server')
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
    noElementsToUpdate() {
      return (
        this.attributesToUpdate.length == 0 &&
        this.commandsToUpdate.length == 0 &&
        this.eventsToUpdate.length == 0
      )
    },
    filteredColumns() {
      return this.hasFeatureWithDisabledCluster
        ? this.columns
        : this.columns.filter(
            (column) => column.name != dbEnum.deviceTypeFeature.name.status
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
      noElementsToUpdateMessage:
        'No elements need to be updated after toggling this feature',
      pagination: {
        rowsPerPage: 10
      },
      showDialog: false,
      attributesToUpdate: [],
      commandsToUpdate: [],
      eventsToUpdate: [],
      disableChange: false,
      displayWarning: false,
      warningMessage: '',
      selectedFeature: {},
      updatedEnabledFeatures: [],
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

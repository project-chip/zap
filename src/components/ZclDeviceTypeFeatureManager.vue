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
          :rows="deviceTypeFeatures"
          :columns="columns"
          flat
          v-model:pagination="pagination"
          separator="horizontal"
          id="ZclDeviceTypeFeatureManager"
        >
          <template v-slot:body="props">
            <q-tr :props="props" class="table_body attribute_table_body">
              <q-td key="enabled" :props="props" auto-width>
                <q-toggle
                  :disable="isToggleDisabled(props.row.conformance)"
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
        <q-dialog v-model="showDialog">
          <q-card>
            <q-card-section>
              <div class="row items-center">
                <div class="text-h6 col">Updated Elements</div>
                <div class="col-1 text-right">
                  <q-btn dense flat icon="close" v-close-popup>
                    <q-tooltip>Close</q-tooltip>
                  </q-btn>
                </div>
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
                    v-for="(attribute, index) in attributesToUpdate"
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
                    v-for="(command, index) in commandsToUpdate"
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
                    v-for="(event, index) in eventsToUpdate"
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
          </q-card>
        </q-dialog>
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
import EditableAttributeMixin from '../util/editable-attributes-mixin'
import dbEnum from '../../src-shared/db-enum'
import restApi from '../../src-shared/rest-api.js'
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
    isToggleDisabled(conformance) {
      // disable togglging unsupported features
      return conformance == 'X' || conformance == 'D'
    },
    onToggleDeviceTypeFeature(featureData, inclusionList) {
      /* when conformance is not properly handled and change is disabled,
        do not set featureMap attribute */
      let disabled = this.updateElementsAndSetWarnings(
        featureData,
        inclusionList
      )
      if (!disabled) {
        this.setFeatureMapAttribute(featureData)
      }
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
    updateElementsAndSetWarnings(featureData, inclusionList) {
      let featureMap = {}
      this.deviceTypeFeatures.forEach((feature) => {
        if (feature.deviceTypeClusterId == featureData.deviceTypeClusterId) {
          let enabled = this.featureIsEnabled(feature, inclusionList)
          featureMap[feature.code] = enabled ? 1 : 0
        }
      })
      this.$serverPost(restApi.uri.checkConformOnFeatureUpdate, {
        featureData: featureData,
        featureMap: featureMap,
        endpointId: this.endpointId[this.selectedEndpointId]
      }).then((res) => {
        let {
          attributesToUpdate,
          commandsToUpdate,
          eventsToUpdate,
          displayWarning,
          warningMessage,
          disableChange
        } = res.data

        // show popup warning message
        if (displayWarning) {
          if (!Array.isArray(warningMessage)) {
            warningMessage = [warningMessage]
          }
          for (let message of warningMessage) {
            Notify.create({
              message: message,
              type: 'warning',
              classes: 'custom-notification notification-warning',
              position: 'top',
              html: true
            })
          }
        }

        // if diableChange is true, the case is too complex to handle
        // throw warnings and skip the following actions
        if (disableChange) {
          return disableChange
        }

        // toggle attributes, commands, and events for correct conformance
        attributesToUpdate.forEach((attribute) => {
          let editContext = {
            action: 'boolean',
            endpointTypeIdList: this.endpointTypeIdList,
            id: attribute.id,
            value: attribute.value,
            listType: 'selectedAttributes',
            clusterRef: attribute.clusterRef,
            attributeSide: attribute.side,
            reportMinInterval: attribute.reportMinInterval,
            reportMaxInterval: attribute.reportMaxInterval
          }
          this.$store.dispatch('zap/updateSelectedAttribute', editContext)
        })
        commandsToUpdate.forEach((command) => {
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
          this.$store.dispatch('zap/updateSelectedCommands', editContext)
        })
        eventsToUpdate.forEach((event) => {
          let editContext = {
            action: 'boolean',
            endpointTypeId: this.selectedEndpointTypeId,
            id: event.id,
            value: event.value,
            listType: 'selectedEvents',
            clusterRef: event.clusterRef,
            eventSide: event.side
          }
          this.$store.dispatch('zap/updateSelectedEvents', editContext)
        })

        // prepare messages and show dialog
        this.attributesToUpdate = attributesToUpdate
          .map((attribute) =>
            attribute.value
              ? 'enabled ' + attribute.name
              : 'disabled ' + attribute.name
          )
          .sort((a, b) => (a.includes('enabled') ? -1 : 1))
        this.commandsToUpdate = commandsToUpdate
          .map((command) =>
            command.value
              ? 'enabled ' + command.name
              : 'disabled ' + command.name
          )
          .sort((a, b) => (a.includes('enabled') ? -1 : 1))
        this.eventsToUpdate = eventsToUpdate
          .map((event) =>
            event.value ? 'enabled ' + event.name : 'disabled ' + event.name
          )
          .sort((a, b) => (a.includes('enabled') ? -1 : 1))
        this.showDialog = true

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

        return disableChange
      })
    },
    featureIsEnabled(featureData, inclusionList) {
      return inclusionList.includes(
        this.hashDeviceTypeClusterIdFeatureId(
          featureData.deviceTypeClusterId,
          featureData.featureId
        )
      )
    }
  },
  computed: {
    noElementsToUpdate() {
      return (
        this.attributesToUpdate.length == 0 &&
        this.commandsToUpdate.length == 0 &&
        this.eventsToUpdate.length == 0
      )
    }
  },
  data() {
    return {
      nodataMessage: 'No device type features available for this endpoint',
      noElementsToUpdateMessage:
        'No elements need to be updated \
                                  after togglging this feature',
      pagination: {
        rowsPerPage: 10
      },
      showDialog: false,
      attributesToUpdate: [],
      commandsToUpdate: [],
      eventsToUpdate: [],
      columns: [
        {
          name: dbEnum.deviceTypeFeature.name.enabled,
          required: true,
          label: dbEnum.deviceTypeFeature.label.enabled,
          align: 'left'
        },
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

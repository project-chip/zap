/**
 *
 *    Copyright (c) 2020 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import restApi from '../../src-shared/rest-api'
import { Notify } from 'quasar'
import commonMixin from '../util/common-mixin'
import * as dbEnum from '../../src-shared/db-enum'

export default {
  mixins: [commonMixin],
  computed: {
    deviceTypeFeatures() {
      return this.$store.state.zap.featureView.deviceTypeFeatures
    },
    // attribute Id for the feature map attribute, used to query feature map attribute
    featureMapAttributeId() {
      return this.$store.state.zap.attributes.find(
        (attribute) =>
          attribute.name == dbEnum.featureMapAttribute.name &&
          attribute.code == dbEnum.featureMapAttribute.code &&
          attribute.side == dbEnum.clusterSide.server
      )?.id
    },
    featureMapAttribute() {
      return this.$store.state.zap.featureMapAttribute
    },
    featureMapValue() {
      return this.featureMapAttribute
        ? parseInt(this.featureMapAttribute.value)
        : null
    },
    enabledDeviceTypeFeatures() {
      return this.$store.state.zap.featureView.enabledDeviceTypeFeatures
    },
    noElementsToUpdate() {
      return (
        this.attributesToUpdate.length == 0 &&
        this.commandsToUpdate.length == 0 &&
        this.eventsToUpdate.length == 0
      )
    },
    clusterFeatures() {
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
              deviceTypeFeature.featureId === feature.featureId &&
              deviceTypeFeature.clusterRef === feature.clusterRef
          )
          if (matchingDeviceTypeFeature) {
            feature.conformance = matchingDeviceTypeFeature.conformance
            feature.deviceTypes = matchingDeviceTypeFeature.deviceTypes
          }
          feature.cluster = this.selectedCluster
            ? this.selectedCluster.name
            : ''
          if (this.featureMapValue != null) {
            feature.featureMapValue = this.featureMapValue
            feature.featureMapAttributeId = this.featureMapAttribute.id
          }
          return feature
        })
    },
    enabledClusterFeatures() {
      return this.clusterFeatures
        .filter((feature) => {
          return this.getEnabledBitsFromFeatureMapValue(
            this.featureMapValue
          ).includes(feature.bit)
        })
        .map((feature) => feature.featureId)
    }
  },
  methods: {
    async onToggleFeature(featureData, inclusionList) {
      // if the toggle is from a device type feature, get cluster data of the feature,
      // and load featureMap attribute for the cluster
      if (
        !this.selectedCluster ||
        Object.keys(this.selectedCluster).length == 0 ||
        this.selectedCluster.id !== featureData.clusterRef
      ) {
        let clusterData = this.getClusterDataByRef(featureData.clusterRef)
        await this.$store.dispatch('zap/updateSelectedCluster', clusterData)

        await this.loadFeatureMapAttribute(clusterData)
      }

      // build feature map after featureMap attribute is synced
      let featureMap = this.buildFeatureMap(inclusionList, featureData)

      this.$serverPost(restApi.uri.checkConformOnFeatureUpdate, {
        featureData: featureData,
        featureMap: featureMap,
        clusterFeatures: this.clusterFeatures,
        endpointId: this.endpointId[this.selectedEndpointId],
        endpointTypeId: this.selectedEndpointTypeId,
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
        } else if (this.noElementsToUpdate) {
          // if no elements need to be updated, update the feature directly without confirm dialog
          this.confirmFeatureUpdate(featureData, inclusionList)
        } else {
          this.showDialog = true
        }
      })
    },
    async confirmFeatureUpdate(featureData, inclusionList) {
      let featureMap = this.buildFeatureMap(inclusionList, featureData)

      // update attributes, commands, and events for the toggle feature, and set notifications
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
        let listType = command.source == 'client' ? 'selectedIn' : 'selectedOut'
        let editContext = {
          action: 'boolean',
          endpointTypeIdList: this.endpointTypeIdList,
          id: command.id,
          value: command.value,
          listType: listType,
          clusterRef: command.clusterRef,
          commandSide: command.source
        }
        this.setRequiredElementNotifications(command, command.value, 'commands')
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

      // update device type features in the store
      let added = this.featureIsEnabled(featureData, inclusionList)
      this.$store.commit('zap/updateInclusionList', {
        id: featureData.featureId,
        added: added,
        listType: 'enabledDeviceTypeFeatures',
        view: 'featureView'
      })

      // set notifications and pop-up warnings for the updated feature
      this.$serverPost(restApi.uri.checkConformOnFeatureUpdate, {
        featureData: featureData,
        featureMap: featureMap,
        clusterFeatures: this.clusterFeatures,
        endpointId: this.endpointId[this.selectedEndpointId],
        endpointTypeId: this.selectedEndpointTypeId,
        changeConfirmed: true
      })
      if (this.displayWarning) {
        this.displayPopUpWarnings(this.warningMessage)
      }

      // update featureMap attribute value for the updated cluster
      this.updateFeatureMapAttribute(featureData.bit)

      this.setRequiredConformElement()

      // close the dialog
      this.showDialog = false

      // clean the state of variables related to the dialog
      Object.assign(this, {
        displayWarning: false,
        warningMessage: '',
        disableChange: false,
        selectedFeature: {},
        updatedEnabledFeatures: [],
        attributesToUpdate: [],
        commandsToUpdate: [],
        eventsToUpdate: []
      })
    },
    updateFeatureMapAttribute(updatedFeatureBit) {
      let attribute = this.featureMapAttribute
      let id = attribute.id
      let value = this.featureMapValue ^ (1 << updatedFeatureBit)
      let newValue = value.toString()

      // update featureMap value in backend
      this.$serverPatch(restApi.uri.updateBitOfFeatureMapAttribute, {
        featureMapAttributeId: id,
        newValue: newValue
      })

      // update featureMap attribute in frontend store
      this.$store.commit('zap/updateFeatureMapAttributeOfDeviceTypeFeatures', {
        featureMapAttributeId: id,
        featureMapValue: newValue
      })
      this.$store.commit('zap/updateFeatureMapAttribute', {
        ...this.featureMapAttribute,
        value: newValue
      })

      // sync featureMap value attribute with cluster feature updates
      let editContext = {
        action: 'text',
        endpointTypeIdList: this.endpointTypeIdList,
        selectedEndpoint: this.selectedEndpointTypeId,
        id: attribute.attributeRef,
        value: value,
        listType: 'defaultValue',
        clusterRef: attribute.clusterRef,
        attributeSide: dbEnum.clusterSide.server,
        reportMinInterval: attribute.minInterval,
        reportMaxInterval: attribute.maxInterval
      }
      this.$store.dispatch('zap/updateSelectedAttribute', editContext)
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
    // build new feature map after both device type and cluster feature updates
    buildFeatureMap(inclusionList, updatedFeature = null) {
      let featureMap = {}
      if (updatedFeature) {
        // for device type feature updates, merge cluster feature data into inclusionList
        let clusterInclusionList = [...this.enabledClusterFeatures]
        // handle edge case for disabling a device type feature: remove it from cluster inclusionList
        if (!this.featureIsEnabled(updatedFeature, inclusionList)) {
          clusterInclusionList = clusterInclusionList.filter(
            (featureId) => featureId !== updatedFeature.featureId
          )
        }
        inclusionList = [...clusterInclusionList, ...inclusionList]
      }
      this.clusterFeatures.forEach((feature) => {
        featureMap[feature.code] = this.featureIsEnabled(feature, inclusionList)
      })
      return featureMap
    },
    featureIsEnabled(featureData, inclusionList) {
      return inclusionList.includes(featureData.featureId)
    },
    // set required and unsupported elements based on conformance for the selected cluster
    setRequiredConformElement() {
      if (Object.keys(this.clusterFeatures).length > 0) {
        let featureMap = this.buildFeatureMap(this.enabledClusterFeatures)
        this.$store.dispatch('zap/setRequiredElements', {
          featureMap: featureMap,
          endpointTypeId: this.selectedEndpointTypeId,
          clusterRef: this.selectedClusterId
        })
      }
    },
    getClusterDataByRef(clusterRef) {
      return this.$store.state.zap.clusters.find(
        (cluster) => cluster.id == clusterRef
      )
    },
    processElementsForDialog(elementData) {
      return (elementData || [])
        .map((item) =>
          item.value ? 'enable ' + item.name : 'disable ' + item.name
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
    async loadFeatureMapAttribute(cluster) {
      await this.$store.dispatch('zap/updateFeatureMapAttribute', {
        attributeId: this.featureMapAttributeId,
        clusterId: cluster.id,
        endpointTypeId: this.selectedEndpointTypeId
      })
    },
    getEnabledBitsFromFeatureMapValue(featureMapValue) {
      let enabledBits = []
      for (let i = 0; i < 32; i++) {
        if ((featureMapValue & (1 << i)) != 0) {
          enabledBits.push(i)
        }
      }
      return enabledBits
    },
    getFeatureMapBinary(value) {
      let totalBits = this.clusterFeatures.length
      return value.toString(2).padStart(totalBits, '0')
    }
  },
  data() {
    return {
      showDialog: false,
      attributesToUpdate: [],
      commandsToUpdate: [],
      eventsToUpdate: [],
      disableChange: false,
      displayWarning: false,
      warningMessage: '',
      selectedFeature: {},
      updatedEnabledFeatures: [],
      conformanceSourceTip: 'Click to view related documentation',
      documentSource:
        'https://docs.silabs.com/zap-tool/latest/zap-users-guide/matter-conformance'
    }
  }
}

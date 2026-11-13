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
    visibleDeviceTypeFeatures() {
      return this.deviceTypeFeatures.filter(
        (feature) =>
          !this.isObsoleteElement(feature) ||
          this.isLegacyDisabledObsoleteElement('features', feature)
      )
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
        .filter(
          (feature) =>
            !this.isObsoleteElement(feature) ||
            this.isLegacyDisabledObsoleteElement('features', feature)
        )
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

      const enabled = this.featureIsEnabled(featureData, inclusionList)

      this.$serverPost(restApi.uri.checkConformOnFeatureUpdate, {
        featureData: featureData,
        ...this.featureTarget(featureData),
        enabled
      }).then((res) => {
        // A refusal has already been shown by the request layer.
        if (!res) return
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
      const enabled = this.featureIsEnabled(featureData, inclusionList)
      const outcome = await this.$serverPost(restApi.uri.applyFeatureUpdate, {
        ...this.featureTarget(featureData),
        feature: featureData.code,
        enabled
      })
      if (!outcome) {
        // Refused; the request layer has shown why. Leave the dialog open.
        return
      }

      this.$store.commit('zap/updateInclusionList', {
        id: featureData.featureId,
        added: enabled,
        listType: 'enabledDeviceTypeFeatures',
        view: 'featureView'
      })
      this.$store.commit('zap/updateFeatureMapAttribute', {
        ...this.featureMapAttribute,
        value: outcome.data.newValue
      })
      this.$store.commit('zap/updateFeatureMapAttributeOfDeviceTypeFeatures', {
        featureMapAttributeId: this.featureMapAttribute.id,
        featureMapValue: String(outcome.data.newValue)
      })
      await this.$store.dispatch(
        'zap/refreshEndpointTypeConfiguration',
        this.selectedEndpointTypeId
      )
      if (this.displayWarning) {
        this.displayPopUpWarnings(this.warningMessage)
      }

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
    featureIsEnabled(featureData, inclusionList) {
      return inclusionList.includes(featureData.featureId)
    },
    /**
     * The endpoint and cluster a feature request is about, as database ids.
     * The interface knows the exact rows, so the backend needs no lookup by
     * endpoint number or cluster name, which can be ambiguous.
     */
    featureTarget(featureData = null) {
      let clusterRef =
        featureData && featureData.clusterRef != null
          ? featureData.clusterRef
          : this.selectedClusterId
      return {
        endpointRef: this.selectedEndpointId,
        clusterRef: clusterRef
      }
    },
    // set required and unsupported elements based on conformance for the selected cluster
    setRequiredConformElement() {
      if (Object.keys(this.clusterFeatures).length > 0) {
        this.$store.dispatch('zap/setRequiredElements', this.featureTarget())
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

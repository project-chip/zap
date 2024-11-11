/*
 *
 *    Copyright (c) 2021 Project CHIP Authors
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

export default {
  data() {
    return {
      globalLists: [
        'EventList',
        'AttributeList',
        'GeneratedCommandList',
        'AcceptedCommandList'
      ]
    }
  },
  computed: {
    zapState() {
      return this.$store.state.zap
    },
    zclProperties() {
      return this.zapState.selectedZapConfig?.zclProperties
    },
    zclPropertiesNonEmpty() {
      return this.zclProperties && this.zclProperties.length > 0
    },
    multiDeviceCategories() {
      if (this.zclPropertiesNonEmpty) {
        return this.zclProperties.map((zclProp) => zclProp.category)
      } else {
        const selectedZapConfig = this.zapState.selectedZapConfig
        let categories = selectedZapConfig?.zclProperties?.category
        if (
          !categories &&
          selectedZapConfig &&
          selectedZapConfig.zclProperties &&
          selectedZapConfig.zclProperties.length == 0 &&
          this.zapState.packages &&
          this.zapState.packages.length > 0
        ) {
          categories = this.zapState.packages[0]?.sessionPackage?.category
        }
        return categories
      }
    },
    deviceTypeFeatureDataExists() {
      return this.$store.state.zap.featureView.deviceTypeFeatureExists
    },
    enableMatterFeatures() {
      // Check if cmpEnableMatterFeatures is true
      if (this.$store.state.zap.cmpEnableMatterFeatures) {
        return true
      } else if (this.$store.state.zap.cmpEnableZigbeeFeatures) {
        return false
      }

      // Proceed with the next set of conditions
      return this.zclPropertiesNonEmpty
        ? this.multiDeviceCategories.includes('matter')
        : this.multiDeviceCategories == 'matter'
    },
    enableZigbeeFeatures() {
      // Check if cmpEnableZigbeeFeatures is true
      if (this.$store.state.zap.cmpEnableZigbeeFeatures) {
        return true
      } else if (this.$store.state.zap.cmpEnableMatterFeatures) {
        return false
      }

      // Proceed with the next set of conditions
      return this.zclPropertiesNonEmpty
        ? this.multiDeviceCategories.includes('zigbee')
        : this.multiDeviceCategories === 'zigbee' || !this.multiDeviceCategories
    },
    enableProfileId() {
      return this.enableZigbeeFeatures
    },
    enableNetworkId() {
      return this.enableZigbeeFeatures
    },
    enableSingleton() {
      return this.enableZigbeeFeatures
    },
    enableBounded() {
      return this.enableZigbeeFeatures
    },
    enableMultipleDevice() {
      return this.enableMatterFeatures
    },
    enablePrimaryDevice() {
      return this.enableMatterFeatures
    },
    enableParentEndpoint() {
      return this.enableMatterFeatures
    },
    enableFeature() {
      return this.enableMatterFeatures && this.deviceTypeFeatureDataExists
    },
    enableServerOnly() {
      return this.enableMatterFeatures
    }
  }
}

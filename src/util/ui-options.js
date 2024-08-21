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
      enableProfileId: false,
      enableNetworkId: false,
      enableMultipleDevice: false,
      enablePrimaryDevice: false,
      enableParentEndpoint: false,
      enableServerOnly: false,
      enableSingleton: false,
      enableBounded: false,
      globalLists: [
        'EventList',
        'AttributeList',
        'GeneratedCommandList',
        'AcceptedCommandList'
      ]
    }
  },
  mounted() {
    const zapState = this.$store.state.zap
    const zclProperties = zapState.selectedZapConfig?.zclProperties
    let multiDeviceCategories = []
    let enableMatterFeatures = false
    let enableZigbeeFeatures = false
    if (Array.isArray(zclProperties) && zclProperties.length > 0) {
      multiDeviceCategories = zclProperties.map((zclProp) => zclProp.category)
      enableMatterFeatures = multiDeviceCategories.includes('matter')
      enableZigbeeFeatures = multiDeviceCategories.includes('zigbee')
    } else {
      let selectedZapConfig = zapState.selectedZapConfig
      multiDeviceCategories = selectedZapConfig?.zclProperties?.category
      // the use case when there is only one zcl and template package and user
      // does not have any packages to select from.
      if (
        !multiDeviceCategories &&
        selectedZapConfig &&
        selectedZapConfig.zclProperties &&
        selectedZapConfig.zclProperties.length == 0 &&
        zapState.packages &&
        zapState.packages.length > 0
      ) {
        multiDeviceCategories = zapState.packages[0]?.sessionPackage?.category
      }
      enableMatterFeatures = multiDeviceCategories == 'matter'
      // Showing zigbee UI by default when category is not defined
      enableZigbeeFeatures =
        multiDeviceCategories == 'zigbee' || !multiDeviceCategories
    }

    this.enableProfileId = enableZigbeeFeatures
    this.enableNetworkId = enableZigbeeFeatures
    this.enableSingleton = enableZigbeeFeatures
    this.enableBounded = enableZigbeeFeatures
    this.enableMultipleDevice = enableMatterFeatures
    this.enablePrimaryDevice = enableMatterFeatures
    this.enableParentEndpoint = enableMatterFeatures
    this.enableServerOnly = enableMatterFeatures & !enableZigbeeFeatures
  }
}

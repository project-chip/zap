// mixin.js
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
    }
  },
  mounted() {
    const enableZigbeeFeatures =
      this.$store.state.zap.selectedZapConfig?.zclProperties?.category ===
      'zigbee'
    this.enableProfileId = enableZigbeeFeatures
    this.enableNetworkId = enableZigbeeFeatures
    this.enableSingleton = enableZigbeeFeatures
    this.enableBounded = enableZigbeeFeatures
    const enableMatterFeatures =
      this.$store.state.zap.selectedZapConfig?.zclProperties?.category ===
      'matter'
    this.enableMultipleDevice = enableMatterFeatures
    this.enablePrimaryDevice = enableMatterFeatures
    this.enableParentEndpoint = enableMatterFeatures
    this.enableServerOnly = enableMatterFeatures
  },
}

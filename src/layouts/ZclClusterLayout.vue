<template>
  <div class="q-pa-md bg-grey-10 text-white">
    <q-splitter
      v-model="splitterModel"
      separator-class="bg-orange"
      separator-style="width: 3px"
      style="height: 600px;"
    >
      <template v-slot:before>
        <div class="q-pa-md">
          <ZclEndpointTypeConfig class="bg-grey-10 text-white" />
          <ZclEndpointConfig class="bg-grey-10 text-white" />
          <ZclClusterList class="bg-grey-10 text-white" />
        </div>
      </template>
      <template v-slot:after>
        <div class="q-pa-md">
          <ZclClusterDetails class="bg-grey-10 text-white" />
        </div>
      </template>
    </q-splitter>
  </div>
</template>
<script>
import ZclEndpointConfig from '../components/ZclEndpointConfig.vue'
import ZclEndpointTypeConfig from '../components/ZclEndpointTypeConfig.vue'
import ZclClusterList from '../components/ZclClusterList.vue'
import ZclClusterDetails from '../components/ZclClusterDetail.vue'
export default {
  name: 'ZclClusterLayout',
  components: {
    ZclEndpointConfig,
    ZclClusterList,
    ZclEndpointTypeConfig,
    ZclClusterDetails,
  },
  mounted() {
    this.$serverOn('zcl-item-list', (event, arg) => {
      if (arg.type === 'cluster') {
        this.$store.dispatch('zap/updateClusters', arg.data)
      }
    })
    this.$serverGet('/cluster/all')
  },
  data() {
    return {
      splitterModel: 50,
    }
  },
}
</script>

<!-- Copyright (c) 2019 Silicon Labs. All rights reserved. -->
<template>
  <div>
    <div v-show="selectedEndpointId.length == 0 && item.length > 0">
      Please select an endpoint type before trying to configure anything.
    </div>
    <div v-show="item.length > 0 && selectedEndpointId.length > 0">
      <zcl-cluster-info />
      <q-tabs v-model="tab" dense align="justify">
        <q-tab name="attributes" label="Attributes" />
        <q-tab name="commands" label="Commands" />
        <q-tab name="reporting" label="Reporting" />
      </q-tabs>

      <div class="col" v-show="tab == 'attributes'">
        <ZclAttributeView />
      </div>
      <div class="col" v-show="tab == 'commands'">
        <ZclCommandView />
      </div>
      <div class="col" v-show="tab == 'reporting'">
        <ZclReportingView />
      </div>
    </div>
  </div>
</template>

<script>
import ZclAttributeView from './ZclAttributeView.vue'
import ZclCommandView from './ZclCommandView.vue'
import ZclClusterInfo from './ZclClusterInfo.vue'
import ZclReportingView from './ZclReportingView.vue'
export default {
  name: 'ZclClusterDetail',
  computed: {
    item: {
      get() {
        return this.$store.state.zap.clustersView.selected
      },
    },
    selectedEndpointId: {
      get() {
        return this.$store.state.zap.endpointTypeView.selectedEndpointType
      },
    },
  },
  data() {
    return {
      tab: 'attributes',
    }
  },
  components: {
    ZclAttributeView,
    ZclCommandView,
    ZclClusterInfo,
    ZclReportingView,
  },
}
</script>

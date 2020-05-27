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

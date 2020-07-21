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
    <q-page padding>
      <div class="row q-mb-md">
        <q-btn
          flat
          dense
          color="primary"
          size="xs"
          icon="keyboard_arrow_left"
        />
        <q-breadcrumbs>
          <!-- not sure how this aspect will work so it was left alone -->
          <q-breadcrumbs-el
            v-for="locationBreadcrum in clusters.locationBreadcrums"
            :key="locationBreadcrum"
          >
            {{ locationBreadcrum }}
          </q-breadcrumbs-el>
        </q-breadcrumbs>
      </div>

      <h2>
        <b>{{ item.label }}</b>
      </h2>

      <div class="row q-pb-md">
        <div class="col">
          <p v-if="clusters.serverEnabled">
            Cluster ID: {{ item.id }}, Enabled for <b>Server</b>
          </p>
          <p v-else>Cluster ID: {{ item.id }}, Not Enabled for <b>Server</b></p>
        </div>
        <div>
          <q-toggle
            v-model="clusters.commandDiscovery"
            label="Enable Command Discovery"
          ></q-toggle>
          <q-btn round flat icon="info" size="md" color="grey">
            <q-tooltip
              >An explanation of toggling Enable Command Discovery</q-tooltip
            >
          </q-btn>
        </div>
      </div>

      <div>
        <q-tabs v-model="tab" dense active-color="blue" align="left">
          <q-tab name="attributes" label="Attributes" />
          <q-tab name="reporting" label="Reporting" />
          <q-tab name="commands" label="Commands" />
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
    </q-page>
  </div>
</template>
<script>
import ZclAttributeView from './ZclAttributeView.vue'
import ZclCommandView from './ZclCommandView.vue'
import ZclClusterInfo from './ZclClusterInfo.vue'
import ZclReportingView from './ZclReportingView.vue'

export default {
  name: 'ZclClusterView',
  onMounted() {},
  computed: {
    item: {
      get() {
        return this.$store.state.zap.clustersView.selected[0]
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
      clusters: {
        label: 'On/Off',
        id: '0x0006',
        serverEnabled: true,
        commandDiscovery: true,
        locationBreadcrums: [
          'Endpoint x0001',
          'General Clusters',
          'Configure On/Off',
        ],
      },
      tab: 'attributes',
    }
  },

  components: {
    ZclAttributeView,
    ZclCommandView,
    ZclReportingView,
  },
}
</script>

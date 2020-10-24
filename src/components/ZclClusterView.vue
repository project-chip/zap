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
    <div class="row q-py-md">
      <strong>
        <q-breadcrumbs>
          <!-- this needs to be updated depending on how the pages will work -->
          <q-breadcrumbs-el icon="keyboard_arrow_left" to="/">
            Endpoint x{{ this.endpointId[this.selectedEndpointId] }}
          </q-breadcrumbs-el>
          <q-breadcrumbs-el to="/">
            {{ selectedCluster.domainName }}
          </q-breadcrumbs-el>
          <q-breadcrumbs-el to="/">{{
            selectedCluster.label
          }}</q-breadcrumbs-el>
        </q-breadcrumbs>
      </strong>
    </div>

    <h5 style="margin: 10px 0 0px">
      <strong>
        {{ selectedCluster.label }}
      </strong>
    </h5>
    <div class="row q-py-none">
      <div class="col">
        Cluster ID: {{ asHex(selectedCluster.code, 4) }}, Enabled for
        <strong> {{ enabledMessage }} </strong>
      </div>
      <div>
        <q-toggle
          :value="commandDiscoverySetting == 1 ? true : false"
          label="Enable Command Discovery"
          @input="handleOptionChange('commandDiscovery', $event)"
        ></q-toggle>
        <q-btn round flat icon="info" size="md" color="grey">
          <q-tooltip> Enable Command Discovery for your project </q-tooltip>
        </q-btn>
      </div>
    </div>

    <div class="q-pb-sm">
      <q-tabs v-model="tab" dense active-color="blue" align="left">
        <q-tab name="attributes" label="Attributes" />
        <q-tab name="reporting" label="Attribute Reporting" />
        <q-tab name="commands" label="Commands" />
      </q-tabs>

      <q-separator />
      <div v-show="Object.keys(selectedCluster).length > 0">
        <div class="col" v-show="tab == 'attributes'">
          <ZclAttributeManager />
        </div>
        <div class="col" v-show="tab == 'commands'">
          <ZclCommandManager />
        </div>
        <div class="col" v-show="tab == 'reporting'">
          <ZclAttributeReportingManager />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import ZclAttributeManager from './ZclAttributeManager.vue'
import ZclAttributeReportingManager from './ZclAttributeReportingManager.vue'
import ZclCommandManager from './ZclCommandManager.vue'
import CommonMixin from '../util/common-mixin'

export default {
  name: 'ZclClusterView',
  mixins: [CommonMixin],
  computed: {
    enabledMessage: {
      get() {
        if (
          this.selectionClients.includes(this.selectedClusterId) &&
          this.selectionServers.includes(this.selectedClusterId)
        )
          return ' Client & Server'
        if (this.selectionServers.includes(this.selectedClusterId))
          return ' Server'
        if (this.selectionClients.includes(this.selectedClusterId))
          return ' Client'
        return ' none'
      },
    },
    commandDiscoverySetting: {
      get() {
        return this.$store.state.zap.selectedGenericOptions['commandDiscovery']
      },
    },
  },
  methods: {
    handleOptionChange(option, value) {
      console.log(this.commandDiscoverySetting)
      this.$store.dispatch('zap/setSelectedGenericKey', {
        option: option,
        value: value,
      })
    },
  },
  data() {
    return {
      tab: 'attributes',
    }
  },

  components: {
    ZclCommandManager,
    ZclAttributeManager,
    ZclAttributeReportingManager,
  },
}
</script>

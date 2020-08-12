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
  <div v-show="selectedEndpointId.length != 0">
    <q-card flat square>
      <div class="row">
        <q-toolbar>
          <q-toolbar-title style="font-weight: bolder;">
            Endpoint x{{ this.endpointId[this.selectedEndpointId] }} Clusters
          </q-toolbar-title>
        </q-toolbar>
      </div>
      <div class="row bar align=left;">
        <q-btn
          class="col-6 left"
          align="left"
          text-color="primary"
          icon="add"
          label="Add Custom ZCL"
          flat
          :ripple="false"
          :unelevated="false"
          :outline="none"
        />
        <div class="row">
          <div
            style="
              vertical-align: middle;
              text-align: center;
              padding: 10px 0 0 0;
            "
          >
            Show
          </div>
          &nbsp; &nbsp;

          <div>
            <q-select
              outlined
              v-model="test"
              bg-color="white"
              dense
              class="col-2"
            />
          </div>
        </div>
        <q-space />
        <q-input
          dense
          outlined
          bg-color="white"
          class="col-4"
          placeholder="Search Clusters"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <q-list>
        <div v-for="domainName in domainNames" :key="domainName">
          <q-expansion-item :label="domainName" icon="play_arrow">
            <zcl-domain-cluster-view :domainName="domainName" />
          </q-expansion-item>
        </div>
      </q-list>
    </q-card>
  </div>
</template>
<script>
import ZclDomainClusterView from './ZclDomainClusterView.vue'

export default {
  name: 'ZclClusterManager',
  computed: {
    selectedEndpointId: {
      get() {
        return this.$store.state.zap.endpointTypeView.selectedEndpointType
      },
    },
    endpointId: {
      get() {
        return this.$store.state.zap.endpointView.endpointId
      },
    },
    endpointType: {
      get() {
        return this.$store.state.zap.endpointView.endpointType
      },
    },
    domainNames: {
      get() {
        return [
          ...new Set(this.$store.state.zap.clusters.map((a) => a.domainName)),
        ]
      },
    },
    clusters: {
      get() {
        return this.$store.state.zap.clusters
      },
    },
  },
  methods: {
    clusterDomains(domainName) {
      return this.clusters
        .filter((a) => {
          return a.domainName == domainName
        })
        .sort(function (b, a) {
          return a.code > b.code
        })
    },
  },
  data() {
    return {
      test: 'All Clusters',
    }
  },
  components: {
    ZclDomainClusterView,
  },
}
</script>

<!-- Notice lang="scss" -->
<style lang="scss">
.bar {
  background-color: $grey-4;
  padding: 15px 15px 15px 15px;
}
</style>

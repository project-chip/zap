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
  <div v-if="selectedEndpointTypeId.length != 0">
    <div class="row justify-between q-py-md">
      <div
        v-on:click.ctrl="showVersion"
        v-if="showPreviewTab && this.endpointId[this.selectedEndpointId]"
      >
        <q-select
          class=""
          outlined
          :options="endpoints"
          :model-value="selectedEndpointId"
          dense
          emit-value
          map-options
          @update:model-value="setSelectedEndpointType($event)"
        />
      </div>
      <div v-else class="text-h5">
        <span class="v-step-6"
          >Endpoint
          {{ this.endpointId[this.selectedEndpointId] }} Clusters</span
        >
      </div>
      <div class="row q-gutter-x-sm">
        <div v-if="isFeatureEnabled">
          <q-btn
            class="full-height"
            flat
            rounded
            label="Device Type Features"
            color="secondary"
            @click="updateDeviceTypeFeatures"
            to="/feature"
          />
        </div>
        <q-btn
          v-if="isClusterDocumentationAvailable"
          flat
          color="grey"
          dense
          icon="sym_o_quick_reference"
          @click="openClusterDocumentation"
        >
          <q-tooltip> Cluster Specification </q-tooltip>
        </q-btn>
        <div class="v-step-7">
          <q-select
            outlined
            :model-value="filter"
            :options="filterOptions"
            dense
            @update:model-value="changeDomainFilter($event)"
            data-test="filter-input"
            data-cy="cluster-domain-filter"
          />
        </div>

        <div>
          <q-input
            dense
            outlined
            clearable
            placeholder="Search Clusters"
            @update:model-value="changeFilterString($event)"
            @clear="changeFilterString('')"
            :model-value="filterString"
            data-test="search-clusters"
            data-cy="cluster-text-filter"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div v-for="actionOption in actionOptions" :key="actionOption.label">
          <q-btn
            class="full-height close-all-button"
            flat
            rounded
            @click="doActionFilter(actionOption)"
            :label="actionOption.label"
            color="secondary"
            :data-cy="
              'cluster-btn-' +
              actionOption.label.replace(/\s/g, '').toLowerCase()
            "
          />
        </div>
      </div>
    </div>

    <q-list class="cluster-list">
      <div v-for="(domainName, index) in domainNames" :key="domainName.id">
        <div v-show="clusterDomains(domainName).length > 0">
          <q-expansion-item
            :id="domainName"
            :label="domainName"
            :ref="domainName + index"
            @update:model-value="setOpenDomain(domainName, $event)"
            :model-value="getDomainOpenState(domainName)"
            data-test="Cluster"
            :data-cy="'cluster-' + domainName.replace(/\s/g, '').toLowerCase()"
            header-class="bg-white text-primary"
          >
            <q-card>
              <q-card-section>
                <zcl-domain-cluster-view
                  :domainName="domainName"
                  :clusters="clusterDomains(domainName)"
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </div>
      </div>
    </q-list>
  </div>
</template>

<style lang="scss">
.close-all-button {
  color: #67696d !important;
}
</style>

<script>
import ZclDomainClusterView from './ZclDomainClusterView.vue'
import CommonMixin from '../util/common-mixin'
import { scroll } from 'quasar'
const { getScrollTarget, setVerticalScrollPosition } = scroll
import * as dbEnum from '../../src-shared/db-enum.js'

export default {
  name: 'ZclClusterManager',
  props: ['endpointTypeReference'],
  mixins: [CommonMixin],
  mounted() {
    if (this.domainNames.length > 0 && this.lastSelectedDomain) {
      this.scrollToElementById(this.lastSelectedDomain)
    }
    this.changeDomainFilter(this.filter)
  },
  watch: {
    enabledClusters() {
      this.changeDomainFilter(this.filter)
    },
    expanded() {
      this.$refs[this.$store.state.zap.domains[0] + 0][0].show()
    }
  },
  computed: {
    isClusterDocumentationAvailable() {
      return (
        this.$store.state.zap.genericOptions[
          dbEnum.sessionOption.clusterSpecification
        ] &&
        this.$store.state.zap.genericOptions[
          dbEnum.sessionOption.clusterSpecification
        ].length > 0
      )
    },
    showPreviewTab: {
      get() {
        return this.$store.state.zap.showPreviewTab
      }
    },
    domainNames: {
      get() {
        return this.$store.state.zap.domains
      }
    },
    openDomains: {
      get() {
        return this.$store.state.zap.clusterManager.openDomains
      }
    },
    clusters: {
      get() {
        return this.$store.state.zap.clusters
      }
    },
    lastSelectedDomain: {
      get() {
        return this.$store.state.zap.clusterManager.lastSelectedDomain
      }
    },
    relevantClusters: {
      get() {
        if (this.clusters.clusterData) {
          return this.clusters.clusterData.filter((cluster) =>
            this.filterString == ''
              ? true
              : cluster.label
                  .toLowerCase()
                  .includes(this.filterString.toLowerCase())
          )
        } else {
          return this.clusters.filter((cluster) =>
            this.filterString == ''
              ? true
              : cluster.label
                  .toLowerCase()
                  .includes(this.filterString.toLowerCase())
          )
        }
      }
    },
    enabledClusters: {
      get() {
        const clusters = this.relevantClusters.filter((cluster) => {
          return this.isClusterEnabled(cluster.id)
        })
        this.$store.commit('zap/setEnabledClusters', clusters)
        return clusters
      }
    },
    filterOptions: {
      get() {
        return this.$store.state.zap.clusterManager.filterOptions
      }
    },
    filter: {
      get() {
        return this.$store.state.zap.clusterManager.filter
      }
    },
    filterString: {
      get() {
        return this.$store.state.zap.clusterManager.filterString
      }
    },
    actionOptions: {
      get() {
        return this.$store.state.zap.clusterManager.actionOptions
      }
    },
    isTutorialRunning: {
      get() {
        return this.$store.state.zap.isTutorialRunning
      }
    },
    expanded: {
      get() {
        return this.$store.state.zap.expanded
      }
    },

    endpoints: {
      get() {
        const endpoints = []
        for (let id in this.endpointId) {
          if (this.endpointId[id]) {
            endpoints.push({
              label: `Endpoint - ${this.endpointId[id]}`,
              value: id
            })
          }
        }
        return endpoints
      }
    }
  },
  methods: {
    openClusterDocumentation() {
      if (
        this.$store.state.zap.genericOptions[
          dbEnum.sessionOption.clusterSpecification
        ].length > 0
      ) {
        window.open(
          this.$store.state.zap.genericOptions[
            dbEnum.sessionOption.clusterSpecification
          ][0]['optionLabel'],
          '_blank'
        )
      }
    },
    scrollToElementById(tag) {
      const el = document.getElementById(tag)
      const target = getScrollTarget(el)
      const offset = el.offsetTop
      setVerticalScrollPosition(target, offset)
    },
    clusterDomains(domainName) {
      return this.relevantClusters
        .filter((a) => {
          return a.domainName == domainName
        })
        .filter((a) => {
          return typeof this.filter.clusterFilterFn === 'function'
            ? this.filter.clusterFilterFn(a, {
                enabledClusters: this.enabledClusters
              })
            : true
        })
        .sort(function (b, a) {
          return a.code > b.code
        })
    },
    isClusterEnabled(clusterReference) {
      return (
        this.selectionClients.includes(clusterReference) ||
        this.selectionServers.includes(clusterReference)
      )
    },
    setOpenDomain(domainName, event) {
      this.$store.dispatch('zap/setOpenDomain', {
        domainName: domainName,
        value: event
      })
    },
    showVersion() {
      this.$serverGet(restApi.uri.version).then((result) => {
        let msg = `ZAP Version Information

 - version: ${result.data.version}
 - feature level: ${result.data.featureLevel}
 - date of relese commit: ${result.data.date}
 - hash of release commit: ${result.data.hash}`
        alert(msg)
      })
    },
    getDomainOpenState(domainName) {
      return this.openDomains[domainName]
    },
    changeDomainFilter(filter) {
      this.$store.dispatch('zap/setDomainFilter', {
        filter: filter,
        enabledClusters: this.enabledClusters
      })
    },
    doActionFilter(filter) {
      this.$store.dispatch('zap/doActionFilter', {
        filter: filter,
        enabledClusters: this.enabledClusters
      })
    },
    changeFilterString(filterString) {
      this.$store.dispatch('zap/setFilterString', filterString)
    },
    updateDeviceTypeFeatures() {
      let deviceTypeRefs = this.endpointDeviceTypeRef[this.selectedEndpointId]
      this.$store.dispatch(
        'zap/updateSelectedDeviceTypeFeatures',
        deviceTypeRefs
      )
    },
    isFeatureEnabled() {
      let categories =
        this.$store.state.zap.selectedZapConfig?.zclProperties.map(
          (zclProp) => zclProp.category
        )
      return categories.includes('matter')
    }
  },
  components: {
    ZclDomainClusterView
  }
}
</script>

<!-- Notice lang="scss" -->
<style lang="scss">
.bar {
  padding: 15px 15px 15px 15px;
}
</style>

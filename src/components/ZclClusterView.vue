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
  <div class="popup-wrap row" id="ZclClusterView">
    <q-card flat class="col column q-pa-lg">
      <div>
        <div class="row no-wrap">
          <div class="col">
            <div class="text-h4">
              {{ selectedCluster.label }}
            </div>

            <q-breadcrumbs active-color="grey">
              <!-- this needs to be updated depending on how the pages will work -->
              <q-breadcrumbs-el>
                Endpoint {{ this.endpointId[this.selectedEndpointId] }}
              </q-breadcrumbs-el>
              <q-breadcrumbs-el>
                {{ selectedCluster.domainName }}
              </q-breadcrumbs-el>
              <q-breadcrumbs-el>{{ selectedCluster.label }}</q-breadcrumbs-el>
            </q-breadcrumbs>
          </div>
          <div class="col-auto q-gutter-x-md items-start">
            <q-btn
              v-if="isClusterDocumentationAvailable"
              flat
              class="documentation"
              color="grey"
              dense
              icon="sym_o_quick_reference"
              @click="openClusterDocumentation"
            >
              <q-tooltip> Cluster Specification </q-tooltip>
            </q-btn>
            <q-btn to="/" flat dense icon="close" />
          </div>
        </div>
        <div class="row items-center no-wrap q-py-lg">
          <div class="col">
            {{ selectedCluster.caption }}
            <div>
              Cluster ID: {{ asHex(selectedCluster.code, 4) }}, Enabled for
              <strong> {{ enabledMessage }} </strong>
            </div>
          </div>
          <div class="col-auto">
            <q-input
              dense
              outlined
              clearable
              :placeholder="placeHolderText"
              @update:model-value="setIndividualClusterFilterString($event)"
              @clear="setIndividualClusterFilterString('')"
              :model-value="individualClusterFilterString"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>
      </div>
      <div class="col column">
        <q-tabs
          v-model="tab"
          dense
          align="left"
          active-bg-color="primary"
          indicator-color="primary"
          class="q-pl-lg"
        >
          <q-tab name="attributes" label="Attributes" class="v-step-10" />
          <q-tab
            name="reporting"
            label="Attribute Reporting"
            class="v-step-11"
            v-show="enableAttributeReportingTab"
          />
          <q-tab name="commands" label="Commands" class="v-step-12" />
          <q-tab name="events" label="Events" v-show="enableEventsTab" />
        </q-tabs>
        <div
          class="col column linear-border-wrap"
          v-show="Object.keys(selectedCluster).length > 0"
        >
          <div class="" v-show="tab == 'attributes'">
            <ZclAttributeManager />
          </div>
          <div class="col column" v-show="tab == 'commands'">
            <ZclCommandManager />
          </div>
          <div class="col column" v-show="tab == 'reporting'">
            <ZclAttributeReportingManager />
          </div>
          <div class="col column" v-show="tab == 'events'">
            <ZclEventManager />
          </div>
        </div>
      </div>
    </q-card>
    <q-resize-observer @resize="onResize" />
  </div>
</template>
<script>
import ZclAttributeManager from './ZclAttributeManager.vue'
import ZclAttributeReportingManager from './ZclAttributeReportingManager.vue'
import ZclCommandManager from './ZclCommandManager.vue'
import ZclEventManager from './ZclEventManager.vue'
import EditableAttributesMixin from '../util/editable-attributes-mixin'
import CommonMixin from '../util/common-mixin'

import * as dbEnum from '../../src-shared/db-enum.js'

export default {
  name: 'ZclClusterView',
  mixins: [CommonMixin, EditableAttributesMixin],
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
    placeHolderText: {
      get() {
        return 'Search ' + this.tab
      },
    },
    individualClusterFilterString: {
      get() {
        return this.$store.state.zap.clusterManager
          .individualClusterFilterString
      },
    },
    events: {
      get() {
        return this.$store.state.zap.events
      },
    },
    tutorialTab: {
      get() {
        return this.$store.state.zap.showReportTabInCluster
      },
    },
    category: {
      get() {
        return this.getDeviceCategory(
          this.zclDeviceTypes[
            this.endpointDeviceTypeRef[this.selectedEndpointId][0]
          ]?.packageRef
        )
      },
    },
    enableEventsTab: {
      get() {
        return this.category !== dbEnum.helperCategory.zigbee
      },
    },
    enableAttributeReportingTab: {
      get() {
        return this.category !== dbEnum.helperCategory.matter
      },
    },
  },
  watch: {
    tutorialTab(val) {
      this.tab = val
    },
  },
  mounted() {
    window.addEventListener('resize', this.calculateTableSize)
  },
  unmounted() {
    window.removeEventListener('resize', this.calculateTableSize)
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
    setIndividualClusterFilterString(filterString) {
      this.$store.dispatch('zap/setIndividualClusterFilterString', filterString)
    },
    onResize(size) {
      this.tableHeight = size.height - 380 + 'px'
      this.tableWidth = size.width - 80 + 'px'
    },
    calculateTableSize() {
      this.tableHeight = '30px'
      this.tableWidth = '500px'
    },
  },
  data() {
    return {
      tab: 'attributes',
      tableHeight: '30px',
      tableWidth: '500px',
    }
  },

  components: {
    ZclCommandManager,
    ZclAttributeManager,
    ZclAttributeReportingManager,
    ZclEventManager,
  },
}
</script>
<style lang="scss">
.popup-wrap {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9999;
  height: 100vh;
  overflow: hidden;
  width: 100vw;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  padding: 65px 16px;
}
.q-tab {
  padding: 2px 16px;
  margin-right: 9px;
  width: fit-content;
  border-radius: 5px 5px 0 0;
  text-transform: none;
  color: rgb(95, 101, 111);
  &--active {
    color: white;
  }
}

.q-tab {
  &--active {
    .q-tab {
      &__content {
        .q-tab {
          &__label {
            color: white;
          }
        }
      }
    }
  }
}
.q-table th,
.q-table td {
  padding: 5px;
  background-color: inherit;
  text-align: center;
}
.q-table--dense .q-table th,
.q-table--dense .q-table td {
  padding: 2px 5px;
}
.my-sticky-header-table {
  width: v-bind(tableWidth);
  height: v-bind(tableHeight);
}
</style>

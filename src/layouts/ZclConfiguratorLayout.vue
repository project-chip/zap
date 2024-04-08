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
    <q-page>
      <!--
        OLD
      <q-header bordered height-hint="500" class="zclConfiguratorLayoutHeader">
        <q-toolbar class="row">
          <q-toolbar-title
            v-on:click.ctrl="showVersion"
            v-if="showPreviewTab && this.endpointId[this.selectedEndpointId]"
          >
            <q-select
              filled
              :options="endpoints"
              :model-value="selectedEndpointId"
              label="Endpoint"
              emit-value
              map-options
              @update:model-value="setSelectedEndpoint($event)"
              style="width: 250px"
            />
          </q-toolbar-title>
          <q-toolbar-title v-on:click.ctrl="showVersion" v-else>
            Cluster Configurator:
            {{ zclProperties != undefined ? description : '' }}
          </q-toolbar-title>
          <q-btn
            class="hidden"
            outline
            color="primary"
            label="View Manual"
            v-on:click="openDocumentation()"
          />
          <q-btn
            flat
            icon="public"
            @click="globalOptionsDialog = !globalOptionsDialog"
            id="global_options"
          >
            <Transition name="bounce">
              <div v-if="displayButton" class="q-ml-xs">Options</div>
            </Transition>
          </q-btn>
          <q-btn
            icon="list"
            align="center"
            flat
            class="v-step-16"
            :ripple="false"
            :unelevated="false"
            :outline="false"
            @click="zclExtensionDialog = true"
          >
            <Transition name="bounce">
              <div v-if="displayButton" class="text-align q-ml-xs">
                Extensions
              </div></Transition
            >
          </q-btn>
          <q-btn
            flat
            icon="warning"
            to="/notifications"
            id="Notifications"
            :color="notification"
          >
            <Transition name="bounce">
              <div v-if="displayButton" class="text-align q-ml-xs">
                Notifications
              </div></Transition
            >
            <q-tooltip> Notifications </q-tooltip>
            <q-badge color="red" floating>{{ this.$store.state.zap.notificationCount }}</q-badge>
          </q-btn>
        </q-toolbar>
        <q-dialog
          v-model="globalOptionsDialog"
          class="background-color:transparent"
        >
          <ZclGeneralOptionsBar />
        </q-dialog>
      </q-header>
    -->
      <!-- Not using mobile mode, so breakpoint is set at 0 -->
      <!-- OLD
      <q-drawer
        v-if="!showPreviewTab"
        v-model="leftDrawerOpen"
        bordered
        :breakpoint="0"
        :mini="!leftDrawerOpen || miniState"
      >
        <zcl-endpoint-manager />
      </q-drawer>
    -->
      <q-scroll-area style="height: 75vh; max-width: 200vh">
        <initial-content
          v-if="isSelectedEndpoint"
          :ui-theme="uiThemeCategory"
        />
        <zcl-cluster-manager />
      </q-scroll-area>
    </q-page>
    <q-dialog v-model="zclExtensionDialog" style="width: 800px">
      <ZclExtensionDialog />
    </q-dialog>
  </div>
</template>

<script>
//import ZclGeneralOptionsBar from '../components/ZclGeneralOptionsBar.vue'
//import ZclEndpointManager from '../components/ZclEndpointManager.vue'
import ZclClusterManager from '../components/ZclClusterManager.vue'
import InitialContent from '../components/InitialContent.vue'
import ZclExtensionDialog from '../components/ZclCustomZclView.vue'

const restApi = require('../../src-shared/rest-api.js')
const commonUrl = require('../../src-shared/common-url.js')

export default {
  name: 'ZclConfiguratorLayout',
  methods: {
    collapseOnResize(e) {
      if (e.currentTarget.innerWidth < 750) {
        this.miniState = true
      }
    },
    // setSelectedEndpoint(value) {
    //   this.$store.dispatch('zap/updateSelectedEndpointType', {
    //     endpointType: this.endpointType[value],
    //     deviceTypeRef: this.endpointDeviceTypeRef[this.endpointType[value]],
    //   })
    //   this.$store.dispatch('zap/updateSelectedEndpoint', value)
    // },
    openDocumentation() {
      window.open(commonUrl.documentationUrl, '_blank')
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
  },
  mounted() {
    this.$store.dispatch('zap/clearLastSelectedDomain')
    window.addEventListener('resize', this.collapseOnResize)
  },
  computed: {
    displayButton() {
      return !this.$q.screen.lt.md
    },
    endpointDeviceTypeRef: {
      get() {
        return this.$store.state.zap.endpointTypeView.deviceTypeRef
      },
    },
    endpointType: {
      get() {
        return this.$store.state.zap.endpointView.endpointType
      },
    },
    selectedEndpointId: {
      get() {
        return this.$store.state.zap.endpointView.selectedEndpoint
      },
    },
    endpointId: {
      get() {
        return this.$store.state.zap.endpointView.endpointId
      },
    },
    showPreviewTab: {
      get() {
        return this.$store.state.zap.showPreviewTab
      },
      set() {
        return this.$store.dispatch('zap/togglePreviewTab')
      },
    },
    endpoints: {
      get() {
        const endpoints = []
        for (let id in this.endpointId) {
          if (this.endpointId[id]) {
            endpoints.push({
              label: `Endpoint - ${this.endpointId[id]}`,
              value: id,
            })
          }
        }
        return endpoints
      },
    },
    leftDrawerOpen: {
      get() {
        return this.$store.state.zap.leftDrawerOpenState
      },
      set(newLeftDrawerOpenState) {
        this.$store.dispatch('zap/setLeftDrawerState', newLeftDrawerOpenState)
      },
    },
    uiThemeCategory: {
      get() {
        let zclProps = this.$store.state.zap.selectedZapConfig?.zclProperties
        // Picking the first category in the case of multi-protocol(zigbee/matter)
        if (Array.isArray(zclProps) && zclProps.length > 0) {
          return zclProps[0].category
        } else {
          return this.$store.state.zap.selectedZapConfig?.zclProperties.category
        }
      },
    },
    description: {
      get() {
        // Picking the first description in the case of multi-protocol(zigbee/matter)
        if (
          Array.isArray(this.$store.state.zap.selectedZapConfig?.zclProperties)
        ) {
          return this.$store.state.zap.selectedZapConfig?.zclProperties[0]
            .description
        } else {
          return this.$store.state.zap.selectedZapConfig?.zclProperties
            .description
        }
      },
    },
    miniState: {
      get() {
        return this.$store.state.zap.miniState
      },
      set(miniState) {
        this.$store.dispatch('zap/setMiniState', miniState)
      },
    },
    isSelectedEndpoint: {
      get() {
        return this.$store.state.zap.endpointView.selectedEndpoint == null
      },
    },
    zclProperties: {
      get() {
        return this.$store.state.zap.allPackages.find(
          (single) => single.type === 'zcl-properties'
        )
      },
    },
    zclExtensionDialogInTutorial: {
      get() {
        return this.$store.state.zap.openZclExtensionsDialog
      },
    },
  },
  watch: {
    zclExtensionDialogInTutorial(val) {
      this.zclExtensionDialog = val
    },
  },
  data() {
    return {
      isExpanded: false,
      globalOptionsDialog: false,
      zclExtensionDialog: false,
      notification: '',
    }
  },

  components: {
    //ZclGeneralOptionsBar,
    // ZclEndpointManager,
    ZclClusterManager,
    InitialContent,
    ZclExtensionDialog,
  },
}
</script>

<style lang="scss">
.zclConfiguratorLayoutHeader {
  background: white;
  color: black;
  margin-bottom: 3px;
}

.body--dark .zclConfiguratorLayoutHeader {
  background: $dark-header-bar-bg;
  color: white;
}

body.body--dark {
  background: #272821;
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}

@keyframes bounce-in {
  0% {
    opacity: 0;
  }
  25% {
    opacity: 0.25;
  }
  50% {
    opacity: 0.5;
  }
  75% {
    opacity: 0.75;
  }
  100% {
    opacity: 1;
  }
}
</style>

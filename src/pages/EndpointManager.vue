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
  <q-page class="row">
    <div class="col">
      <q-scroll-area class="q-px-md fit">
        <initial-content
          v-if="isSelectedEndpoint"
          :ui-theme="uiThemeCategory"
        />
        <zcl-cluster-manager />
      </q-scroll-area>
    </div>
  </q-page>
</template>

<script>
import ZclClusterManager from '../components/ZclClusterManager.vue'
import InitialContent from '../components/InitialContent.vue'
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
    getNotifications() {
      this.$serverGet(restApi.uri.sessionNotification)
        .then((resp) => {
          if (resp.data[0] != undefined) {
            this.notification = 'red'
          }
        })
        .catch((err) => {
          console.log(err)
        })
    },
  },
  mounted() {
    this.$store.dispatch('zap/clearLastSelectedDomain')
    window.addEventListener('resize', this.collapseOnResize)
  },
  computed: {
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
    uiThemeCategory: {
      get() {
        return this.$store.state.zap.selectedZapConfig?.zclProperties.category
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
  },
  data() {
    return {
      isExpanded: false,
      globalOptionsDialog: false,
      zclExtensionDialog: false,
      notification: '',
    }
  },
  created() {
    if (this.$serverGet != null) {
      this.notification = ''
      this.getNotifications()
    }
  },

  components: {
    ZclClusterManager,
    InitialContent,
  },
}
</script>

<style lang="scss">
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

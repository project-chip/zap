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
    <q-layout view="hHh Lpr lFf">
      <q-header
        elevated
        bordered
        height-hint="500"
        class="shadow-2 zclConfiguratorLayoutHeader"
      >
        <q-toolbar bordered class="shadow-2 zclConfiguratorLayoutHeader">
          <q-toolbar-title v-on:click.ctrl="showVersion">
            Zigbee Cluster Configurator
          </q-toolbar-title>
          <q-space />

          <q-btn
            class="hidden"
            outline
            color="primary"
            label="View Manual"
            v-on:click="openDocumentation()"
          />
        </q-toolbar>
        <ZclGeneralOptionsBar />
      </q-header>
      <!-- Not using mobile mode, so breakpoint is set at 0 -->
      <q-drawer
        v-model="leftDrawerOpen"
        bordered
        :behavior="desktop"
        :breakpoint="0"
        :mini="!leftDrawerOpen || miniState"
      >
        <zcl-endpoint-manager />
      </q-drawer>
      <q-page-container>
        <zcl-cluster-manager />
      </q-page-container>
    </q-layout>
  </div>
</template>

<script>
import ZclGeneralOptionsBar from '../components/ZclGeneralOptionsBar.vue'
import ZclEndpointManager from '../components/ZclEndpointManager.vue'
import ZclClusterManager from '../components/ZclClusterManager.vue'
const restApi = require('../../src-shared/rest-api.js')
const commonUrl = require('../../src-shared/common-url.js')

export default {
  name: 'ZclConfiguratorLayout',

  methods: {
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
  },
  computed: {
    leftDrawerOpen: {
      get() {
        return this.$store.state.zap.leftDrawerOpenState
      },
      set(newLeftDrawerOpenState) {
        this.$store.dispatch('zap/setLeftDrawerState', newLeftDrawerOpenState)
      },
    },
    miniState: {
      get() {
        return this.$store.state.zap.miniState
      },
    },
  },
  data() {
    return {}
  },
  components: {
    ZclGeneralOptionsBar,
    ZclEndpointManager,
    ZclClusterManager,
  },
}
</script>

<style lang="scss">
.zclConfiguratorLayoutHeader {
  border: 1px white;
  background: white;
  color: black;
  vertical-align: middle;
  margin: 0px 5px 5px 0px;
}

.body--dark .zclConfiguratorLayoutHeader {
  background: $dark-header-bar-bg;
  color: white;
}

body.body--dark {
  background: #272821;
}
</style>

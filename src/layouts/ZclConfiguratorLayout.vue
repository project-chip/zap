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
          <q-toolbar-title>
            Zigbee Clusters Configurator
          </q-toolbar-title>
          <q-space />

          <!-- TODO add a link to said manual here/manage the implementation of manual. -->
          <q-btn outline color="primary" label="Manual" />
          <!-- TODO add handler for closing. -->
          <q-btn
            color="primary"
            flat
            icon="close"
            :ripple="false"
            :unelevated="true"
            :outline="none"
          />
        </q-toolbar>
        <ZclGeneralOptionsBar />
      </q-header>
      <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
        <zcl-endpoint-manager />
      </q-drawer>
    </q-layout>
  </div>
</template>

<script>
import { matClose } from '@quasar/extras/material-icons'
import ZclGeneralOptionsBar from '../components/ZclGeneralOptionsBar.vue'
import ZclEndpointManager from '../components/ZclEndpointManager.vue'

export default {
  name: 'ZclConfiguratorLayout',
  methods: {},
  computed: {
    leftDrawerOpen: {
      get() {
        return this.$store.state.zap.leftDrawerOpenState
      },
    },
  },
  data() {
    return {}
  },
  created() {
    this.matClose = matClose
  },
  components: {
    ZclGeneralOptionsBar,
    ZclEndpointManager,
  },
}
</script>

<style lang="scss">
.zclConfiguratorLayoutHeader {
  border: 1dp white;
  background: white;
  color: black;
  vertical-align: middle;
  margin: 0px 5px 5px 0px;
}
</style>

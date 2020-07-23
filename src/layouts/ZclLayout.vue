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
  <div class="q-pa-md dark">
    <q-dialog v-model="zclDialogFlag">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ zclDialogTitle }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">{{ zclDialogText }}</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <div class="q-gutter-y-md height: 10vh">
      <q-toolbar class="shadow-2">
        <q-tabs flat v-model="tab">
          <q-tab name="general" label="General" />
          <q-tab :name="restApi.uiMode.OLD" label="ZCL Clusters" />
          <q-tab :name="restApi.uiMode.ZIGBEE" label="Reformed UI" />
        </q-tabs>
        <q-space />
        <q-btn flat @click="drawerRight = !drawerRight" dense label="Preview" />
      </q-toolbar>
      <q-layout
        view="hHh Lpr lff"
        container
        style="height: 85vh;"
        class="shadow-2 rounded-borders"
      >
        <q-page-container>
          <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="general">
              <q-expansion-item
                expand-separator
                label="Application Configuration"
                caption
              >
                <ZclApplicationSetup />
              </q-expansion-item>
              <q-expansion-item
                expand-separator
                label="Information Configuration"
                caption
              >
                <ZclInformationSetup />
              </q-expansion-item>
              <q-expansion-item expand-separator label="SQL Query Test" caption>
                <sql-query />
              </q-expansion-item>
            </q-tab-panel>
            <q-tab-panel :name="restApi.uiMode.OLD">
              <ZclClusterLayout />
            </q-tab-panel>
            <q-tab-panel :name="restApi.uiMode.ZIGBEE">
              <zcl-configurator-layout />
            </q-tab-panel>
          </q-tab-panels>
          <q-drawer
            :width="$q.screen.width * 0.6"
            bordered
            show-if-above="true"
            overlay
            v-model="drawerRight"
            side="right"
          >
            <div class="q-pa-md">
              <q-btn-dropdown
                no-caps
                color="blue"
                :label="generationButtonText"
                dropdown-icon="change_history"
                class="full-width"
              >
                <q-list>
                  <q-item
                    clickable
                    v-close-popup
                    @click="
                      generationButtonText = 'cluster-id.h'
                      getGeneratedFile('cluster-id')
                    "
                    key="status"
                    :label="generationButtonText"
                  >
                    <q-item-section>
                      <q-item-label>cluster-id.h</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    @click="
                      generationButtonText = 'enums.h'
                      getGeneratedFile('enums')
                    "
                    :label="generationButtonText"
                  >
                    <q-item-section>
                      <q-item-label>enums.h</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    @click="
                      generationButtonText = 'print-cluster.h'
                      getGeneratedFile('print-cluster')
                    "
                    :label="generationButtonText"
                  >
                    <q-item-section>
                      <q-item-label>print-cluster.h</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    @click="
                      generationButtonText = 'af-structs.h'
                      getGeneratedFile('af-structs')
                    "
                    :label="generationButtonText"
                  >
                    <q-item-section>
                      <q-item-label>af-structs.h</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    @click="
                      generationButtonText = 'att-storage.h'
                      getGeneratedFile('att-storage')
                    "
                    :label="generationButtonText"
                  >
                    <q-item-section>
                      <q-item-label>att-storage.h</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    @click="
                      generationButtonText = 'debug-printing-zcl.h'
                      getGeneratedFile('debug-printing-zcl')
                    "
                    :label="generationButtonText"
                  >
                    <q-item-section>
                      <q-item-label>debug-printing-zcl.h</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    @click="
                      generationButtonText = 'callback-zcl.h'
                      getGeneratedFile('callback-zcl')
                    "
                    :label="generationButtonText"
                  >
                    <q-item-section>
                      <q-item-label>callback-zcl.h</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    @click="
                      generationButtonText = 'client-command-macro.h'
                      getGeneratedFile('client-command-macro')
                    "
                    :label="generationButtonText"
                  >
                    <q-item-section>
                      <q-item-label>client-command-macro.h</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
              <div>
                <template>
                  <div class="q-ma-md">
                    <q-scroll-area
                      style="height: 70vh; width: 55vw;"
                      ref="generationScroll"
                    >
                      <pre class="q-ma-none container">{{
                        generationData
                      }}</pre>
                      <q-scroll-observer @scroll="onScroll" />
                    </q-scroll-area>
                  </div>
                </template>
              </div>
            </div>
          </q-drawer>
        </q-page-container>
      </q-layout>
    </div>
  </div>
</template>

<script>
import ZclApplicationSetup from '../components/ZclApplicationSetup.vue'
import ZclInformationSetup from '../components/ZclInformationSetup.vue'
import ZclClusterLayout from './ZclClusterLayout.vue'
import ZclConfiguratorLayout from './ZclConfiguratorLayout.vue'
import SqlQuery from '../components/SqlQuery.vue'
const restApi = require(`../../src-shared/rest-api.js`)
import { scroll } from 'quasar'
const { getScrollHeight } = scroll

export default {
  name: 'ZclLayout',
  methods: {
    getGeneratedFile(fileName, index = 1) {
      this.$serverGet('/preview/' + fileName + '/' + index)
        .then((result) => {
          this.generationData = result.data['result']
          this.maxIndex = result.data['size']
          this.index = index
          this.currentFile = fileName
          this.$refs.generationScroll.setScrollPosition(0)
        })
        .catch((err) => console.log('Server Get:' + err))
    },

    setThemeMode(bodyElement) {
      const theme = bodyElement.getAttribute('data-theme')
      if (theme === 'com.silabs.ss.platform.theme.dark') {
        this.$q.dark.set(true)
      } else {
        this.$q.dark.set(false)
      }
    },

    onScroll(info) {
      this.scrollInfo = info
      const scrollArea = this.$refs.generationScroll
      const scrollTarget = scrollArea.getScrollTarget()
      this.scrollHeight = scrollTarget.scrollHeight
      this.clientHeight = scrollTarget.clientHeight
      this.scrollTop = scrollTarget.scrollTop
      if (
        this.scrollInfo.direction === 'down' &&
        this.scrollHeight - this.scrollTop === this.clientHeight &&
        this.maxIndex > this.index
      ) {
        this.index = this.index + 1
        this.$serverGet('/preview/' + this.currentFile + '/' + this.index)
          .then((result) => {
            this.generationData = this.generationData + result.data['result']
          })
          .catch((err) => console.log('Server Get:' + err))
      }
    },
  },
  components: {
    ZclApplicationSetup,
    ZclInformationSetup,
    ZclClusterLayout,
    ZclConfiguratorLayout,
    SqlQuery,
  },
  data() {
    return {
      restApi: restApi,
      tab: this.$store.state.zap.calledArgs['defaultUiMode'],
      zclDialogFlag: false,
      zclDialogTitle: '',
      zclDialogText: '',
      drawerRight: false,
      generationData: 'Generated Data',
      generationButtonText: 'Select File',
      currentFile: '',
      scrollInfo: {},
      scrollHeight: '',
      clientHeight: '',
      scrollTop: '',
      index: 0,
      maxIndex: 0,
    }
  },
  mounted() {
    this.zclDialogTitle = 'ZCL tab!'
    this.zclDialogText = 'Welcome to ZCL tab. This is just a test of a dialog.'
    this.zclDialogFlag = false
    var html = document.documentElement
    this.setThemeMode(html)
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          this.setThemeMode(html)
        }
      })
    }).observe(html, {
      attributes: true,
      attributeFilter: ['data-theme'],
      subtree: false,
    })
    this.$store.dispatch('zap/loadInitialData')
    this.$store.dispatch('zap/loadOptions', {
      key: 'defaultResponsePolicy',
      type: 'string',
    })
    this.$store.dispatch('zap/loadOptions', {
      key: 'manufacturerCodes',
      type: 'object',
    })
    this.$serverOn('zcl-item-list', (event, arg) => {
      if (arg.type === 'cluster') {
        this.$store.dispatch('zap/updateClusters', arg.data)
      }
    })
    this.$serverGet('/zcl/cluster/all')
    this.$serverOn('zcl-item-list', (event, arg) => {
      if (arg.type === 'device_type') {
        this.$store.dispatch('zap/updateZclDeviceTypes', arg.data || [])
      }
    })
    this.$serverGet('/zcl/deviceType/all')
  },
}
</script>

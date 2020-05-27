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
        <q-card-section
          ><div class="text-h6">{{ zclDialogTitle }}</div>
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
          <q-tab name="zclClusters" label="ZCL Clusters" />
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
                caption=""
              >
                <ZclApplicationSetup />
              </q-expansion-item>
              <q-expansion-item
                expand-separator
                label="Information Configuration"
                caption=""
              >
                <ZclInformationSetup />
              </q-expansion-item>
              <q-expansion-item
                expand-separator
                label="SQL Query Test"
                caption=""
              >
                <sql-query />
              </q-expansion-item>
            </q-tab-panel>
            <q-tab-panel name="zclClusters">
              <ZclClusterLayout />
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
                      getGeneratedFile('clusters')
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
                      getGeneratedFile('client-command-macro-global')
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
                <q-input
                  :value="generationData"
                  type="textarea"
                  rows="30"
                  readonly
                />
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
import SqlQuery from '../components/SqlQuery.vue'

export default {
  name: 'ZclLayout',
  methods: {
    getGeneratedFile(fileName) {
      this.$serverGetWithType('/preview/' + fileName, 'preview')
        .then((result) => {
          this.generationData = result.data
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
  },
  components: {
    ZclApplicationSetup,
    ZclInformationSetup,
    ZclClusterLayout,
    SqlQuery,
  },
  data() {
    return {
      tab: 'zclClusters',
      zclDialogFlag: false,
      zclDialogTitle: '',
      zclDialogText: '',
      drawerRight: false,
      generationData: 'Generated Data',
      generationButtonText: 'Select File',
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
  },
}
</script>

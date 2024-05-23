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
  <q-page>
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
      <!-- <q-toolbar class="shadow-2" v-if="this.$store.state.zap.debugNavBar">
        <q-tabs flat v-model="tab">
          <q-tab
            v-if="this.$store.state.zap.showDevTools"
            name="general"
            label="Dev Tools"
          />
          <q-tab :name="restApi.uiMode.ZIGBEE" label="ZCL" />
        </q-tabs>
        <q-space />

        <q-btn
          flat
          @click="generateIntoDirectory(generationDirectory)"
          label="Generate ..."
        />
        <q-btn
          flat
          @click="regenerateIntoDirectory(generationDirectory)"
          label="Regenerate"
          v-bind:disabled="generationDirectory == ''"
        />
        <q-btn
          flat
          @click="
            () => {
              togglePreviewTab()
              getGeneratedFiles()
            }
          "
          label="Preview"
          data-test="preview"
        />
        <q-btn flat icon="settings" id="preference" to="/preference">
          <q-tooltip> Preferences </q-tooltip>
        </q-btn>
        <q-btn
          v-if="this.$store.state.zap.showDevTools"
          flat
          @click="startTour"
          icon="psychology_alt"
        >
          <q-tooltip> Tutorial </q-tooltip>
        </q-btn>
        <q-btn flat @click="homeDialog = !homeDialog" icon="mdi-alert-circle">
          <q-tooltip> About </q-tooltip>
        </q-btn>
      </q-toolbar> -->
      <q-layout
        view="hHh Lpr lff"
        container
        :style="`${
          this.$store.state.zap.debugNavBar
            ? 'height: calc(100vh - 100px)'
            : 'height: calc(100vh - 30px)'
        }`"
        class="shadow-2 rounded-borders"
      >
        <q-page-container>
          <q-tab-panels v-model="tab" animated>
            <!-- dev tools panel-->
            <q-tab-panel name="general">
              <q-scroll-area style="height: 80vh">
                <q-expansion-item
                  expand-separator
                  label="Information Configuration"
                  caption
                >
                  <ZclInformationSetup />
                </q-expansion-item>
                <q-expansion-item
                  expand-separator
                  label="SQL Query Test"
                  caption
                >
                  <sql-query />
                </q-expansion-item>
                <q-expansion-item
                  expand-separator
                  label="API Exceptions"
                  caption
                  v-model="isExceptionsExpanded"
                >
                  <Exceptions />
                </q-expansion-item>
              </q-scroll-area>
            </q-tab-panel>

            <!-- zcl panel-->
            <q-tab-panel :name="restApi.uiMode.ZIGBEE">
              <zcl-configurator-layout />
            </q-tab-panel>
          </q-tab-panels>
          <q-drawer
            :width="$q.screen.width * 0.4"
            bordered
            v-model="showPreviewTab"
            side="right"
            :breakpoint="0"
            class="column"
          >
            <q-btn-dropdown
              no-caps
              color="blue"
              :label="generationButtonText"
              dropdown-icon="change_history"
              class="q-mx-sm q-mt-sm"
              data-test="select-file-in-preview"
            >
              <q-list>
                <q-item
                  v-for="(file, i) in generationFiles"
                  :key="i"
                  clickable
                  v-close-popup
                  @click="
                    () => {
                      generationButtonText = file.category
                      getGeneratedFile(file.category)
                    }
                  "
                  :label="generationButtonText"
                >
                  <q-item-section>
                    <q-item-label>{{ file.category }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
            <div class="col">
              <q-scroll-area class="fit" ref="generationScroll">
                <pre class="q-ma-sm">{{ generationData }}</pre>
                <q-scroll-observer @scroll="onScroll" />
              </q-scroll-area>
            </div>
          </q-drawer>
        </q-page-container>
      </q-layout>
    </div>
    <q-dialog v-model="homeDialog">
      <About />
    </q-dialog>
  </q-page>
</template>

<script>
import Exceptions from '../components/ZclExceptions.vue'
import ZclInformationSetup from '../components/ZclInformationSetup.vue'
import ZclConfiguratorLayout from './ZclConfiguratorLayout.vue'
import SqlQuery from '../components/SqlQuery.vue'
import About from '../pages/preferences/AboutPage.vue'
import CommonMixin from '../util/common-mixin'

const restApi = require(`../../src-shared/rest-api.js`)
const rendApi = require(`../../src-shared/rend-api.js`)
const observable = require('../util/observable.js')

export default {
  name: 'ZclLayout',
  mixins: [CommonMixin],
  methods: {
    // This function will start vue tour steps
    togglePreviewTab() {
      this.$store.commit('zap/togglePreviewTab')
    },
    doGeneration(path) {
      window[rendApi.GLOBAL_SYMBOL_EXECUTE](
        rendApi.id.progressStart,
        'Generating files...'
      )
      this.$serverPut(restApi.uri.generate, {
        generationDirectory: path,
      }).finally(() => {
        window[rendApi.GLOBAL_SYMBOL_EXECUTE](rendApi.id.progressEnd)
      })
    },
    regenerateIntoDirectory(currentPath) {
      this.doGeneration(currentPath)
    },

    generateIntoDirectory(currentPath) {
      window[rendApi.GLOBAL_SYMBOL_NOTIFY](rendApi.notifyKey.fileBrowse, {
        context: 'generateDir',
        title: 'Select directory to generate into',
        mode: 'directory',
        defaultPath: currentPath,
        buttonLabel: 'Generate',
      })
    },
    getGeneratedFiles() {
      this.$serverGet(restApi.uri.preview).then((result) => {
        this.generationFiles = result.data
      })
    },
    getGeneratedFile(fileName, index = 1) {
      this.$serverGet(restApi.uri.preview + fileName + '/' + index)
        .then((result) => {
          this.generationData = result.data['result']
          this.maxIndex = result.data['size']
          this.index = index
          this.currentFile = fileName
          this.$refs.generationScroll.setScrollPosition('vertical', 0)
        })
        .catch((err) => console.log('Server Get:' + err))
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
        this.$serverGet(
          restApi.uri.preview + this.currentFile + '/' + this.index
        )
          .then((result) => {
            this.generationData = this.generationData + result.data['result']
          })
          .catch((err) => console.log('Server Get:' + err))
      }
    },
  },
  components: {
    ZclInformationSetup,
    ZclConfiguratorLayout,
    SqlQuery,
    Exceptions,
    About,
  },
  data() {
    return {
      restApi: restApi,
      zclDialogFlag: false,
      zclDialogTitle: '',
      zclDialogText: '',
      drawerRight: false,
      generationFiles: '',
      generationData: 'Generated Data',
      generationButtonText: 'Select File',
      currentFile: '',
      scrollInfo: {},
      scrollHeight: '',
      clientHeight: '',
      scrollTop: '',
      index: 0,
      maxIndex: 0,
      generationDirectory: '',
      homeDialog: false,
    }
  },
  computed: {
    showPreviewTab: {
      get() {
        return this.$store.state.zap.showPreviewTab
      },
      set() {
        return this.$store.dispatch('zap/togglePreviewTab')
      },
    },
    tab: {
      get() {
        return this.$store.state.zap.calledArgs['defaultUiMode']
      },
      set(value) {
        return this.$store.dispatch('zap/setDefaultUiMode', value)
      },
    },
    isExceptionsExpanded: {
      get() {
        return this.$store.state.zap.isExceptionsExpanded
      },
      set() {
        return this.$store.commit('zap/expandedExceptionsToggle')
      },
    },
  },
  mounted() {
    observable.observeAttribute(rendApi.observable.reported_files, (value) => {
      if (value.context == 'generateDir') {
        this.generationDirectory = value.filePaths[0]
        this.doGeneration(this.generationDirectory)
      }
    })

    observable.observeAttribute(rendApi.observable.debugNavBar, (value) => {
      this.$store.dispatch('zap/setDebugNavBar', value)
    })
  },
}
</script>

<style scoped>
:deep() .q-tab-panel {
  max-height: calc(100vh - 100px);
  overflow: hidden;
}
</style>

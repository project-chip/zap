<template>
  <q-layout view="lHh LpR lFf">
    <q-header class="transparent">
      <ZCLToolbar />
    </q-header>
    <q-drawer
      v-if="!showPreviewTab && !showNotificationTab"
      class="bg-glass"
      v-model="leftDrawerOpen"
      show-if-above
      :width="300"
      :breakpoint="500"
      style="border-right: 1px solid #ddd"
    >
      <div
        class="full-width absolute-top text-h4 q-pt-md q-px-md row q-electron-drag"
        :class="{
          'justify-end': isElectron && isMac,
        }"
        style="height: 53.8px"
      >
        <div>ZCL</div>
      </div>

      <q-scroll-area style="height: calc(100% - 53.8px); margin-top: 53.8px">
        <router-view v-slot="{ Component }" name="sidebar">
          <transition mode="out-in" name="slide-left">
            <component :is="Component" />
          </transition>
        </router-view>
      </q-scroll-area>
    </q-drawer>
    <q-drawer
      :width="$q.screen.width * 0.4"
      bordered
      v-model="showPreviewTab"
      side="right"
      :breakpoint="0"
      class="bg-glass column"
    >
      <!-- <div
        v-on:click.ctrl="showVersion"
        v-if="showPreviewTab && this.endpointId[this.selectedEndpointId]"
      >
        <q-select
          class="q-mx-sm q-mt-sm"
          filled
          :options="endpoints"
          :model-value="selectedEndpointId"
          label="Endpoint"
          emit-value
          map-options
          @update:model-value="setSelectedEndpoint($event)"
        />
      </div> -->
      <q-btn-dropdown
        no-caps
        color="primary"
        :label="generationButtonText"
        dropdown-icon="change_history"
        class="q-ma-sm"
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
      <div class="col column q-mx-sm">
        <q-scroll-area class="fit" ref="generationScroll">
          <pre class="q-ma-sm">{{ generationData }}</pre>
          <q-scroll-observer @scroll="onScroll" />
        </q-scroll-area>
      </div>
    </q-drawer>
    <q-drawer
      :width="$q.screen.width * 0.4"
      bordered
      v-model="showNotificationTab"
      side="right"
      :breakpoint="0"
      class="bg-glass column"
      id="NotificationPanel"
    >
      <NotificationPage />
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition mode="out-in" name="slide-down">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>
<script>
import ZCLToolbar from '../components/ZCLToolbar.vue'
import NotificationPage from '../pages/NotificationsPage.vue'
import { isElectron, isMac } from '../util/platform'
const restApi = require(`../../src-shared/rest-api.js`)

export default {
  components: {
    ZCLToolbar,
    NotificationPage,
  },
  name: 'MainLayout',
  data() {
    return {
      isElectron,
      isMac,
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
    showNotificationTab: {
      get() {
        return this.$store.state.zap.showNotificationTab
      },
      set() {
        return this.$store.dispatch('zap/showNotificationTab')
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
  },
  created() {
    if (this.$serverGet != null) {
      this.getGeneratedFiles()
    }
  },
  methods: {
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
}
</script>
<style lang="scss">
.slide-left-leave-active,
.slide-left-enter-active {
  transition: all 0.25s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-down-leave-active,
.slide-down-enter-active {
  transition: all 0.25s ease-out;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-35px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(35px);
}

.slide-left-leave-active,
.slide-left-enter-active {
  transition: all 0.25s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-down-leave-active,
.slide-down-enter-active {
  transition: all 0.5s ease-out;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-75px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(35px);
}
</style>

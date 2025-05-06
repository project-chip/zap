<template>
  <q-toolbar
    class="bg-glass"
    :class="{
      'window-button-padding-right': isElectron && isWin,
      ' q-electron-drag': !showCreateModifyEndpoint
    }"
  >
    <q-toolbar-title
      :class="{ 'logo-margin': showPreviewTab || showNotificationTab }"
      style="width: 180px"
    >
      <Transition mode="out-in" name="slide-up">
        <div
          v-if="$route.fullPath === '/'"
          class="text-center text-primary text-caption w-fit-content"
        >
          <img
            v-for="(image, index) in getLogos(
              $store.state.zap.selectedZapConfig
                ? $store.state.zap.selectedZapConfig.zclProperties
                : null
            )"
            :key="index"
            :src="image"
            class="my-auto logo image-space"
          />
          <div v-if="$store.state.zap.isMultiConfig">Multiprotocol</div>
        </div>

        <q-btn
          v-else
          flat
          icon="arrow_back_ios"
          to="/"
          label="Back"
          id="Back"
          color="grey"
          data-test="go-back-button"
        />
      </Transition>
    </q-toolbar-title>
    <q-btn
      v-if="showDebugNavItems"
      id="generate"
      color="grey"
      class="navmenu-item"
      flat
      push
      no-caps
      @click="generateIntoDirectory(generationDirectory)"
    >
      <div class="text-center">
        <q-icon name="o_video_settings" />
        <div>Generate</div>
      </div>
    </q-btn>
    <q-btn id="save" color="grey" flat no-caps @click="saveChanges">
      <div class="text-center">
        <q-icon name="o_save" />
        <div>Save</div>
      </div>
    </q-btn>
    <q-btn
      v-if="isCoreDocumentationAvailable"
      id="documentation"
      flat
      class="documentation-cursor"
      color="grey"
      push
      no-caps
      title="Core Specification"
      @click="openDocumentation"
    >
      <div class="text-center">
        <q-icon name="sym_o_quick_reference" />
        <div>Documentation</div>
      </div>
    </q-btn>
    <router-link v-slot="{ isActive, navigate }" to="/options">
      <q-btn
        id="global_options"
        class="navmenu-item"
        :class="{ 'navmenu-item--active': isActive }"
        color="grey"
        flat
        no-caps
        @click="navigate"
      >
        <div class="text-center">
          <q-icon name="o_tune" />
          <div>Options</div>
        </div>
      </q-btn>
    </router-link>

    <router-link v-slot="{ isActive, navigate }" to="/extensions">
      <q-btn
        class="navmenu-item q-py-sm v-step-16"
        :class="{ 'navmenu-item--active': isActive }"
        flat
        no-caps
        @click="navigate"
      >
        <div class="text-center">
          <q-icon name="o_extension" />
          <div>Extensions</div>
        </div>
      </q-btn>
    </router-link>

    <q-btn
      class="navmenu-item"
      :class="{ 'navmenu-item--active': showNotificationTab }"
      flat
      no-caps
      id="Notifications"
      @click="
        () => {
          toggleNotificationTab()
        }
      "
    >
      <div class="text-center">
        <q-icon name="o_assignment_late" />
        <div>
          Notifications
          <q-badge
            style="top: 5px; right: 5px"
            color="red"
            floating
            v-if="this.$store.state.zap.notificationCount > 0"
          >
            {{ this.$store.state.zap.notificationCount }}
          </q-badge>
        </div>
      </div>
    </q-btn>

    <q-btn
      v-if="showDebugNavItems"
      class="navmenu-item"
      :class="{ 'navmenu-item--active': showPreviewTab }"
      flat
      no-caps
      id="Preview"
      @click="
        () => {
          togglePreviewTab()
        }
      "
      data-test="preview"
    >
      <div class="text-center">
        <q-icon name="o_preview" />
        <div class="">Preview</div>
      </div>
    </q-btn>
    <q-btn
      v-if="!isMultiProtocolTutorialAvailable"
      flat
      push
      no-caps
      class="navmenu-item"
      :class="{ 'navmenu-item--active': isTutorialRunning }"
      @click="openEndpointTour"
      data-cy="btn-tutorial"
    >
      <div class="text-center">
        <q-icon name="o_psychology_alt" />
        <div>Tutorial</div>
      </div>
    </q-btn>
    <q-btn-dropdown
      v-else
      flat
      push
      no-caps
      class="navmenu-item"
      data-cy="btn-tutorial-dropdown"
    >
      <template v-slot:label>
        <div class="text-center">
          <q-icon name="o_psychology_alt" />
          <div>Tutorial</div>
        </div>
      </template>
      <div class="column q-ma-sm">
        <q-btn
          flat
          no-caps
          class="navmenu-item"
          @click="openEndpointTour"
          data-cy="btn-tutorial-endpoint"
        >
          Endpoint tutorial
        </q-btn>
        <q-btn
          flat
          no-caps
          class="navmenu-item"
          @click="openCmpTour"
          data-cy="btn-tutorial-cmp"
        >
          CMP tutorial
        </q-btn>
      </div>
    </q-btn-dropdown>
    <router-link v-slot="{ isActive, navigate }" to="/preferences/user">
      <q-btn
        v-if="showDebugNavItems"
        class="navmenu-item"
        :class="{ 'navmenu-item--active': isActive }"
        flat
        no-caps
        id="Settings"
        @click="navigate"
      >
        <div class="text-center">
          <q-icon name="o_settings" />
          <div>Settings</div>
        </div>
      </q-btn>
    </router-link>
  </q-toolbar>
</template>
<script>
import { isElectron, isWin } from '../util/platform'
import * as dbEnum from '../../src-shared/db-enum.js'

const rendApi = require(`../../src-shared/rend-api.js`)
const restApi = require(`../../src-shared/rest-api.js`)
const observable = require('../util/observable.js')
import CommonMixin from '../util/common-mixin'
export default {
  name: 'ZCLToolbar',
  mixins: [CommonMixin],
  computed: {
    isCoreDocumentationAvailable() {
      return (
        this.$store.state.zap.genericOptions[
          dbEnum.sessionOption.coreSpecification
        ] &&
        this.$store.state.zap.genericOptions[
          dbEnum.sessionOption.coreSpecification
        ].length > 0
      )
    },
    isTutorialRunning: {
      get() {
        return this.$store.state.zap.isTutorialRunning
      }
    },
    showCreateModifyEndpoint: {
      get() {
        return this.$store.state.zap.showCreateModifyEndpoint
      }
    },
    showPreviewTab: {
      get() {
        return this.$store.state.zap.showPreviewTab
      },
      set() {
        return this.$store.dispatch('zap/togglePreviewTab')
      }
    },
    showNotificationTab: {
      get() {
        return this.$store.state.zap.showNotificationTab
      },
      set() {
        return this.$store.dispatch('zap/toggleNotificationTab')
      }
    },
    isMultiProtocolTutorialAvailable: {
      get() {
        return this.$store.state.zap.isMultiConfig
      }
    },
    showDebugNavItems: {
      get() {
        return this.$store.state.zap.debugNavBar
      }
    }
  },
  data() {
    return {
      isElectron,
      isWin,
      isExpanded: false,
      globalOptionsDialog: false,
      notification: '',
      generationDirectory: ''
    }
  },
  methods: {
    openCmpTour() {
      this.$store.commit('zap/toggleCmpTutorial', true)
    },
    openEndpointTour() {
      this.$store.commit('zap/toggleEndpointTutorial', true)
    },
    openDocumentation() {
      if (
        this.$store.state.zap.genericOptions[
          dbEnum.sessionOption.coreSpecification
        ].length > 0
      ) {
        window.open(
          this.$store.state.zap.genericOptions[
            dbEnum.sessionOption.coreSpecification
          ][0]['optionLabel'],
          '_blank'
        )
      }
    },
    saveChanges() {
      window[rendApi.GLOBAL_SYMBOL_EXECUTE](rendApi.id.save)
    },
    togglePreviewTab() {
      if (this.showNotificationTab) {
        this.$store.commit('zap/toggleNotificationTab')
      }
      this.$store.commit('zap/togglePreviewTab')
    },
    toggleNotificationTab() {
      if (this.showPreviewTab) {
        this.$store.commit('zap/togglePreviewTab')
      }
      this.$store.commit('zap/toggleNotificationTab')
    },
    generateIntoDirectory(currentPath) {
      window[rendApi.GLOBAL_SYMBOL_NOTIFY](rendApi.notifyKey.fileBrowse, {
        context: 'generateDir',
        title: 'Select directory to generate into',
        mode: 'directory',
        defaultPath: currentPath,
        buttonLabel: 'Generate'
      })
    },
    doGeneration(path) {
      window[rendApi.GLOBAL_SYMBOL_EXECUTE](
        rendApi.id.progressStart,
        'Generating files...'
      )
      this.$serverPut(restApi.uri.generate, {
        generationDirectory: path
      }).finally(() => {
        window[rendApi.GLOBAL_SYMBOL_EXECUTE](rendApi.id.progressEnd)
      })
    },
    regenerateIntoDirectory(currentPath) {
      this.doGeneration(currentPath)
    },
    getNotifications() {
      this.$serverGet(restApi.uri.unseenNotificationCount)
        .then((resp) => {
          this.$store.commit('zap/updateNotificationCount', resp.data)
        })
        .catch((err) => {
          console.log(err)
        })
    }
  },
  mounted() {
    if (this.$onWebSocket) {
      this.$onWebSocket(
        dbEnum.wsCategory.notificationCount,
        (notificationCount) => {
          this.$store.commit('zap/updateNotificationCount', notificationCount)
        }
      )
    }

    if (this.$serverGet != null) {
      this.getNotifications()
    }

    observable.observeAttribute(rendApi.observable.reported_files, (value) => {
      if (value.context == 'generateDir') {
        this.generationDirectory = value.filePaths[0]
        this.doGeneration(this.generationDirectory)
      }
    })
    observable.observeAttribute(rendApi.observable.debugNavBar, (value) => {
      this.$store.dispatch('zap/setDebugNavBar', value)
    })
  }
}
</script>
<style lang="scss" scoped>
.navmenu-item {
  font-size: 10px;
  padding: 15px 20px;
  font-weight: 400;
  color: $grey !important;
}

.navmenu-item:hover {
  color: var(--q-color-primary) !important;
}
.navmenu-item--active {
  color: var(--q-color-primary) !important;
  background-color: $grey-4;
}

.q-btn {
  font-size: 10px;
  padding: 15px 20px;
  font-weight: 400;
  .q-icon {
    font-size: 24px;
  }
  &.disabled {
    opacity: 0.3 !important;
  }
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.window-button-padding-right {
  padding-right: calc(100vw - env(titlebar-area-width, 100vw) + 2px);
}

.image-space:not(:last-of-type) {
  margin-right: 15px;
}
.logo-margin {
  margin-left: 75px;
}
</style>

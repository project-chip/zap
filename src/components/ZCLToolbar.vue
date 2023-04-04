<template>
  <q-toolbar class="bg-glass q-electron-drag">
    <q-toolbar-title style="width: 180px">
      <Transition mode="out-in" name="slide-up">
        <div v-if="$route.fullPath === '/'">
          <img
            v-if="uiThemeCategory === 'zigbee'"
            class="my-auto block logo"
            src="/zigbee_logo.svg"
          />
          <img
            v-else-if="uiThemeCategory === 'matter'"
            class="my-auto block logo"
            src="/matter_logo.svg"
          />
        </div>

        <q-btn
          v-else
          flat
          icon="arrow_back_ios"
          to="/"
          label="Back"
          color="grey"
          data-test="go-back-button"
        />
      </Transition>
    </q-toolbar-title>
    <q-btn
      id="generate"
      color="grey"
      flat
      push
      no-caps
      class="cursor-pointer"
      @click="generateIntoDirectory(generationDirectory)"
    >
      <div class="text-center">
        <q-icon name="o_video_settings" />
        <div>Generate</div>
      </div>
    </q-btn>
    <q-btn
      id="regenerate"
      color="grey"
      flat
      push
      no-caps
      class="cursor-pointer"
      v-bind:disable="generationDirectory == ''"
      @click="regenerateIntoDirectory(generationDirectory)"
    >
      <div class="text-center">
        <q-icon name="repartition" />
        <div>Regenerate</div>
      </div>
    </q-btn>
    <q-btn
      id="global_options"
      color="grey"
      flat
      no-caps
      class="cursor-pointer"
      @click="globalOptionsDialog = !globalOptionsDialog"
    >
      <div class="text-center">
        <q-icon name="o_tune" />
        <div>Options</div>
      </div>
    </q-btn>

    <q-btn
      class="cursor-pointer q-py-sm v-step-16"
      flat
      no-caps
      color="grey"
      @click="zclExtensionDialog = true"
    >
      <div class="text-center">
        <q-icon name="o_extension" />
        <div>Extensions</div>
      </div>
    </q-btn>
    <q-btn
      class="cursor-pointer"
      flat
      no-caps
      to="/notifications"
      id="Notifications"
      color="grey"
    >
      <div class="text-center">
        <q-icon name="o_assignment_late" />
        <div>Notifications</div>
      </div>
    </q-btn>
    <q-btn
      class="cursor-pointer"
      flat
      no-caps
      to="/notifications"
      id="Notifications"
      color="grey"
    >
      <div class="text-center">
        <q-icon name="o_preview" />
        <div class="">Preview</div>
      </div>
    </q-btn>
    <q-btn
      v-if="this.$store.state.zap.showDevTools"
      flat
      push
      no-caps
      color="grey"
      class="cursor-pointer"
      @click="startTour"
    >
      <div class="text-center">
        <q-icon name="o_psychology_alt" />
        <div>Tutorial</div>
      </div>
    </q-btn>
    <q-btn
      class="cursor-pointer"
      flat
      no-caps
      to="/preferences/user"
      id="Settings"
      color="grey"
    >
      <div class="text-center">
        <q-icon name="o_settings" />
        <div>Settings</div>
      </div>
    </q-btn>
    <q-dialog
      v-model="globalOptionsDialog"
      class="background-color:transparent"
    >
      <ZclGeneralOptionsBar />
    </q-dialog>
    <q-dialog v-model="zclExtensionDialog">
      <ZclExtensionDialog />
    </q-dialog>
  </q-toolbar>
</template>
<script>
import ZclGeneralOptionsBar from '../components/ZclGeneralOptionsBar.vue'
import ZclExtensionDialog from '../components/ZclCustomZclView.vue'
import { startTour } from '../boot/tour'

const rendApi = require(`../../src-shared/rend-api.js`)
const restApi = require(`../../src-shared/rest-api.js`)
const observable = require('../util/observable.js')
export default {
  name: 'ZCLToolbar',
  components: {
    ZclGeneralOptionsBar,
    ZclExtensionDialog,
  },
  computed: {
    zclExtensionDialogInTutorial: {
      get() {
        return this.$store.state.zap.openZclExtensionsDialog
      },
    },
    uiThemeCategory: {
      get() {
        return this.$store.state.zap.selectedZapConfig?.zclProperties.category
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
      generationDirectory: '',
    }
  },
  methods: {
    // This function will start vue tour steps
    startTour,
    generateIntoDirectory(currentPath) {
      window[rendApi.GLOBAL_SYMBOL_NOTIFY](rendApi.notifyKey.fileBrowse, {
        context: 'generateDir',
        title: 'Select directory to generate into',
        mode: 'directory',
        defaultPath: currentPath,
        buttonLabel: 'Generate',
      })
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
  },
  mounted() {
    observable.observeAttribute(rendApi.observable.reported_files, (value) => {
      if (value.context == 'generateDir') {
        this.generationDirectory = value.filePaths[0]
        this.doGeneration(this.generationDirectory)
      }
    })
  },
}
</script>
<style lang="scss" scoped>
.bg-glass {
  background-color: rgba(238, 238, 238, 0.61);
  -webkit-backdrop-filter: blur(7px);
  backdrop-filter: blur(7px);
  border-bottom: 1px solid rgba(233, 232, 238, 1);
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
</style>

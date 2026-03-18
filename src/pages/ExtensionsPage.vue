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
  <PreferencePageLayout>
    <template #title>Extensions</template>
    <q-card-section>
      <div class="row items-center">
        <div class="text-h6 col">Add Custom ZCL</div>
      </div>
      <div class="column">
        <div class="col">
          You can use this functionality to add custom ZCL clusters to the ZCL
          Advanced Platform (ZAP). Click the button below to browse for an
          <strong>XML file containing only cluster definitions</strong>. JSON
          files are not currently supported for loading.
        </div>
        <p
          class="text-center"
          v-if="enableExtensionsWarning()"
          style="color: red"
        >
          Warning: Custom xml is currently not supported for multi-protocol
          configurations.
        </p>
        <q-btn
          color="primary"
          icon="add"
          class="v-step-17 col q-mx-auto q-mt-md"
          @click="browseForFile()"
          rounded
          label="Browse for XML file"
        >
          <q-tooltip>
            Only XML files containing cluster definitions can be loaded. JSON
            package files shown below are for reference only.
          </q-tooltip>
        </q-btn>
      </div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <div class="row items-center">
        <strong>Custom XML extensions</strong>
      </div>
      <div v-if="customPackages.length === 0" class="text-grey-7 q-mt-sm">
        No custom extensions added yet.
      </div>
      <PackagesList :packages="customPackages" :notisData="notisData" v-else />
    </q-card-section>
    <q-card-section class="q-pt-none">
      <div class="row items-center">
        <strong>Built-in ZCL packages</strong>
      </div>
      <PackagesList
        :packages="builtInPackages"
        :notisData="notisData"
        builtIn
      />
    </q-card-section>
  </PreferencePageLayout>
</template>

<script>
import CommonMixin from '../util/common-mixin'
import rendApi from '../../src-shared/rend-api.js'
import restApi from '../../src-shared/rest-api.js'
import PreferencePageLayout from '../layouts/PreferencePageLayout.vue'
import PackagesList from '../components/PackagesList.vue'
const observable = require('../util/observable.js')
import { Notify } from 'quasar'

export default {
  mixins: [CommonMixin],
  components: {
    PreferencePageLayout,
    PackagesList
  },
  watch: {
    packages(newPackages) {
      this.loadPackageNotification(newPackages)
    },
    packageToLoad() {
      this.loadNewPackage().then(() => {
        this.$store.dispatch('zap/updateZclDeviceTypes')
      })
    }
  },
  computed: {
    customPackages() {
      return this.packages.filter(
        (p) => p.sessionPackage.type === 'zcl-xml-standalone'
      )
    },
    builtInPackages() {
      return this.packages.filter(
        (p) => p.sessionPackage.type !== 'zcl-xml-standalone'
      )
    }
  },
  methods: {
    browseForFile() {
      window[rendApi.GLOBAL_SYMBOL_NOTIFY](rendApi.notifyKey.fileBrowse, {
        context: 'customXml',
        title: 'Select an XML file containing custom ZCL objects',
        mode: 'file',
        defaultPath: this.packageToLoad,
        buttonLabel: 'Open'
      })
    },
    loadNewPackage() {
      return this.$store
        .dispatch('zap/addNewPackage', this.packageToLoad)
        .then((packageStatus) => {
          if (packageStatus.isValid) {
            this.error = null
            this.$store.dispatch('zap/updateClusters')
            this.$store.dispatch('zap/updateAtomics')
          } else {
            this.error = packageStatus.err
            Notify.create({
              message: this.error,
              type: 'warning',
              classes: 'custom-notification notification-warning',
              position: 'top',
              html: true
            })
          }
        })
    },
    // load package notification data after global var updates
    loadPackageNotification(newPackages) {
      if (newPackages) {
        newPackages.forEach((packageFile) => {
          let packageId = packageFile.pkg.id
          if (packageId) {
            this.getPackageNotifications(packageId)
          }
        })
      }
    },
    async getPackageNotifications(packageId) {
      this.$serverGet(
        restApi.uri.packageNotificationById.replace(':packageId', packageId)
      ).then((res) => {
        let notifications = res.data || []
        let currentPackage = {
          hasWarning: notifications.length > 0,
          hasError: false,
          warnings: [],
          errors: []
        }
        notifications.forEach((notification) => {
          if (notification.type == 'ERROR') {
            currentPackage.hasError = true
            currentPackage.errors.push(notification)
          } else {
            currentPackage.warnings.push(notification)
          }
        })
        this.$set(this.notisData, packageId, currentPackage)
      })
    },
    // Custom xml currently not supported for multi-protocol
    enableExtensionsWarning() {
      let categories =
        this.$store.state.zap.selectedZapConfig?.zclProperties.map(
          (zclProp) => zclProp.category
        )
      // Showing extensions when the zcl packages have less than 1 category
      return categories.length > 1
    }
  },
  mounted() {
    if (this.$serverGet != null) {
      this.$store.dispatch('zap/getProjectPackages')
      observable.observeAttribute(
        rendApi.observable.reported_files,
        (value) => {
          if (value.context == 'customXml') {
            this.packageToLoad = value.filePaths[0]
          }
        }
      )
    }
  },
  data() {
    return {
      packageToLoad: '',
      error: null,
      notisData: {}
    }
  }
}
</script>

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
  <div style="width: 800px; max-width: 80vw">
    <q-card>
      <q-card-section>
        <div class="text-h5">Add Custom ZCL</div>
        <div class="row items-center">
          <div>
            You can use this functionality to add custom ZCL clusters or
            commands to the Zigbee Clusters Configurator
          </div>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            class="v-step-17"
            @click="browseForFile()"
          />
        </div>
      </q-card-section>
      <q-card-section>
        <q-list bordered separator>
          <div v-for="(sessionPackage, index) in packages" :key="index">
            <q-item>
              <q-item-section>
                <q-expansion-item>
                  <template #header>
                    <q-toolbar>
                      <div>
                        <strong>{{
                          getFileName(sessionPackage.pkg.path)
                        }}</strong>
                      </div>
                      <q-space />
                      <q-btn
                        label="Delete"
                        icon="delete"
                        flat
                        @click.stop="deletePackage(sessionPackage)"
                        :disable="sessionPackage.sessionPackage.required == 1"
                      />
                      <q-btn
                        label="Relative to..."
                        outlined
                        v-show="false"
                        @click.stop
                      />
                    </q-toolbar>
                  </template>
                  Full File path: {{ sessionPackage.pkg.path }} <br />
                  Package Type: {{ sessionPackage.pkg.type }} <br />
                  Version: {{ sessionPackage.pkg.version }} <br />
                  Required:
                  {{
                    sessionPackage.sessionPackage.required ? 'True' : 'False'
                  }}
                  <br />
                </q-expansion-item>
              </q-item-section>
              <q-item-section side>
                <q-icon
                  :class="{
                    'cursor-pointer':
                      iconName(sessionPackage.pkg.id) == 'error' ||
                      iconName(sessionPackage.pkg.id) == 'warning',
                  }"
                  :name="iconName(sessionPackage.pkg.id)"
                  :color="iconColor(sessionPackage.pkg.id)"
                  size="2em"
                  @click="() => handleIconClick(sessionPackage.pkg.id)"
                />
              </q-item-section>
              <q-dialog v-model="dialogData[sessionPackage.pkg.id]">
                <q-card>
                  <q-card-section>
                    <div class="row items-center">
                      <div class="col-1">
                        <q-icon
                          :name="iconName(sessionPackage.pkg.id)"
                          :color="iconColor(sessionPackage.pkg.id)"
                          size="2em"
                        ></q-icon>
                      </div>
                      <div class="text-h6 col">
                        {{ sessionPackage.pkg.path }}
                      </div>
                      <div class="col-1 text-right">
                        <q-btn dense flat icon="close" v-close-popup>
                          <q-tooltip>Close</q-tooltip>
                        </q-btn>
                      </div>
                    </div>
                    <div v-if="notisData[sessionPackage.pkg.id]?.hasError">
                      <div
                        class="text-h6"
                        style="margin-top: 15px; padding-left: 20px"
                      >
                        Errors
                      </div>
                      <ul>
                        <li
                          v-for="(error, index) in populateNotifications(
                            sessionPackage.pkg.id,
                            'ERROR'
                          )"
                          :key="'error' + index"
                          style="margin-bottom: 10px"
                        >
                          {{ error.message }}
                        </li>
                      </ul>
                    </div>
                    <div v-if="notisData[sessionPackage.pkg.id]?.hasWarning">
                      <div
                        class="text-h6"
                        style="margin-top: 15px; padding-left: 20px"
                      >
                        Warnings
                      </div>
                      <ul>
                        <li
                          v-for="(warning, index) in populateNotifications(
                            sessionPackage.pkg.id,
                            'WARNING'
                          )"
                          :key="index"
                          style="margin-bottom: 10px"
                        >
                          {{ warning.message }}
                        </li>
                      </ul>
                    </div>
                  </q-card-section>
                </q-card>
              </q-dialog>
            </q-item>
          </div>
        </q-list>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import CommonMixin from '../util/common-mixin'
import rendApi from '../../src-shared/rend-api.js'
import restApi from '../../src-shared/rest-api.js'
const observable = require('../util/observable.js')
import { Notify } from 'quasar'
import { rest } from 'underscore'

export default {
  mixins: [CommonMixin],
  watch: {
    packages(newPackages) {
      this.loadPackageNotification(newPackages)
    },
  },
  methods: {
    getFileName(path) {
      let fileName = path.match(/[^/]+$/)
      return fileName.length > 0 ? fileName[0] : path
    },
    browseForFile() {
      window[rendApi.GLOBAL_SYMBOL_NOTIFY](rendApi.notifyKey.fileBrowse, {
        context: 'customXml',
        title: 'Select an XML file containing custom ZCL objects',
        mode: 'file',
        defaultPath: this.packageToLoad,
        buttonLabel: 'Open',
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
              html: true,
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
            this.dialogData[packageId] = false
          }
        })
      }
    },
    async deletePackage(packageToDelete) {
      await this.$store.dispatch(
        'zap/deleteSessionPackage',
        packageToDelete.sessionPackage
      )
      await this.$store.dispatch('zap/updateClusters')
      await this.$store.dispatch('zap/updateAtomics')
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
          errors: [],
        }
        notifications.forEach((notification) => {
          if (notification.type == 'ERROR') {
            currentPackage.hasError = true
            currentPackage.errors.push(notification)
          } else {
            currentPackage.warnings.push(notification)
          }
        })
        this.notisData[packageId] = currentPackage
      })
    },
    iconName(packageId) {
      if (this.notisData[packageId]?.hasError) {
        return 'error'
      } else if (this.notisData[packageId]?.hasWarning) {
        return 'warning'
      } else {
        return 'check_circle'
      }
    },
    iconColor(packageId) {
      if (this.notisData[packageId]?.hasError) {
        return 'red'
      } else if (this.notisData[packageId]?.hasWarning) {
        return 'orange'
      } else {
        return 'green'
      }
    },
    handleIconClick(packageId) {
      let iconName = this.iconName(packageId)
      if (iconName === 'error' || iconName === 'warning') {
        this.dialogData[packageId] = true
      }
    },
    populateNotifications(packageId, type) {
      let key = type == 'ERROR' ? 'errors' : 'warnings'
      return this.notisData[packageId][key]
    },
  },
  mounted() {
    if (this.$serverGet != null) {
      this.$store.dispatch('zap/getProjectPackages')
      observable.observeAttribute(
        rendApi.observable.reported_files,
        (value) => {
          if (value.context == 'customXml') {
            this.packageToLoad = value.filePaths[0]
            this.loadNewPackage().then(() => {
              this.$store.dispatch('zap/updateZclDeviceTypes')
            })
          }
        }
      )
    }
  },
  data() {
    return {
      packageToLoad: '',
      error: null,
      notisData: {},
      dialogData: {},
    }
  },
}
</script>

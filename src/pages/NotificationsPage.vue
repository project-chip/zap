<template>
  <div class="column fit">
    <q-scroll-area class="col">
      <div class="q-pa-sm">
        <div class="text-h5 q-pb-sm">Notifications</div>
        <q-table
          :rows="notis"
          :columns="columns"
          row-key="id"
          flat
          dense
          wrap-cells
          hide-pagination
          :pagination="{ rowsPerPage: 0 }"
        >
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th v-for="col in props.cols" :key="col.name" :props="props">
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>
          <template v-slot:body="props">
            <q-tr
              :props="props"
              class="table_body cursor-pointer"
              @click="props.expand = !props.expand"
            >
              <q-td key="type" :props="props">
                <div v-if="props.row.type == 'ERROR'" style="color: red">
                  {{ props.row.type }}
                </div>
                <div
                  v-else-if="props.row.type == 'WARNING'"
                  style="color: rgb(128, 128, 9)"
                >
                  {{ props.row.type }}
                </div>
                <div v-else>{{ props.row.type }}</div>
              </q-td>
              <q-td key="message" :props="props" class="notification-message">
                <div v-if="props.row.type == 'ERROR'" style="color: red">
                  {{ props.row.message }}
                </div>
                <div
                  v-else-if="props.row.type == 'WARNING'"
                  style="color: rgb(128, 128, 9)"
                >
                  {{ props.row.message }}
                </div>
                <div v-else>{{ props.row.message }}</div>
              </q-td>
              <q-td key="delete" :props="props">
                <q-btn
                  flat
                  icon="delete"
                  data-cy="btn-delete-notification"
                  @click.stop="deleteNotification(props.row.id)"
                />
              </q-td>
            </q-tr>
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%" class="notification-message-expanded">
                {{ props.row.message }}
              </q-td>
            </q-tr>
          </template>
        </q-table>

        <br />

        <div class="text-h5">Package Notifications</div>
        <div v-for="(sessionPackage, index) in packages" :key="index">
          <q-expansion-item
            v-if="
              packageNotis[sessionPackage.pkg.id]?.hasError ||
              packageNotis[sessionPackage.pkg.id]?.hasWarning
            "
            expand-separator
            class="q-mt-sm"
            header-class="text-body1 text-weight-bold"
            data-cy="package-notification-expansion"
          >
            <template #header>
              <q-item-section>
                <q-item-label class="notification-message text-weight-bold">
                  {{ sessionPackage.pkg.path }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon
                  :name="
                    packageNotis[sessionPackage.pkg.id]?.hasError
                      ? 'error'
                      : 'warning'
                  "
                  :color="
                    packageNotis[sessionPackage.pkg.id]?.hasError
                      ? 'red'
                      : 'orange'
                  "
                  size="2em"
                />
              </q-item-section>
            </template>
            <div v-if="packageNotis[sessionPackage.pkg.id]?.hasError">
              <div class="text-h6" style="margin-top: 15px; padding-left: 20px">
                Errors
              </div>
              <ul>
                <li
                  v-for="(error, errorIndex) in packageNotis[
                    sessionPackage.pkg.id
                  ]?.errors"
                  :key="'error' + errorIndex"
                  class="notification-message"
                  style="margin-bottom: 10px"
                >
                  {{ error.message }}
                </li>
              </ul>
            </div>
            <div v-if="packageNotis[sessionPackage.pkg.id]?.hasWarning">
              <div class="text-h6" style="margin-top: 15px; padding-left: 20px">
                Warnings
              </div>
              <ul>
                <li
                  v-for="(warning, warningIndex) in packageNotis[
                    sessionPackage.pkg.id
                  ]?.warnings"
                  :key="'warning' + warningIndex"
                  class="notification-message"
                  style="margin-bottom: 10px"
                >
                  {{ warning.message }}
                </li>
              </ul>
            </div>
          </q-expansion-item>
        </div>
      </div>
    </q-scroll-area>
  </div>
</template>

<script>
import dbEnum from '../../src-shared/db-enum'
import restApi from '../../src-shared/rest-api.js'
import commonMixin from '../util/common-mixin'

export default {
  mixins: [commonMixin],
  computed: {
    showNotificationTab() {
      return this.$store.state.zap.showNotificationTab
    }
  },
  watch: {
    packages(newPackages) {
      this.loadPackageNotification(newPackages)
    },
    showNotificationTab(newVal) {
      if (newVal) {
        this.getNotificationsAndUpdateSeen()
      }
    }
  },
  methods: {
    getNotificationsAndUpdateSeen() {
      this.notis = []
      this.$serverGet(restApi.uri.sessionNotification)
        .then((resp) => {
          let unseenIds = []
          for (let i = 0; i < resp.data.length; i++) {
            let notification = resp.data[i]
            this.notis.push(notification)
            if (notification.seen == 0) {
              unseenIds.push(notification.id)
            }
          }
          if (unseenIds && unseenIds.length > 0) {
            let parameters = {
              unseenIds: unseenIds
            }
            let config = { params: parameters }
            this.$serverGet(restApi.uri.updateNotificationToSeen, config)
              .then((resp) => {
                // clear notification count when enter notification page
                this.$store.commit('zap/updateNotificationCount', 0)
              })
              .catch((err) => {
                console.log(err)
              })
          }
        })
        .catch((err) => {
          console.log(err)
        })
    },
    getNotifications() {
      this.$serverGet(restApi.uri.sessionNotification).then((resp) => {
        this.notis = []
        for (let i = 0; i < resp.data.length; i++) {
          this.notis.push(resp.data[i])
        }
      })
    },
    getUnseenNotificationCount() {
      this.$serverGet(restApi.uri.unseenNotificationCount)
        .then((resp) => {
          this.$store.commit('zap/updateNotificationCount', resp.data)
        })
        .catch((err) => {
          console.log(err)
        })
    },
    deleteNotification(id) {
      let parameters = {
        id: id
      }
      let config = { params: parameters }
      this.$serverDelete(restApi.uri.deleteSessionNotification, config).then(
        (resp) => {
          this.notis = this.notis.filter((row) => row.id !== id)
          this.getUnseenNotificationCount()
        }
      )
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
    getPackageNotifications(packageId) {
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
        this.packageNotis = {
          ...this.packageNotis,
          [packageId]: currentPackage
        }
      })
    },
    hasError(packageId) {
      return this.packageNotis[packageId].hasError
    }
  },
  data() {
    return {
      columns: [
        {
          name: 'type',
          align: 'center',
          label: 'type',
          field: 'type',
          style: 'width: 90px'
        },
        {
          name: 'message',
          align: 'left',
          label: 'message',
          field: 'message',
          style: 'white-space: normal; word-break: break-word;'
        },
        {
          name: 'delete',
          align: 'center',
          label: 'delete',
          field: 'delete',
          style: 'width: 70px'
        }
      ],
      notis: [],
      packageNotis: {}
    }
  },
  mounted() {
    if (this.$onWebSocket) {
      this.$onWebSocket(dbEnum.wsCategory.notificationCount, (data) => {
        this.getNotifications()
      })
    }
  }
}
</script>
<style scoped>
.notification-message {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.notification-message-expanded {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  padding: 8px 12px 16px;
}
</style>

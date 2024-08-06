<template>
  <div class="q-pa-sm">
    <div class="text-h5 q-pb-sm">Notifications</div>
    <q-table :rows="notis" :columns="columns" row-key="ref" flat>
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props" class="table_body">
          <q-td style="display: none" key="id" :props="props">
            <div>{{ props.row.id }}</div>
          </q-td>
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
          <q-td key="message" :props="props">
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
          <q-td>
            <q-btn
              flat
              icon="delete"
              @click="deleteNotification(props.row.id)"
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <br />

    <div class="text-h5">Packages Notifications</div>
    <div v-for="(sessionPackage, index) in packages" :key="index">
      <div
        v-if="
          packageNotis[sessionPackage.pkg.id]?.hasError ||
          packageNotis[sessionPackage.pkg.id]?.hasWarning
        "
      >
        <q-item>
          <q-item-section>
            <q-expansion-item>
              <template #header>
                <q-toolbar>
                  <div>
                    <strong>{{ sessionPackage.pkg.path }}</strong>
                  </div>
                </q-toolbar>
              </template>
              <div v-if="packageNotis[sessionPackage.pkg.id]?.hasError">
                <div
                  class="text-h6"
                  style="margin-top: 15px; padding-left: 20px"
                >
                  Errors
                </div>
                <ul>
                  <li
                    v-for="(error, index) in this.packageNotis[
                      sessionPackage.pkg.id
                    ]?.errors"
                    :key="'error' + index"
                    style="margin-bottom: 10px"
                  >
                    {{ error.message }}
                  </li>
                </ul>
              </div>
              <div v-if="packageNotis[sessionPackage.pkg.id]?.hasWarning">
                <div
                  class="text-h6"
                  style="margin-top: 15px; padding-left: 20px"
                >
                  Warnings
                </div>
                <ul>
                  <li
                    v-for="(warning, index) in this.packageNotis[
                      sessionPackage.pkg.id
                    ]?.warnings"
                    :key="index"
                    style="margin-bottom: 10px"
                  >
                    {{ warning.message }}
                  </li>
                </ul>
              </div>
              <br />
            </q-expansion-item>
          </q-item-section>
          <q-item-section side style="align-self: flex-start; margin-top: 15px">
            <q-icon
              :name="
                this.packageNotis[sessionPackage.pkg.id]?.hasError
                  ? 'error'
                  : 'warning'
              "
              :color="
                this.packageNotis[sessionPackage.pkg.id]?.hasError
                  ? 'red'
                  : 'orange'
              "
              size="2em"
            />
          </q-item-section>
        </q-item>
      </div>
    </div>
  </div>
</template>

<script>
import dbEnum from '../../src-shared/db-enum'
import restApi from '../../src-shared/rest-api.js'
import commonMixin from '../util/common-mixin'

export default {
  mixins: [commonMixin],

  watch: {
    packages(newPackages) {
      this.loadPackageNotification(newPackages)
    },
  },
  methods: {
    getNotificationsAndUpdateSeen() {
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
              unseenIds: unseenIds,
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
        id: id,
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
        this.packageNotis[packageId] = currentPackage
      })
    },
    hasError(packageId) {
      return this.packageNotis[packageId].hasError
    },
  },
  data() {
    return {
      columns: [
        { name: 'type', align: 'center', label: 'type', field: 'type' },
        {
          name: 'message',
          align: 'center',
          label: 'message',
          field: 'message',
        },
        {
          name: 'delete',
          align: 'center',
          label: 'delete',
          field: 'delete',
        },
      ],
      notis: [],
      packageNotis: [],
    }
  },
  created() {
    if (this.$serverGet != null) {
      this.notis = []
      this.getNotificationsAndUpdateSeen()
      this.loadPackageNotification(this.packages)
    }
  },
  mounted() {
    if (this.$onWebSocket) {
      this.$onWebSocket(dbEnum.wsCategory.notificationCount, (data) => {
        this.notis = []
        this.getNotifications()
      })
    }
  },
}
</script>

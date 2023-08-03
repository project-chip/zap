<template>
  <PreferencePageLayout>
    <template #title>Notifications </template>
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
          <q-td style="display: none" key="order" :props="props">
            <div>{{ props.row.order }}</div>
          </q-td>
          <!-- <q-td key="ref" :props="props">
            <div>{{ props.row.ref }}</div>
          </q-td> -->
          <q-td key="type" :props="props">
            <div>{{ props.row.type }}</div>
          </q-td>
          <q-td key="message" :props="props">
            <div>{{ props.row.message }}</div>
          </q-td>
          <!-- <q-td key="severity" :props="props">
            <div>{{ props.row.severity }}</div>
          </q-td> -->
          <q-td>
            <q-btn
              flat
              icon="delete"
              @click="deleteNotification(props.row.order)"
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </PreferencePageLayout>
</template>

<script>
import PreferencePageLayout from '../layouts/PreferencePageLayout.vue'
import dbEnum from '../../src-shared/db-enum'

import restApi from '../../src-shared/rest-api.js'
export default {
  components: {
    PreferencePageLayout,
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
              unseenIds.push(notification.order)
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
      this.$serverGet(restApi.uri.sessionNotification)
        .then((resp) => {
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
    deleteNotification(order) {
      let parameters = {
        order: order,
      }
      let config = { params: parameters }
      this.$serverDelete(restApi.uri.deleteSessionNotification, config).then(
        (resp) => {
          this.notis = this.notis.filter((row) => row.order !== order)
          this.getUnseenNotificationCount()
        }
      )
    },
  },
  data() {
    return {
      columns: [
        // {
        //   name: 'ref',
        //   align: 'center',
        //   label: 'ref',
        //   field: 'ref',
        // },
        { name: 'type', align: 'center', label: 'type', field: 'type' },
        {
          name: 'message',
          align: 'center',
          label: 'message',
          field: 'message',
        },
        // {
        //   name: 'severity',
        //   align: 'center',
        //   label: 'severity',
        //   field: 'severity',
        // },
        {
          name: 'delete',
          align: 'center',
          label: 'delete',
          field: 'delete',
        },
      ],
      notis: [],
    }
  },
  created() {
    if (this.$serverGet != null) {
      this.notis = []
      this.getNotificationsAndUpdateSeen()
    }
  },
  mounted() {
    if(this.$onWebSocket) {
      this.$onWebSocket(
        dbEnum.wsCategory.notificationCount,
        (data) => {
          this.notis = []
          this.getNotifications()
        }
      )
    }
  }
}
</script>

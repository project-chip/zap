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
          <q-td style="display: none;" key="order" :props="props">
            <div>{{ props.row.order }}</div>
          </q-td>
          <q-td key="ref" :props="props">
            <div>{{ props.row.ref }}</div>
          </q-td>
          <q-td key="type" :props="props">
            <div>{{ props.row.type }}</div>
          </q-td>
          <q-td key="message" :props="props">
            <div>{{ props.row.message }}</div>
          </q-td>
          <q-td key="severity" :props="props">
            <div>{{ props.row.severity }}</div>
          </q-td>
          <q-td> 
            <q-btn flat icon="delete" @click="deleteNotification(props.row.order)"/>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </PreferencePageLayout>
</template>

<script>
import PreferencePageLayout from '../layouts/PreferencePageLayout.vue'

import restApi from '../../src-shared/rest-api.js'
export default {
  components: {
    PreferencePageLayout,
  },
  methods: {
    getNotifications() {
      this.$serverGet(restApi.uri.sessionNotification)
        .then((resp) => {
          for (let i = 0; i < resp.data.length; i++) {
            this.notis.push(resp.data[i])
          }
          let notificationCount = resp.data.length
          this.$store.commit('zap/updateNotificationCount', notificationCount)
        })
        .catch((err) => {
          console.log(err)
        })
        console.log(this.notis)
      
        this.$serverGet(restApi.uri.packageNotification)
        .then((resp) => {
          for (let i = 0; i < resp.data.length; i++) {
            this.notis.push(resp.data[i])
          }
          let notificationCount = resp.data.length
          //this.$store.commit('zap/updateNotificationCount', notificationCount)
        })
        .catch((err) => {
          console.log(err)
        })
    },
    deleteNotification(data) {
      let parameters = {
        order: data,
      }
      let config = {params: parameters}
      this.$serverDelete(restApi.uri.deleteNotification, config)
        .then((resp) => {
           this.notis = []
           this.getNotifications()
        })
    }

  },
  data() {
    return {
      columns: [
        {
          name: 'ref',
          align: 'center',
          label: 'ref',
          field: 'ref',
        },
        { name: 'type', align: 'center', label: 'type', field: 'type' },
        {
          name: 'message',
          align: 'center',
          label: 'message',
          field: 'message',
        },
        {
          name: 'severity',
          align: 'center',
          label: 'severity',
          field: 'severity',
        },
        {
          name: 'delete',
          align: 'center',
          label: 'delete',
          field: 'delete',
        }
      ],
      notis: [],
    }
  },
  created() {
    if (this.$serverGet != null) {
      this.notis = []
      this.getNotifications()
    }
  },
}
</script>

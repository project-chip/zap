<template>
  <div class="q-pa-md">
    <q-toolbar class="shadow-2">
      <q-btn icon="arrow_back" to="/" label="Back" data-test="go-back-button" />
    </q-toolbar>
    <q-table
      title="Notifications"
      :data="notis"
      :columns="columns"
      row-key="ref"
    >
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props" class="table_body">
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
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
import restApi from '../../src-shared/rest-api.js'
export default {
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
      ],
      notis: [],
    }
  },
  created() {
    this.$serverGet(restApi.uri.notification)
      .then((resp) => {
        for (let i = 0; i < resp.data.length; i++) {
          this.notis.push(resp.data[i])
        }
      })
      .catch((err) => {
        console.log(err)
      })
  },
}
</script>

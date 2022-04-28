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
  <div>
    <div class="text-h4 q-mb-md">Generation</div>
    <p>Generation preferences.</p>
    <q-table
      class="my-sticky-header-table"
      :data.sync="packages"
      :columns="columns"
      :pagination.sync="pagination"
      row-key="<b>name</b>"
      dense
      flat
      virtual-scroll
      binary-state-sort
      data-cy="Attributes"
      style="height: calc(100vh - 210px); overflow: hidden"
      :rows="1000"
    >
      <template v-slot:body-cell-content="props">
        <q-td :props="props">
          <q-btn
            flat
            color="secondary"
            dense
            icon="visibility"
            @click="showContent(props.row)"
          />
        </q-td>
      </template>
      <template v-slot:pagination> </template>
    </q-table>
    <q-dialog v-model="showContentDialog">
      <q-card style="width: 800px; max-width: 80vw">
        <q-card-section>
          <div>{{ activePackage.VERSION }} content:</div>
          <pre>
            {{ activePackage.content }}
          </pre>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
export default {
  name: 'PreferenceGeneration',
  data() {
    return {
      showContentDialog: false,
      activePackage: {},
      columns: [
        {
          name: 'ID',
          label: 'ID',
          align: 'left',
          field: 'PACKAGE_ID',
        },
        {
          name: 'VERSION',
          align: 'left',
          label: 'Version',
          field: 'VERSION',
        },
        {
          name: 'PATH',
          align: 'left',
          label: 'Path',
          field: 'PATH',
        },
        {
          name: 'content',
          align: 'left',
          label: 'Content',
        },
      ],
    }
  },
  computed: {
    packages: {
      get() {
        return this.$store.state.zap.allPackages.filter(
          (singlePackage) => singlePackage.TYPE == 'gen-template'
        )
      },
    },
    pagination: {
      get() {
        return {
          sortBy: 'desc',
          descending: false,
          page: 1,
          rowsPerPage: this.packages.length,
        }
      },
    },
  },
  methods: {
    showContent(data) {
      console.log(data)
      this.activePackage = data
      this.showContentDialog = true
    },
  },
}
</script>

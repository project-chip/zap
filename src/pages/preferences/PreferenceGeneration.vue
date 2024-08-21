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
    <template #title> Generation</template>
    <q-table
      class="my-sticky-header-table"
      :rows="packages"
      :columns="columns"
      :pagination="pagination"
      row-key="<b>name</b>"
      dense
      flat
      virtual-scroll
      binary-state-sort
      data-cy="Attributes"
      style="height: calc(100vh - 210px); overflow: hidden"
    >
      <template v-slot:pagination> </template>
    </q-table>
  </PreferencePageLayout>
</template>
<script>
import PreferencePageLayout from '../../layouts/PreferencePageLayout.vue'

export default {
  name: 'PreferenceGeneration',
  components: {
    PreferencePageLayout
  },
  data() {
    return {
      activePackage: {},
      columns: [
        {
          name: 'ID',
          label: 'ID',
          align: 'left',
          field: 'PACKAGE_ID'
        },
        {
          name: 'VERSION',
          align: 'left',
          label: 'Version',
          field: 'VERSION'
        },
        {
          name: 'PATH',
          align: 'left',
          label: 'Path',
          field: 'PATH'
        }
      ]
    }
  },
  computed: {
    packages: {
      get() {
        return this.$store.state.zap.allPackages.filter(
          (singlePackage) => singlePackage.TYPE == 'gen-template'
        )
      }
    },
    pagination: {
      get() {
        return {
          sortBy: 'desc',
          descending: false,
          page: 1,
          rowsPerPage: this.packages.length
        }
      }
    }
  }
}
</script>

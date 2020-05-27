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
  <div class="q-pa-md bg-grey-10 text-white">
    <q-list dark bordered dense separator>
      <q-item-label header>{{ title }}</q-item-label>
      <div v-for="(item, index) in items" v-bind:key="index" class="row">
        <q-item v-ripple>
          <q-checkbox
            class="q-mt-xs"
            v-model="selection"
            :val="item.id"
            indeterminate-value="false"
            dark
            @input="handleClusterSelection(item.id)"
          />
          <q-item-section
            class="q-ml-sm"
            clickable
            @click="getSingleEntity(item.id)"
          >
            <div>
              <q-item-label>{{ item.label }}</q-item-label>
              <q-item-label caption>{{ item.caption }}</q-item-label>
            </div>
          </q-item-section>
        </q-item>
      </div>
    </q-list>
  </div>
</template>
<script>
export default {
  name: 'ZclItemList',
  methods: {
    getSingleEntity(id) {
      this.$serverGet(`/${this.type}/${id}`)
    },
    handleClusterSelection(item) {
      this.$serverPost(`/${this.type}/${item}`)
    },
  },
  mounted() {
    this.$serverOn('zcl-item-list', (event, arg) => {
      console.log('zcl-item-list:')
      this.items = arg.data
      this.title = arg.title
      this.type = arg.type
      this.selection = []
    })
    this.$serverGet('/cluster/all')
  },
  data() {
    return {
      items: [],
      title: 'unknown',
      type: 'unknown',
      selection: [],
    }
  },
}
</script>

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
    <q-input dark outlined v-model="text" label="Outlined" @change="hitEnter" />
    <p>Count: {{ count }}</p>
    <q-list dark bordered separator>
      <div v-for="(item, index) in items" v-bind:key="index" class="row">
        <q-item>{{ item }}</q-item>
      </div>
    </q-list>
    <pre>
      {{ result }}
      </pre
    >
  </div>
</template>

<script>
import restApi from '../../src-shared/rest-api.js'
export default {
  methods: {
    hitEnter() {
      this.$serverPost(restApi.uri.sql, { sql: this.text })
    },
  },
  mounted() {
    this.$serverOn(restApi.replyId.sqlResult, (event, arg) => {
      this.items = arg.result
      this.count = arg.result.length
    })
  },
  data() {
    return {
      text: '',
      count: 0,
      items: '',
    }
  },
}
</script>

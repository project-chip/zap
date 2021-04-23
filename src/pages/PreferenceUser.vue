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
    <div class="text-h4 q-mb-md">User settings</div>
    <p>User preferences.</p>
    <q-input @input="setPath" v-model="localPath" label="Last file location" />
  </div>
</template>
<script>
import * as storage from '../util/storage.js'
import rendApi from '../../src-shared/rend-api.js'
export default {
  name: 'PreferenceUser',
  methods: {
    setPath(path) {
      storage.setItem(rendApi.storageKey.fileSave, path)
    },
  },
  computed: {
    localPath: {
      get() {
        return storage.getItem(rendApi.storageKey.fileSave)
      },
    },
  },
}
</script>

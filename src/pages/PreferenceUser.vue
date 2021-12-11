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
    <q-separator spaced="md" />
    <p>UI preferences</p>
    <q-separator spaced="md" />
    <q-toggle
      class="q-mr-sm q-mt-lg q-mb-lg"
      label="Dark Theme"
      dense
      left-label
      v-model="localtheme"
    >
      <q-tooltip> Enable Dark theme </q-tooltip>
    </q-toggle>
    <br />
    <q-toggle
      class="q-mr-sm q-mt-lg q-mb-lg"
      label="Dev Tools"
      dense
      left-label
      v-model="devtab"
    >
      <q-tooltip> Enable Dev Tools tab </q-tooltip>
    </q-toggle>
    <q-separator spaced="md" />
    <p>User preferences.</p>
    <q-input @input="setPath" v-model="localPath" label="Last file location" />
  </div>
</template>
<script>
import * as storage from '../util/storage.js'
import rendApi from '../../src-shared/rend-api.js'
const observable = require('../util/observable.js')
export default {
  name: 'PreferenceUser',
  data() {
    return {
      localtheme: false,
    }
  },
  created() {
    this.gettheme()
  },
  methods: {
    setPath(path) {
      storage.setItem(rendApi.storageKey.fileSave, path)
    },
    gettheme() {
      return new Promise((r) => {
        setTimeout(async () => {
          let theme = observable.getObservableAttribute(
            rendApi.observable.themeData
          )
          if (!theme) await this.gettheme()
          this.localtheme = theme === 'dark'
        }, 1000)
      })
    },
  },
  watch: {
    localtheme(val) {
      observable.setObservableAttribute(
        rendApi.observable.themeData,
        val ? 'dark' : 'light'
      )
    },
  },
  computed: {
    localPath: {
      get() {
        return storage.getItem(rendApi.storageKey.fileSave)
      },
    },
    devtab: {
      get() {
        return this.$store.state.zap.showDevTools
      },
      set() {
        return this.$store.dispatch('zap/updateShowDevTools')
      },
    },
  },
}
</script>

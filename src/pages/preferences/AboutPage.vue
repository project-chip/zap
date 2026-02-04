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
    <template #title>About </template>
    <q-img src="~assets/zap_splash.png">
      <div class="absolute-bottom text-subtitle1 text-center">
        Version {{ version }} (feature level: {{ featureLevel }}, commit #{{
          hash
        }}
        from {{ date }})
        <br />
        &copy; 2020 by the authors. Released as open-source, under terms of
        Apache 2.0 license. {{ version }}
        <br />
        <q-btn
          color="primary"
          label="View Manual"
          v-on:click="openDocumentation()"
          data-cy="view-manual-button"
        />
      </div>
    </q-img>
  </PreferencePageLayout>
</template>
<script>
const restApi = require(`../../../src-shared/rest-api.js`)
import PreferencePageLayout from '../../layouts/PreferencePageLayout.vue'
const commonUrl = require('../../../src-shared/common-url.js')

export default {
  name: 'AboutPage',
  components: {
    PreferencePageLayout
  },
  mounted() {
    if (this.$serverGet != null) {
      this.$serverGet(restApi.uri.version).then((result) => {
        this.version = result.data.version
        this.featureLevel = result.data.featureLevel
        if ('hash' in result.data) {
          this.hash = result.data.hash.substring(0, 7)
        } else {
          this.hash = 'Unknown hash'
        }
        if ('date' in result.data) {
          let d = new Date(result.data.date)
          this.date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
        } else {
          this.date = 'Unknown date'
        }
      })
    }
  },
  data() {
    return {
      version: '',
      featureLevel: '',
      hash: '',
      date: ''
    }
  },
  methods: {
    openDocumentation() {
      window.open(commonUrl.documentationUrl, '_blank')
    }
  }
}
</script>

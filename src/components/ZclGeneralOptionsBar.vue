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
    <q-toolbar>
      <div class="q-pr-lg row-m-4 vertical-align:middle">
        Manufacturer Name or Code
      </div>
      <div class="q-pr-xl">
        <q-select
          :options="manufacturerCodesOptions"
          v-model="selectedMfgCodeOption"
          style="width: 200px;"
          outlined
          dense
        />
      </div>
      <div class="q-pr-lg vertical-align:middle">
        Default Response Policy
      </div>
      <q-select
        :options="defaultResponsePolicyOptions"
        v-model="selectedDefaultResponsePolicy"
        style="width: 150px;"
        outlined
        dense
      />
    </q-toolbar>
  </div>
</template>

<script>
export default {
  name: 'ZclGeneralOptionsBar',
  onMounted() {},
  methods: {},
  computed: {
    defaultResponsePolicyOptions: {
      get() {
        return this.$store.state.zap.genericOptions['defaultResponsePolicy']
      },
    },
    manufacturerCodesOptions: {
      get() {
        return this.$store.state.zap.genericOptions['manufacturerCodes']
      },
    },
  },
  data() {
    return {
      mfgCodeOptions: ['Silicon Labs (0x1049)'],
      selectedMfgCodeOption: '',
      selectedDefaultResponsePolicy: '',
    }
  },
}
</script>

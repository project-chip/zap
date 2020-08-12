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
    <q-splitter
      v-model="splitterModel"
      separator-class="bg-orange"
      separator-style="width: 3px"
      style="height: 600px;"
    >
      <template v-slot:before>
        <div class="q-pa-md">
          <ZclEndpointTypeConfig class="bg-grey-10 text-white" />
          <ZclEndpointConfig class="bg-grey-10 text-white" />
          <ZclClusterList class="bg-grey-10 text-white" />
        </div>
      </template>
      <template v-slot:after>
        <div class="q-pa-md">
          <ZclClusterDetails class="bg-grey-10 text-white" />
        </div>
      </template>
    </q-splitter>
  </div>
</template>
<script>
import ZclEndpointConfig from '../components/ZclEndpointConfig.vue'
import ZclEndpointTypeConfig from '../components/ZclEndpointTypeConfig.vue'
import ZclClusterList from '../components/ZclClusterList.vue'
import ZclClusterDetails from '../components/ZclClusterDetail.vue'
export default {
  name: 'ZclOldClusterLayout',
  components: {
    ZclEndpointConfig,
    ZclClusterList,
    ZclEndpointTypeConfig,
    ZclClusterDetails,
  },
  data() {
    return {
      splitterModel: 50,
    }
  },
}
</script>

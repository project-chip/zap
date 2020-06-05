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
    <q-splitter v-model="splitterModel" style="height: 250px;">
      <template v-slot:before>
        <q-tabs v-model="tab" vertical class="text-teal">
          <q-tab name="zcl" icon="mdi-lan" label="ZCL settings" />
          <q-tab
            name="gen"
            icon="mdi-file-document-edit-outline"
            label="Generation"
          />
          <q-tab name="user" icon="mdi-wrench" label="User settings" />
        </q-tabs>
      </template>

      <template v-slot:after>
        <q-tab-panels
          v-model="tab"
          animated
          swipeable
          vertical
          transition-prev="jump-up"
          transition-next="jump-up"
        >
          <q-tab-panel name="zcl">
            <PreferenceZcl />
          </q-tab-panel>

          <q-tab-panel name="gen">
            <PreferenceGeneration />
          </q-tab-panel>

          <q-tab-panel name="user">
            <PreferenceUser />
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </q-splitter>
  </div>
</template>
<script>
import PreferenceZcl from './PreferenceZcl.vue'
import PreferenceGeneration from './PreferenceGeneration.vue'
import PreferenceUser from './PreferenceUser.vue'
export default {
  name: 'Preference',
  components: {
    PreferenceZcl,
    PreferenceGeneration,
    PreferenceUser,
  },
  data() {
    return {
      tab: 'zcl',
      splitterModel: 20,
    }
  },
}
</script>

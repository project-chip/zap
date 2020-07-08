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
    <!-- Add onClick handler for new endpoint-->
    <div class="row">
      <q-btn
        class="vertical-align:middle q-pa-md q-mini-drawer-hide"
        text-color="primary"
        @click="test()"
        icon="add"
        label="Add New Endpoint"
        flat
        :ripple="false"
        :unelevated="false"
        :outline="none"
      />
      <q-space />
      <q-btn
        text-color="primary"
        icon="fast_rewind"
        flat
        :ripple="false"
        :unelevated="false"
        :outline="none"
        @click="miniState = !miniState"
      />
    </div>
    <q-separator />
  </div>
</template>

<script>
export default {
  name: 'ZclEndpointManager',
  components: {},

  methods: {
    test() {
      console.log('New Endpoint should pop up')
    },
  },
  computed: {
    leftDrawerOpen: {
      get() {
        return this.$store.state.zap.leftDrawerOpenState
      },
      set(newLeftDrawerOpenState) {
        this.$store.dispatch('zap/setLeftDrawerState', newLeftDrawerOpenState)
      },
    },
    miniState: {
      get() {
        return this.$store.state.zap.miniState
      },
      set(newLeftDrawerOpenState) {
        this.$store.dispatch('zap/setMiniState', newLeftDrawerOpenState)
      },
    },
  },

  data() {
    return {}
  },
}
</script>

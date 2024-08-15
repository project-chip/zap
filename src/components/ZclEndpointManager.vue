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
  <q-list>
    <div class="row justify-between q-mt-md q-mb-xs">
      <q-item-label class="q-my-auto" header>Endpoints</q-item-label>
      <q-btn
        class="q-px-md q-mini-drawer-hide row-8 v-step-0"
        text-color="primary"
        @click="toggleCreateEndpointModal()"
        icon="add"
        label="Add Endpoint"
        flat
        rounded
        :ripple="false"
        :unelevated="false"
        id="new_endpoint_button"
        data-test="add-new-endpoint"
      />
    </div>

    <zcl-endpoint-card
      v-for="(child, index) in endpoints"
      v-bind:key="index"
      v-bind:endpointReference="child.id"
      class="q-mini-drawer-hide"
    />

    <q-dialog v-model="showEndpointModal" class="background-color:transparent">
      <zcl-create-modify-endpoint
        v-bind:endpointReference="null"
        v-on:saveOrCreateValidated="toggleCreateEndpointModal()"
      />
    </q-dialog>
  </q-list>
</template>

<script>
import ZclEndpointCard from './ZclEndpointCard.vue'
import ZclCreateModifyEndpoint from './ZclCreateModifyEndpoint.vue'
import CommonMixin from '../util/common-mixin'

export default {
  name: 'ZclEndpointManager',
  components: { ZclEndpointCard, ZclCreateModifyEndpoint },
  mixins: [CommonMixin],
  mounted() {
    // initialize ZclClusterManager with first endpoint info.
    if (this.endpointIdListSorted.size && !this.selectedEndpointId) {
      this.setSelectedEndpointType(
        this.endpointIdListSorted.keys().next().value,
      )
    }
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
      set(newMiniState) {
        this.$store.dispatch('zap/setMiniState', newMiniState)
      },
    },
    endpoints: {
      get() {
        return Array.from(this.endpointIdListSorted.keys()).map((id) => ({
          id: id,
        }))
      },
    },
    // This computed will show create endpoint modal, its trigger with vue tour
    showEndpointModal: {
      get() {
        return this.$store.state.zap.showCreateModifyEndpoint
      },
    },
  },
  data() {
    return {
      newEndpointDialog: false,
    }
  },
  methods: {
    // This function changing the modal state
    toggleCreateEndpointModal() {
      this.$store.commit('zap/toggleEndpointModal', true)
    },
  },
}
</script>

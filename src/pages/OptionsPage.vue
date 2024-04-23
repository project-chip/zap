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
    <template #title>Options</template>
    <q-card-section>
      <div class="text-h6">Global Options</div>
    </q-card-section>
    <q-separator inset />
    <q-card-section>
      <div>
        <div class="q-mb-xs">Product Manufacturer</div>
        <q-select
          use-input
          hide-selected
          fill-input
          input-debounce="0"
          :options="mfgOptions"
          :option-label="(item) => getMfgOptionLabel(item)"
          @new-value="createValue"
          @update:model-value="
            handleOptionChange(DbEnum.sessionOption.manufacturerCodes, $event)
          "
          v-model="selectedManufacturerCode"
          @filter="filterMfgCode"
          outlined
          dense
          data-cy="manufacturer-name-or-code"
          class="q-mb-sm"
        />

        <div class="q-mb-xs">Default Response Policy</div>
        <q-select
          :options="defaultResponsePolicyOptions"
          v-model="selectedDefaultResponsePolicy"
          :option-label="(item) => (item === null ? 'NULL' : item.optionLabel)"
          @update:model-value="
            handleEnumeratedOptionChange(
              DbEnum.sessionOption.defaultResponsePolicy,
              $event
            )
          "
          outlined
          dense
          data-cy="default-response-policy"
          class="q-mb-sm"
        />
      </div>
      <div class="row">
        <div class="col-md q-mb-md col-sm-12">
          <q-toggle
            :model-value="commandDiscoverySetting == 1 ? true : false"
            label="Enable Command Discovery"
            dense
            left-label
            @update:model-value="handleOptionChange('commandDiscovery', $event)"
          >
            <q-tooltip> Enable Command Discovery for your project</q-tooltip>
          </q-toggle>
        </div>
        <div class="col-md q-mb-md col-sm-12">
          <q-toggle
            :model-value="disableComponentToggling == 1 ? false : true"
            label="Enable Component Toggling in IDE"
            dense
            left-label
            @update:model-value="
              handleOptionChange('disableComponentToggling', !$event)
            "
          >
            <q-tooltip
              >Enable automatic toggling of components in an IDE for your
              project</q-tooltip
            >
          </q-toggle>
        </div>
      </div>
    </q-card-section>
  </PreferencePageLayout>
</template>

<script>
import * as DbEnum from '../../src-shared/db-enum'
import CommonMixin from '../util/common-mixin'
import PreferencePageLayout from '../layouts/PreferencePageLayout.vue'
import * as Util from '../util/util'

export default {
  name: 'OptionsPage',
  mixins: [CommonMixin],
  components: {
    PreferencePageLayout,
  },
  computed: {
    DbEnum: {
      get() {
        return DbEnum
      },
    },
    defaultResponsePolicyOptions: {
      get() {
        return this.$store.state.zap.genericOptions[
          DbEnum.sessionOption.defaultResponsePolicy
        ]
      },
    },
    manufacturerCodesOptions: {
      get() {
        return this.$store.state.zap.genericOptions[
          DbEnum.sessionOption.manufacturerCodes
        ]
      },
    },
    defaultManufacturerCodes: {
      get() {
        return this.manufacturerCodesOptions?.map((option) => option.optionCode)
      },
    },
    selectedDefaultResponsePolicy: {
      get() {
        let drp =
          this.$store.state.zap.genericOptions[
            DbEnum.sessionOption.defaultResponsePolicy
          ]
        if (drp == null) {
          return ''
        } else {
          return drp.find(
            (o) =>
              o.optionCode ===
              this.$store.state.zap.selectedGenericOptions[
                DbEnum.sessionOption.defaultResponsePolicy
              ]
          )
        }
      },
    },
    selectedManufacturerCode: {
      get() {
        return this.getMfgOptionLabel(
          this.$store.state.zap.selectedGenericOptions[
            DbEnum.sessionOption.manufacturerCodes
          ]
        )
      },
    },
    commandDiscoverySetting: {
      get() {
        return this.$store.state.zap.selectedGenericOptions['commandDiscovery']
      },
    },
    disableComponentToggling: {
      get() {
        return this.$store.state.zap.selectedGenericOptions[
          'disableComponentToggling'
        ]
      },
    },
  },
  data() {
    return {
      mfgOptions: null,
    }
  },
  beforeMount() {
    this.$store.dispatch('zap/loadSessionKeyValues')
    this.mfgOptions = this.defaultManufacturerCodes
  },
  methods: {
    handleEnumeratedOptionChange(option, value) {
      this.$store.dispatch('zap/setSelectedGenericKey', {
        key: option,
        value: value.optionCode,
      })
    },
    handleOptionChange(option, value) {
      this.$store.dispatch('zap/setSelectedGenericKey', {
        key: option,
        value: value,
      })

      // reload all setting values to $store/frontend
      this.$store.dispatch('zap/loadSessionKeyValues')
    },
    createValue(val, done) {
      try {
        done(Util.asHex(parseInt(val), 4), 'add-unique')
      } catch (err) {
        //Catch bad inputs.
      }
    },
    getMfgOptionLabel(code) {
      let mfgOption =
        this.manufacturerCodesOptions == null
          ? null
          : this.manufacturerCodesOptions.find((o) => o.optionCode === code)

      return mfgOption
        ? mfgOption.optionLabel + ' (' + mfgOption.optionCode + ')'
        : code
    },
    filterMfgCode(val, update) {
      if (val === '') {
        update(() => {
          this.mfgOptions = this.defaultManufacturerCodes
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.mfgOptions = this.defaultManufacturerCodes.filter((v) => {
          return this.getMfgOptionLabel(v).toLowerCase().indexOf(needle) > -1
        })
      })
    },
  },
}
</script>

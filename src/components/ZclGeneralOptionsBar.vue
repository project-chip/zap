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
          use-input
          hide-selected
          fill-input
          input-debounce="0"
          :options="mfgOptions"
          :option-label="
            (item) =>
              item.optionLabel == NULL || item.optionCode == NULL
                ? 'NULL'
                : item.optionLabel + ' (' + item.optionCode + ')'
          "
          @input="
            handleOptionChange(DbEnum.sessionOption.manufacturerCodes, $event)
          "
          v-model="selectedManufacturerCode"
          @filter="filterMfgCode"
          outlined
          dense
        />
      </div>
      <div class="q-pr-lg vertical-align:middle">Default Response Policy</div>
      <q-select
        :options="defaultResponsePolicyOptions"
        v-model="selectedDefaultResponsePolicy"
        :option-label="(item) => (item === null ? 'NULL' : item.optionLabel)"
        @input="
          handleOptionChange(DbEnum.sessionOption.defaultResponsePolicy, $event)
        "
        style="width: 150px"
        outlined
        dense
      />

      <q-btn
        class="col-6 left"
        align="left"
        text-color="primary"
        icon="add"
        label="Add Custom ZCL"
        flat
        :ripple="false"
        :unelevated="false"
        :outline="none"
        to="/customZcl"
      />
    </q-toolbar>
  </div>
</template>

<script>
import * as DbEnum from '../../src-shared/db-enum'

export default {
  name: 'ZclGeneralOptionsBar',
  computed: {
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
    selectedDefaultResponsePolicy: {
      get() {
        let drp = this.$store.state.zap.genericOptions[
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
        let mc = this.$store.state.zap.genericOptions[
          DbEnum.sessionOption.manufacturerCodes
        ]
        return mc == null
          ? ''
          : mc.find(
              (o) =>
                o.optionCode ===
                this.$store.state.zap.selectedGenericOptions[
                  DbEnum.sessionOption.manufacturerCodes
                ]
            )
      },
    },
  },
  data() {
    return {
      mfgOptions: this.manufacturerCodesOptions,
    }
  },
  methods: {
    handleOptionChange(option, value) {
      this.$store.dispatch('zap/setSelectedGenericKey', {
        key: option,
        value: value.optionCode,
      })
    },

    getMfgLabel(item) {
      return item.optionLabel + ' (' + item.optionCode + ')'
    },
    filterMfgCode(val, update) {
      if (val === '') {
        update(() => {
          this.mfgOptions = this.manufacturerCodesOptions
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.mfgOptions = this.manufacturerCodesOptions.filter((v) => {
          return this.getMfgLabel(v).toLowerCase().indexOf(needle) > -1
        })
      })
    },
  },
}
</script>

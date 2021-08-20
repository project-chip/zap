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
      <div class="q-mr-sm vertical-align:middle">Manufacturer Name or Code</div>
      <div>
        <q-select
          class="q-mr-sm"
          use-input
          hide-selected
          fill-input
          input-debounce="0"
          :options="mfgOptions"
          :option-label="(item) => getMfgOptionLabel(item)"
          @new-value="createValue"
          @input="
            handleOptionChange(DbEnum.sessionOption.manufacturerCodes, $event)
          "
          v-model="selectedManufacturerCode"
          @filter="filterMfgCode"
          outlined
          dense
          data-cy='manufacturer_name_or_code'
        />
      </div>
      <div class="q-mr-sm vertical-align:middle">Default Response Policy</div>
      <q-select
        class="q-mr-sm"
        :options="defaultResponsePolicyOptions"
        v-model="selectedDefaultResponsePolicy"
        :option-label="(item) => (item === null ? 'NULL' : item.optionLabel)"
        @input="
          handleEnumeratedOptionChange(
            DbEnum.sessionOption.defaultResponsePolicy,
            $event
          )
        "
        outlined
        dense
        data-cy='default_response_policy'
      />
      <div>
        <q-toggle
          class="q-mr-sm"
          :value="commandDiscoverySetting == 1 ? true : false"
          label="Enable Command Discovery"
          dense
          left-label
          @input="handleOptionChange('commandDiscovery', $event)"
        >
          <q-tooltip> Enable Command Discovery for your project </q-tooltip>
        </q-toggle>
      </div>
      <q-btn
        class="q-mr-sm"
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
      <q-space />
    </q-toolbar>
  </div>
</template>

<script>
import * as DbEnum from '../../src-shared/db-enum'
import * as Util from '../util/util'

export default {
  name: 'ZclGeneralOptionsBar',
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
        return this.manufacturerCodesOptions.map((option) => option.optionCode)
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
  },
  data() {
    return {
      mfgOptions: this.defaultManufacturerCodes,
    }
  },
  methods: {
    handleEnumeratedOptionChange(option, value) {
      this.$store.dispatch('zap/setSelectedGenericKey', {
        key: option,
        value: value.optionCode,
      })
    },
    handleOptionChange(option, value) {
      console.log(value)
      this.$store.dispatch('zap/setSelectedGenericKey', {
        key: option,
        value: value,
      })
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

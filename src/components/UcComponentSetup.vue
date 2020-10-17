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
  <q-card>
    <q-card-section>
      <q-tree
        :nodes="testData"
        node-key="id"
        tick-strategy="leaf"
        :ticked.sync="uc.ticked"
        :expanded.sync="uc.expanded"
        @update:ticked="handleClick"
      ></q-tree>
    </q-card-section>
  </q-card>
</template>

<script>
import { QToggle } from 'quasar'
const restApi = require('../../src-shared/rest-api.js')

export default {
  name: 'UcComponentSetup',

  data() {
    return {
      value: false,
      checked: false,
      input: [],

      // q-tree attri
      uc: {
        last_ticked: [], // keep this to get checked/unchecked items.
        ticked: [],
        expanded: [],
        a: 1,
        tree: [],
      },

      testData: [],

      last_ticked: [],
    }
  },

  mounted() {
    this.$serverGet(restApi.uc.componentTree, {
      params: {
        studioProject: this.$store.state.zap.studioProject,
      },
    }).then((response) => {
      response.data.forEach((ele) => this.testData.push(ele))

      // computed selected Nodes
      let selected = []
      this.testData.filter(function f(e) {
        if (e.children) {
          e.children.filter(f, this)
        }

        if (e.isSelected) {
          this.push(e.id)
        }
      }, selected)
      selected.forEach((e) => this.uc.ticked.push(e))

      this.uc.last_ticked = this.uc.ticked
    })
  },

  methods: {
    handleClick: function (target) {
      // let diff = .filter(x => !arr2.includes(x));
      let enabledItems = this.uc.ticked.filter(
        (x) => !this.uc.last_ticked.includes(x)
      )
      let disabledItems = this.uc.last_ticked.filter(
        (x) => !this.uc.ticked.includes(x)
      )

      console.log('Enable: ' + enabledItems)
      enabledItems.forEach(function (item) {
        let id = item.substr(item.lastIndexOf('-') + 1)
        this.$serverGet(restApi.uc.componentAdd, {
          params: {
            componentId: id,
            studioProject: this.$store.state.zap.studioProject,
          },
        })
      }, this)

      console.log('Disable: ' + disabledItems)
      disabledItems.forEach(function (item) {
        let id = item.substr(item.lastIndexOf('-') + 1)
        this.$serverGet(restApi.uc.componentRemove, {
          params: {
            componentId: id,
            studioProject: this.$store.state.zap.studioProject,
          },
        })
      }, this)

      this.uc.last_ticked = this.uc.ticked
    },
  },
}
</script>

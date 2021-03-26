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
        :nodes="componentTree"
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
const restApi = require('../../src-shared/rest-api.js')
import CommonMixin from '../util/common-mixin'
const util = require('../util/util.js')

export default {
  name: 'UcComponentSetup',
  mixins: [CommonMixin],

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
      },

      componentTree: [],
    }
  },

  mounted() {
    this.$serverGet(restApi.uc.componentTree, {
      params: {
        studioProject: this.$store.state.zap.studioProject,
      },
    }).then((response) => {
      this.componentTree.length = 0
      response.data.forEach((ele) => this.componentTree.push(ele))

      let selectedComponentIds = util.getSelectedComponent(response.data)

      this.uc.ticked.length = 0
      selectedComponentIds.forEach((e) => this.uc.ticked.push(e))
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

      // Parse component id from Studio ids 
      // e.g. "zigbee_basic" via "studiocomproot-Zigbee-Cluster_Library-Common-zigbee_basic"
      enabledItems = enabledItems.map(x => x.substr(x.lastIndexOf('-') + 1))
      if (enabledItems.length) {
        this.updateSelectedComponentRequest({ componentIds: enabledItems, added: true })
      }

      disabledItems = disabledItems.map(x => x.substr(x.lastIndexOf('-') + 1))
      if (disabledItems.length) {
        this.updateSelectedComponentRequest({ componentIds: disabledItems, added: false })
      }

      this.uc.last_ticked = this.uc.ticked
    },
  },
}
</script>

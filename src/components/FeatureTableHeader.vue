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
  <q-tr :props="props">
    <q-th v-for="col in props.cols" :key="col.name" :props="props">
      <div>
        <template v-if="col.name === 'conformance'">
          <a
            :href="documentSource"
            class="cursor-pointer"
            target="_blank"
            style="text-decoration: none; color: black"
          >
            {{ col.label }}
            <q-icon
              name="info"
              class="q-pl-sm q-pb-xs"
              style="font-size: 1rem"
              color="primary"
            >
              <q-tooltip>
                {{ conformanceSourceTip }}
              </q-tooltip>
            </q-icon>
          </a>
        </template>
        <template v-else>
          {{ col.label }}
        </template>
      </div>
    </q-th>
  </q-tr>
</template>

<script>
import featureMixin from '../util/feature-mixin'

export default {
  name: 'FeatureTableHeader',
  mixins: [featureMixin],
  props: {
    props: { type: Object, required: true }
  }
}
</script>

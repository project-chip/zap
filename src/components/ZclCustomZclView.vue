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
  <div style="">
    <div class="row q-py-md">
      <strong>
        <q-breadcrumbs>
          <!-- this needs to be updated depending on how the pages will work -->
          <q-breadcrumbs-el icon="keyboard_arrow_left" to="/">
            Endpoint x{{ this.endpointId[this.selectedEndpointId] }}
          </q-breadcrumbs-el>
          <q-breadcrumbs-el to="/"> Add Custom ZCL </q-breadcrumbs-el>
        </q-breadcrumbs>
      </strong>
    </div>
    <h5 style="margin: 10px 0 0px">
      <strong> Add Custom ZCL </strong>
    </h5>
    <div class="row">
      <div style="padding: 10px 10px 10px 10px">
        You can use this functionality to add custom ZCL clusters or commands to
        the Zigbee Clusters Configurator
      </div>
      <q-space />
      <q-btn
        color="primary"
        label="Add"
        @click="uploadNewPackage = !uploadNewPackage"
        v-close-popup
      />
    </div>
    <div>
      <q-list bordered separator>
        <template v-for="(sessionPackage, index) in packages">
          <q-item v-bind:key="index">
            <q-item-section>
              <q-expansion-item>
                <template slot="header">
                  <q-toolbar>
                    <div>
                      <b>{{ getFileName(sessionPackage.path) }}</b>
                    </div>
                    <q-space />
                    <q-btn label="Delete" icon="delete" flat @click.stop />
                    <q-btn label="Relative to..." outlined @click.stop />
                  </q-toolbar>
                </template>
                Full File path: {{ sessionPackage.path }} <br />
                Package Type: {{ sessionPackage.type }} <br />
                Version: {{ sessionPackage.version }} <br />
              </q-expansion-item>
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </div>
    <q-dialog v-model="uploadNewPackage">
      <q-card>
        <q-card-section>
          Add new custom ZCL Package
          <q-file v-model="packageToLoad" />
          <q-card-actions>
            <q-btn label="Cancel" v-close-popup />
            <q-btn label="Add Package" @click="loadNewPackage(packageToLoad)" />
          </q-card-actions>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import restApi from '../../src-shared/rest-api.js'
import CommonMixin from '../util/common-mixin'

export default {
  mixins: [CommonMixin],
  methods: {
    getFileName(path) {
      let fileName = path.match(/[^\/]+$/)
      return fileName.length > 0 ? fileName[0] : path
    },
    loadNewPackage(packageToLoad) {
      console.log(packageToLoad)
    },
  },
  mounted() {
    this.$store.dispatch('zap/getProjectPackages')
  },
  data() {
    return {
      uploadNewPackage: false,
      packageToLoad: '',
    }
  },
}
</script>

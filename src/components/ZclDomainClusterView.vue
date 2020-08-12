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
    <q-table
      :data="clusterDomains(domainName)"
      :columns="columns"
      :rows-per-page-options="[0]"
      hide-pagination
      row-key="code"
      flat
      square
      bordered
      :table-header-style="{ backgroundColor: '#cccccc' }"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="label" :props="props" auto-width>
            {{ props.row.label }}
          </q-td>
          <q-td key="requiredCluster" :props="props">
            {{ isClusterRequired(props.row.id) }}
          </q-td>
          <q-td key="clusterId" :props="props">
            {{ props.row.code }}
          </q-td>
          <q-td key="manufacturerId" :props="props">
            {{
              props.row.manufacturerCode ? props.row.manufacturerCode : '---'
            }}
          </q-td>
          <q-td key="options" :props="props">
            <q-select
              v-model="test"
              dense
              outlined
              :options="clusterSelectionOptions"
            />
          </q-td>
          <q-td key="configure" :props="props">
            <q-icon name="settings" color="primary" />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>
<script>
export default {
  name: 'ZclDomainClusterView',
  props: ['domainName'],
  computed: {
    clusters: {
      get() {
        return this.$store.state.zap.clusters
      },
    },
    recommendedClients: {
      get() {
        return this.$store.state.zap.clustersView.recommendedClients
      },
    },
    recommendedServers: {
      get() {
        return this.$store.state.zap.clustersView.recommendedServers
      },
    },
  },
  methods: {
    clusterDomains(domainName) {
      return this.clusters
        .filter((a) => {
          return a.domainName == domainName
        })
        .sort(function (b, a) {
          return a.code > b.code
        })
    },
    isClusterRequired(id) {
      let clientRequired = this.recommendedClients.includes(id)
      let serverRequired = this.recommendedServers.includes(id)
      if (clientRequired && serverRequired) return 'Client & Server'
      if (clientRequired) return 'Client'
      if (serverRequired) return 'Server'
      return ''
    },
  },
  data() {
    return {
      test: [],
      clusterSelectionOptions: ['--', 'Client', 'Server', 'Client & Server'],
      columns: [
        {
          name: 'label',
          requried: true,
          label: 'Cluster',
          align: 'left',
          field: (row) => row.label,
          style: 'width:30%',
        },
        {
          name: 'requiredCluster',
          requried: true,
          label: 'Required Cluster',
          align: 'center',
          field: (row) => this.isClusterRequired(row.id),
          style: 'width:20%',
        },
        {
          name: 'clusterId',
          requried: false,
          label: 'Cluster Id',
          align: 'left',
          field: (row) => row.code,
          style: 'width:10%',
        },
        {
          name: 'manufacturerId',
          requried: false,
          label: 'Manufacturer ID',
          align: 'left',
          field: (row) => (row.manufacturerCode ? row.manufacturerCode : '---'),
          style: 'width:10%',
        },
        {
          name: 'options',
          requried: false,
          label: 'Options',
          align: 'left',
          field: (row) => 'test',
          style: 'width:20%',
        },
        {
          name: 'configure',
          required: true,
          label: 'Configure',
          align: 'center',
          style: 'width: 10%',
        },
      ],
    }
  },
}
</script>

<!-- Notice lang="scss" -->
<style lang="scss">
.bar {
  background-color: $grey-4;
  padding: 15px 15px 15px 15px;
}
</style>

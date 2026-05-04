<!--
Copyright (c) 2025 Silicon Labs.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
-->
<template>
  <div class="column fit">
    <q-toolbar class="bg-transparent q-px-sm border-bottom">
      <div class="text-h6">Validation</div>
      <q-space />
      <q-btn
        flat
        dense
        icon="refresh"
        label="Refresh"
        no-caps
        data-cy="btn-validation-refresh"
        :loading="loading"
        @click="refreshValidation"
      />
    </q-toolbar>
    <q-scroll-area class="col">
      <div class="q-pa-sm">
        <div v-if="!validationReport" class="text-grey q-pa-md text-body2">
          No validation results yet. Click Refresh or choose Validate on the
          toolbar to run a full check.
        </div>
        <template v-else>
          <div class="text-body2 q-mb-md">
            <span
              v-if="validationReport.summary.errors > 0"
              class="text-negative"
            >
              {{ validationReport.summary.errors }} error(s)
            </span>
            <span
              v-if="validationReport.summary.errors === 0"
              class="text-positive"
            >
              No validation issues found.
            </span>
            <span class="text-caption q-ml-sm text-grey">
              Checked {{ validationReport.summary.attributes }} attribute(s),
              {{ validationReport.summary.endpoints }} endpoint(s),
              {{ validationReport.summary.clusters }} cluster check(s).
            </span>
          </div>

          <q-expansion-item
            v-if="validationReport.endpoints.length > 0"
            default-opened
            icon="settings_input_component"
            label="Endpoints"
            header-class="text-subtitle1"
          >
            <q-table
              flat
              dense
              :rows="validationReport.endpoints"
              :columns="endpointIssueColumns"
              row-key="endpointDbId"
            >
              <template #body-cell-issues="props">
                <q-td :props="props">
                  <div v-if="props.row.issues.endpointId.length">
                    <strong>Endpoint ID:</strong>
                    {{ props.row.issues.endpointId.join('; ') }}
                  </div>
                  <div v-if="props.row.issues.networkId.length">
                    <strong>Network ID:</strong>
                    {{ props.row.issues.networkId.join('; ') }}
                  </div>
                </q-td>
              </template>
            </q-table>
          </q-expansion-item>

          <q-expansion-item
            v-if="validationReport.attributes.length > 0"
            default-opened
            icon="tune"
            label="Attributes"
            header-class="text-subtitle1"
          >
            <q-table
              flat
              dense
              wrap-cells
              :rows="validationReport.attributes"
              :columns="attributeIssueColumns"
              :row-key="attributeRowKey"
            >
              <template #body-cell-issues="props">
                <q-td :props="props">
                  {{ props.row.issues.join('; ') }}
                </q-td>
              </template>
            </q-table>
          </q-expansion-item>

          <q-expansion-item
            v-if="validationReport.conformance.length > 0"
            default-opened
            icon="rule_folder"
            label="Conformance"
            header-class="text-subtitle1"
          >
            <q-table
              flat
              dense
              wrap-cells
              :rows="validationReport.conformance"
              :columns="conformanceIssueColumns"
              :row-key="conformanceRowKey"
            >
              <template #body-cell-warnings="props">
                <q-td :props="props">
                  <ul class="q-ma-none">
                    <li v-for="(w, i) in props.row.warnings" :key="i">
                      {{ w }}
                    </li>
                  </ul>
                </q-td>
              </template>
            </q-table>
          </q-expansion-item>
        </template>
      </div>
    </q-scroll-area>
  </div>
</template>

<script>
import commonMixin from '../util/common-mixin'
const restApi = require('../../src-shared/rest-api.js')
const rendApi = require('../../src-shared/rend-api.js')

export default {
  name: 'ValidationPanelPage',
  mixins: [commonMixin],
  data() {
    return {
      loading: false,
      endpointIssueColumns: [
        {
          name: 'endpointId',
          label: 'Endpoint #',
          field: 'endpointId',
          align: 'left'
        },
        {
          name: 'endpointDbId',
          label: 'DB id',
          field: 'endpointDbId',
          align: 'left'
        },
        {
          name: 'issues',
          label: 'Issues',
          field: 'issues',
          align: 'left'
        }
      ],
      attributeIssueColumns: [
        {
          name: 'endpointIdentifierLabel',
          label: 'Endpoint #',
          field: 'endpointIdentifierLabel',
          align: 'left'
        },
        {
          name: 'clusterName',
          label: 'Cluster',
          field: 'clusterName',
          align: 'left'
        },
        {
          name: 'attributeName',
          label: 'Attribute',
          field: 'attributeName',
          align: 'left'
        },
        {
          name: 'defaultValue',
          label: 'Default',
          field: 'defaultValue',
          align: 'left'
        },
        {
          name: 'issues',
          label: 'Issues',
          field: 'issues',
          align: 'left'
        }
      ],
      conformanceIssueColumns: [
        {
          name: 'endpointId',
          label: 'Endpoint #',
          field: 'endpointId',
          align: 'left'
        },
        {
          name: 'clusterName',
          label: 'Cluster',
          field: 'clusterName',
          align: 'left'
        },
        {
          name: 'warnings',
          label: 'Issues',
          field: 'warnings',
          align: 'left'
        }
      ]
    }
  },
  computed: {
    validationReport() {
      return this.$store.state.zap.validationReport
    }
  },
  methods: {
    attributeRowKey(row) {
      return `${row.endpointTypeId}-${row.clusterRef}-${row.attributeRef}`
    },
    conformanceRowKey(row) {
      return `${row.endpointDbId}-${row.clusterRef}`
    },
    refreshValidation() {
      if (this.$serverGet == null) return
      this.loading = true
      window[rendApi.GLOBAL_SYMBOL_EXECUTE](
        rendApi.id.progressStart,
        'Validating configuration...'
      )
      this.$serverGet(restApi.uri.validate)
        .then((resp) => {
          const body = resp?.data
          if (body == null) {
            if (this.$q && this.$q.notify) {
              this.$q.notify({
                type: 'negative',
                message: 'Validation returned no data'
              })
            }
            return
          }
          this.$store.commit('zap/setValidationReport', body)
        })
        .catch((err) => {
          console.error(err)
          if (this.$q && this.$q.notify) {
            this.$q.notify({
              type: 'negative',
              message:
                (err.response &&
                  err.response.data &&
                  err.response.data.error) ||
                err.message ||
                'Validation failed'
            })
          }
        })
        .finally(() => {
          this.loading = false
          window[rendApi.GLOBAL_SYMBOL_EXECUTE](rendApi.id.progressEnd)
        })
    }
  }
}
</script>

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
    <div v-if="clusterFeatures.length > 0">
      <q-table
        class="my-sticky-header-table"
        :rows="clusterFeatures"
        :columns="columns"
        row-key="<b>name</b>"
        dense
        flat
        v-model:pagination="pagination"
        separator="horizontal"
        id="ZclClusterFeatureManager"
      >
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props" class="table_body" data-test="feature-row">
            <q-td key="enabled" :props="props" auto-width>
              <q-toggle
                :disable="isToggleDisabled(props.row.conformance)"
                class="q-mt-xs v-step-14"
                v-model="enabledClusterFeatures"
                :val="props.row.featureId"
                indeterminate-value="false"
                keep-color
                @update:model-value="(val) => onToggleFeature(props.row, val)"
                data-test="feature-toggle"
              />
            </q-td>
            <q-td
              key="featureName"
              :props="props"
              auto-width
              data-test="feature-name"
            >
              {{ props.row.name }}
            </q-td>
            <q-td key="code" :props="props" auto-width data-test="feature-code">
              {{ props.row.code }}
            </q-td>
            <q-td
              key="conformance"
              :props="props"
              auto-width
              data-test="feature-conformance"
            >
              {{ props.row.conformance }}
            </q-td>
            <q-td key="bit" :props="props" auto-width data-test="feature-bit">
              {{ props.row.bit }}
            </q-td>
            <q-td key="description" :props="props" auto-width>
              {{ props.row.description }}
            </q-td>
          </q-tr>
        </template>
      </q-table>
      <q-dialog
        v-model="showDialog"
        persistent
        data-test="feature-update-dialog"
      >
        <q-card>
          <q-card-section>
            <div class="row items-center">
              <div class="text-h6 col">Elements to be updated</div>
            </div>
            <div v-if="attributesToUpdate.length > 0">
              <div
                class="text-body1"
                style="margin-top: 15px; padding-left: 20px"
              >
                Attributes
              </div>
              <ul data-test="attributes-to-update">
                <li
                  v-for="(attribute, index) in processElementsForDialog(
                    attributesToUpdate
                  )"
                  :key="'attribute' + index"
                  style="margin-bottom: 10px"
                >
                  {{ attribute }}
                </li>
              </ul>
            </div>
            <div v-if="commandsToUpdate.length > 0">
              <div
                class="text-body1"
                style="margin-top: 15px; padding-left: 20px"
              >
                Commands
              </div>
              <ul data-test="commands-to-update">
                <li
                  v-for="(command, index) in processElementsForDialog(
                    commandsToUpdate
                  )"
                  :key="'command' + index"
                  style="margin-bottom: 10px"
                >
                  {{ command }}
                </li>
              </ul>
            </div>
            <div v-if="eventsToUpdate.length > 0">
              <div
                class="text-body1"
                style="margin-top: 15px; padding-left: 20px"
              >
                Events
              </div>
              <ul data-test="events-to-update">
                <li
                  v-for="(event, index) in processElementsForDialog(
                    eventsToUpdate
                  )"
                  :key="'event' + index"
                  style="margin-bottom: 10px"
                >
                  {{ event }}
                </li>
              </ul>
            </div>
          </q-card-section>
          <q-card-actions>
            <q-btn label="Cancel" v-close-popup class="col" />
            <q-btn
              label="Confirm"
              color="primary"
              @click="
                confirmFeatureUpdate(selectedFeature, updatedEnabledFeatures)
              "
              class="col v-step-4 w-step-3"
              data-test="confirm-feature-update"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
    <div v-else><br />{{ noFeaturesMessage }}</div>
  </div>
</template>

<script>
import EditableAttributesMixin from '../util/editable-attributes-mixin.js'
import featureMixin from '../util/feature-mixin.js'
import uiOptions from '../util/ui-options'
import CommonMixin from '../util/common-mixin'
import dbEnum from '../../src-shared/db-enum'

export default {
  name: 'ZclClusterFeatureManager',
  mixins: [EditableAttributesMixin, uiOptions, CommonMixin, featureMixin],
  computed: {},
  methods: {
    isToggleDisabled(conformance) {
      // disable toggling features with unsupported conformance
      return (
        conformance == dbEnum.conformanceTag.disallowed ||
        conformance == dbEnum.conformanceTag.deprecated
      )
    }
  },
  data() {
    return {
      noFeaturesMessage: 'No features available for this cluster.',
      pagination: {
        rowsPerPage: 0
      },
      columns: [
        {
          name: dbEnum.feature.name.enabled,
          required: true,
          label: dbEnum.feature.label.enabled,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.featureName,
          required: true,
          label: dbEnum.feature.label.featureName,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.code,
          required: true,
          label: dbEnum.feature.label.code,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.conformance,
          required: true,
          label: dbEnum.feature.label.conformance,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.bit,
          required: true,
          label: dbEnum.feature.label.bit,
          align: 'left'
        },
        {
          name: dbEnum.feature.name.description,
          required: false,
          label: dbEnum.feature.label.description,
          align: 'left'
        }
      ]
    }
  }
}
</script>

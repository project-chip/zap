/**
 *
 *    Copyright (c) 2020 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 *
 * @jest-environment jsdom
 */

import {
  Quasar,
  QBtn,
  QFile,
  QSplitter,
  QSpace,
  QPageContainer,
  QDrawer,
  QToolbar,
  QToolbarTitle,
  QHeader,
  QTable,
  QLayout,
  QInput,
  QToggle,
  QCardSection,
  QCard,
  QTabs,
  QTab,
  QForm,
  QSelect,
  QSeparator,
  QList,
  QBreadcrumbs,
  QBreadcrumbsEl,
  QTooltip,
  QField,
  QCardActions,
  QDialog,
  QItem,
  ClosePopup,
} from 'quasar'
import Vue from 'vue'

import { shallowMount } from '@vue/test-utils'
import ZapStore from '../src/store/index.js'

import ZclApplicationSetup from '../src/components/ZclApplicationSetup.vue'
import ZclAttributeManager from '../src/components/ZclAttributeManager.vue'
import ZclAttributeReportingManager from '../src/components/ZclAttributeReportingManager.vue'
import ZclClusterManager from '../src/components/ZclClusterManager.vue'
import ZclClusterView from '../src/components/ZclClusterView.vue'
import ZclCommandManager from '../src/components/ZclCommandManager.vue'
import ZclCreateModifyEndpoint from '../src/components/ZclCreateModifyEndpoint.vue'
import ZclCustomSetup from '../src/components/ZclCustomSetup.vue'
import ZclDomainClusterView from '../src/components/ZclDomainClusterView.vue'
import ZclEndpointCard from '../src/components/ZclEndpointCard.vue'
import ZclEndpointManager from '../src/components/ZclEndpointManager.vue'
import ZclGeneralOptionsBar from '../src/components/ZclGeneralOptionsBar.vue'
import ZclInformationSetup from '../src/components/ZclInformationSetup.vue'
import ZclClusterLayout from '../src/layouts/ZclClusterLayout.vue'
import ZclConfiguratorLayout from '../src/layouts/ZclConfiguratorLayout.vue'
import Error404 from '../src/pages/Error404.vue'
import Preference from '../src/pages/Preference.vue'
import PreferenceGeneration from '../src/pages/PreferenceGeneration.vue'
import PreferenceUser from '../src/pages/PreferenceUser.vue'
import PreferenceZcl from '../src/pages/PreferenceZcl.vue'
import ZclSettings from '../src/pages/ZclSettings.vue'

Vue.use(Quasar, {
  components: {
    QBtn,
    QFile,
    QSplitter,
    QSpace,
    QPageContainer,
    QDrawer,
    QToolbar,
    QToolbarTitle,
    QHeader,
    QTable,
    QLayout,
    QInput,
    QToggle,
    QCardSection,
    QCard,
    QTabs,
    QTab,
    QForm,
    QSelect,
    QSeparator,
    QList,
    QBreadcrumbs,
    QBreadcrumbsEl,
    QTooltip,
    QField,
    QCardActions,
    QDialog,
    QItem,
  },
  directives: {
    ClosePopup,
  },
})

test('ZclApplicationSetup', () => {
  const wrapper = shallowMount(ZclApplicationSetup, { store: ZapStore() })
  expect(wrapper.html().includes('application setup')).toBe(true)
})

test('ZclAttributeManager', () => {
  const wrapper = shallowMount(ZclAttributeManager, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclAttributeReportingManager', () => {
  const wrapper = shallowMount(ZclAttributeReportingManager, {
    store: ZapStore(),
  })
  expect(ZclAttributeReportingManager.data()).not.toBe(null)
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclClusterManager', () => {
  const wrapper = shallowMount(ZclClusterManager, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclClusterView', () => {
  const wrapper = shallowMount(ZclClusterView, { store: ZapStore() })
  expect(wrapper.html().includes('Endpoint')).toBe(true)
})
test('ZclCommandManager', () => {
  const wrapper = shallowMount(ZclCommandManager, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclCreateModifyEndpoint', () => {
  const wrapper = shallowMount(ZclCreateModifyEndpoint, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclCustomSetup', () => {
  const wrapper = shallowMount(ZclCustomSetup, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(50)
})
test('ZclDomainClusterView', () => {
  const wrapper = shallowMount(ZclDomainClusterView, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclEndpointCard', () => {
  const wrapper = shallowMount(ZclEndpointCard, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclEndpointManager', () => {
  const wrapper = shallowMount(ZclEndpointManager, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclGeneralOptionsBar', () => {
  const wrapper = shallowMount(ZclGeneralOptionsBar, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclInformationSetup', () => {
  const wrapper = shallowMount(ZclInformationSetup, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclClusterLayout', () => {
  const wrapper = shallowMount(ZclClusterLayout, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(90)
})
test('ZclConfiguratorLayout', () => {
  const wrapper = shallowMount(ZclConfiguratorLayout, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('Error404', () => {
  const wrapper = shallowMount(Error404, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(50)
})
test('Preference', () => {
  const wrapper = shallowMount(Preference, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(50)
})
test('PreferenceGeneration', () => {
  const wrapper = shallowMount(PreferenceGeneration, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(50)
})
test('PreferenceUser', () => {
  const wrapper = shallowMount(PreferenceUser, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(50)
})
test('PreferenceZcl', () => {
  const wrapper = shallowMount(PreferenceZcl, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(50)
})
test('ZclSettings', () => {
  const wrapper = shallowMount(ZclSettings, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(50)
})

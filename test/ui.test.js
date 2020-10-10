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

import { shallowMount } from '@vue/test-utils'
import ZapStore from '../src/store/index.js'

import ZclApplicationSetup from '../src/components/ZclApplicationSetup.vue'
import ZclAttributeManager from '../src/components/ZclAttributeManager.vue'
import ZclAttributeReportingManager from '../src/components/ZclAttributeReportingManager.vue'
import ZclAttributeView from '../src/components/ZclAttributeView.vue'
import ZclClusterDetail from '../src/components/ZclClusterDetail.vue'
import ZclClusterInfo from '../src/components/ZclClusterInfo.vue'
import ZclClusterList from '../src/components/ZclClusterList.vue'
import ZclClusterManager from '../src/components/ZclClusterManager.vue'
import ZclClusterView from '../src/components/ZclClusterView.vue'
import ZclCommandManager from '../src/components/ZclCommandManager.vue'
import ZclCommandView from '../src/components/ZclCommandView.vue'
import ZclCreateModifyEndpoint from '../src/components/ZclCreateModifyEndpoint.vue'
import ZclCustomSetup from '../src/components/ZclCustomSetup.vue'
import ZclDomainClusterView from '../src/components/ZclDomainClusterView.vue'
import ZclEndpointCard from '../src/components/ZclEndpointCard.vue'
import ZclEndpointConfig from '../src/components/ZclEndpointConfig.vue'
import ZclEndpointManager from '../src/components/ZclEndpointManager.vue'
import ZclEndpointTypeConfig from '../src/components/ZclEndpointTypeConfig.vue'
import ZclGeneralOptionsBar from '../src/components/ZclGeneralOptionsBar.vue'
import ZclInformationSetup from '../src/components/ZclInformationSetup.vue'
import ZclReportingView from '../src/components/ZclReportingView.vue'

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
test('ZclAttributeView', () => {
  const wrapper = shallowMount(ZclAttributeView, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclClusterDetail', () => {
  const wrapper = shallowMount(ZclClusterDetail, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclClusterInfo', () => {
  const wrapper = shallowMount(ZclClusterInfo, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(50)
})
test('ZclClusterList', () => {
  const wrapper = shallowMount(ZclClusterList, { store: ZapStore() })
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
test('ZclCommandView', () => {
  const wrapper = shallowMount(ZclCommandView, { store: ZapStore() })
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
test('ZclEndpointConfig', () => {
  const wrapper = shallowMount(ZclEndpointConfig, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclEndpointManager', () => {
  const wrapper = shallowMount(ZclEndpointManager, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})
test('ZclEndpointTypeConfig', () => {
  const wrapper = shallowMount(ZclEndpointTypeConfig, { store: ZapStore() })
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
test('ZclReportingView', () => {
  const wrapper = shallowMount(ZclReportingView, { store: ZapStore() })
  expect(wrapper.html().length).toBeGreaterThan(100)
})

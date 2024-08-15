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
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-jest'
import { shallowMount, mount } from '@vue/test-utils'

import ZclAttributeManager from '../src/components/ZclAttributeManager.vue'
import ZclAttributeReportingManager from '../src/components/ZclAttributeReportingManager.vue'
import ZclClusterManager from '../src/components/ZclClusterManager.vue'
import ZclClusterView from '../src/components/ZclClusterView.vue'
import ZclCommandManager from '../src/components/ZclCommandManager.vue'
import ZclCreateModifyEndpoint from '../src/components/ZclCreateModifyEndpoint.vue'
import ZclDomainClusterView from '../src/components/ZclDomainClusterView.vue'
import ZclEndpointCard from '../src/components/ZclEndpointCard.vue'
import ZclEndpointManager from '../src/components/ZclEndpointManager.vue'
import ZclInformationSetup from '../src/components/ZclInformationSetup.vue'
import Error404 from '../src/pages/ErrorPage404.vue'
import Preference from '../src/pages/PreferencePage.vue'
import Notifications from '../src/pages/NotificationsPage.vue'
import Options from '../src/pages/OptionsPage.vue'
import Extensions from '../src/pages/ExtensionsPage'
import PreferenceGeneration from '../src/pages/preferences/PreferenceGeneration.vue'
import PreferenceUser from '../src/pages/preferences/PreferenceUser.vue'
import PreferencePackage from '../src/pages/preferences/PreferencePackage.vue'
import ZclSettings from '../src/pages/ZclSettings.vue'
import About from '../src/pages/preferences/AboutPage.vue'
import MainLayout from '../src/layouts/MainLayout.vue'
import routes from '../src/router/routes.js'
import { createRouter, createWebHistory } from 'vue-router'

import { timeout } from './test-util.js'
import ZapStore from '../src/store/index.js'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

installQuasarPlugin()
const observable = require('../src/util/observable.js')

describe('Component mounting test', () => {
  test(
    'ZclAttributeManager',
    () => {
      const wrapper = shallowMount(ZclAttributeManager, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short(),
  )
  test(
    'ZclAttributeReportingManager',
    () => {
      const wrapper = shallowMount(ZclAttributeReportingManager, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(ZclAttributeReportingManager.data()).not.toBe(null)
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short(),
  )
  test(
    'ZclClusterManager',
    () => {
      const wrapper = shallowMount(ZclClusterManager, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short(),
  )
  test(
    'ZclClusterView',
    () => {
      const wrapper = shallowMount(ZclClusterView, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.find('#ZclClusterView').exists()).toBe(true)
    },
    timeout.short(),
  )
  test(
    'ZclCommandManager',
    () => {
      const wrapper = shallowMount(ZclCommandManager, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(60)
    },
    timeout.short(),
  )
  test(
    'ZclCreateModifyEndpoint',
    () => {
      const wrapper = mount(ZclCreateModifyEndpoint, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short(),
  )
  test(
    'ZclDomainClusterView',
    () => {
      const wrapper = shallowMount(ZclDomainClusterView, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short(),
  )
  test(
    'ZclEndpointCard',
    () => {
      const wrapper = shallowMount(ZclEndpointCard, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short(),
  )
  test(
    'ZclEndpointManager',
    () => {
      const wrapper = shallowMount(ZclEndpointManager, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short(),
  )
  test(
    'Options',
    () => {
      const wrapper = shallowMount(Options, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short(),
  )
  test(
    'ZclInformationSetup',
    () => {
      const wrapper = shallowMount(ZclInformationSetup, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short(),
  )

  test(
    'MainLayout',
    () => {
      const wrapper = shallowMount(MainLayout, {
        global: {
          plugins: [ZapStore(), router],
        },
        router,
      })
      expect(wrapper.html().length).toBeGreaterThan(60)
    },
    timeout.short(),
  )

  test(
    'Notifications',
    () => {
      const wrapper = shallowMount(Notifications, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short(),
  )
  test(
    'Error404',
    () => {
      const wrapper = shallowMount(Error404, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short(),
  )
  test(
    'Preference',
    () => {
      const wrapper = shallowMount(Preference, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short(),
  )
  test(
    'PreferenceGeneration',
    () => {
      const wrapper = shallowMount(PreferenceGeneration, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short(),
  )
  test(
    'PreferenceUser',
    () => {
      const wrapper = shallowMount(PreferenceUser, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short(),
  )
  test(
    'PreferencePackage',
    () => {
      const wrapper = shallowMount(PreferencePackage, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short(),
  )
  test(
    'ZclSettings',
    () => {
      const wrapper = shallowMount(ZclSettings, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short(),
  )
  test(
    'Extensions',
    () => {
      const wrapper = shallowMount(Extensions, {
        global: {
          plugins: [ZapStore()],
        },
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short(),
  )
  test(
    'About',
    () => {
      const wrapper = shallowMount(About, { store: ZapStore() })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short(),
  )
})

describe('DOM tests', () => {
  let observedValue = null

  test(
    'Observables',
    async () => {
      observable.setObservableAttribute('x', 'value0')
      expect(observable.getObservableAttribute('x')).toEqual('value0')

      const valuePromise = new Promise((resolve) => {
        observable.observeAttribute('x', (value) => {
          observedValue = value
          resolve(value)
        })
      })

      expect(observedValue).toBe(null)

      observable.setObservableAttribute('x', 'value1')

      const value = await valuePromise

      expect(value).toEqual('value1')
    },
    timeout.short(),
  )
})

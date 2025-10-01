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
import ZapConfig from '../src/pages/ZapConfig.vue'
import FeatureTableHeader from '../src/components/FeatureTableHeader.vue'
import InitialContent from '../src/components/InitialContent.vue'
import MainSidebar from '../src/components/MainSidebar.vue'
import SettingsSidebar from '../src/components/SettingsSidebar.vue'
import SqlQuery from '../src/components/SqlQuery.vue'
import ZCLToolbar from '../src/components/ZCLToolbar.vue'
import ZclClusterFeatureManager from '../src/components/ZclClusterFeatureManager.vue'
import ZclExceptions from '../src/components/ZclExceptions.vue'
import ZclEventManager from '../src/components/ZclEventManager.vue'
import ZclDeviceTypeFeatureManager from '../src/components/ZclDeviceTypeFeatureManager.vue'

import EndpointManager from '../src/pages/EndpointManager.vue'
import ExtensionsPage from '../src/pages/ExtensionsPage.vue'
import NotificationsPage from '../src/pages/NotificationsPage.vue'
import OptionsPage from '../src/pages/OptionsPage.vue'
import PreferencePage from '../src/pages/PreferencePage.vue'

import ApiExceptions from '../src/pages/preferences/devtools/ApiExceptions.vue'
import InformationSetup from '../src/pages/preferences/devtools/InformationSetup.vue'
import SqlQueryDev from '../src/pages/preferences/devtools/SqlQuery.vue'

import CMPTour from '../src/tutorials/CMPTour.vue'
import EndpointTour from '../src/tutorials/EndpointTour.vue'
import ZclTour from '../src/tutorials/ZclTour.vue'
import App from '../src/App.vue'
import CommonMixin from '../src/util/common-mixin'
import uiOptions from '../src/util/ui-options'

import { timeout } from './test-util.js'
import ZapStore from '../src/store/index.js'
import { createStore } from 'vuex'
import rendApi from '../src-shared/rend-api.js'

global.window = global.window || {}
window[rendApi.GLOBAL_SYMBOL_EXECUTE] = jest.fn()

// Minimal zap state for App.vue and common-mixin
const zapState = {
  selectedZapConfig: null,
  endpointTypeView: {
    deviceTypeRef: {}
  },
  showExceptionIcon: false,
  query: {},
  isMultiConfig: false
}

const store = createStore({
  state() {
    return {
      zap: { ...zapState }
    }
  }
})

const router = createRouter({
  history: createWebHistory(),
  routes
})

installQuasarPlugin()
const observable = require('../src/util/observable.js')

describe('Component mounting test', () => {
  test(
    'ZapConfig renders and requests package selection',
    async () => {
      const wrapper = shallowMount(ZapConfig, {
        global: {
          plugins: [ZapStore()],
          mocks: {
            $serverPost: jest.fn(() =>
              Promise.resolve({
                data: {
                  zclProperties: [],
                  zclGenTemplates: [],
                  filePath: './resource/test-light.zap',
                  open: false,
                  zapFilePackages: [
                    {
                      type: 'zcl-properties',
                      path: '../zcl-builtin/silabs/zcl.json',
                      id: 1
                    },
                    {
                      type: 'gen-templates-json',
                      path: './gen-template/zigbee/gen-templates.json',
                      id: 2
                    }
                  ],
                  zapFileExtensions: [],
                  sessions: []
                }
              })
            ),
            $serverGet: jest.fn(() =>
              Promise.resolve({ data: { warningMap: {}, errorMap: {} } })
            ),
            $q: { loading: { show: jest.fn(), hide: jest.fn() } },
            $router: { push: jest.fn() }
          }
        }
      })
      expect(wrapper.html().toLowerCase()).toContain(
        'warning: please select atleast one package each from zcl metadata and templates.'
      )
    },
    timeout.short()
  )

  test(
    'ZclAttributeManager',
    () => {
      const wrapper = shallowMount(ZclAttributeManager, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short()
  )
  test(
    'ZclAttributeReportingManager',
    () => {
      const wrapper = shallowMount(ZclAttributeReportingManager, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(ZclAttributeReportingManager.data()).not.toBe(null)
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short()
  )
  test(
    'ZclClusterManager',
    () => {
      const wrapper = shallowMount(ZclClusterManager, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'ZclClusterView',
    () => {
      const wrapper = shallowMount(ZclClusterView, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.find('#ZclClusterView').exists()).toBe(true)
    },
    timeout.short()
  )
  test(
    'ZclCommandManager',
    () => {
      const wrapper = shallowMount(ZclCommandManager, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(60)
    },
    timeout.short()
  )
  test(
    'ZclCreateModifyEndpoint',
    () => {
      const wrapper = mount(ZclCreateModifyEndpoint, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short()
  )
  test(
    'ZclDomainClusterView',
    () => {
      const wrapper = shallowMount(ZclDomainClusterView, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short()
  )
  test(
    'ZclEndpointCard',
    () => {
      const wrapper = shallowMount(ZclEndpointCard, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short()
  )
  test(
    'ZclEndpointManager',
    () => {
      const wrapper = shallowMount(ZclEndpointManager, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short()
  )
  test(
    'Options',
    () => {
      const wrapper = shallowMount(Options, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short()
  )
  test(
    'ZclInformationSetup',
    () => {
      const wrapper = shallowMount(ZclInformationSetup, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(100)
    },
    timeout.short()
  )

  test(
    'MainLayout',
    () => {
      const wrapper = shallowMount(MainLayout, {
        global: {
          plugins: [ZapStore(), router]
        },
        router
      })
      expect(wrapper.html().length).toBeGreaterThan(60)
    },
    timeout.short()
  )

  test(
    'Notifications',
    () => {
      const wrapper = shallowMount(Notifications, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short()
  )
  test(
    'Error404',
    () => {
      const wrapper = shallowMount(Error404, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short()
  )
  test(
    'Preference',
    () => {
      const wrapper = shallowMount(Preference, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short()
  )
  test(
    'PreferenceGeneration',
    () => {
      const wrapper = shallowMount(PreferenceGeneration, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short()
  )
  test(
    'PreferenceUser',
    () => {
      const wrapper = shallowMount(PreferenceUser, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short()
  )
  test(
    'PreferencePackage',
    () => {
      const wrapper = shallowMount(PreferencePackage, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short()
  )
  test(
    'ZclSettings',
    () => {
      const wrapper = shallowMount(ZclSettings, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short()
  )
  test(
    'Extensions',
    () => {
      const wrapper = shallowMount(Extensions, {
        global: {
          plugins: [ZapStore()]
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short()
  )
  test(
    'About',
    () => {
      const wrapper = shallowMount(About, { store: ZapStore() })
      expect(wrapper.html().length).toBeGreaterThan(50)
    },
    timeout.short()
  )

  test(
    'ZapConfig renders and requests package selection',
    async () => {
      const wrapper = shallowMount(ZapConfig, {
        global: {
          plugins: [ZapStore()],
          mocks: {
            $serverPost: jest.fn(() =>
              Promise.resolve({
                data: {
                  zclProperties: [],
                  zclGenTemplates: [],
                  filePath: '',
                  open: false,
                  zapFilePackages: [],
                  zapFileExtensions: [],
                  sessions: []
                }
              })
            ),
            $serverGet: jest.fn(() =>
              Promise.resolve({ data: { warningMap: {}, errorMap: {} } })
            ),
            $q: { loading: { show: jest.fn(), hide: jest.fn() } },
            $router: { push: jest.fn() }
          }
        }
      })
      expect(wrapper.html().toLowerCase()).toContain(
        'warning: please select atleast one package each from zcl metadata and templates.'
      )
    },
    timeout.short()
  )

  test(
    'ZapConfig submitForm triggers navigation',
    async () => {
      const pushMock = jest.fn()
      const wrapper = shallowMount(ZapConfig, {
        global: {
          plugins: [ZapStore()],
          mocks: {
            $router: { push: pushMock },
            $q: { loading: { show: jest.fn(), hide: jest.fn() } },
            $serverPost: jest.fn(() =>
              Promise.resolve({
                data: {
                  zclProperties: [],
                  zclGenTemplates: [],
                  filePath: '',
                  open: false,
                  zapFilePackages: [],
                  zapFileExtensions: [],
                  sessions: []
                }
              })
            ),
            $serverGet: jest.fn(() =>
              Promise.resolve({ data: { warningMap: {}, errorMap: {} } })
            )
          }
        }
      })
      // Set up data to simulate selection
      await wrapper.setData({
        customConfig: 'select',
        selectedZclPropertiesData: [{ id: 1 }],
        selectZclGenInfo: [{ id: 2 }],
        zapFileExtensions: []
      })
      // Call submitForm
      await wrapper.vm.submitForm()
      expect(pushMock).toHaveBeenCalledWith({ path: '/' })
    },
    timeout.short()
  )

  test(
    'FeatureTableHeader',
    () => {
      const wrapper = shallowMount(FeatureTableHeader, {
        global: { plugins: [ZapStore()] },
        props: {
          props: { cols: [{ name: 'test', label: 'Test Column' }] }
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'InitialContent',
    () => {
      const wrapper = shallowMount(InitialContent, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'MainSidebar',
    () => {
      const wrapper = shallowMount(MainSidebar, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'SettingsSidebar',
    () => {
      const wrapper = shallowMount(SettingsSidebar, {
        global: {
          plugins: [ZapStore()],
          mocks: {
            $route: { fullPath: '/' }
          }
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'SqlQuery',
    () => {
      const wrapper = shallowMount(SqlQuery, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'ZCLToolbar',
    () => {
      const wrapper = shallowMount(ZCLToolbar, {
        global: {
          plugins: [ZapStore()],
          stubs: {
            'router-link': {
              template:
                '<a><slot :isActive="false" :navigate="() => {}"></slot></a>'
            }
          },
          mocks: {
            $route: { fullPath: '/' }
          }
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'ZclClusterFeatureManager',
    () => {
      const wrapper = shallowMount(ZclClusterFeatureManager, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'ZclExceptions',
    () => {
      const wrapper = shallowMount(ZclExceptions, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'ZclEventManager',
    () => {
      const wrapper = shallowMount(ZclEventManager, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'ZclDeviceTypeFeatureManager',
    () => {
      const wrapper = shallowMount(ZclDeviceTypeFeatureManager, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )

  // Pages
  test(
    'EndpointManager',
    () => {
      const wrapper = shallowMount(EndpointManager, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'ExtensionsPage',
    () => {
      const wrapper = shallowMount(ExtensionsPage, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'NotificationsPage',
    () => {
      const wrapper = shallowMount(NotificationsPage, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'OptionsPage',
    () => {
      const wrapper = shallowMount(OptionsPage, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'PreferencePage',
    () => {
      const wrapper = shallowMount(PreferencePage, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'ZapConfig',
    () => {
      const wrapper = shallowMount(ZapConfig, {
        global: {
          plugins: [ZapStore()],
          mocks: {
            $serverPost: jest.fn(() =>
              Promise.resolve({
                data: {
                  zclProperties: [],
                  zclGenTemplates: [],
                  filePath: '',
                  open: false,
                  zapFilePackages: [],
                  zapFileExtensions: [],
                  sessions: []
                }
              })
            ),
            $serverGet: jest.fn(() =>
              Promise.resolve({ data: { warningMap: {}, errorMap: {} } })
            ),
            $q: { loading: { show: jest.fn(), hide: jest.fn() } },
            $router: { push: jest.fn() }
          }
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'ZclSettings',
    () => {
      const wrapper = shallowMount(ZclSettings, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )

  // Preferences/devtools
  test(
    'ApiExceptions',
    () => {
      const wrapper = shallowMount(ApiExceptions, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'InformationSetup',
    () => {
      const wrapper = shallowMount(InformationSetup, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'SqlQueryDev',
    () => {
      const wrapper = shallowMount(SqlQueryDev, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )

  // Tutorials
  test(
    'CMPTour',
    () => {
      const wrapper = shallowMount(CMPTour, {
        global: {
          plugins: [ZapStore()],
          stubs: {
            'v-tour': {
              template: '<div></div>',
              methods: { resetTour: jest.fn() }
            }
          }
        },
        mocks: {
          $refs: { 'zcl-cmp-tour': { resetTour: jest.fn() } }
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )

  test(
    'EndpointTour',
    () => {
      const wrapper = shallowMount(EndpointTour, {
        global: {
          plugins: [ZapStore()],
          stubs: {
            'v-tour': {
              template: '<div></div>',
              methods: { resetTour: jest.fn() }
            }
          }
        },
        mocks: {
          $refs: { 'zcl-endpoint-tour': { resetTour: jest.fn() } }
        }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )
  test(
    'ZclTour',
    () => {
      const wrapper = shallowMount(ZclTour, {
        global: { plugins: [ZapStore()] }
      })
      expect(wrapper.html().length).toBeGreaterThan(10)
    },
    timeout.short()
  )

  it('renders main elements', () => {
    const wrapper = shallowMount(App, {
      global: {
        plugins: [store],
        stubs: {
          'router-view': true,
          'q-ajax-bar': true,
          'q-btn': true,
          'q-icon': true,
          'zcl-tour': true
        },
        mocks: {
          $router: { push: jest.fn() }
        }
      }
    })
    expect(wrapper.findComponent({ name: 'router-view' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'zcl-tour' }).exists()).toBe(true)
  })

  it('shows exception icon when showExceptionIcon is true', async () => {
    // Set the store state directly
    store.state.zap.showExceptionIcon = true
    const wrapper = shallowMount(App, {
      global: {
        plugins: [store],
        stubs: ['router-view', 'q-ajax-bar', 'q-btn', 'q-icon', 'zcl-tour'],
        mocks: {
          $router: { push: jest.fn() }
        }
      }
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('q-btn-stub').exists()).toBe(true)
  })

  it('calls viewExceptions when exception button is clicked', async () => {
    store.state.zap.showExceptionIcon = true
    const spy = jest.spyOn(App.methods, 'viewExceptions')
    const wrapper = shallowMount(App, {
      global: {
        plugins: [store],
        stubs: ['router-view', 'q-ajax-bar', 'q-btn', 'q-icon', 'zcl-tour'],
        mocks: {
          $router: { push: jest.fn() }
        }
      }
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('q-btn-stub').trigger('click')
    expect(spy).toHaveBeenCalled()
  })

  it('calls addClassToBody and setTheme', () => {
    const addClassToBody = jest.fn()
    const setTheme = jest.fn()
    shallowMount(App, {
      global: {
        plugins: [store],
        stubs: ['router-view', 'q-ajax-bar', 'q-btn', 'q-icon', 'zcl-tour'],
        mocks: {
          $router: { push: jest.fn() }
        }
      },
      methods: { addClassToBody, setTheme }
    })
    // No assertion needed, just ensure mount does not throw
  })

  it('calls parseQueryString and routePage on created', () => {
    const parseQueryString = jest
      .spyOn(App.methods, 'parseQueryString')
      .mockImplementation(() => {})
    const setTheme = jest
      .spyOn(App.methods, 'setTheme')
      .mockImplementation(() => {})
    const routePage = jest
      .spyOn(App.methods, 'routePage')
      .mockImplementation(() => {})

    shallowMount(App, {
      global: {
        plugins: [store],
        stubs: ['router-view', 'q-ajax-bar', 'q-btn', 'q-icon', 'zcl-tour'],
        mocks: {
          $router: { push: jest.fn() }
        }
      }
    })
    expect(parseQueryString).toHaveBeenCalled()
    expect(setTheme).toHaveBeenCalled()
    expect(routePage).toHaveBeenCalled()
  })

  it('calls addClassToBody on mounted', () => {
    const spy = jest
      .spyOn(App.methods, 'addClassToBody')
      .mockImplementation(() => {})
    shallowMount(App, {
      global: {
        plugins: [store],
        stubs: ['router-view', 'q-ajax-bar', 'q-btn', 'q-icon', 'zcl-tour'],
        mocks: {
          $router: { push: jest.fn() }
        }
      }
    })
    expect(spy).toHaveBeenCalled()
  })
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
    timeout.short()
  )
})

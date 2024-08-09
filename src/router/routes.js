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
 */

const routes = [
  {
    path: '/config',
    component: () => import('../layouts/ConfigLayout.vue'),
    children: [{ path: '', component: () => import('../pages/ZapConfig.vue') }],
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () => import('../pages/EndpointManager.vue'),
          sidebar: () => import('../components/ZclEndpointManager.vue'),
        },
      },
    ],
  },
  {
    path: '/cluster',
    name: 'cluster',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () => import('../components/ZclClusterView.vue'),
          sidebar: () => import('../components/ZclEndpointManager.vue'),
        },
      },
    ],
  },
  {
    path: '/preferences/user',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () => import('../pages/preferences/PreferenceUser.vue'),
          sidebar: () => import('../components/SettingsSidebar.vue'),
        },
      },
    ],
  },
  {
    path: '/preferences/generation',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () =>
            import('../pages/preferences/PreferenceGeneration.vue'),
          sidebar: () => import('../components/SettingsSidebar.vue'),
        },
      },
    ],
  },
  {
    path: '/preferences/package',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () => import('../pages/preferences/PreferencePackage.vue'),
          sidebar: () => import('../components/SettingsSidebar.vue'),
        },
      },
    ],
  },
  {
    path: '/preferences/about',
    name: 'about',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () => import('../pages/preferences/AboutPage.vue'),
          sidebar: () => import('../components/SettingsSidebar.vue'),
        },
      },
    ],
  },
  {
    path: '/preferences/devtools/information-setup',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () =>
            import('../pages/preferences/devtools/InformationSetup.vue'),
          sidebar: () => import('../components/SettingsSidebar.vue'),
        },
      },
    ],
  },
  {
    path: '/preferences/devtools/sql-query',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () => import('../pages/preferences/devtools/SqlQuery.vue'),
          sidebar: () => import('../components/SettingsSidebar.vue'),
        },
      },
    ],
  },
  {
    path: '/preferences/devtools/api-exceptions',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () =>
            import('../pages/preferences/devtools/ApiExceptions.vue'),
          sidebar: () => import('../components/SettingsSidebar.vue'),
        },
      },
    ],
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () => import('../pages/NotificationsPage.vue'),
          sidebar: () => import('../components/ZclEndpointManager.vue'),
        },
      },
    ],
  },
  {
    path: '/options',
    name: 'options',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () => import('../pages/OptionsPage.vue'),
          sidebar: () => import('../components/ZclEndpointManager.vue'),
        },
      },
    ],
  },
  {
    path: '/extensions',
    name: 'extensions',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () => import('../pages/ExtensionsPage.vue'),
          sidebar: () => import('../components/ZclEndpointManager.vue'),
        },
      },
    ],
  },
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorPage404.vue'),
  })
}

export default routes

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
    path: '/',
    name: 'Home',
    component: () => import('layouts/ZclLayout.vue'),
    children: [
      { path: '', component: () => import('layouts/ZclLayout.vue') }, // Consider making this a "New Project" page
    ],
  },
  {
    path: '/cluster',
    name: 'cluster',
    component: () => import('components/ZclClusterView.vue'),
  },
  {
    path: '/customZcl',
    component: () => import('components/ZclCustomZclView.vue'),
  },
  {
    path: '/preference',
    component: () => import('pages/Preference.vue'),
  },
  {
    path: '/about',
    component: () => import('pages/About.vue'),
  },
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue'),
  })
}

export default routes

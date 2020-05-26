// Copyright (c) 2019 Silicon Labs. All rights reserved.

const routes = [
  {
    path: '/',
    component: () => import('layouts/ZclLayout.vue'),
    children: [
      { path: '', component: () => import('layouts/ZclLayout.vue') }, // Consider making this a "New Project" page
      { path: 'clusters', component: () => import('pages/ZclBrowsing.vue') },
      { path: 'domains', component: () => import('pages/ZclBrowsing.vue') },
      { path: 'bitmaps', component: () => import('pages/ZclBrowsing.vue') },
      { path: 'enums', component: () => import('pages/ZclBrowsing.vue') },
      { path: 'structs', component: () => import('pages/ZclBrowsing.vue') },
      { path: 'devicetypes', component: () => import('pages/ZclBrowsing.vue') },
      { path: 'settings', component: () => import('pages/ZclSettings.vue') },
    ],
  },
  {
    path: '/zcl',
    component: () => import('layouts/ZclLayout.vue'),
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

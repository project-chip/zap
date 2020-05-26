<!-- Copyright (c) 2019 Silicon Labs. All rights reserved. -->

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          icon="menu"
          aria-label="Menu"
        />
        <q-toolbar-title>
          Zigbee Cluster Library
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="bg-grey-2"
    >
      <q-list>
        <q-item-label header>ZCL entities</q-item-label>
        <q-item clickable @click="getEntities('/cluster/all')" to="/clusters">
          <q-item-section avatar>
            <q-icon name="mdi-alpha-c-circle" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Clusters</q-item-label>
            <q-item-label caption>Load a list of clusters</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable @click="getEntities('/domain/all')" to="/domains">
          <q-item-section avatar>
            <q-icon name="mdi-alpha-d-circle" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Domains</q-item-label>
            <q-item-label caption>Load a list of domains</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable @click="getEntities('/bitmap/all')" to="/bitmaps">
          <q-item-section avatar>
            <q-icon name="mdi-alpha-b-circle" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Bitmaps</q-item-label>
            <q-item-label caption>Load a list of bitmaps</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable @click="getEntities('/enum/all')" to="/enums">
          <q-item-section avatar>
            <q-icon name="mdi-alpha-e-circle" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Enums</q-item-label>
            <q-item-label caption>Load a list of enums</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable @click="getEntities('/struct/all')" to="/structs">
          <q-item-section avatar>
            <q-icon name="mdi-alpha-s-circle" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Structs</q-item-label>
            <q-item-label caption>Load a list of structs</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          @click="getEntities('/deviceType/all')"
          to="/devicetypes"
        >
          <q-item-section avatar>
            <q-icon name="mdi-cellphone-wireless" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Device Types</q-item-label>
            <q-item-label caption>Load a list of device types</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          to="/settings"
          clickable
          @click="getEntities('/deviceType/all')"
        >
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Settings</q-item-label>
            <q-item-label caption>Configure various settings</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="generate()">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Generate</q-item-label>
            <q-item-label caption>Generate Various Things</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/sql">
          <q-item-section avatar>
            <q-icon name="database" />
          </q-item-section>
          <q-item-section>
            <q-item-label>SQL Query</q-item-label>
            <q-item-label caption
              >Run SQL Queries against the database</q-item-label
            >
          </q-item-section>
        </q-item>

        <q-item clickable to="/zcl">
          <q-item-section avatar>
            <q-icon name="database" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Zcl</q-item-label>
            <q-item-label caption>Go to main ZCL layout</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'MyLayout',
  methods: {
    getEntities(url) {
      this.$serverGet(url)
    },
    generate() {
      this.$serverGet('/generate')
    },
  },
  data() {
    return {
      leftDrawerOpen: false,
    }
  },
}
</script>

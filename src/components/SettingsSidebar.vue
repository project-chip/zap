<template>
  <q-list padding class="menu-list inner">
    <div v-for="(menuItem, index) in menuList" :key="index">
      <q-item
        :to="menuItem.link"
        clickable
        :active="menuItem.link === $route.fullPath"
        v-ripple
      >
        <q-item-section avatar>
          <q-icon :name="menuItem.icon" />
        </q-item-section>
        <q-item-section>
          {{ menuItem.label }}
        </q-item-section>
      </q-item>
    </div>
    <q-separator spaced />
    <div v-if="this.$store.state.zap.showDevTools">
      <q-item-label header>Developer Tools</q-item-label>
      <div v-for="(menuItem, index) in devToolList" :key="index">
        <q-item
          :to="menuItem.link"
          clickable
          :active="menuItem.link === $route.fullPath"
          v-ripple
        >
          <q-item-section avatar>
            <q-icon :name="menuItem.icon" />
          </q-item-section>
          <q-item-section>
            {{ menuItem.label }}
          </q-item-section>
        </q-item>
      </div>
    </div>
  </q-list>
</template>
<script>
export default {
  name: 'MainSidebar',
  data() {
    return {
      menuList: [
        {
          icon: 'o_manage_accounts',
          label: 'User Settings',
          link: '/preferences/user',
          separator: false
        },
        {
          icon: 'mdi-lan',
          label: 'ZCL Packages',
          link: '/preferences/package',
          separator: false
        },
        {
          icon: 'mdi-file-document-edit-outline',
          label: 'Generation',
          link: '/preferences/generation',
          separator: false
        },
        {
          icon: 'o_info',
          label: 'About',
          link: '/preferences/about',
          separator: false
        }
      ],
      devToolList: [
        {
          icon: 'o_settings_applications',
          label: 'Information Setup',
          link: '/preferences/devtools/information-setup',
          separator: false
        },
        {
          icon: 'o_schema',
          label: 'SQL Query',
          link: '/preferences/devtools/sql-query',
          separator: false
        },
        {
          icon: 'o_api',
          label: 'API Exceptions',
          link: '/preferences/devtools/api-exceptions',
          separator: false
        }
      ]
    }
  },
  methods: {
    minimize() {
      if (process.env.MODE === 'electron') {
        //
      }
    },

    toggleMaximize() {
      if (process.env.MODE === 'electron') {
        //
      }
    },

    closeApp() {
      if (process.env.MODE === 'electron') {
        //
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.q-drawer {
  background: transparent;
}
.q-item {
  margin: 5px 15px;
  padding: 6px 9px;
  border-radius: 6px;
  min-height: 0;
  .q-item__section--avatar {
    min-width: 0px;
  }
}
.q-item.q-router-link--active,
.q-item--active {
  background: var(--q-primary);
  color: #fff;
  font-weight: 700;
}
</style>

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
          separator: false,
        },
        {
          icon: 'mdi-lan',
          label: 'ZCL Packages',
          link: '/preferences/package',
          separator: false,
        },
        {
          icon: 'mdi-file-document-edit-outline',
          label: 'Generation',
          link: '/preferences/generation',
          separator: false,
        },
        {
          icon: 'o_info',
          label: 'About',
          link: '/preferences/about',
          separator: false,
        },
      ],
      devToolList: [
        {
          icon: 'o_settings_applications',
          label: 'Information Setup',
          link: '/preferences/devtools/information-setup',
          separator: false,
        },
        {
          icon: 'o_schema',
          label: 'SQL Query',
          link: '/preferences/devtools/sql-query',
          separator: false,
        },
        {
          icon: 'o_linear_scale',
          label: 'UC Components',
          link: '/preferences/devtools/uc-components',
          separator: false,
        },
        {
          icon: 'o_api',
          label: 'API Exceptions',
          link: '/preferences/devtools/api-exceptions',
          separator: false,
        },
      ],
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
    },
  },
}
</script>
<style lang="scss">
.q-layout {
  background: grey;
  background: url('/bg-layout.png');
  background-attachment: fixed;
  background-size: cover;
  animation: fadeInAnimation ease 1.5s;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
}

@keyframes fadeInAnimation {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.bg-glass {
  background-color: rgba(238, 238, 238, 0.61);
  -webkit-backdrop-filter: blur(7px);
  backdrop-filter: blur(7px);
  border-bottom: 1px solid rgba(233, 232, 238, 1);
}
.q-drawer {
  background: transparent;
}
</style>

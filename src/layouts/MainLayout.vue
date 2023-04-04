<template>
  <q-layout view="lHh LpR lFf">
    <q-header class="transparent">
      <ZCLToolbar />
    </q-header>
    <q-drawer
      class="bg-glass"
      v-model="drawer"
      show-if-above
      :width="300"
      :breakpoint="500"
      style="border-right: 1px solid #ddd"
    >
      <div
        class="full-width absolute-top text-h4 q-pt-md q-px-md row justify-end"
        style="height: 53.8px"
      >
        <div>ZCL</div>
      </div>

      <q-scroll-area style="height: calc(100% - 53.8px); margin-top: 53.8px">
        <router-view v-slot="{ Component }" name="sidebar">
          <transition mode="out-in" name="slide-left">
            <component :is="Component" />
          </transition>
        </router-view>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition mode="out-in" name="slide-down">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>
<script>
import ZCLToolbar from '../components/ZCLToolbar.vue'

export default {
  components: {
    ZCLToolbar,
  },
  name: 'MainLayout',
  data() {
    return {}
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

.slide-left-leave-active,
.slide-left-enter-active {
  transition: all 0.25s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-down-leave-active,
.slide-down-enter-active {
  transition: all 0.25s ease-out;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-35px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(35px);
}
</style>

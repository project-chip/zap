<template>
  <q-layout view="lHh LpR lFf">
    <q-header class="transparent">
      <ZCLToolbar />
    </q-header>

    <q-drawer
      class="bg-glass"
      v-model="drawer"
      show-if-above
      :width="200"
      :breakpoint="500"
      style="border-right: 1px solid #ddd"
    >
      <div
        class="full-width absolute-top text-h4 q-pt-md q-px-md row justify-between"
        style="height: 53.8px"
      >
        <div>
          <q-btn
            dense
            unelevated
            round
            size="5px"
            color="red-12"
            @click="closeApp"
          />
          <q-btn
            class="q-mx-sm"
            dense
            unelevated
            round
            size="5px"
            color="warning"
            @click="minimize"
          />
          <q-btn
            dense
            unelevated
            round
            size="5px"
            color="green-14"
            @click="toggleMaximize"
          />
        </div>
        <div>ZCL</div>
      </div>

      <q-scroll-area style="height: calc(100% - 53.8px); margin-top: 53.8px">
        <q-list padding class="menu-list">
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="inbox" />
            </q-item-section>

            <q-item-section> Inbox </q-item-section>
          </q-item>

          <q-item active clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="star" />
            </q-item-section>

            <q-item-section> Star </q-item-section>
          </q-item>

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="send" />
            </q-item-section>

            <q-item-section> Send </q-item-section>
          </q-item>

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="drafts" />
            </q-item-section>

            <q-item-section> Drafts </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>
    <q-page-container>
      <!-- TODO: modify this height -->
      <router-view></router-view>
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
</style>

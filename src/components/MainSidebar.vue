<template>
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
</template>
<script>
export default {
  name: 'MainSidebar',
  data() {
    return {}
  },
  methods: {},
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

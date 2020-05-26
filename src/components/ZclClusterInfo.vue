<template>
  <div v-show="item">
    <div>Cluster: {{ item.label }}</div>
    <div>Description: {{ item.caption }}</div>
  </div>
</template>

<script>
export default {
  name: 'ZclClusterInfo',
  mounted() {},
  computed: {
    item: {
      get() {
        return this.$store.state.zap.clustersView.selected[0]
      },
    },
  },
  data() {
    return {}
  },
}
</script>

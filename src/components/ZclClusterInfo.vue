<template>
  <div v-show='item'>
    <div v-show='item.label'>Cluster: {{ item.label }}</div>
    <div v-show='item.caption'>Description: {{ item.caption }}</div>
  </div>
</template>

<script>
export default {
  name: 'ZclClusterInfo',
  mounted () {
    this.$serverOn('zcl-item', (event, arg) => {
      console.log('zcl-item:')
      console.log(arg)
      this.item = arg.data
      this.title = arg.title
      this.type = arg.type
      this.attributeData = arg.attributeData
      this.commandData = arg.commandData
    })
  },
  data () {
    return {
      item: {},
      title: '',
      type: '',
      attributeData: [],
      commandData: [],
      selection: []
    }
  }
}
</script>

<!-- Copyright (c) 2019 Silicon Labs. All rights reserved. -->
<template>
  <div>
    {{ title }}: {{ item }}
  </div>
</template>

<script>
export default {
  name: 'ZclItemDetail',
  mounted () {
    this.$serverOn('zcl-item', (event, arg) => {
      console.log('zcl-item:')
      console.log(arg)
      this.item = arg.data
      this.title = arg.title
      this.type = arg.type
      if (arg.attributeData) {
        this.attributeData = arg.attributeData
      }
    })
  },
  data () {
    return {
      item: {},
      title: '',
      type: ''
    }
  }
}
</script>

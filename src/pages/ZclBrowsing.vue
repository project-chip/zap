<!-- Copyright (c) 2019 Silicon Labs. All rights reserved. -->
<template>
  <div class="q-pa-md bg-grey-10 text-white">
    <div class="row">
      <div class="col">
        <ZclItemList />
      </div>
      <div class="col">
        <ZclItemDetail />
      </div>
    </div>
  </div>
</template>

<script>
import ZclItemList from './ZclItemList.vue'
import ZclItemDetail from './ZclItemDetail.vue'

export default {
  name: 'ZclBrowsing',
  components: {
    ZclItemList,
    ZclItemDetail,
  },
}
</script>

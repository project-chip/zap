<!-- Copyright (c) 2019 Silicon Labs. All rights reserved. -->
<template>
  <div class="q-pa-md text-white bg-black">
    <q-file
      v-model="files"
      label="Included XMLs"
      multiple
      clearable
      @input="fileUpload(files)"
    />
  </div>
</template>

<script>
export default {
  name: 'ZclSettings',
  components: {},
  methods: {
    fileUpload (test) {
      console.log(test)
      if (test) { test.map(a => console.log(a)) }
    }
  },
  mounted () {
  },
  data () {
    return {
      files: []
    }
  }
}
</script>

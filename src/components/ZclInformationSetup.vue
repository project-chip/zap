<template>
  <div>
    <q-input
      debounce="500"
      type="textarea"
      rounded
      filled
      v-model="informationText"
      label="Information about the application"
      :min-rows="3"
    />
  </div>
</template>

<script>
export default {
  name: 'ZclInformationSetup',
  computed: {
    informationText: {
      get() {
        return this.$store.state.zap.informationText
      },
      set(val) {
        this.$store.dispatch('zap/updateInformationText', val)
      },
    },
  },
  updated() {
    console.log('INFO updated')
  },
  created() {
    console.log('INFO created')
  },
  mounted() {
    console.log('INFO mounted')
  },
  destroyed() {
    console.log('INFO destroyed')
  },
}
</script>

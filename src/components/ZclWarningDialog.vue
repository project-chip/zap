<template>
  <div>
    <q-card>
      <q-card-section class="content-size">
        <div class="text-h6 text-align:left q-mb-md">
          {{ title }}
        </div>
        <div>
          {{ message }}
        </div>
      </q-card-section>
      <q-card-actions>
        <q-btn :label="cancelLabel" v-close-popup class="col" @click="cancel" />
        <q-btn
          :label="okLabel"
          color="primary"
          class="col v-step-4"
          @click="ok"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>
<script>
export default {
  name: 'ZclWarningDialog',
  emits: ['cancel', 'ok'],
  props: {
    title: { type: String, required: true },
    message: { type: String, required: false },
    cancelLabel: {
      type: String,
      required: false,
      default: () => 'Cancel',
    },
    okLabel: { type: String, required: false, default: () => 'Ok' },
  },
  methods: {
    cancel() {
      this.$emit('cancel')
    },
    ok() {
      this.$emit('ok')
    },
  },
}
</script>
<style scoped>
.content-size {
  min-width: 400px;
}
</style>

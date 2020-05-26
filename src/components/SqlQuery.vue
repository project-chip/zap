<template>
  <div class="q-pa-md bg-grey-10 text-white">
    <q-input dark outlined v-model="text" label="Outlined" @change="hitEnter" />
    <p>Count: {{ count }}</p>
    <q-list dark bordered separator>
      <div v-for="(item, index) in items" v-bind:key="index" class="row">
        <q-item>
          {{ item }}
        </q-item>
      </div>
    </q-list>
    <pre>
      {{ result }}
      </pre
    >
  </div>
</template>

<script>
export default {
  methods: {
    hitEnter() {
      this.$serverPost('/sql', { sql: this.text })
    },
  },
  mounted() {
    this.$serverOn('sql-result', (event, arg) => {
      console.log('sql-result')
      console.log(arg)
      this.items = arg.result
      this.count = arg.result.length
    })
  },
  data() {
    return {
      text: '',
      count: 0,
      items: '',
    }
  },
}
</script>

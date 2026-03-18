<template>
  <q-list class="cluster-list">
    <div v-for="(pkg, index) in packages" :key="'custom-' + index">
      <q-item dense class="q-px-none">
        <q-item-section>
          <q-expansion-item>
            <template #header>
              <q-item-section avatar class="q-pr-none">
                <q-icon
                  :class="{
                    'cursor-pointer':
                      iconName(pkg.pkg.id) == 'error' ||
                      iconName(pkg.pkg.id) == 'warning'
                  }"
                  :name="iconName(pkg.pkg.id)"
                  :color="iconColor(pkg.pkg.id)"
                  size="1.5em"
                  @click="() => handleIconClick(pkg.pkg.id)"
                />
              </q-item-section>
              <div class="q-my-auto q-item__label q-item__label__popup">
                <strong>{{ getFileName(pkg.pkg.path) }}</strong>
              </div>
              <q-space />
              <q-btn
                v-if="!builtIn"
                class="q-mx-xl"
                label="Delete"
                icon="delete"
                flat
                dense
                @click.stop="deletePackage(pkg)"
                :disable="pkg.sessionPackage.required"
              />
            </template>
            <q-card>
              <q-card-section>
                <div class="q-mx-lg q-px-lg">
                  <strong> Full File path:</strong>
                  {{ pkg.pkg.path }} <br />
                  <strong> Package Type:</strong>
                  {{ pkg.pkg.type }} <br />
                  <strong> Version: </strong>{{ pkg.pkg.version }} <br />
                  <strong> Required:</strong>
                  {{ pkg.sessionPackage.required ? 'True' : 'False' }}
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-item-section>
      </q-item>
    </div>
  </q-list>
</template>
<script>
export default {
  name: 'PackagesList',
  props: {
    packages: {
      type: Array,
      required: true
    },
    builtIn: {
      type: Boolean,
      required: false,
      default: false
    },
    notisData: {
      type: Object,
      required: false,
      default: () => ({})
    }
  },
  data() {
    return {
      dialogData: {}
    }
  },
  methods: {
    async deletePackage(packageToDelete) {
      await this.$store.dispatch(
        'zap/deleteSessionPackage',
        packageToDelete.sessionPackage
      )
      await this.$store.dispatch('zap/updateClusters')
      await this.$store.dispatch('zap/updateAtomics')
    },
    iconName(packageId) {
      if (this.notisData[packageId]?.hasError) {
        return 'error'
      } else if (this.notisData[packageId]?.hasWarning) {
        return 'warning'
      } else {
        return 'check_circle'
      }
    },
    iconColor(packageId) {
      if (this.notisData[packageId]?.hasError) {
        return 'red'
      } else if (this.notisData[packageId]?.hasWarning) {
        return 'orange'
      } else {
        return 'green'
      }
    },
    handleIconClick(packageId) {
      let iconName = this.iconName(packageId)
      if (iconName === 'error' || iconName === 'warning') {
        this.dialogData[packageId] = true
      }
    },
    getFileName(path) {
      let fileName = path.match(/[^/]+$/)
      return fileName.length > 0 ? fileName[0] : path
    }
  }
}
</script>

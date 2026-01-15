<template>
  <q-page padding class="row justify-center full-height" :class="getuitheme">
    <Transition name="slide-up" mode="out-in" appear>
      <q-card flat class="q-mt-lg q-rounded-borders-xl bg-glass col-10 column">
        <q-scroll-area class="col q-px-xl">
          <div class="q-py-lg">
            <Transition name="slide-up" mode="out-in" appear>
              <div class="row justify-center q-col-gutter-sm text-center">
                <img
                  v-for="(image, index) in getLogos(selectedZclPropertiesData)"
                  :key="index"
                  :src="image"
                  height="40"
                  class="q-mt-md w-fit-content"
                  alt=""
                />
              </div>
            </Transition>
            <div
              v-if="isMultiProtocolConfiguration"
              class="q-mx-auto w-fit-content text-primary"
            >
              Multiprotocol
            </div>
            <div class="row justify-center q-mt-md">
              <q-radio
                v-if="loadPreSessionData.length"
                v-model="customConfig"
                checked-icon="task_alt"
                unchecked-icon="panorama_fish_eye"
                val="select"
                label="Generate New Session"
                data-cy="generate-new-session-radio"
              />
              <q-radio
                v-if="loadPreSessionData.length"
                v-model="customConfig"
                checked-icon="task_alt"
                class="q-ml-xl"
                unchecked-icon="panorama_fish_eye"
                val="load"
                label="Restore Unsaved Session"
                data-cy="restore-session-radio"
              />
            </div>
            <p class="text-center" v-if="isPackageSelected" style="color: red">
              Warning: Please select atleast one package each from ZCL metadata
              and Templates. If a package is not selected then internal packages
              used for testing will be loaded automatically.
            </p>
            <p
              class="text-center"
              v-if="isMultiProtocolConfiguration"
              style="color: red"
            >
              Warning: More than one ZCL packages with different categories have
              been selected. You are initiating a ZAP configuration for
              multi-protocol.
            </p>
            <p
              class="text-center"
              v-if="isMissalignedZclAndTemplateConfig"
              style="color: red"
            >
              Warning: Corresponding ZCL and Template packages are not enabled
              based on the same category.
            </p>
            <p
              class="text-center"
              v-if="isMultiplePackage && customConfig === 'select'"
            >
              There are multiple packages of ZCL metadata loaded. Please select
              the one you wish to use with this configuration. Packages within
              an existing .zap file will come pre-selected when available.
              However please update the packages in case of a SDK upgrade such
              that you are using the latest version of the packages.
            </p>
            <p class="text-center" v-else-if="customConfig === 'load'">
              These are sessions found in the database that were not saved into
              a .zap file. You can select them here, and continue the work with
              the configuration.
            </p>

            <template v-if="customConfig === 'select'">
              <q-table
                title="Zigbee Cluster Library metadata"
                :rows="zclPropertiesRow"
                :columns="newSessionCol"
                row-key="name"
                :pagination="newGenerationPagination"
                hide-bottom
                flat
                :card-style="{ backgroundColor: 'transparent' }"
              >
                <template v-slot:header="props">
                  <q-tr :props="props">
                    <q-th
                      v-for="col in props.cols"
                      :key="col.name"
                      :props="props"
                    >
                      {{ col.label }}
                    </q-th>
                  </q-tr>
                </template>
                <template v-slot:body="props">
                  <q-tr :props="props" class="table_body">
                    <q-td key="select" :props="props">
                      <q-checkbox
                        v-model="selectedZclPropertiesDataIds"
                        :val="props.row.id"
                        data-cy="zcl-package-checkbox"
                      />
                    </q-td>
                    <q-td key="category" :props="props">
                      <div>{{ props.row.category }}</div>
                      <q-tooltip :offset="[5, 5]">
                        {{ props.row.path }}
                      </q-tooltip>
                    </q-td>
                    <q-td key="description" :props="props">
                      <div>{{ props.row.description }}</div>
                      <q-tooltip :offset="[5, 5]">
                        {{ props.row.path }}
                      </q-tooltip>
                    </q-td>
                    <q-td key="version" :props="props">
                      <div>{{ props.row.version }}</div>
                    </q-td>
                    <q-td key="status" :props="props">
                      <div v-if="props.row.hasWarning || props.row.hasError">
                        <q-icon
                          class="cursor-pointer"
                          :name="props.row.hasError ? 'error' : 'warning'"
                          :color="props.row.hasError ? 'red' : 'orange'"
                          size="2.5em"
                          @click="propertyDataDialog[props.row.id] = true"
                          data-cy="package-error-warning-icon"
                        />
                        <q-dialog v-model="propertyDataDialog[props.row.id]">
                          <q-card>
                            <q-card-section>
                              <div class="row items-center">
                                <div class="col-1">
                                  <q-icon
                                    :name="
                                      props.row.hasError ? 'error' : 'warning'
                                    "
                                    :color="
                                      props.row.hasError ? 'red' : 'orange'
                                    "
                                    size="2em"
                                  />
                                </div>
                                <div class="text-h6 col">
                                  {{ props.row.description }}
                                </div>
                                <div class="col-1 text-right">
                                  <q-btn dense flat icon="close" v-close-popup>
                                    <q-tooltip>Close</q-tooltip>
                                  </q-btn>
                                </div>
                              </div>
                              <div v-if="props.row.hasError">
                                <div
                                  class="text-h6"
                                  style="margin-top: 15px; padding-left: 20px"
                                >
                                  Errors
                                </div>
                                <ul>
                                  <li
                                    v-for="(error, index) in props.row.errors"
                                    :key="'error' + index"
                                    style="margin-bottom: 10px"
                                  >
                                    {{ error }}
                                  </li>
                                </ul>
                              </div>
                              <div v-if="props.row.hasWarning">
                                <div
                                  class="text-h6"
                                  style="margin-top: 15px; padding-left: 20px"
                                >
                                  Warnings
                                </div>
                                <ul>
                                  <li
                                    v-for="(warning, index) in props.row
                                      .warnings"
                                    :key="index"
                                    style="margin-bottom: 10px"
                                  >
                                    {{ warning }}
                                  </li>
                                </ul>
                              </div>
                            </q-card-section>
                          </q-card>
                        </q-dialog>
                      </div>
                      <q-icon
                        v-else
                        name="check_circle"
                        color="green"
                        size="2em"
                      />
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
              <q-table
                title="Zap Generation Templates"
                :rows="zclGenRow"
                :columns="newSessionCol"
                row-key="name"
                :pagination="newGenerationPagination"
                hide-bottom
                flat
                :card-style="{ backgroundColor: 'transparent' }"
              >
                <template v-slot:top>
                  <div class="q-table__title q-mr-md">
                    Zap Generation Templates
                  </div>
                  <small>( Please select a package for generation )</small>
                </template>
                <template v-slot:header="props">
                  <q-tr :props="props">
                    <q-th
                      v-for="col in props.cols"
                      :key="col.name"
                      :props="props"
                    >
                      {{ col.label }}
                    </q-th>
                  </q-tr>
                </template>
                <template v-slot:body="props">
                  <q-tr :props="props" class="table_body">
                    <q-td key="select" :props="props">
                      <q-checkbox
                        v-model="selectedZclGenData"
                        :val="props.row.id"
                        data-test="gen-template"
                      />
                    </q-td>
                    <q-td key="category" :props="props">
                      <div>{{ props.row.category }}</div>
                      <q-tooltip :offset="[5, 5]">
                        {{ props.row.path }}
                      </q-tooltip>
                    </q-td>
                    <q-td key="description" :props="props">
                      <div>{{ props.row.description }}</div>
                      <q-tooltip :offset="[5, 5]">
                        {{ props.row.path }}
                      </q-tooltip>
                    </q-td>
                    <q-td key="version" :props="props">
                      <div>{{ props.row.version }}</div>
                    </q-td>
                    <q-td key="status" :props="props">
                      <div v-if="props.row.hasWarning || props.row.hasError">
                        <q-icon
                          class="cursor-pointer"
                          :name="props.row.hasError ? 'error' : 'warning'"
                          :color="props.row.hasError ? 'red' : 'orange'"
                          size="2.5em"
                          @click="genDataDialog[props.row.id] = true"
                          data-cy="template-error-warning-icon"
                        ></q-icon>
                        <q-dialog v-model="genDataDialog[props.row.id]">
                          <q-card>
                            <q-card-section>
                              <div class="row items-center">
                                <div class="col-1">
                                  <q-icon
                                    :name="
                                      props.row.hasError ? 'error' : 'warning'
                                    "
                                    :color="
                                      props.row.hasError ? 'red' : 'orange'
                                    "
                                    size="2em"
                                  />
                                </div>
                                <div class="text-h6 col">
                                  {{ props.row.description }}
                                </div>
                                <div class="col-1 text-right">
                                  <q-btn dense flat icon="close" v-close-popup>
                                    <q-tooltip>Close</q-tooltip>
                                  </q-btn>
                                </div>
                              </div>
                              <div v-if="props.row.hasError">
                                <div
                                  class="text-h6"
                                  style="margin-top: 15px; padding-left: 20px"
                                >
                                  Errors
                                </div>
                                <ul>
                                  <li
                                    v-for="(error, index) in props.row.errors"
                                    :key="'error' + index"
                                    style="margin-bottom: 10px"
                                  >
                                    {{ error }}
                                  </li>
                                </ul>
                              </div>
                              <div v-if="props.row.hasWarning">
                                <div
                                  class="text-h6"
                                  style="margin-top: 15px; padding-left: 20px"
                                >
                                  Warnings
                                </div>
                                <ul>
                                  <li
                                    v-for="(warning, index) in props.row
                                      .warnings"
                                    :key="index"
                                    style="margin-bottom: 10px"
                                  >
                                    {{ warning }}
                                  </li>
                                </ul>
                              </div>
                            </q-card-section>
                          </q-card>
                        </q-dialog>
                      </div>
                      <q-icon
                        v-else
                        name="check_circle"
                        color="green"
                        size="2em"
                      />
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
            </template>
            <template v-else>
              <q-table
                title=""
                :rows="loadPreSessionData"
                :columns="loadPreSessionCol"
                row-key="name"
                :pagination="pagination"
                flat
                :card-style="{ backgroundColor: 'transparent' }"
              >
                <template v-slot:header="props">
                  <q-tr :props="props">
                    <q-th
                      v-for="col in props.cols"
                      :key="col.name"
                      :props="props"
                    >
                      {{ col.label }}
                    </q-th>
                  </q-tr>
                </template>
                <template v-slot:body="props">
                  <q-tr :props="props" class="table_body">
                    <q-td key="select" :props="props">
                      <q-radio
                        v-model="selectedZclSessionData"
                        checked-icon="task_alt"
                        unchecked-icon="panorama_fish_eye"
                        :val="props.row"
                      />
                    </q-td>
                    <q-td key="zclproperty" :props="props">
                      <div>{{ props.row.zclProperty.description }}</div>
                    </q-td>
                    <q-td key="gen template file" :props="props">
                      <div>{{ props.row.genTemplateFile.version }}</div>
                    </q-td>
                    <q-td key="creation time" :props="props">
                      <div>
                        {{ new Date(props.row.creationTime).toDateString() }}
                      </div>
                    </q-td>
                  </q-tr>
                </template>
              </q-table>
            </template>

            <div class="row justify-center q-mt-xl">
              <q-btn
                color="primary"
                @click="submitForm"
                label="Submit"
                data-test="login-submit"
              />
            </div>
          </div>
        </q-scroll-area>
      </q-card>
    </Transition>
  </q-page>
</template>

<script>
import restApi from '../../src-shared/rest-api.js'
import dbEnum from '../../src-shared/db-enum.js'
import { QSpinnerGears } from 'quasar'
import { setCssVar } from 'quasar'
import CommonMixin from '../util/common-mixin'
const generateNewSessionCol = [
  {
    name: 'select',
    label: '',
    align: 'center',
    style: 'width: 20%'
  },
  {
    name: 'category',
    align: 'left',
    label: 'Category',
    style: 'width: 20%'
  },
  {
    name: 'description',
    label: 'Description',
    align: 'left',
    style: 'width: 25%'
  },
  {
    name: 'version',
    label: 'version',
    align: 'left',
    style: 'width: 20%'
  },
  {
    name: 'status',
    label: 'status',
    align: 'left',
    style: 'width: 15%'
  }
]
const loadPreSessionCol = [
  {
    name: 'select',
    label: 'Session',
    align: 'center'
  },
  {
    name: 'zclproperty',
    label: 'ZCL Property',
    align: 'center'
  },
  {
    name: 'gen template file',
    align: 'left',
    label: 'Generation Template File'
  },
  {
    name: 'creation time',
    label: 'Creation Time',
    align: 'left'
  }
]

export default {
  name: 'ZapConfig',
  mixins: [CommonMixin],
  data() {
    return {
      customConfig: 'select',
      selected: [],
      selectedZclPropertiesDataIds: [],
      selectedZclPropertiesData: [],
      selectedZclGenData: [],
      selectZclGenInfo: [],
      selectedZclSessionData: null,
      zclPropertiesRow: [],
      newSessionCol: generateNewSessionCol,
      loadPreSessionCol: loadPreSessionCol,
      zclGenRow: [],
      newConfig: false,
      path: window.location,
      open: true,
      filePath: '',
      loadPreSessionData: [],
      pagination: {
        rowsPerPage: 10
      },
      newGenerationPagination: {
        rowsPerPage: 0
      },
      propertyDataDialog: {},
      genDataDialog: {},
      currentZapFilePackages: []
    }
  },
  computed: {
    // Checks if atleast one zcl and template packages have been selected
    isPackageSelected: function () {
      if (this.customConfig === 'select')
        return (
          this.selectedZclPropertiesData.length == 0 ||
          this.selectedZclGenData.length == 0
        )
      else return this.selectedZclSessionData == null
    },
    // Checks if package selection is leading to a multi-protocol configuration
    isMultiProtocolConfiguration: function () {
      let categorySet = []
      this.selectedZclPropertiesData.forEach((prop) => {
        if (!categorySet.includes(prop.category)) {
          categorySet.push(prop.category)
        }
      })
      let result = false
      result =
        this.customConfig === 'select'
          ? categorySet.length > 1
          : this.selectedZclSessionData == null
      this.$store.commit('zap/setMultiConfig', result)
      return result
    },
    // Checks for missaligned zcl and template package selection
    isMissalignedZclAndTemplateConfig: function () {
      if (this.customConfig === 'select') {
        let zclCategorySet = []
        let templateCategorySet = []
        this.selectedZclPropertiesData.forEach((prop) => {
          if (!zclCategorySet.includes(prop.category)) {
            zclCategorySet.push(prop.category)
          }
        })
        this.selectZclGenInfo.forEach((prop) => {
          if (!templateCategorySet.includes(prop.category)) {
            templateCategorySet.push(prop.category)
          }
        })
        if (zclCategorySet.length !== templateCategorySet.length) {
          return true
        }
        zclCategorySet.sort()
        templateCategorySet.sort()

        for (let i = 0; i < zclCategorySet.length; i++) {
          if (zclCategorySet[i] != templateCategorySet[i]) {
            return true
          }
        }
        return false
      } else {
        return this.selectedZclSessionData == null
      }
    },
    isMultiplePackage: function () {
      return this.zclPropertiesRow.length > 1
    },
    getuitheme: function () {
      if (this.isMultiProtocolConfiguration) {
        return 'multiprotocol'
      } else {
        return this.selectedZclPropertiesData[0]?.category
      }
    }
  },

  watch: {
    getuitheme() {
      this.addClassToBody()
    },
    // Updating this.selectedZclPropertiesData based on UI selections
    selectedZclPropertiesDataIds() {
      this.selectedZclPropertiesData = this.zclPropertiesRow.filter((zpr) =>
        this.selectedZclPropertiesDataIds.includes(zpr.id)
      )
    },
    // Updating this.selectZclGenInfo based on UI selections
    selectedZclGenData() {
      this.selectZclGenInfo = this.zclGenRow.filter((zgr) =>
        this.selectedZclGenData.includes(zgr.id)
      )
    }
  },
  methods: {
    addClassToBody() {
      document.body.classList.remove('matter', 'zigbee', 'multiprotocol')
      document.body.classList.add(this.getuitheme)
    },
    submitForm() {
      if (this.customConfig === 'select') {
        let data = {
          zclProperties: this.selectedZclPropertiesData,
          genTemplate: this.selectedZclGenData,
          zapFileExtensions: this.zapFileExtensions
        }

        this.$router.push({ path: '/' })
        this.$q.loading.show({
          spinner: QSpinnerGears,
          messageColor: 'white',
          message: 'Please wait while zap is loading...',
          spinnerSize: 300
        })

        if (this.open) {
          // Include selected packages in the file open request
          let openData = {
            zapFilePath: this.filePath,
            search: this.path.search,
            selectedZclPackages: this.selectedZclPropertiesData,
            selectedTemplatePackages: this.zclGenRow.filter((pkg) =>
              this.selectedZclGenData.includes(pkg.id)
            )
          }
          this.$serverPost(restApi.uri.sessionCreate, data)
            .then(() => this.$serverPost(restApi.ide.open, openData))
            .then(() => {
              this.$store.commit('zap/selectZapConfig', {
                zclProperties: this.selectedZclPropertiesData,
                genTemplate: this.selectedZclGenData,
                newConfig: false
              })
            })
            .catch((error) => {
              console.error('Error in file open process:', error)
              this.$q.loading.hide()
            })
        } else {
          this.$serverPost(restApi.uri.sessionCreate, data).then(() => {
            this.$store.commit('zap/selectZapConfig', {
              zclProperties: this.selectedZclPropertiesData,
              genTemplate: this.selectedZclGenData,
              newConfig: true
            })
          })
        }
      } else {
        this.$serverPost(restApi.uri.reloadSession, {
          sessionId: this.selectedZclSessionData.id
        }).then((result) => {
          this.$store.commit('zap/selectZapConfig', {
            sessionId: this.selectedZclSessionData.id,
            zclProperties: this.selectedZclSessionData.zclProperty
          })
        })
      }
    },
    // classify all notifications by type and package ref
    classifyMessages(data) {
      return data.reduce(
        (map, row) => {
          const key = row.type === 'ERROR' ? 'errorMap' : 'warningMap'
          if (!map[key][row.ref]) {
            map[key][row.ref] = []
          }
          map[key][row.ref].push(row.message)
          return map
        },
        { warningMap: {}, errorMap: {} }
      )
    },
    // then assign classfied notifications to proper packages
    assignWarningsAndErrors(data, warningMap, errorMap) {
      data.forEach((row) => {
        if (warningMap[row.id]) {
          row.hasWarning = true
          row.warnings = warningMap[row.id]
        } else {
          row.hasWarning = false
          row.warnings = []
        }
        if (errorMap[row.id]) {
          row.hasError = true
          row.errors = errorMap[row.id]
        } else {
          row.hasError = false
          row.errors = []
        }
        // set up var for dialog component of each package
        this.propertyDataDialog[row.id] = false
        this.genDataDialog[row.id] = false
      })
    },
    // Create an absolute path for relative paths of the packages
    createAbsolutePath(basePath, relativePath) {
      let lastIndex = basePath.lastIndexOf('/')
      basePath = basePath.substring(0, lastIndex)
      let relativePathSegment = relativePath.split('/')
      while (relativePathSegment[0] === '..') {
        basePath = basePath.split('/')
        basePath.pop()
        basePath = basePath.join('/')
        relativePathSegment.shift()
      }
      let absolutePath = basePath + '/' + relativePathSegment.join('/')
      return absolutePath
    }
  },
  created() {
    this.$serverPost(restApi.uri.sessionAttempt, this.path).then((result) => {
      this.zclPropertiesRow = result.data.zclProperties
      this.zclGenRow = result.data.zclGenTemplates
      this.filePath = result.data.filePath
      this.open = result.data.open
      this.currentZapFilePackages = result.data.zapFilePackages
      this.zapFileExtensions = result.data.zapFileExtensions
      let currentZapFileZclPackages = []
      let currentTopLevelZapFilePackages = []
      let currentZapFileTemplatePackages = []
      let currentZclPackagesAbsolutePaths = []
      let currentTemplatePackagesAbsolutePaths = []
      if (this.currentZapFilePackages) {
        currentTopLevelZapFilePackages = this.currentZapFilePackages.filter(
          (zfp) => zfp.type != dbEnum.packageType.zclXmlStandalone
        )
        currentZapFileZclPackages = this.currentZapFilePackages.filter(
          (zfp) => zfp.type == dbEnum.packageType.zclProperties
        )

        currentZapFileTemplatePackages = this.currentZapFilePackages.filter(
          (zfp) => zfp.type == dbEnum.packageType.genTemplatesJson
        )
        currentZclPackagesAbsolutePaths = currentZapFileZclPackages.map((zfp) =>
          this.createAbsolutePath(this.filePath, zfp.path)
        )
        currentTemplatePackagesAbsolutePaths =
          currentZapFileTemplatePackages.map((zfp) =>
            this.createAbsolutePath(this.filePath, zfp.path)
          )
      }

      if (
        this.zclPropertiesRow.length == currentZapFileZclPackages.length ||
        this.zclPropertiesRow.length == 1
      ) {
        if (
          this.zclGenRow.length == currentZapFileTemplatePackages.length ||
          this.zclGenRow.length == 1
        ) {
          this.selectedZclGenData = this.zclGenRow.map((zgr) => zgr.id)
          this.selectedZclPropertiesDataIds = this.zclPropertiesRow.map(
            (zpr) => zpr.id
          )
          this.selectedZclPropertiesData = this.zclPropertiesRow
        }
        this.customConfig = 'select'
        this.submitForm()
      } else {
        let selectableZclPackages = this.zclPropertiesRow.filter((zp) =>
          currentZclPackagesAbsolutePaths.includes(zp.path)
        )
        let selectableTemplatePackages = this.zclGenRow.filter((zt) =>
          currentTemplatePackagesAbsolutePaths.includes(zt.path)
        )
        this.selectedZclPropertiesDataIds = selectableZclPackages.map(
          (zp) => zp.id
        )
        this.selectedZclPropertiesData = selectableZclPackages
        this.selectedZclGenData = selectableTemplatePackages.map((zt) => zt.id)
        this.customConfig = 'select'
        // Do not show the config page when the packages from the .zap file are found
        if (
          this.selectedZclPropertiesData &&
          this.selectedZclPropertiesData.length > 0 &&
          this.selectedZclGenData &&
          this.selectedZclGenData.length > 0 &&
          this.selectedZclPropertiesData.length +
            this.selectedZclGenData.length ==
            currentTopLevelZapFilePackages.length
        ) {
          this.submitForm()
        }
      }

      result.data.sessions.forEach((item) => {
        let atts = null
        let gen = null
        for (const element of item.packageRef) {
          if (!atts) {
            atts = this.zclPropertiesRow.find((data) => data.id === element)
          }
          if (!gen) {
            gen = this.zclGenRow.find((data) => data.id === element)
          }
          if (atts && gen) break
        }
        this.loadPreSessionData.push({
          zclProperty: atts,
          genTemplateFile: gen,
          creationTime: item.creationTime,
          id: item.sessionId
        })
      })

      // load package notification data, and assign to both zclProperty & zclGen packages
      this.$serverGet(restApi.uri.packageNotification)
        .then((resp) => {
          const { warningMap, errorMap } = this.classifyMessages(resp.data)
          this.assignWarningsAndErrors(
            this.zclPropertiesRow,
            warningMap,
            errorMap
          )
          this.assignWarningsAndErrors(this.zclGenRow, warningMap, errorMap)
        })
        .catch((err) => {
          console.log(err)
        })
    })
  }
}
</script>
<style lang="scss" scoped>
.q-page {
  background: url('/bg-matter.jpg');
  background-size: cover;
  transition: 2s;

  &.zigbee {
    background: url('/bg-zigbee.jpg');
  }
  &.multiprotocol {
    background: url('/bg-multiprotocol.jpg');
  }
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.55s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>

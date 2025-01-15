/**
 *
 *    Copyright (c) 2020 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

/**
 * This module provides mappings between database columns and JS keys.
 *
 * @module DB API: DB types and enums.
 */

exports.packageType = {
  zclProperties: 'zcl-properties',
  zclXml: 'zcl-xml-child',
  zclXmlStandalone: 'zcl-xml-standalone',
  sqlSchema: 'sql-schema',
  zclSchema: 'zcl-schema',
  genTemplatesJson: 'gen-templates-json',
  genSingleTemplate: 'gen-template',
  genHelper: 'gen-helper',
  genOverride: 'gen-override',
  genPartial: 'gen-partial',
  jsonExtension: 'json-extension'
}

exports.rootNode = {
  endpointId: 0,
  getParentEndpointIdentifier: null,
  deviceVersion: 1,
  type: 'rootNode',
  profileID: 259
}

exports.packageOptionCategory = {
  manufacturerCodes: 'manufacturerCodes',
  typeMap: 'typeMap',
  generator: 'generator',
  profileCodes: 'profileCodes',
  validationTimersFlags: 'validationTimersFlags',
  ui: 'ui',
  helperCategories: 'helperCategories',
  helperAliases: 'helperAliases',
  resources: 'resources',
  outputOptions: 'outputOptions'
}

// these are allowed values for the value of "iterator" for
// the individual template in a templates.json file.
// Note: if you add more of these, add the documentation to sdk-integration.md
exports.iteratorValues = {
  availableCluster: 'availableCluster',
  selectedCluster: 'selectedCluster',
  selectedClientCluster: 'selectedClientCluster',
  selectedServerCluster: 'selectedServerCluster'
}

exports.side = {
  client: 'client',
  server: 'server',
  either: 'either',
  both: 'both'
}
exports.source = {
  client: 'client',
  server: 'server'
}

exports.storageOption = {
  ram: 'RAM',
  nvm: 'NVM',
  external: 'External'
}

exports.composition = {
  fullFamily: 'fullFamily',
  tree: 'tree',
  rootNode: 'rootNode'
}

exports.zclType = {
  struct: 'struct',
  enum: 'enum',
  bitmap: 'bitmap',
  atomic: 'atomic',
  unknown: 'unknown',
  array: 'array',
  zclCharFormatter: 'zclCharFormatter',
  string: 'string',
  number: 'number',
  typedef: 'typedef'
}

exports.sessionKey = {
  filePath: 'filePath',
  ideProjectPath: 'ideProjectPath',
  informationText: 'informationText',
  disableComponentToggling: 'disableComponentToggling'
}

exports.pathRelativity = {
  relativeToZap: 'relativeToZap',
  relativeToUserHome: 'relativeToHome',
  absolute: 'absolute',
  resolveEnvVars: 'resolveEnvVars'
}

exports.wsCategory = {
  generic: 'generic',
  dirtyFlag: 'dirtyFlag',
  upgrade: 'upgrade',
  validation: 'validation',
  notificationCount: 'notificationCount',
  notificationInfo: 'notificationInfo',
  sessionCreationError: 'sessionCreationError',
  componentUpdateStatus: 'componentUpdateStatus',
  updateSelectedUcComponents: 'updateSelectedUcComponents',
  init: 'init',
  tick: 'tick'
}

exports.packageExtensionEntity = {
  cluster: 'cluster',
  command: 'command',
  attribute: 'attribute',
  attributeType: 'attributeType',
  deviceType: 'deviceType',
  event: 'event'
}

exports.generatorOptions = {
  postProcessMulti: 'postProcessMulti',
  postProcessSingle: 'postProcessSingle',
  routeErrToOut: 'routeErrToOut',
  postProcessConditionalFile: 'postProcessConditionalFile',
  enabled: 'enabled',
  shareClusterStatesAcrossEndpoints: 'shareClusterStatesAcrossEndpoints',
  disableUcComponentOnZclClusterUpdate: 'disableUcComponentOnZclClusterUpdate'
}

exports.sessionOption = {
  defaultResponsePolicy: 'defaultResponsePolicy',
  manufacturerCodes: 'manufacturerCodes',
  profileCodes: 'profileCodes',
  coreSpecification: 'coreSpecification',
  clusterSpecification: 'clusterSpecification',
  deviceTypeSpecification: 'deviceTypeSpecification'
}

const reportingPolicy = {
  mandatory: 'mandatory',
  suggested: 'suggested',
  optional: 'optional',
  prohibited: 'prohibited',
  defaultReportingPolicy: 'optional',
  resolve: (txt) => {
    switch (txt) {
      case reportingPolicy.mandatory:
      case reportingPolicy.optional:
      case reportingPolicy.suggested:
      case reportingPolicy.prohibited:
        return txt
      default:
        // Default
        return reportingPolicy.defaultReportingPolicy
    }
  }
}

exports.reportingPolicy = reportingPolicy

const storagePolicy = {
  // Allow any storage policy to be used in the UI
  any: 'any',
  // Must use external storage and bypasses attribute store altogether.
  attributeAccessInterface: 'attributeAccessInterface',
  resolve: (txt) => {
    switch (txt) {
      case storagePolicy.any:
      case storagePolicy.attributeAccess:
        return txt
      default:
        return storagePolicy.any
    }
  }
}

exports.storagePolicy = storagePolicy

// When SDK supports a custom device, these are the default values for it.
exports.customDevice = {
  domain: 'Custom',
  name: 'Custom ZCL Device Type',
  description: 'Custom ZCL device type supports any combination of clusters.',
  code: 0xffff,
  profileId: 0xffff
}

exports.helperCategory = {
  zigbee: 'zigbee',
  matter: 'matter',
  meta: 'meta'
}

exports.packageMatch = {
  fuzzy: 'fuzzy', // This mechanism will attempt to match the ones from zap file, then give up and do fuzzy match if it fails.
  strict: 'strict', // This mechanism will ONLY use the records of packages in the .zap file.
  ignore: 'ignore' // This mechanism will completely ignore the use of packages in the .zap file.
}

exports.deviceTypeFeature = {
  name: {
    enabled: 'enabled',
    deviceType: 'deviceType',
    cluster: 'cluster',
    clusterSide: 'clusterSide',
    featureName: 'featureName',
    code: 'code',
    conformance: 'conformance',
    bit: 'bit',
    description: 'description'
  },
  label: {
    enabled: 'Enabled',
    deviceType: 'Device Type',
    cluster: 'Cluster',
    clusterSide: 'Cluster Side',
    featureName: 'Feature Name',
    code: 'Code',
    conformance: 'Conformance',
    bit: 'Bit',
    description: 'Description'
  }
}

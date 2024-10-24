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
 * @module DB API: DB mappings between columns and JS object keys.
 */

const dbApi = require('./db-api.js')
const dbEnums = require('../../src-shared/db-enum.js')
const bin = require('../util/bin')

exports.map = {
  package: (x) => {
    if (x == null) return undefined
    return {
      id: x.PACKAGE_ID,
      path: x.PATH,
      crc: x.CRC,
      type: x.TYPE,
      category: x.CATEGORY,
      description: x.DESCRIPTION,
      version: x.VERSION,
      parentId: x.PARENT_PACKAGE_REF
    }
  },
  options: (x) => {
    if (x == null) return undefined
    return {
      id: x.OPTION_ID,
      packageRef: x.PACKAGE_REF,
      optionCategory: x.OPTION_CATEGORY,
      optionCode: x.OPTION_CODE,
      optionLabel: x.OPTION_LABEL
    }
  },
  optionDefaults: (x) => {
    if (x == null) return undefined
    return {
      id: x.OPTION_DEFAULT_ID,
      packageRef: x.PACKAGE_REF,
      optionCategory: x.OPTION_CATEGORY,
      optionRef: x.OPTION_REF
    }
  },
  trackedFile: (x) => {
    if (x == null) return undefined
    return {
      path: x.PATH,
      crc: x.CRC
    }
  },
  cluster: (x) => {
    if (x == null) return undefined
    return {
      id: x.CLUSTER_ID,
      packageRef: x.PACKAGE_REF,
      code: x.CODE,
      manufacturerCode: x.MANUFACTURER_CODE,
      label: x.NAME,
      name: x.NAME,
      caption: x.DESCRIPTION,
      description: x.DESCRIPTION,
      define: x.DEFINE,
      domainName: x.DOMAIN_NAME,
      isSingleton: dbApi.fromDbBool(x.IS_SINGLETON),
      revision: x.REVISION,
      isManufacturingSpecific: dbApi.toDbBool(x.CLUSTER_MANUFACTURER_CODE),
      apiMaturity: x.API_MATURITY
    }
  },

  attribute: (x) => {
    if (x == null) return undefined
    return {
      id: x.ATTRIBUTE_ID,
      clusterRef: x.CLUSTER_REF,
      packageRef: x.PACKAGE_REF,
      code: x.CODE,
      clusterCode: x.CLUSTER_CODE,
      manufacturerCode: x.MANUFACTURER_CODE,
      name: x.NAME,
      label: x.NAME,
      type: x.TYPE != 'array' ? x.TYPE : x.ARRAY_TYPE,
      side: x.SIDE,
      define: x.DEFINE,
      min: x.MIN,
      max: x.MAX,
      minLength: x.MIN_LENGTH,
      maxLength: x.MAX_LENGTH,
      reportMinInterval: x.REPORT_MIN_INTERVAL,
      reportMaxInterval: x.REPORT_MAX_INTERVAL,
      reportableChange: x.REPORTABLE_CHANGE,
      reportableChangeLength: x.REPORTABLE_CHANGE_LENGTH,
      isWritable: dbApi.fromDbBool(x.IS_WRITABLE),
      isWritableAttribute: dbApi.fromDbBool(x.IS_WRITABLE),
      isNullable: dbApi.fromDbBool(x.IS_NULLABLE),
      defaultValue: x.DEFAULT_VALUE,
      isOptional: dbApi.fromDbBool(x.IS_OPTIONAL),
      isReportable:
        x.REPORTING_POLICY == dbEnums.reportingPolicy.mandatory ||
        x.REPORTING_POLICY == dbEnums.reportingPolicy.suggested,
      isReportableAttribute:
        x.REPORTING_POLICY == dbEnums.reportingPolicy.mandatory ||
        x.REPORTING_POLICY == dbEnums.reportingPolicy.suggested,
      reportingPolicy: x.REPORTING_POLICY,
      storagePolicy: x.STORAGE_POLICY,
      isSceneRequired: dbApi.fromDbBool(x.IS_SCENE_REQUIRED),
      entryType: x.ARRAY_TYPE,
      isArray: x.ARRAY_TYPE ? 1 : 0,
      mustUseTimedWrite: dbApi.fromDbBool(x.MUST_USE_TIMED_WRITE),
      apiMaturity: x.API_MATURITY,
      isChangeOmitted: dbApi.fromDbBool(x.IS_CHANGE_OMITTED),
      persistence: x.PERSISTENCE
    }
  },

  attributeMapping: (x) => {
    if (x == null) return undefined
    return {
      attributeMappingId: x.ATTRIBUTE_MAPPING_ID,
      attributeRef1: x.ATTRIBUTE_LEFT_REF,
      attributeRef2: x.ATTRIBUTE_RIGHT_REF,
      attributeCode1: x.A1_CODE,
      attributeMfgCode1: x.A1_MANUFACTURER_CODE,
      attributeCode2: x.A2_CODE,
      attributeMfgCode2: x.A2_MANUFACTURER_CODE,
      attributeName1: x.A1_NAME,
      attributeName2: x.A2_NAME,
      clusterCode1: x.C1_CODE,
      clusterMfgCode1: x.C1_MANUFACTURER_CODE,
      clusterCode2: x.C2_CODE,
      clusterMfgCode2: x.C2_MANUFACTURER_CODE,
      clusterName1: x.C1_NAME,
      clusterName2: x.C2_NAME
    }
  },

  eventField: (x) => {
    if (x == null) return undefined
    return {
      fieldIdentifier: x.FIELD_IDENTIFIER,
      name: x.NAME,
      type: x.TYPE,
      isArray: dbApi.fromDbBool(x.IS_ARRAY),
      isNullable: dbApi.fromDbBool(x.IS_NULLABLE),
      isOptional: dbApi.fromDbBool(x.IS_OPTIONAL)
    }
  },

  event: (x) => {
    if (x == null) return undefined
    return {
      id: x.EVENT_ID,
      clusterRef: x.CLUSTER_REF,
      clusterCode: x.CLUSTER_CODE,
      packageRef: x.PACKAGE_REF,
      code: x.CODE,
      manufacturerCode: x.MANUFACTURER_CODE,
      name: x.NAME,
      description: x.DESCRIPTION,
      side: x.SIDE,
      isOptional: dbApi.fromDbBool(x.IS_OPTIONAL),
      isFabricSensitive: dbApi.fromDbBool(x.IS_FABRIC_SENSITIVE),
      priority: x.PRIORITY
    }
  },

  command: (x) => {
    if (x == null) return undefined
    return {
      id: x.COMMAND_ID,
      clusterRef: x.CLUSTER_REF,
      packageRef: x.PACKAGE_REF,
      code: x.CODE,
      manufacturerCode: x.MANUFACTURER_CODE,
      label: x.NAME,
      name: x.NAME,
      commandName: x.NAME,
      description: x.DESCRIPTION,
      source: x.SOURCE,
      isOptional: dbApi.fromDbBool(x.IS_OPTIONAL),
      mustUseTimedInvoke: dbApi.fromDbBool(x.MUST_USE_TIMED_INVOKE),
      isFabricScoped: dbApi.fromDbBool(x.IS_FABRIC_SCOPED),
      clusterCode: x.CLUSTER_CODE,
      clusterName: x.CLUSTER_NAME,
      clusterDefineName: x.CLUSTER_DEFINE_NAME,
      argName: x.ARG_NAME,
      argType: x.ARG_TYPE,
      argIsArray: dbApi.fromDbBool(x.ARG_IS_ARRAY),
      argPresentIf: x.ARG_PRESENT_IF,
      argCountArg: x.ARG_COUNT_ARG,
      commandArgCount: x.COMMAND_ARGUMENT_COUNT,
      requiredCommandArgCount: x.REQUIRED_COMMAND_ARGUMENT_COUNT,
      hasArguments: x.COMMAND_ARGUMENT_COUNT > 0,
      commandHasRequiredField: x.REQUIRED_COMMAND_ARGUMENT_COUNT > 0,
      argIsNullable: x.ARG_IS_NULLABLE,
      responseRef: x.RESPONSE_REF,
      responseName: x.RESPONSE_NAME,
      hasSpecificResponse: dbApi.toDbBool(x.RESPONSE_REF),
      isIncoming: x.INCOMING,
      isOutgoing: x.OUTGOING,
      isDefaultResponseEnabled: x.IS_DEFAULT_RESPONSE_ENABLED,
      isLargeMessage: dbApi.fromDbBool(x.IS_LARGE_MESSAGE)
    }
  },

  commandArgument: (x) => {
    if (x == null) return undefined
    return {
      commandRef: x.COMMAND_REF,
      fieldIdentifier: x.FIELD_IDENTIFIER,
      label: x.NAME,
      name: x.NAME,
      type: x.TYPE,
      typeSize: x.TYPE_SIZE,
      typeIsSigned: x.TYPE_IS_SIGNED,
      min: x.MIN,
      max: x.MAX,
      minLength: x.MIN_LENGTH,
      maxLength: x.MAX_LENGTH,
      code: x.CODE,
      isArray: dbApi.fromDbBool(x.IS_ARRAY),
      presentIf: x.PRESENT_IF,
      isNullable: dbApi.fromDbBool(x.IS_NULLABLE),
      isOptional: dbApi.fromDbBool(x.IS_OPTIONAL),
      introducedInRef: x.INTRODUCED_IN_REF,
      removedInRef: x.REMOVED_IN_REF,
      countArg: x.COUNT_ARG,
      caption: `Command argument of type ${x.TYPE}`
    }
  },

  deviceTypeFeature: (x) => {
    if (x == null) return undefined
    return {
      deviceType: x.DEVICE_TYPE_NAME,
      cluster: x.CLUSTER_NAME,
      includeServer: x.INCLUDE_SERVER,
      includeClient: x.INCLUDE_CLIENT,
      conformance: x.DEVICE_TYPE_CLUSTER_CONFORMANCE,
      id: x.FEATURE_ID,
      name: x.FEATURE_NAME,
      code: x.CODE,
      bit: x.BIT,
      default_value: x.DEFAULT_VALUE,
      description: x.DESCRIPTION
    }
  },

  domain: (x) => {
    if (x == null) return undefined
    return {
      id: x.DOMAIN_ID,
      label: x.NAME,
      caption: `Domain, named ${x.NAME}`
    }
  },

  dataType: (x) => {
    if (x == null) return undefined
    return {
      id: x.DATA_TYPE_ID,
      name: x.NAME,
      description: x.DESCRIPTION,
      descriminatorId: x.DISCRIMINATOR_REF,
      packageId: x.PACKAGE_REF,
      discriminatorName: x.DISCRIMINATOR_NAME,
      clusterCode: x.CLUSTER_CODE
    }
  },

  discriminator: (x) => {
    if (x == null) return undefined
    return {
      id: x.DISCRIMINATOR_ID,
      name: x.NAME
    }
  },

  string: (x) => {
    if (x == null) return undefined
    return {
      id: x.STRING_ID,
      label: x.NAME,
      name: x.NAME,
      isLong: x.IS_LONG,
      isChar: x.IS_CHAR,
      size: x.SIZE
    }
  },

  number: (x) => {
    if (x == null) return undefined
    return {
      id: x.NUMBER_ID,
      label: x.NAME,
      name: x.NAME,
      isSigned: x.IS_SIGNED,
      size: x.SIZE
    }
  },

  enum: (x) => {
    if (x == null) return undefined
    return {
      id: x.ENUM_ID,
      label: x.NAME,
      name: x.NAME,
      caption: `Enum of size ${x.SIZE} byte`,
      enumClusterCount: x.ENUM_CLUSTER_COUNT,
      size: x.SIZE
    }
  },

  enumItem: (x) => {
    if (x == null) return undefined
    return {
      name: x.NAME,
      label: x.NAME,
      value: x.VALUE,
      enumRef: x.ENUM_REF,
      caption: `EnumItem, named ${x.NAME}`
    }
  },

  struct: (x) => {
    if (x == null) return undefined
    return {
      id: x.STRUCT_ID,
      label: x.NAME,
      name: x.NAME,
      itemCnt: x.ITEM_COUNT,
      isFabricScoped: dbApi.fromDbBool(x.IS_FABRIC_SCOPED),
      caption: `Struct, named ${x.NAME}`,
      structClusterCount: x.STRUCT_CLUSTER_COUNT,
      clusterName: x.CLUSTER_NAME,
      apiMaturity: x.API_MATURITY
    }
  },

  structItem: (x) => {
    if (x == null) return undefined
    return {
      name: x.NAME,
      label: x.NAME,
      fieldIdentifier: x.FIELD_IDENTIFIER,
      structRef: x.STRUCT_REF,
      type: x.TYPE,
      minLength: x.MIN_LENGTH,
      maxLength: x.MAX_LENGTH,
      isArray: dbApi.fromDbBool(x.IS_ARRAY),
      isEnum: dbApi.fromDbBool(x.IS_ENUM),
      isWritable: dbApi.fromDbBool(x.IS_WRITABLE),
      isNullable: dbApi.fromDbBool(x.IS_NULLABLE),
      isOptional: dbApi.fromDbBool(x.IS_OPTIONAL),
      isFabricSensitive: dbApi.fromDbBool(x.IS_FABRIC_SENSITIVE),
      dataTypeReference: x.TYPE,
      dataTypeReferenceName: x.DATA_TYPE_REF_NAME,
      discriminatorName: x.DISCRIMINATOR_NAME
    }
  },

  atomic: (x) => {
    if (x == null) return undefined
    return {
      id: x.ATOMIC_ID,
      atomicId: x.ATOMIC_IDENTIFIER,
      name: x.NAME,
      description: x.DESCRIPTION,
      size: x.ATOMIC_SIZE,
      isDiscrete: dbApi.fromDbBool(x.IS_DISCRETE),
      isString: dbApi.fromDbBool(x.IS_STRING),
      isLong: dbApi.fromDbBool(x.IS_LONG),
      isChar: dbApi.fromDbBool(x.IS_CHAR),
      isSigned: dbApi.fromDbBool(x.IS_SIGNED)
    }
  },

  bitmap: (x) => {
    if (x == null) return undefined
    return {
      id: x.BITMAP_ID,
      label: x.NAME,
      name: x.NAME,
      type: x.TYPE,
      bitmapClusterCount: x.BITMAP_CLUSTER_COUNT,
      size: x.SIZE
    }
  },

  bitmapField: (x) => {
    if (x == null) return undefined
    return {
      label: x.NAME,
      mask: x.MASK,
      type: x.TYPE,
      bitmapRef: x.BITMAP_REF,
      caption: `BitmapField, named ${x.NAME}`
    }
  },

  deviceType: (x) => {
    if (x == null) return undefined
    return {
      id: x.DEVICE_TYPE_ID,
      code: x.CODE,
      profileId: x.PROFILE_ID,
      domain: x.DOMAIN,
      label: x.NAME,
      name: x.NAME,
      caption: x.DESCRIPTION,
      class: x.CLASS,
      packageRef: x.PACKAGE_REF
    }
  },

  deviceTypeExtended: (x) => {
    if (x == null) return undefined
    return {
      id: x.DEVICE_TYPE_ID,
      code: x.CODE,
      profileId: x.PROFILE_ID,
      domain: x.DOMAIN,
      label: x.NAME,
      name: x.NAME,
      caption: x.DESCRIPTION,
      class: x.CLASS,
      packageRef: x.PACKAGE_REF,
      category: x.CATEGORY
    }
  },

  deviceTypeExport: (x) => {
    if (x == null) return undefined
    return {
      code: x.CODE,
      profileId: x.PROFILE_ID,
      label: x.NAME,
      name: x.NAME,
      deviceTypeOrder: x.DEVICE_TYPE_ORDER
    }
  },

  deviceTypeCluster: (x) => {
    if (x == null) return undefined
    return {
      id: x.DEVICE_TYPE_CLUSTER_ID,
      deviceTypeRef: x.DEVICE_TYPE_REF,
      clusterRef: x.CLUSTER_REF,
      clusterName: x.CLUSTER_NAME,
      includeClient: dbApi.fromDbBool(x.INCLUDE_CLIENT),
      includeServer: dbApi.fromDbBool(x.INCLUDE_SERVER),
      lockClient: dbApi.fromDbBool(x.LOCK_CLIENT),
      lockServer: dbApi.fromDbBool(x.LOCK_SERVER)
    }
  },

  deviceTypeAttribute: (x) => {
    if (x == null) return undefined
    return {
      deviceTypeClusterRef: x.DEVICE_TYPE_CLUSTER_REF,
      attributeRef: x.ATTRIBUTE_REF,
      name: x.NAME,
      code: x.CODE,
      manufacturerCode: x.MANUFACTURER_CODE
    }
  },

  deviceTypeCommand: (x) => {
    if (x == null) return undefined
    return {
      deviceTypeClusterRef: x.DEVICE_TYPE_CLUSTER_REF,
      commandRef: x.COMMAND_REF,
      name: x.NAME,
      code: x.CODE,
      manufacturerCode: x.MANUFACTURER_CODE,
      source: x.SOURCE
    }
  },

  endpoint: (x) => {
    if (x == null) return undefined
    return {
      id: x.ENDPOINT_ID,
      endpointRef: x.ENDPOINT_ID,
      sessionRef: x.SESSION_REF,
      endpointIdentifier: x.ENDPOINT_IDENTIFIER,
      endpointId: x.ENDPOINT_IDENTIFIER,
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      profileId: x.PROFILE,
      networkId: x.NETWORK_IDENTIFIER,
      endpointVersion: x.DEVICE_VERSION, // Left for backwards compatibility
      deviceVersion: x.DEVICE_VERSION,
      deviceIdentifier: x.DEVICE_IDENTIFIER,
      parentRef: x.PARENT_ENDPOINT_REF,
      parentEndpointIdentifier: x.PARENT_ENDPOINT_IDENTIFIER
    }
  },
  endpointExtended: (x) => {
    if (x == null) return undefined
    return {
      id: x.ENDPOINT_ID,
      endpointRef: x.ENDPOINT_ID,
      sessionRef: x.SESSION_REF,
      endpointIdentifier: x.ENDPOINT_IDENTIFIER,
      endpointId: x.ENDPOINT_IDENTIFIER,
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      profileId: x.PROFILE,
      networkId: x.NETWORK_IDENTIFIER,
      endpointVersion: x.DEVICE_VERSION, // Left for backwards compatibility
      deviceVersion: x.DEVICE_VERSION,
      deviceIdentifier: x.DEVICE_IDENTIFIER,
      parentRef: x.PARENT_ENDPOINT_REF,
      parentEndpointIdentifier: x.PARENT_ENDPOINT_IDENTIFIER,
      category: x.CATEGORY // Category of the device type coming from the zcl package it belongs to.
    }
  },
  endpointType: (x) => {
    if (x == null) return undefined
    return {
      id: x.ENDPOINT_TYPE_ID,
      endpointTypeId: x.ENDPOINT_TYPE_ID,
      sessionRef: x.SESSION_REF,
      name: x.NAME,
      deviceTypeRef: x.DEVICE_TYPE_REF,
      deviceTypes: x.deviceTypes // Populated outside the sql query mapping.
    }
  },
  endpointTypeExport: (x) => {
    if (x == null) return undefined
    return {
      id: x.ENDPOINT_TYPE_INDEX, // Index of endpoint type from list of endpoints types based on endpoint identifier
      endpointTypeId: x.ENDPOINT_TYPE_ID,
      name: x.NAME,
      deviceTypeRef: x.DEVICE_TYPE_REF,
      deviceTypes: x.deviceTypes // Populated outside the sql query mapping.
    }
  },
  endpointTypeDevice: (x) => {
    if (x == null) return undefined
    return {
      id: x.ENDPOINT_TYPE_DEVICE_ID,
      deviceTypeRef: x.DEVICE_TYPE_REF,
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      endpointTypeId: x.ENDPOINT_TYPE_REF,
      deviceTypeOrder: x.DEVICE_TYPE_ORDER,
      deviceIdentifier: x.DEVICE_IDENTIFIER,
      deviceId: x.DEVICE_IDENTIFIER,
      deviceVersion: x.DEVICE_VERSION
    }
  },
  endpointTypeDeviceExtended: (x) => {
    if (x == null) return undefined
    return {
      id: x.ENDPOINT_TYPE_DEVICE_ID,
      deviceTypeRef: x.DEVICE_TYPE_REF,
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      endpointTypeId: x.ENDPOINT_TYPE_REF,
      deviceTypeOrder: x.DEVICE_TYPE_ORDER,
      deviceIdentifier: x.DEVICE_IDENTIFIER,
      deviceId: x.DEVICE_IDENTIFIER,
      deviceVersion: x.DEVICE_VERSION,
      featureId: x.FEATURE_ID,
      featureCode: x.FEATURE_CODE,
      featureName: x.FEATURE_NAME,
      featureBit: x.FEATURE_BIT,
      clusterId: x.CLUSTER_REF,
      composition: x.TYPE
    }
  },
  endpointTypeCluster: (x) => {
    if (x == null) return undefined
    return {
      endpointTypeClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      clusterRef: x.CLUSTER_REF,
      side: x.SIDE,
      enabled: dbApi.fromDbBool(x.ENABLED)
    }
  },

  endpointTypeClusterExtended: (x) => {
    if (x == null) return undefined
    return {
      endpointTypeClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      clusterRef: x.CLUSTER_REF,
      side: x.SIDE,
      enabled: dbApi.fromDbBool(x.ENABLED),
      name: x.NAME, // Cluster Name
      code: x.CODE, // Cluster Code
      tokenAttributesCount: x.TOKEN_ATTRIBUTES_COUNT // Number of Token Attributes within the endpoint type cluster
    }
  },

  endpointTypeAttribute: (x) => {
    if (x == null) return undefined
    return {
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      clusterRef: x.CLUSTER_REF,
      attributeRef: x.ATTRIBUTE_REF,
      included: dbApi.fromDbBool(x.INCLUDED),
      storageOption: x.STORAGE_OPTION,
      singleton: dbApi.fromDbBool(x.SINGLETON),
      bounded: dbApi.fromDbBool(x.BOUNDED),
      defaultValue: x.DEFAULT_VALUE,
      includedReportable: dbApi.fromDbBool(x.INCLUDED_REPORTABLE),
      minInterval: x.MIN_INTERVAL,
      maxInterval: x.MAX_INTERVAL,
      reportableChange: x.REPORTABLE_CHANGE,
      apiMaturity: x.API_MATURITY
    }
  },

  endpointTypeAttributeExtended: (x) => {
    if (x == null) return undefined
    return {
      arrayType: x.ARRAY_TYPE,
      attributeRef: x.ATTRIBUTE_REF,
      bounded: dbApi.fromDbBool(x.BOUNDED),
      clusterDefine: x.CLUSTER_DEFINE,
      clusterMfgCode: x.CLUSTER_MANUFACTURER_CODE,
      clusterName: x.CLUSTER_NAME,
      clusterRef: x.CLUSTER_REF,
      clusterSide: x.SIDE,
      code: x.CODE, // Attribute Code
      defaultValue: x.DEFAULT_VALUE,
      define: x.DEFINE, // Attribute define
      endpointId: x.ENDPOINT_IDENTIFIER, // Endpoint type attribute's endpoint Id
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      entryType: x.ARRAY_TYPE,
      hexCode: '0x' + bin.int16ToHex(x['CODE'] ? x['CODE'] : 0), // Attribute code in hex
      id: x.ATTRIBUTE_ID, // Attribute id
      included: dbApi.fromDbBool(x.INCLUDED),
      includedReportable: dbApi.fromDbBool(x.INCLUDED_REPORTABLE), // Is attribute reportable
      isArray: x.IS_ARRAY, // Is attribute of type array
      isBound: dbApi.fromDbBool(x.BOUNDED), // Is endpoint type attribute bounded
      isClusterEnabled: x.ENABLED,
      isGlobalAttribute: x.IS_GLOBAL_ATTRIBUTE, // Is attribute global
      isIncluded: dbApi.fromDbBool(x.INCLUDED), // Is endpoint type attribute included
      isManufacturingSpecific: dbApi.toDbBool(
        x.MANUFACTURER_CODE | x.CLUSTER_MANUFACTURER_CODE
      ), // Is Attribute mfg specific or not
      isNullable: dbApi.fromDbBool(x.IS_NULLABLE), // Is attribute nullable
      isOptionalAttribute: dbApi.fromDbBool(x.IS_OPTIONAL),
      isReportableAttribute: dbApi.fromDbBool(x.INCLUDED_REPORTABLE), // Is attribute reportable
      isSceneRequired: dbApi.fromDbBool(x.IS_SCENE_REQUIRED),
      isSingleton: dbApi.fromDbBool(x.SINGLETON), // Endpoint type attribute is singleton or not
      isWritable: dbApi.fromDbBool(x.IS_WRITABLE), // Is attribute writable
      isWritableAttribute: dbApi.fromDbBool(x.IS_WRITABLE), // Is attribute writable
      manufacturerCode: x.MANUFACTURER_CODE
        ? x.MANUFACTURER_CODE
        : x.CLUSTER_MANUFACTURER_CODE, // Attribute manufacturer code
      max: x.MAX, // Attribute max value
      maxInterval: x.MAX_INTERVAL,
      maxLength: x.MAX_LENGTH, // Attribute max length
      mfgCode: x.MANUFACTURER_CODE
        ? x.MANUFACTURER_CODE
        : x.CLUSTER_MANUFACTURER_CODE, // Attribute manufacturer code
      min: x.MIN, // Attribute min value
      minInterval: x.MIN_INTERVAL,
      minLength: x.MIN_LENGTH, // Attribute min length
      mustUseTimedWrite: dbApi.fromDbBool(x.MUST_USE_TIMED_WRITE),
      name: x.NAME, // Attribute Name
      reportableChange: x.REPORTABLE_CHANGE,
      side: x.SIDE, // Attribute Side
      singleton: dbApi.fromDbBool(x.SINGLETON),
      smallestEndpointIdentifier: x.SMALLEST_ENDPOINT_IDENTIFIER, // Smallest endpoint Id in which the attribute is present
      storage: x.STORAGE_OPTION,
      storageOption: x.STORAGE_OPTION,
      tokenId: x.TOKEN_ID, // Endpoint type attribute's token id
      type: x.TYPE != 'array' ? x.TYPE : x.ARRAY_TYPE, // Attribute type
      apiMaturity: x.API_MATURITY,
      isChangeOmitted: dbApi.fromDbBool(x.IS_CHANGE_OMITTED),
      persistence: x.PERSISTENCE
    }
  },

  endpointTypeCommand: (x) => {
    if (x == null) return undefined
    return {
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      clusterRef: x.CLUSTER_REF,
      commandRef: x.COMMAND_REF,
      incoming: dbApi.fromDbBool(x.INCOMING),
      outgoing: dbApi.fromDbBool(x.OUTGOING),
      isIncoming: dbApi.fromDbBool(x.IS_INCOMING),
      isEnabled: dbApi.fromDbBool(x.IS_ENABLED)
    }
  },

  endpointTypeEvent: (x) => {
    if (x == null) return undefined
    return {
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      clusterRef: x.CLUSTER_REF,
      eventRef: x.EVENT_REF,
      included: dbApi.fromDbBool(x.INCLUDED)
    }
  },

  packageExtension: (x) => {
    if (x == null) return undefined
    return {
      entity: x.ENTITY,
      property: x.PROPERTY,
      type: x.TYPE,
      configurability: x.CONFIGURABILITY,
      label: x.LABEL,
      globalDefault: x.GLOBAL_DEFAULT
    }
  },
  packageExtensionDefault: (x) => {
    if (x == null) return undefined
    return {
      entityCode: x.ENTITY_CODE,
      entityQualifier: x.ENTITY_QUALIFIER,
      parentCode: x.PARENT_CODE,
      manufacturerCode: x.MANUFACTURER_CODE,
      value: x.VALUE
    }
  },
  sessionPackage: (x) => {
    if (x == null) return undefined
    return {
      packageRef: x.PACKAGE_REF,
      sessionRef: x.SESSION_REF,
      required: x.REQUIRED,
      type: x.TYPE,
      sessionPartitionId: x.SESSION_PARTITION_ID,
      category: x.CATEGORY
    }
  },
  sessionLog: (x) => {
    if (x == null) return undefined
    return {
      timestamp: x.TIMESTAMP,
      log: x.LOG
    }
  },
  session: (x) => {
    if (x == null) return undefined
    return {
      sessionId: x.SESSION_ID,
      sessionKey: x.SESSION_KEY,
      creationTime: x.CREATION_TIME,
      packageRef: x.PACKAGE_REF,
      userRef: x.USER_REF,
      dirty: x.DIRTY == 1,
      newNotification: x.NEW_NOTIFICATION == 1
    }
  },

  sessionPartition: (x) => {
    if (x == null) return undefined
    return {
      sessionPartitionId: x.SESSION_PARTITION_ID,
      sessionRef: x.SESSION_REF,
      sessionPartitionNumber: x.SESSION_PARTITION_NUMBER
    }
  },

  rootNode: (x) => {
    if (x == null) return undefined
    return {
      deviceTypeRef: x.DEVICE_TYPE_REF,
      code: x.CODE,
      name: x.NAME,
      type: x.TYPE
    }
  },

  user: (x) => {
    if (x == null) return undefined
    return {
      userId: x.USER_ID,
      userKey: x.USER_KEY,
      creationTime: x.CREATION_TIME
    }
  },
  accessRole: (x) => {
    if (x == null) return undefined
    return {
      name: x.NAME,
      description: x.DESCRIPTION,
      level: x.LEVEL
    }
  },
  accessOperation: (x) => {
    if (x == null) return undefined
    return {
      name: x.NAME,
      description: x.DESCRIPTION
    }
  },
  accessModifier: (x) => {
    if (x == null) return undefined
    return {
      name: x.NAME,
      description: x.DESCRIPTION
    }
  },
  access: (x) => {
    if (x == null) return undefined
    return {
      operation: x.OP_NAME,
      role: x.ROLE_NAME,
      accessModifier: x.MODIFIER_NAME
    }
  },
  settings: (x) => {
    if (x == null) return undefined
    return {
      category: x.CATEGORY,
      key: x.KEY,
      value: x.VALUE
    }
  },
  sessionNotifications: (x) => {
    if (x == null) return undefined
    return {
      ref: x.SESSION_REF,
      type: x.NOTICE_TYPE,
      message: x.NOTICE_MESSAGE,
      severity: x.NOTICE_SEVERITY,
      id: x.NOTICE_ID,
      display: x.DISPLAY,
      seen: x.SEEN
    }
  },
  packageNotification: (x) => {
    if (x == null) return undefined
    return {
      ref: x.PACKAGE_REF,
      type: x.NOTICE_TYPE,
      message: x.NOTICE_MESSAGE,
      severity: x.NOTICE_SEVERITY,
      id: x.NOTICE_ID
    }
  }
}

exports.reverseMap = {
  endpoint: {
    endpointRef: 'ENDPOINT_ID',
    sessionRef: 'SESSION_REF',
    endpointId: 'ENDPOINT_IDENTIFIER',
    endpointTypeRef: 'ENDPOINT_TYPE_REF',
    profileId: 'PROFILE',
    networkId: 'NETWORK_IDENTIFIER',
    parentRef: 'PARENT_ENDPOINT_REF',
    parentEndpointIdentifier: 'PARENT_ENDPOINT_IDENTIFIER',
    endpointVersion: 'DEVICE_VERSION',
    deviceVersion: 'DEVICE_VERSION'
  }
}

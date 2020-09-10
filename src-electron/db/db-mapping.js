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

exports.map = {
  package: (x) => {
    if (x == null) return undefined
    return {
      id: x.PACKAGE_ID,
      path: x.PATH,
      crc: x.CRC,
      type: x.TYPE,
      version: x.VERSION,
    }
  },
  options: (x) => {
    if (x == null) return undefined
    return {
      id: x.OPTION_ID,
      packageRef: x.PACKAGE_REF,
      optionCategory: x.OPTION_CATEGORY,
      optionCode: x.OPTION_CODE,
      optionLabel: x.OPTION_LABEL,
    }
  },
  optionDefaults: (x) => {
    if (x == null) return undefined
    return {
      id: x.OPTION_DEFAULT_ID,
      packageRef: x.PACKAGE_REF,
      optionCategory: x.OPTION_CATEGORY,
      optionRef: x.OPTION_REF,
    }
  },
  trackedFile: (x) => {
    if (x == null) return undefined
    return {
      path: x.PATH,
      crc: x.CRC,
    }
  },
  cluster: (x) => {
    if (x == null) return undefined
    return {
      id: x.CLUSTER_ID,
      code: x.CODE,
      manufacturerCode: x.MANUFACTURER_CODE,
      label: x.NAME,
      caption: x.DESCRIPTION,
      define: x.DEFINE,
      domainName: x.DOMAIN_NAME,
    }
  },

  attribute: (x) => {
    if (x == null) return undefined
    return {
      id: x.ATTRIBUTE_ID,
      clusterRef: x.CLUSTER_REF,
      code: x.CODE,
      manufacturerCode: x.MANUFACTURER_CODE,
      label: x.NAME,
      type: x.TYPE,
      side: x.SIDE,
      define: x.DEFINE,
      min: x.MIN,
      max: x.MAX,
      isWritable: x.IS_WRITABLE,
      defaultValue: x.DEFAULT_VALUE,
      isOptional: x.IS_OPTIONAL,
      isReportable: x.IS_REPORTABLE,
    }
  },

  command: (x) => {
    if (x == null) return undefined
    return {
      id: x.COMMAND_ID,
      clusterRef: x.CLUSTER_REF,
      code: x.CODE,
      manufacturerCode: x.MANUFACTURER_CODE,
      label: x.NAME,
      description: x.DESCRIPTION,
      source: x.SOURCE,
      isOptional: x.IS_OPTIONAL,
    }
  },

  commandArgument: (x) => {
    if (x == null) return undefined
    return {
      commandRef: x.COMMAND_REF,
      label: x.NAME,
      type: x.TYPE,
      code: x.CODE,
      isArray: x.IS_ARRAY,
      caption: `Command argument of type ${x.TYPE}`,
    }
  },

  domain: (x) => {
    if (x == null) return undefined
    return {
      id: x.DOMAIN_ID,
      label: x.NAME,
      caption: `Domain, named ${x.NAME}`,
    }
  },

  enum: (x) => {
    if (x == null) return undefined
    return {
      id: x.ENUM_ID,
      label: x.NAME,
      caption: `Enum of type ${x.TYPE}`,
    }
  },

  enumItem: (x) => {
    if (x == null) return undefined
    return {
      label: x.NAME,
      value: x.VALUE,
      enumRef: x.ENUM_REF,
      caption: `EnumItem, named ${x.NAME}`,
    }
  },

  struct: (x) => {
    if (x == null) return undefined
    return {
      id: x.STRUCT_ID,
      label: x.NAME,
      caption: `Struct, named ${x.NAME}`,
    }
  },

  structItem: (x) => {
    if (x == null) return undefined
    return {
      label: x.NAME,
      structRef: x.STRUCT_REF,
      type: x.TYPE,
      caption: `Struct Item of type ${x.TYPE}`,
    }
  },

  atomic: (x) => {
    if (x == null) return undefined
    return {
      atomicId: x.ATOMIC_IDENTIFIER,
      name: x.NAME,
      description: x.DESCRIPTION,
      size: x.ATOMIC_SIZE,
    }
  },

  bitmap: (x) => {
    if (x == null) return undefined
    return {
      id: x.BITMAP_ID,
      label: x.NAME,
      type: x.TYPE,
    }
  },

  bitmapField: (x) => {
    if (x == null) return undefined
    return {
      label: x.NAME,
      mask: x.MASK,
      bitmapRef: x.BITMAP_REF,
      caption: `BitmapField, named ${x.NAME}`,
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
      caption: x.DESCRIPTION,
    }
  },

  deviceTypeCluster: (x) => {
    if (x == null) return undefined
    return {
      id: x.DEVICE_TYPE_CLUSTER_ID,
      deviceTypeRef: x.DEVICE_TYPE_REF,
      clusterRef: x.CLUSTER_REF,
      clusterName: x.CLUSTER_NAME,
      includeClient: x.INCLUDE_CLIENT,
      includeServer: x.INCLUDE_SERVER,
      lockClient: x.LOCK_CLIENT,
      lockServer: x.LOCK_SERVER,
    }
  },

  deviceTypeAttribute: (x) => {
    if (x == null) return undefined
    return {
      deviceTypeClusterRef: x.DEVICE_TYPE_CLUSTER_REF,
      attributeRef: x.ATTRIBUTE_REF,
      attributeName: x.ATTRIBUTE_NAME,
    }
  },

  deviceTypeCommand: (x) => {
    if (x == null) return undefined
    return {
      deviceTypeClusterRef: x.DEVICE_TYPE_CLUSTER_REF,
      commandRef: x.COMMAND_REF,
      commandName: x.COMMAND_NAME,
    }
  },

  endpoint: (x) => {
    if (x == null) return undefined
    return {
      id: x.ENDPOINT_ID,
      endpointRef: x.ENDPOINT_ID,
      sessionRef: x.SESSION_REF,
      endpointId: x.ENDPOINT_IDENTIFIER,
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      profileId: x.PROFILE,
      networkId: x.NETWORK_IDENTIFIER,
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
    }
  },
  endpointTypeCluster: (x) => {
    if (x == null) return undefined
    return {
      endpointTypeClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      clusterRef: x.CLUSTER_REF,
      side: x.SIDE,
      enabled: x.ENABLED,
    }
  },

  endpointTypeAttribute: (x) => {
    if (x == null) return undefined
    return {
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      clusterRef: x.CLUSTER_REF,
      attributeRef: x.ATTRIBUTE_REF,
      included: x.INCLUDED,
      storageOption: x.STORAGE_OPTION,
      singleton: x.SINGLETON,
      bounded: x.BOUNDED,
      defaultValue: x.DEFAULT_VALUE,
      includedReportable: x.INCLUDED_REPORTABLE,
      minInterval: x.MIN_INTERVAL,
      maxInterval: x.MAX_INTERVAL,
      reportableChange: x.REPORTABLE_CHANGE,
    }
  },

  endpointTypeCommand: (x) => {
    if (x == null) return undefined
    return {
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      clusterRef: x.CLUSTER_REF,
      commandRef: x.COMMAND_REF,
      incoming: x.INCOMING,
      outgoing: x.OUTGOING,
    }
  },
}

exports.reverseMap = {
  endpoint: {
    endpointRef: 'ENDPOINT_ID',
    sessionRef: 'SESSION_REF',
    endpointId: 'ENDPOINT_IDENTIFIER',
    endpointTypeRef: 'ENDPOINT_TYPE_REF',
    profileId: 'PROFILE',
    networkId: 'NETWORK_IDENTIFIER',
  },
}

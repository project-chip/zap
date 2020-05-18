// Copyright (c) 2019 Silicon Labs. All rights reserved.

/**
 * ZCL specific stuff.
 */

import { selectAllClusters, selectAllAttributes, selectAllCommands, selectClusterById, selectAllDomains, selectDomainById, selectAllEnums, selectEnumById, selectAllStructs, selectStructById, selectAllBitmaps, selectBitmapById, selectAllDeviceTypes, selectDeviceTypeById, selectAttributesByClusterId, selectCommandsByClusterId, selectEndpointTypeClustersByEndpointTypeId, selectEndpointTypeAttributesByEndpointId, selectEndpointTypeCommandsByEndpointId, selectEndpointTypeReportableAttributeByEndpointId, selectDeviceTypeClustersByDeviceTypeRef, selectDeviceTypeAttributesByDeviceTypeRef, selectDeviceTypeCommandsByDeviceTypeRef, selectEndpointTypeAttribute, selectAttributeByAttributeRef} from '../db/query-zcl.js'

export function zclClusters(db, id) {
  const f = (x) => {
    return {
      id: x.CLUSTER_ID,
      code: x.CODE,
      manufacturerCode: x.MANUFACTURER_CODE,
      label: x.NAME,
      caption: x.DESCRIPTION,
      define: x.DEFINE
    }
  }
  if (id == 'all') {
    return selectAllClusters(db).then(rows => rows.map(f))
  } else {
    return selectClusterById(db, id).then(f)
  }
}

export function zclAttributes(db, clusterId) {
  const f = (x) => {
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
      isReportable: x.IS_REPORTABLE
    }
  }

  if (clusterId == 'all') {
    return selectAllAttributes(db).then(rows => rows.map(f))
  } else {
    return selectAttributesByClusterId(db, clusterId).then(rows => rows.map(f))
  }
}

export function zclAttribute(db, attributeRef) {
  const f = (x) => {
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
      isReportable: x.IS_REPORTABLE
    }
  }
  return selectAttributeByAttributeRef(db, attributeRef).then(f)
}

export function zclCommands(db, clusterId) {
  const f = (x) => {
    return {
      id: x.COMMAND_ID,
      clusterRef: x.CLUSTER_REF,
      code: x.CODE,
      manufacturerCode: x.MANUFACTURER_CODE,
      label: x.NAME,
      description: x.DESCRIPTION,
      source: x.SOURCE,
      isOptional: x.IS_OPTIONAL
    }
  }

  if (clusterId == 'all') {
    return selectAllCommands(db).then(rows => rows.map(f))
  } else {
    return selectCommandsByClusterId(db, clusterId).then(rows => rows.map(f))
  }
}

  export function zclDomains(db, id) {
    const f = (x) => {
      return {
        id: x.DOMAIN_ID,
        label: x.NAME,
        caption: `Domain, named ${x.NAME}`
      }
    }
    if (id == 'all') {
      return selectAllDomains(db).then(rows => rows.map(f))
    } else {
      return selectDomainById(db, id).then(f)
    }
  }

  export function zclEnums(db, id) {
    const f = (x) => { 
      return {
        id: x.ENUM_ID,
        label: x.NAME,
        caption: `Enum of type ${x.TYPE}`
      }
    }
    if (id == 'all') {
      return selectAllEnums(db).then(rows => rows.map(f))
    } else {
      return selectEnumById(db, id).then(f)
    }
  }

  export function zclStructs(db, id) {
    const f = (x) => {
      return {
        id: x.STRUCT_ID,
        label: x.NAME,
        caption: `Struct, named ${x.NAME}`
      }
    }
    if (id == 'all') {
      return selectAllStructs(db).then(rows => rows.map(f))
    } else {
      return selectStructById(db, id).then(f)
    }
  }

  export function zclBitmaps(db, id) {
    const f = (x) => {
      return {
        id: x.BITMAP_ID,
        label: x.NAME,
        caption: `Enum of type ${x.TYPE}`
      }
    }
    if (id == 'all') {
      return selectAllBitmaps(db).then(rows => rows.map(f))
    } else {
      return selectBitmapById(db, id).then(f)
    }
  }

  export function zclDeviceTypes(db, id) {
    const f = (x) => {
      return {
        id: x.DEVICE_TYPE_ID,
        code: x.CODE,
        profileId: x.PROFILE_ID,
        label: x.NAME,
        caption: x.DESCRIPTION
      }
    }
    if (id == 'all') {
      return selectAllDeviceTypes(db).then(rows => rows.map(f))
    } else {
      return selectDeviceTypeById(db, id).then(f)
    }
  }

  export function zclDeviceTypeClusters(db, deviceTypeRef) {
    const f = (x) => {
      zclDeviceTypeAttributes(db, deviceTypeRef)
      return {
        deviceTypeRef: x.DEVICE_TYPE_REF,
        clusterRef: x.CLUSTER_REF,
        clusterName: x.CLUSTER_NAME, 
        includeClient: x.INCLUDE_CLIENT,
        includeServer: x.INCLUDE_SERVER,
        lockClient: x.LOCK_CLIENT,
        lockServer: x.LOCK_SERVER
      }
    }
    return selectDeviceTypeClustersByDeviceTypeRef(db, deviceTypeRef).then(rows => rows.map(f))
  }

  export function zclEndpointTypeClusters(db, id) {
    const f = (x) => {
      return {
        endpointTypeRef: x.ENDPOINT_TYPE_REF,
        clusterRef: x.CLUSTER_REF,
        side: x.SIDE,
        enabled: x.ENABLED
      }
    }
    return selectEndpointTypeClustersByEndpointTypeId(db, id).then(rows => rows.map(f))
  }

  export function zclEndpointTypeAttributes(db, id) {
    const f = (x) => {
      return {
        endpointTypeRef: x.ENDPOINT_TYPE_REF,
        attributeRef: x.ATTRIBUTE_REF,
        included: x.INCLUDED,
        external: x.EXTERNAL,
        flash: x.FLASH,
        singleton: x.SINGLETON,
        bounded: x.BOUNDED,
        defaultValue: x.DEFAULT_VALUE
      }
    }
      return selectEndpointTypeAttributesByEndpointId(db, id).then(rows => rows.map(f))
  }

  export function zclEndpointTypeAttribute(db, endpointTypeId, attributeRef) {
    const f = (x) => {
      return {
        endpointTypeRef: x.ENDPOINT_TYPE_REF,
        attributeRef: x.ATTRIBUTE_REF,
        included: x.INCLUDED,
        external: x.EXTERNAL,
        flash: x.FLASH,
        singleton: x.SINGLETON,
        bounded: x.BOUNDED,
        defaultValue: x.DEFAULT_VALUE
      }
    }
    return selectEndpointTypeAttribute(db, endpointTypeId, attributeRef).then(f)
  }

  export function zclEndpointTypeCommands(db, id) {
    const f = (x) => {
      return {
        endpointTypeRef: x.ENDPOINT_TYPE_REF,
        commandRef: x.COMMAND_REF, 
        incoming: x.INCOMING,
        outgoing: x.OUTGOING
      }
    }
    return selectEndpointTypeCommandsByEndpointId(db, id).then(rows => rows.map(f))
  }

  export function zclEndpointTypeReportableAttributes(db, id) {
    const f = (x) => {
      return {
        endpointTypeRef: x.ENDPOINT_TYPE_REF,
        attributeRef: x.ATTRIBUTE_REF,
        included: x.INCLUDED,
        minInterval: x.MIN_INTERVAL,
        maxInterval: x.MAX_INTERVAL,
        reportableChange: x.REPORTABLE_CHANGE
      }
    }
    return selectEndpointTypeReportableAttributeByEndpointId(db, id).then(rows => rows.map(f))
  }

  export function zclDeviceTypeAttributes(db, id) {
    const f = (x) => {
      return {
        deviceTypeClusterRef: x.DEVICE_TYPE_REF_CLUSTER_REF,
        attributeRef: x.ATTRIBUTE_REF,
        attributeName: x.ATTRIBUTE_NAME
      }
    }
    return selectDeviceTypeAttributesByDeviceTypeRef(db, id).then(rows => rows.map(f))
  }

  export function zclDeviceTypeCommands(db, id) {
    const f = (x) => {
      return {
        deviceTypeClusterRef: x.DEVICE_TYPE_REF_CLUSTER_REF,
        commandRef: x.COMMAND_REF,
        commandName: x.COMMAND_NAME
      }
    }
    return selectDeviceTypeCommandsByDeviceTypeRef(db, id).then(rows => rows.map(f))
  }
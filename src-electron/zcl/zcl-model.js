// Copyright (c) 2019 Silicon Labs. All rights reserved.

/**
 * ZCL specific stuff.
 */

import { selectAllClusters, selectClusterById, selectAllDomains, selectDomainById, selectAllEnums, selectEnumById, selectAllStructs, selectStructById, selectAllBitmaps, selectBitmapById, selectAllDeviceTypes, selectDeviceTypeById, selectAttributesByClusterId, selectCommandsByClusterId} from '../db/query.js'

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
      isOptional: x.IS_OPTIONAL
    }
  }

  if (clusterId == 'all') {
    return selectAllClusters(db).then(rows => null).then(t => null)
  } else {
    return selectAttributesByClusterId(db, clusterId).then(rows => rows.map(f))
  }
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
    return selectAllClusters(db).then(rows => null).then(t => null)
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

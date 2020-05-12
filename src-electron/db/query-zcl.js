// Copyright (c) 2020 Silicon Labs. All rights reserved.

/** 
 * This module provides queries for ZCL static queries.
 * 
 * @module DB API: zcl database access
 */
import { dbAll, dbGet, dbMultiInsert, dbUpdate, dbInsert } from './db-api.js';

/**
 * Retrieves all the enums in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of enums.
 */
export function selectAllEnums(db) {
    return dbAll(db, 'SELECT ENUM_ID, NAME, TYPE FROM ENUM ORDER BY NAME', [])
}

export function selectAllEnumItemsById(db, id) {
    return dbAll(db, 'SELECT NAME FROM ENUM_ITEM WHERE ENUM_REF=?', [id]);
}

export function selectAllEnumItems(db) {
    return dbAll(db, 'SELECT NAME, VALUE, ENUM_REF FROM ENUM_ITEM ORDER BY ENUM_REF', []);
}

export function selectEnumById(db, id) {
    return dbGet(db, 'SELECT ENUM_ID, NAME, TYPE FROM ENUM WHERE ENUM_ID = ? ORDER BY NAME', [id])
}

/**
 * Retrieves all the bitmaps in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of bitmaps.
 */
export function selectAllBitmaps(db) {
    return dbAll(db, 'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP ORDER BY NAME', [])
}

export function selectAllBitmapFields(db) {
    return dbAll(db, 'SELECT NAME, MASK, BITMAP_REF FROM BITMAP_FIELD ORDER BY NAME', [])
}

export function selectBitmapById(db, id) {
    return dbGet(db, 'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP WHERE BITMAP_ID = ? ORDER BY NAME', [id])
}

/**
 * Retrieves all the domains in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of domains.
 */
export function selectAllDomains(db) {
    return dbAll(db, 'SELECT DOMAIN_ID, NAME FROM DOMAIN ORDER BY NAME', [])
}

export function selectDomainById(db, id) {
    return dbGet(db, 'SELECT DOMAIN_ID, NAME FROM DOMAIN WHERE DOMAIN_ID = ? ORDER BY NAME', [id])
}

/**
 * Retrieves all the structs in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of structs.
 */
export function selectAllStructs(db) {
    return dbAll(db, 'SELECT STRUCT_ID, NAME FROM STRUCT ORDER BY NAME', [])
}

export function selectStructById(db, id) {
    return dbGet(db, 'SELECT STRUCT_ID, NAME FROM STRUCT WHERE STRUCT_ID = ? ORDER BY NAME', [id])
}

export function selectAllStructItems(db) {
    return dbAll(db, 'SELECT NAME, TYPE, STRUCT_REF FROM STRUCT_ITEM ORDER BY STRUCT_REF', []);
}

export function selectStructItemById(db, id) {
    return dbAll(db, 'SELECT NAME FROM STRUCT_ITEM WHERE STRUCT_REF=?', [id]);
}

/**
 * Retrieves all the clusters in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of clusters.
 */
export function selectAllClusters(db) {
    return dbAll(db, 'SELECT CLUSTER_ID, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, DEFINE FROM CLUSTER ORDER BY CODE', [])
}

export function selectClusterById(db, id) {
    return dbGet(db, 'SELECT CLUSTER_ID, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION FROM CLUSTER WHERE CLUSTER_ID = ?', [id])
}

/**
 * Retrieves all the device types in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of device types.
 */
export function selectAllDeviceTypes(db) {
    return dbAll(db, 'SELECT DEVICE_TYPE_ID, CODE, PROFILE_ID, NAME, DESCRIPTION FROM DEVICE_TYPE ORDER BY CODE', [])
}

export function selectDeviceTypeById(db, id) {
    return dbGet(db, 'SELECT DEVICE_TYPE_ID, CODE, PROFILE_ID, NAME, DESCRIPTION FROM DEVICE_TYPE WHERE DEVICE_TYPE_ID = ?', [id])
}

export function selectAttributesByClusterId(db, clusterId) {
    return dbAll(db, `SELECT ATTRIBUTE_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL, IS_REPORTABLE FROM ATTRIBUTE WHERE CLUSTER_REF = ? ORDER BY CODE`, [clusterId])
}

export function selectAttributeByAttributeRef(db, attributeRef) {
    return dbGet(db, 'SELECT ATTRIBUTE_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL, IS_REPORTABLE FROM ATTRIBUTE WHERE ATTRIBUTE_ID = ?', attributeRef)
}

export function selectAllAttributes(db) {
    return dbAll(db, `SELECT ATTRIBUTE_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL, IS_REPORTABLE FROM ATTRIBUTE ORDER BY CODE`, [])
}

export function selectCommandsByClusterId(db, clusterId) {
    return dbAll(db, `SELECT COMMAND_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL FROM COMMAND WHERE CLUSTER_REF = ? ORDER BY CODE`, [clusterId])
}

export function selectAllCommands(db) {
    return dbAll(db, `SELECT COMMAND_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL FROM COMMAND ORDER BY CODE`, [])
}

export function selectEndpointTypeClustersByEndpointTypeId(db, endpointTypeId) {
    return dbAll(db, `SELECT ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE, ENABLED FROM ENDPOINT_TYPE_CLUSTER WHERE ENDPOINT_TYPE_REF = ? ORDER BY CLUSTER_REF`, [endpointTypeId])
}

export function selectEndpointTypeAttributesByEndpointId(db, endpointTypeId) {
    return dbAll(db, `SELECT ENDPOINT_TYPE_REF, ATTRIBUTE_REF, INCLUDED, EXTERNAL, FLASH, SINGLETON, BOUNDED, DEFAULT_VALUE FROM ENDPOINT_TYPE_ATTRIBUTE WHERE ENDPOINT_TYPE_REF = ? ORDER BY ATTRIBUTE_REF`, [endpointTypeId])
}

export function selectEndpointTypeCommandsByEndpointId(db, endpointTypeId) {
    return dbAll(db, `SELECT ENDPOINT_TYPE_REF, COMMAND_REF, INCOMING, OUTGOING FROM ENDPOINT_TYPE_COMMAND WHERE ENDPOINT_TYPE_REF = ? ORDER BY COMMAND_REF`, [endpointTypeId])
}

export function selectEndpointTypeReportableAttributeByEndpointId(db, endpointTypeId) {
    return dbAll(db, `SELECT ENDPOINT_TYPE_REF, ATTRIBUTE_REF, INCLUDED, MIN_INTERVAL, MAX_INTERVAL, REPORTABLE_CHANGE FROM ENDPOINT_TYPE_REPORTABLE_ATTRIBUTE WHERE ENDPOINT_TYPE_REF = ? ORDER BY ATTRIBUTE_REF`, [endpointTypeId])
}

export function selectDeviceTypeClustersByDeviceTypeRef(db, deviceTypeRef) {
    return dbAll(db, `SELECT DEVICE_TYPE_CLUSTER_ID, DEVICE_TYPE_REF, CLUSTER_REF, CLUSTER_NAME, INCLUDE_CLIENT, INCLUDE_SERVER, LOCK_CLIENT, LOCK_SERVER FROM DEVICE_TYPE_CLUSTER WHERE DEVICE_TYPE_REF = ? ORDER BY CLUSTER_REF`, [deviceTypeRef])
}

export function selectDeviceTypeAttributesByDeviceTypeClusterRef(db, deviceTypeClusterRef) {
    return dbAll(db, `SELECT DEVICE_TYPE_CLUSTER_REF, ATTRIBUTE_REF, ATTRIBUTE_NAME FROM DEVICE_TYPE_ATTRIBUTE WHERE DEVICE_TYPE_CLUSTER_REF = ? ORDER BY ATTRIBUTE_REF`, [deviceTypeClusterRef])
}

export function selectDeviceTypeCommandsByDeviceTypeClusterRef(db, deviceTypeClusterRef) {
    return dbAll(db, `SELECT DEVICE_TYPE_CLUSTER_REF, COMMAND_REF, COMMAND_NAME FROM DEVICE_TYPE_COMMAND WHERE DEVICE_TYPE_CLUSTER_REF = ? ORDER BY COMMAND_REF`, [deviceTypeClusterRef])
}

export function selectDeviceTypeAttributesByDeviceTypeRef(db, deviceTypeRef) {
    return dbAll(db, `SELECT DEVICE_TYPE_CLUSTER.CLUSTER_REF, DEVICE_TYPE_ATTRIBUTE.DEVICE_TYPE_CLUSTER_REF, DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_REF, DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_NAME FROM DEVICE_TYPE_ATTRIBUTE, DEVICE_TYPE_CLUSTER WHERE DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF = ? AND DEVICE_TYPE_CLUSTER.DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_ATTRIBUTE.DEVICE_TYPE_CLUSTER_REF`, [deviceTypeRef])
}

export function selectDeviceTypeCommandsByDeviceTypeRef(db, deviceTypeRef) {
    return dbAll(db, `SELECT DEVICE_TYPE_CLUSTER.CLUSTER_REF, DEVICE_TYPE_COMMAND.DEVICE_TYPE_CLUSTER_REF, DEVICE_TYPE_COMMAND.COMMAND_REF, DEVICE_TYPE_COMMAND.COMMAND_NAME FROM DEVICE_TYPE_COMMAND, DEVICE_TYPE_CLUSTER WHERE DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF = ? AND DEVICE_TYPE_CLUSTER.DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_COMMAND.DEVICE_TYPE_CLUSTER_REF`, [deviceTypeRef])
}

/**
 * Inserts clusters into the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data an array of objects that must contain: code, name, description, define. It also contains commands: and attributes:
 * @returns Promise of cluster insertion.
 */
export function insertClusters(db, packageId, data) {
    return dbMultiInsert(db, "INSERT INTO CLUSTER (PACKAGE_REF, CODE, NAME, DESCRIPTION, DEFINE) VALUES (?, ?, ?, ?, ?)", data.map(cluster => [packageId, cluster.code, cluster.name, cluster.description, cluster.define]))
        .then(lastIdsArray => {
            var commandsToLoad = []
            var attributesToLoad = []
            var argsForCommands = []
            var argsToLoad = []
            var i
            for (i = 0; i < lastIdsArray.length; i++) {
                var lastId = lastIdsArray[i]
                if ('commands' in data[i]) {
                    var commands = data[i].commands
                    commandsToLoad.push(...commands.map(command => [lastId, command.code, command.name, command.description, command.source, command.isOptional]))
                    argsForCommands.push(...commands.map(command => command.args))
                }
                if ('attributes' in data[i]) {
                    var attributes = data[i].attributes
                    attributesToLoad.push(...attributes.map(attribute => [
                        lastId,
                        attribute.code,
                        attribute.name,
                        attribute.type,
                        attribute.side,
                        attribute.define,
                        attribute.min,
                        attribute.max,
                        attribute.isWritable,
                        attribute.defaultValue,
                        attribute.isOptional,
                        attribute.isReportable
                    ]))
                }
            }
            var pCommand = dbMultiInsert(db,
                "INSERT INTO COMMAND (CLUSTER_REF, CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL) VALUES (?,?,?,?,?,?)",
                commandsToLoad).then(lids => {
                    var i
                    for (i = 0; i < lids.length; i++) {
                        var lastId = lids[i]
                        var args = argsForCommands[i]
                        if (args != undefined && args != null) {
                            argsToLoad.push(...args.map(arg => [lastId, arg.name, arg.type, arg.isArray]))
                        }
                    }
                    return dbMultiInsert(db,
                        "INSERT INTO COMMAND_ARG (COMMAND_REF, NAME, TYPE, IS_ARRAY) VALUES (?,?,?,?)",
                        argsToLoad)
                })
            var pAttribute = dbMultiInsert(db,
                "INSERT INTO ATTRIBUTE (CLUSTER_REF, CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL, IS_REPORTABLE) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                attributesToLoad)
            return Promise.all([pCommand, pAttribute])
        })
}

/**
 * Inserts device types into the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data an array of objects that must contain: code, name, description
 * @returns Promise of an insertion of device types.
 */
export function insertDeviceTypes(db, packageId, data) {
    return dbMultiInsert(db, "INSERT INTO DEVICE_TYPE (PACKAGE_REF, CODE, PROFILE_ID, NAME, DESCRIPTION) VALUES (?, ?, ?, ?, ?)", data.map(dt => {
        return [packageId, dt.code, dt.profileId, dt.name, dt.description]
    })).then(lastIdsArray => {
        var i
        var itemsToLoad = []
        for (i = 0; i < lastIdsArray.length; i++) {
            if ('clusters' in data[i]) {
                var lastId = lastIdsArray[i]
                var clusters = data[i].clusters
                // This is an array that links the generated deviceTyepRef to the cluster via generating an array of arrays, 
                var zclIdsPromises = Promise.all(clusters.map( cluster => {
                    return dbInsert(db, 
                                'INSERT INTO DEVICE_TYPE_CLUSTER (DEVICE_TYPE_REF, CLUSTER_NAME, INCLUDE_CLIENT, INCLUDE_SERVER, LOCK_CLIENT, LOCK_SERVER) VALUES (?,?,?,?,?,?)',
                                [lastId, cluster.clusterName, cluster.client, cluster.server, cluster.clientLocked, cluster.serverLocked],
                                true).then( deviceTypeClusterRef => {
                                    return   {
                                                dtClusterRef: deviceTypeClusterRef, 
                                                clusterData: cluster
                                            }
                                })
                }))

                zclIdsPromises.then(dtClusterRefDataPairs => {
                    insertDeviceTypeAttributes(db, dtClusterRefDataPairs)
                    insertDeviceTypeCommands(db, dtClusterRefDataPairs)
                })
            }
        }
        return zclIdsPromises
    })
}

/**
 * This handles the loading of device type attribute requirements into the database. 
 * There is a need to post-process to attach the actual attribute ref after the fact
 * @param {*} db 
 * @param {*} dtClusterRefDataPairs 
 */
export function insertDeviceTypeAttributes(db, dtClusterRefDataPairs) {
    var attributes = []
    dtClusterRefDataPairs.map(dtClusterRefDataPair => {
        var dtClusterRef = dtClusterRefDataPair.dtClusterRef
        var clusterData = dtClusterRefDataPair.clusterData
        if ( 'requiredAttributes' in clusterData) {
            clusterData.requiredAttributes.forEach(attributeName => {
                attributes.push([dtClusterRef, attributeName])
            })
        }
    })
    return dbMultiInsert(db, 'INSERT INTO DEVICE_TYPE_ATTRIBUTE (DEVICE_TYPE_CLUSTER_REF, ATTRIBUTE_NAME) VALUES (?, ?)',
                            attributes)
}

/**
 * This handles the loading of device type command requirements into the database. 
 * There is a need to post-process to attach the actual command ref after the fact
 * @param {*} db 
 * @param {*} dtClusterRefDataPairs 
 */
export function insertDeviceTypeCommands(db, dtClusterRefDataPairs) {
    var commands= []
    dtClusterRefDataPairs.map(dtClusterRefDataPair => {
        var dtClusterRef = dtClusterRefDataPair.dtClusterRef
        var clusterData = dtClusterRefDataPair.clusterData
        if ( 'requiredCommands' in clusterData) {
            clusterData.requiredCommands.forEach(commandName => {
                commands.push([dtClusterRef, commandName])
            })
        }
    })
    return dbMultiInsert(db, 'INSERT INTO DEVICE_TYPE_COMMAND (DEVICE_TYPE_CLUSTER_REF, COMMAND_NAME) VALUES (?, ?)',
                            commands)
}

export function updateClusterReferencesForDeviceTypeClusters(db) {
    return dbUpdate(db, 'UPDATE DEVICE_TYPE_CLUSTER SET CLUSTER_REF = (SELECT CLUSTER.CLUSTER_ID FROM CLUSTER WHERE lower(CLUSTER.NAME) = lower(DEVICE_TYPE_CLUSTER.CLUSTER_NAME))', [])
}

export function updateAttributeReferencesForDeviceTypeReferences(db) {
    return dbUpdate(db, 'UPDATE DEVICE_TYPE_ATTRIBUTE SET ATTRIBUTE_REF = (SELECT ATTRIBUTE.ATTRIBUTE_ID FROM ATTRIBUTE WHERE upper(ATTRIBUTE.DEFINE) = upper(DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_NAME))', [])
}

export function updateCommandReferencesForDeviceTypeReferences(db) {
    return dbUpdate(db, 'UPDATE DEVICE_TYPE_COMMAND SET COMMAND_REF = (SELECT COMMAND.COMMAND_ID FROM COMMAND WHERE upper(COMMAND.NAME) = upper(DEVICE_TYPE_COMMAND.COMMAND_NAME))', [])
}

/**
 *
 * Inserts domains into the database.
 * data is an array of objects that must contain: name
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 * @returns A promise that resolves with an array of rowids of all inserted domains.
 */
export function insertDomains(db, packageId, data) {
    return dbMultiInsert(db, "INSERT INTO DOMAIN (PACKAGE_REF, NAME) VALUES (?, ?)", data.map(domain => {
        return [packageId, domain.name]
    }))
}

/**
 *
 * Inserts structs into the database.
 * data is an array of objects that must contain: name
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 * @returns A promise that resolves with an array of struct item rowids.
 */
export function insertStructs(db, packageId, data) {
    return dbMultiInsert(db, "INSERT INTO STRUCT (PACKAGE_REF, NAME) VALUES (?, ?)", data.map(struct => {
        return [packageId, struct.name]
    })).then(lastIdsArray => {
        var i
        var itemsToLoad = []
        for (i = 0; i < lastIdsArray.length; i++) {
            if ('items' in data[i]) {
                var lastId = lastIdsArray[i]
                var items = data[i].items
                itemsToLoad.push(...items.map(item => [lastId, item.name, item.type]))
            }
        }
        return dbMultiInsert(db,
            "INSERT INTO STRUCT_ITEM (STRUCT_REF, NAME, TYPE) VALUES (?,?,?)",
            itemsToLoad)
    })
}

/**
 * Inserts enums into the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data an array of objects that must contain: name, type
 * @returns A promise of enum insertion.
 */
export function insertEnums(db, packageId, data) {
    return dbMultiInsert(db, "INSERT INTO ENUM (PACKAGE_REF, NAME, TYPE) VALUES (?, ?, ?)", data.map(en => {
        return [packageId, en.name, en.type]
    })).then(lastIdsArray => {
        var i
        var itemsToLoad = []
        for (i = 0; i < lastIdsArray.length; i++) {
            if ('items' in data[i]) {
                var lastId = lastIdsArray[i]
                var items = data[i].items
                itemsToLoad.push(...items.map(item => [lastId, item.name, item.value]))
            }
        }
        return dbMultiInsert(db,
            "INSERT INTO ENUM_ITEM (ENUM_REF, NAME, VALUE) VALUES (?, ?, ?)",
            itemsToLoad)
    })
}

/**
 * Inserts bitmaps into the database. Data is an array of objects that must contain: name, type
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data Array of object containing 'name' and 'type'.
 * @returns A promise of bitmap insertions.
 */
export function insertBitmaps(db, packageId, data) {
    return dbMultiInsert(db, "INSERT INTO BITMAP (PACKAGE_REF, NAME, TYPE) VALUES (?, ?, ?)", data.map(bm => [packageId, bm.name, bm.type]))
        .then(lastIdsArray => {
            var i
            var fieldsToLoad = []
            for (i = 0; i < lastIdsArray.length; i++) {
                if ('fields' in data[i]) {
                    var lastId = lastIdsArray[i]
                    var fields = data[i].fields
                    fieldsToLoad.push(...fields.map(field => [lastId, field.name, field.mask]))
                }
            }
            return dbMultiInsert(db,
                "INSERT INTO BITMAP_FIELD (BITMAP_REF, NAME, MASK) VALUES (?, ?, ?)",
                fieldsToLoad)
        })
}

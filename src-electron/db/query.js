// Copyright (c) 2020 Silicon Labs. All rights reserved.

/** 
 * Contains all the application queries.
 * 
 * @module JS API: database queries
 */
import { dbAll, dbGet, dbInsert, dbMultiInsert, dbRemove, dbUpdate } from './db-api.js'


export function forPathCrc(db, path, crcCallback, noneCallback) {
    dbGet(db, "SELECT PACKAGE_ID, PATH, CRC FROM PACKAGE WHERE PATH = ?", [path]).then(row => {
        if (row == null) {
            noneCallback()
        } else {
            crcCallback(row.CRC, row.PACKAGE_ID)
        }
    })
}

export function getPathCrc(db, path) {
    return dbGet(db, "SELECT CRC FROM PACKAGE WHERE PATH = ?", [path]).then(row => new Promise((resolve, reject) => {
        if (row == null) {
            resolve(null)
        } else {
            resolve(row.CRC)
        }
    }))
}
export function insertPathCrc(db, path, crc) {
    return dbInsert(db, "INSERT INTO PACKAGE ( PATH, CRC ) VALUES (?, ?)", [path, crc])
}

export function updatePathCrc(db, path, crc) {
    return dbInsert(db, "UPDATE PACKAGE SET CRC = ? WHERE PATH = ?", [path, crc])
}

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

export function selectAllBitmaps(db) {
    return dbAll(db, 'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP ORDER BY NAME', [])
}

export function selectAllBitmapFields(db) {
    return dbAll(db, 'SELECT NAME, MASK, BITMAP_REF FROM BITMAP_FIELD ORDER BY NAME', [])
}

export function selectBitmapById(db, id) {
    return dbGet(db, 'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP WHERE BITMAP_ID = ? ORDER BY NAME', [id])
}

export function selectAllDomains(db) {
    return dbAll(db, 'SELECT DOMAIN_ID, NAME FROM DOMAIN ORDER BY NAME', [])
}

export function selectDomainById(db, id) {
    return dbGet(db, 'SELECT DOMAIN_ID, NAME FROM DOMAIN WHERE DOMAIN_ID = ? ORDER BY NAME', [id])
}

export function selectAllStructs(db) {
    return dbAll(db, 'SELECT STRUCT_ID, NAME FROM STRUCT ORDER BY NAME', [])
}

export function selectStructById(db, id) {
    return dbGet(db, 'SELECT STRUCT_ID, NAME FROM STRUCT WHERE STRUCT_ID = ? ORDER BY NAME', [id])
}

export function selectAllClusters(db) {
    return dbAll(db, 'SELECT CLUSTER_ID, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, DEFINE FROM CLUSTER ORDER BY CODE', [])
}

export function selectClusterById(db, id) {
    return dbGet(db, 'SELECT CLUSTER_ID, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION FROM CLUSTER WHERE CLUSTER_ID = ?', [id])
}

export function selectAllDeviceTypes(db) {
    return dbAll(db, 'SELECT DEVICE_TYPE_ID, CODE, PROFILE_ID, NAME, DESCRIPTION FROM DEVICE_TYPE ORDER BY CODE', [])
}

export function selectDeviceTypeById(db, id) {
    return dbGet(db, 'SELECT DEVICE_TYPE_ID, CODE, PROFILE_ID, NAME, DESCRIPTION FROM DEVICE_TYPE WHERE DEVICE_TYPE_ID = ?', [id])
}

export function selectCountFrom(db, table) {
    return dbGet(db, `SELECT COUNT(*) FROM ${table}`).then(x => x['COUNT(*)'])
}

export function selectAttributesByClusterId(db, clusterId) {
    return dbAll(db, `SELECT ATTRIBUTE_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL FROM ATTRIBUTE WHERE CLUSTER_REF = ? ORDER BY CODE`, [clusterId])
}

export function selectCommandsByClusterId(db, clusterId) {
    return dbAll(db, `SELECT COMMAND_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL FROM COMMAND WHERE CLUSTER_REF = ? ORDER BY CODE`, [clusterId])
}


// Inserts clusters into the database.
// data is an array of objects that must contain: code, name, description, define
// It also contains commands: and attributes:
//
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
                        attribute.isOptional
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
                "INSERT INTO ATTRIBUTE (CLUSTER_REF, CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                attributesToLoad)
            return Promise.all([pCommand, pAttribute])
        })
}

// Inserts device types into the database.
// data is an array of objects that must contain: code, name, description
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
                itemsToLoad.push(...clusters.map(cluster => [lastId, cluster.clusterName, cluster.client, cluster.server, cluster.clientLocked, cluster.serverLocked]))
            }
        }
        return dbMultiInsert(db,
            'INSERT INTO DEVICE_TYPE_CLUSTER (DEVICE_TYPE_REF, CLUSTER_NAME, INCLUDE_CLIENT, INCLUDE_SERVER, LOCK_CLIENT, LOCK_SERVER) VALUES (?,?,?,?,?,?)',
            itemsToLoad)
    })
}

export function updateClusterReferencesForDeviceTypeClusters(db) {
    return dbUpdate(db, 'UPDATE DEVICE_TYPE_CLUSTER SET CLUSTER_REF = (SELECT CLUSTER.CLUSTER_ID FROM CLUSTER WHERE CLUSTER.NAME = DEVICE_TYPE_CLUSTER.CLUSTER_NAME)', [])
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

// Inserts enums into the database.
// data is an array of objects that must contain: name, type
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

/************************** SESSION QUERIES *************************************/

/**
 * Promises to delete a session from the database, including all the rows that have the session as a foreign key.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns A promise of a removal of session.
 */
export function deleteSession(db, sessionId) {
    return dbRemove(db, "DELETE FROM SESSION WHERE SESSION_ID = ?", [sessionId])
}

/**
 * Promises to update or insert a key/value pair in SESSION_KEY_VALUE table.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} key
 * @param {*} value
 * @returns A promise of creating or updating a row, resolves with the rowid of a new row.
 */
export function updateKeyValue(db, sessionId, key, value) {
    return dbInsert(db, "INSERT OR REPLACE INTO SESSION_KEY_VALUE (SESSION_REF, KEY, VALUE) VALUES (?,?,?)", [sessionId, key, value])
}
/**
 * Promises to update the cluster include/exclude state.
 *
 * @export
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusterId
 * @param {*} side 
 * @param {*} enabled
 * @returns Promise to update the cluster exclude/include state.
 */
export function insertOrReplaceClusterState(db, endpointTypeId, clusterId, side, enabled) {
    return dbInsert(db, "INSERT OR REPLACE INTO ENDPOINT_TYPE_CLUSTER ( ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE, ENABLED ) VALUES ( ?, ?, ?, ?)", [endpointTypeId, clusterId, side, enabled])
}

/*
  Resolves into all the cluster states.
*/
export function getAllEndpointTypeClusterState(db, endpointTypeId) {
    return dbAll(db, "SELECT CLUSTER.NAME, CLUSTER.CODE, CLUSTER.MANUFACTURER_CODE, ENDPOINT_TYPE_CLUSTER.SIDE, ENDPOINT_TYPE_CLUSTER.ENABLED FROM ENDPOINT_TYPE_CLUSTER INNER JOIN CLUSTER WHERE ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID AND ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ?", [endpointTypeId])
        .then((rows) => new Promise((resolve, reject) => {
            if (rows == null) {
                resolve([])
            } else {
                var result = rows.map(row => {
                    var obj = {
                        clusterName: row.NAME,
                        clusterCode: row.CODE,
                        side: row.SIDE,
                        enabled: (row.STATE == '1')
                    }
                    if (row.MANUFACTURER_CODE != null)
                        obj.manufacturerCode = row.MANUFACTURER_CODE;
                    return obj
                })
                resolve(result)
            }
        }))
}

/**
* Promises to add an endpoint. 
*
* @export
* @param {*} db
* @param {*} sessionId
* @param {*} endpointId
* @param {*} endpointTypeRef
* @param {*} networkId
* @returns Promise to update endpoints. 
*/
export function insertEndpoint(db, sessionId, endpointId, endpointTypeRef, networkId) {
    return dbInsert(db, "INSERT OR REPLACE INTO ENDPOINT ( SESSION_REF, ENDPOINT_ID, ENDPOINT_TYPE_REF, NETWORK_ID ) VALUES ( ?, ?, ?, ?)", [sessionId, endpointId, endpointTypeRef, networkId])
}

/**
 * Deletes an endpoint.
 *
 * @export
 * @param {*} db
 * @param {*} id
 * @returns Promise to delete an endpoint that resolves with the number of rows that were deleted.
 */
export function deleteEndpoint(db, id) {
    return dbRemove(db, "DELETE FROM ENDPOINT WHERE ENDPOINT_REF = ?", [id])
}

/**
* Promises to add an endpoint type. 
*
* @export
* @param {*} db
* @param {*} sessionId
* @param {*} name
* @param {*} deviceTypeRef
* @returns Promise to update endpoints. 
*/
export function insertEndpointType(db, sessionId, name, deviceTypeRef) {
    return dbInsert(db, "INSERT OR REPLACE INTO ENDPOINT_TYPE ( SESSION_REF, NAME, DEVICE_TYPE_REF ) VALUES ( ?, ?, ?)", [sessionId, name, deviceTypeRef])
}

/**
 * Promise to delete an endpoint type. 
 * @param {*} db 
 * @param {*} sessionId 
 * @param {*} id 
 */

export function deleteEndpointType(db, id) {
    return dbRemove(db, "DELETE FROM ENDPOINT_TYPE WHERE ENDPOINT_TYPE_ID = ?", [id])
}



/**
 * Resolves to an array of objects that contain 'key' and 'value'
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise to retrieve all session key values.
 */
export function getAllSesionKeyValues(db, sessionId) {
    return dbAll(db, "SELECT KEY, VALUE FROM SESSION_KEY_VALUE WHERE SESSION_REF = ? ORDER BY KEY", [sessionId])
        .then((rows) => new Promise((resolve, reject) => {
            if (rows == null) {
                resolve([])
            } else {
                var result = rows.map(row => {
                    return {
                        key: row.KEY,
                        value: row.VALUE
                    }
                })
                resolve(result)
            }
        }))
}
/**
 * Resolves to an array of endpoint types.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise to retrieve all endpoint types.
 */
export function getAllEndpointTypes(db, sessionId) {
    return dbAll(db, "SELECT NAME, DEVICE_TYPE_REF FROM ENDPOINT_TYPE WHERE SESSION_REF = ? ORDER BY NAME", [sessionId])
        .then((rows) => new Promise((resolve, reject) => {
            if (rows == null) {
                resolve([])
            } else {
                var result = rows.map(rows => {
                    return {
                        name: row.NAME
                    }
                })
                resolve(result)
            }
        }))
}

/**
 * Returns a promise that resolves into an array of objects containing 'sessionId', 'sessionKey' and 'creationTime'.
 *
 * @export
 * @param {*} db
 * @returns A promise of executing a query.
 */
export function getAllSessions(db) {
    return dbAll(db, "SELECT SESSION_ID, SESSION_KEY, CREATION_TIME FROM SESSION", [])
        .then(rows => {
            if (rows == null) {
                reject()
            } else {
                var map = rows.map(row => {
                    return {
                        sessionId: row.SESSION_ID,
                        sessionKey: row.SESSION_KEY,
                        creationTime: row.CREATION_TIME
                    }
                })
                return Promise.resolve(map)
            }
        })
}

export function setSessionClean(db, sessionId) {
    return dbUpdate(db, "UPDATE SESSION SET DIRTY = ? WHERE SESSION_ID = ?", [0, sessionId])
}
/**
 * Resolves with true or false, depending whether this session is dirty.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns A promise that resolves into true or false, reflecting session dirty state.
 */
export function getSessionDirtyFlag(db, sessionId) {
    return dbGet(db, "SELECT DIRTY FROM SESSION WHERE SESSION_ID = ?", [sessionId])
        .then(row => {
            if ( row == null ) {
                reject()
            } else {
                return Promise.resolve(row.DIRTY)
            }
        })
}

export function getSessionIdFromWindowdId(db, windowId) {
    return dbGet(db, "SELECT SESSION_ID, SESSION_KEY, CREATION_TIME FROM SESSION WHERE SESSION_WINID = ?", [windowId])
        .then(row => {
            if (row == null) {
                reject()
            } else {
                return Promise.resolve({
                    sessionId: row.SESSION_ID,
                    sessionKey: row.SESSION_KEY,
                    creationTime: row.CREATION_TIME
                })
            }
        })
}

export function ensureZapSessionId(db, sessionKey, windowId) {
    return dbGet(db, "SELECT SESSION_ID FROM SESSION WHERE SESSION_KEY = ?", [sessionKey])
        .then(row => {
            if (row == null) {
                return dbInsert(db, "INSERT INTO SESSION (SESSION_KEY, SESSION_WINID, CREATION_TIME) VALUES (?,?,?)", [sessionKey, windowId, Date.now()])
            } else {
                return Promise.resolve(row.SESSION_ID)
            }
        })
}


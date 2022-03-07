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
 * This module provides queries for ZCL loading
 *
 * @module DB API: zcl loading queries
 */
const { size } = require('underscore')
const env = require('../util/env')
const dbApi = require('./db-api.js')

// Some loading queries that are reused few times.

const INSERT_CLUSTER_QUERY = `
INSERT INTO CLUSTER (
  PACKAGE_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  DEFINE,
  DOMAIN_NAME,
  IS_SINGLETON,
  REVISION,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?,
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?)
)
`

const INSERT_EVENT_QUERY = `
INSERT INTO EVENT (
  CLUSTER_REF,
  PACKAGE_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  SIDE,
  IS_OPTIONAL,
  PRIORITY,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?,
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?)
)
`
const INSERT_EVENT_FIELD_QUERY = `
INSERT INTO EVENT_FIELD (
  EVENT_REF,
  FIELD_IDENTIFIER,
  NAME,
  TYPE,
  IS_ARRAY,
  IS_NULLABLE,
  IS_OPTIONAL,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF
) VALUES (
  ?, ?, ?, ?, ?, ?, ?,
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?)
)
`
const INSERT_COMMAND_QUERY = `
INSERT INTO COMMAND (
  CLUSTER_REF,
  PACKAGE_REF,
  CODE,
  NAME,
  DESCRIPTION,
  SOURCE,
  IS_OPTIONAL,
  MUST_USE_TIMED_INVOKE,
  RESPONSE_NAME,
  MANUFACTURER_CODE,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?)
)`

const INSERT_COMMAND_ARG_QUERY = `
INSERT INTO COMMAND_ARG (
  COMMAND_REF,
  NAME,
  TYPE,
  IS_ARRAY,
  PRESENT_IF,
  IS_NULLABLE,
  IS_OPTIONAL,
  COUNT_ARG,
  FIELD_IDENTIFIER,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?,
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?)
)`

const INSERT_ATTRIBUTE_QUERY = `
INSERT INTO ATTRIBUTE (
  CLUSTER_REF,
  PACKAGE_REF,
  CODE,
  NAME,
  TYPE,
  SIDE,
  DEFINE,
  MIN,
  MAX,
  MIN_LENGTH,
  MAX_LENGTH,
  REPORT_MIN_INTERVAL,
  REPORT_MAX_INTERVAL,
  REPORTABLE_CHANGE,
  REPORTABLE_CHANGE_LENGTH,
  IS_WRITABLE,
  DEFAULT_VALUE,
  IS_OPTIONAL,
  REPORTING_POLICY,
  STORAGE_POLICY,
  IS_NULLABLE,
  IS_SCENE_REQUIRED,
  ARRAY_TYPE,
  MUST_USE_TIMED_WRITE,
  MANUFACTURER_CODE,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?)
)`

function attributeMap(clusterId, packageId, attributes) {
  return attributes.map((attribute) => [
    clusterId,
    packageId,
    attribute.code,
    attribute.name,
    attribute.type,
    attribute.side,
    attribute.define,
    attribute.min,
    attribute.max,
    attribute.minLength,
    attribute.maxLength,
    attribute.reportMinInterval,
    attribute.reportMaxInterval,
    attribute.reportableChange,
    attribute.reportableChangeLength,
    attribute.isWritable,
    attribute.defaultValue,
    dbApi.toDbBool(attribute.isOptional),
    attribute.reportingPolicy,
    attribute.storagePolicy,
    dbApi.toDbBool(attribute.isNullable),
    dbApi.toDbBool(attribute.isSceneRequired),
    attribute.entryType,
    dbApi.toDbBool(attribute.mustUseTimedWrite),
    attribute.manufacturerCode,
    attribute.introducedIn,
    packageId,
    attribute.removedIn,
    packageId,
  ])
}

function eventMap(clusterId, packageId, events) {
  return events.map((event) => [
    clusterId,
    packageId,
    event.code,
    event.manufacturerCode,
    event.name,
    event.description,
    event.side,
    dbApi.toDbBool(event.isOptional),
    event.priority,
    event.introducedIn,
    packageId,
    event.removedIn,
    packageId,
  ])
}

function commandMap(clusterId, packageId, commands) {
  return commands.map((command) => [
    clusterId,
    packageId,
    command.code,
    command.name,
    command.description,
    command.source,
    dbApi.toDbBool(command.isOptional),
    dbApi.toDbBool(command.mustUseTimedInvoke),
    command.responseName,
    command.manufacturerCode,
    command.introducedIn,
    packageId,
    command.removedIn,
    packageId,
  ])
}

function fieldMap(eventId, packageId, fields) {
  return fields.map((field) => [
    eventId,
    field.fieldIdentifier,
    field.name,
    field.type,
    dbApi.toDbBool(field.isArray),
    dbApi.toDbBool(field.isNullable),
    dbApi.toDbBool(field.isOptional),
    field.introducedIn,
    packageId,
    field.removedIn,
    packageId,
  ])
}

function argMap(cmdId, packageId, args) {
  return args.map((arg) => [
    cmdId,
    arg.name,
    arg.type,
    dbApi.toDbBool(arg.isArray),
    arg.presentIf,
    dbApi.toDbBool(arg.isNullable),
    dbApi.toDbBool(arg.isOptional),
    arg.countArg,
    arg.fieldIdentifier,
    arg.introducedIn,
    packageId,
    arg.removedIn,
    packageId,
  ])
}

// access data is array of objects, containing id/op/role/modifier
async function insertAttributeAccessData(db, packageId, accessData) {
  let rowIds = await createAccessRows(db, packageId, accessData)
  let insertData = []
  for (let i = 0; i < rowIds.length; i++) {
    insertData.push([accessData[i].id, rowIds[i]])
  }

  return dbApi.dbMultiInsert(
    db,
    `INSERT INTO ATTRIBUTE_ACCESS (ATTRIBUTE_REF, ACCESS_REF) VALUES (?,?)`,
    insertData
  )
}

// access data is array of objects, containing id/op/role/modifier
async function insertCommandAccessData(db, packageId, accessData) {
  let rowIds = await createAccessRows(db, packageId, accessData)
  let insertData = []
  for (let i = 0; i < rowIds.length; i++) {
    insertData.push([accessData[i].id, rowIds[i]])
  }

  return dbApi.dbMultiInsert(
    db,
    `INSERT INTO COMMAND_ACCESS (COMMAND_REF, ACCESS_REF) VALUES (?,?)`,
    insertData
  )
}
// access data is array of objects, containing id/op/role/modifier
async function insertEventAccessData(db, packageId, accessData) {
  let rowIds = await createAccessRows(db, packageId, accessData)
  let insertData = []
  for (let i = 0; i < rowIds.length; i++) {
    insertData.push([accessData[i].id, rowIds[i]])
  }

  return dbApi.dbMultiInsert(
    db,
    `INSERT INTO EVENT_ACCESS (EVENT_REF, ACCESS_REF) VALUES (?,?)`,
    insertData
  )
}

async function insertAttributes(db, packageId, attributes) {
  let data = attributes.data
  let access = attributes.access
  if (data == null || data.length == 0) return

  let attributeIds = await dbApi.dbMultiInsert(db, INSERT_ATTRIBUTE_QUERY, data)

  let accessData = []
  for (let i = 0; i < attributeIds.length; i++) {
    let atId = attributeIds[i]
    let atAccess = access[i] // Array of accesses
    if (atAccess != null && atAccess.length > 0) {
      for (let ac of atAccess) {
        accessData.push({
          id: atId,
          op: ac.op,
          role: ac.role,
          modifier: ac.modifier,
        })
      }
    }
  }

  if (accessData.length > 0) {
    await insertAttributeAccessData(db, packageId, accessData)
  }
}

async function insertEvents(db, packageId, events) {
  let data = events.data
  let fieldData = events.fields
  let access = events.access

  if (data == null || data.length == 0) return
  let eventIds = await dbApi.dbMultiInsert(db, INSERT_EVENT_QUERY, data)
  let fieldsToLoad = []
  for (let i = 0; i < eventIds.length; i++) {
    let lastEventId = eventIds[i]
    let fields = fieldData[i]
    if (fields != undefined && fields != null) {
      fieldsToLoad.push(...fieldMap(lastEventId, packageId, fields))
    }
  }
  await dbApi.dbMultiInsert(db, INSERT_EVENT_FIELD_QUERY, fieldsToLoad)

  let accessData = []
  for (let i = 0; i < eventIds.length; i++) {
    let evId = eventIds[i]
    let evAccess = access[i] // Array of accesses
    if (evAccess != null && evAccess.length > 0) {
      for (let ac of evAccess) {
        accessData.push({
          id: evId,
          op: ac.op,
          role: ac.role,
          modifier: ac.modifier,
        })
      }
    }
  }

  if (accessData.length > 0) {
    await insertEventAccessData(db, packageId, accessData)
  }
}

async function insertCommands(db, packageId, commands) {
  let data = commands.data
  let argData = commands.args
  let access = commands.access

  if (data == null || data.length == 0) return
  let commandIds = await dbApi.dbMultiInsert(db, INSERT_COMMAND_QUERY, data)
  let argsToLoad = []
  for (let i = 0; i < commandIds.length; i++) {
    let lastCmdId = commandIds[i]
    let args = argData[i]
    if (args != undefined && args != null) {
      argsToLoad.push(...argMap(lastCmdId, packageId, args))
    }
  }
  await dbApi.dbMultiInsert(db, INSERT_COMMAND_ARG_QUERY, argsToLoad)

  let accessData = []
  for (let i = 0; i < commandIds.length; i++) {
    let cmdId = commandIds[i]
    let cmdAccess = access[i] // Array of accesses
    if (cmdAccess != null && cmdAccess.length > 0) {
      for (let ac of cmdAccess) {
        accessData.push({
          id: cmdId,
          op: ac.op,
          role: ac.role,
          modifier: ac.modifier,
        })
      }
    }
  }

  if (accessData.length > 0) {
    await insertCommandAccessData(db, packageId, accessData)
  }
}
/**
 * Inserts globals into the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 * @returns Promise of globals insertion.
 */
async function insertGlobals(db, packageId, data) {
  env.logDebug(`Insert globals: ${data.length}`)
  let commands = {
    data: [],
    args: [],
    access: [],
  }
  let attributes = {
    data: [],
    access: [],
  }
  let i
  for (i = 0; i < data.length; i++) {
    if ('commands' in data[i]) {
      let cmds = data[i].commands
      commands.data.push(...commandMap(null, packageId, cmds))
      commands.args.push(...cmds.map((command) => command.args))
    }
    if ('attributes' in data[i]) {
      let atts = data[i].attributes
      attributes.data.push(...attributeMap(null, packageId, atts))
    }
  }
  let pCommand = insertCommands(db, packageId, commands)
  let pAttribute = insertAttributes(db, packageId, attributes)
  return Promise.all([pCommand, pAttribute])
}

/**
 *  Inserts cluster extensions into the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 * @returns Promise of cluster extension insertion.
 */
async function insertClusterExtensions(db, packageId, knownPackages, data) {
  return dbApi
    .dbMultiSelect(
      db,
      `SELECT CLUSTER_ID FROM CLUSTER WHERE PACKAGE_REF IN (${knownPackages.toString()}) AND CODE = ?`,
      data.map((cluster) => [cluster.code])
    )
    .then((rows) => {
      let commands = {
        data: [],
        args: [],
        access: [],
      }
      let attributes = {
        data: [],
        access: [],
      }
      let i, lastId
      for (i = 0; i < rows.length; i++) {
        let row = rows[i]
        if (row != null) {
          lastId = row.CLUSTER_ID
          if ('commands' in data[i]) {
            let cmds = data[i].commands
            commands.data.push(...commandMap(lastId, packageId, cmds))
            commands.args.push(...cmds.map((command) => command.args))
          }
          if ('attributes' in data[i]) {
            let atts = data[i].attributes
            attributes.data.push(...attributeMap(lastId, packageId, atts))
          }
        } else {
          // DANGER: We got here, but we don't have rows. Why not?
          // Because clusters at this point have not yet been created? Odd.
          env.logWarning(
            `Attempting to insert cluster extension, but the cluster was not found: ${data[i].code}`
          )
        }
      }
      let pCommand = insertCommands(db, packageId, commands)
      let pAttribute = insertAttributes(db, packageId, attributes)
      return Promise.all([pCommand, pAttribute])
    })
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
async function insertClusters(db, packageId, data) {
  // If data is extension, we only have code there and we need to simply add commands and clusters.
  // But if it's not an extension, we need to insert the cluster and then run with
  return dbApi
    .dbMultiInsert(
      db,
      INSERT_CLUSTER_QUERY,
      data.map((cluster) => {
        return [
          packageId,
          cluster.code,
          cluster.manufacturerCode,
          cluster.name,
          cluster.description,
          cluster.define,
          cluster.domain,
          cluster.isSingleton,
          cluster.revision,
          cluster.introducedIn,
          packageId,
          cluster.removedIn,
          packageId,
        ]
      })
    )
    .then((lastIdsArray) => {
      let commands = {
        data: [],
        args: [],
        access: [],
      }
      let events = {
        data: [],
        fields: [],
        access: [],
      }
      let attributes = {
        data: [],
        access: [],
      }
      let pTags = null

      let i
      for (i = 0; i < lastIdsArray.length; i++) {
        let lastId = lastIdsArray[i]
        if ('commands' in data[i]) {
          let cmds = data[i].commands
          commands.data.push(...commandMap(lastId, packageId, cmds))
          commands.args.push(...cmds.map((command) => command.args))
          commands.access.push(...cmds.map((command) => command.access))
        }
        if ('attributes' in data[i]) {
          let atts = data[i].attributes
          attributes.data.push(...attributeMap(lastId, packageId, atts))
          attributes.access.push(...atts.map((at) => at.access))
        }
        if ('events' in data[i]) {
          let evs = data[i].events
          events.data.push(...eventMap(lastId, packageId, evs))
          events.fields.push(...evs.map((event) => event.fields))
          events.access.push(...evs.map((event) => event.access))
        }
        if ('tags' in data[i]) {
          pTags = insertTags(db, packageId, data[i].tags, lastId)
        }
      }
      let pCommand = insertCommands(db, packageId, commands)
      let pAttribute = insertAttributes(db, packageId, attributes)
      let pEvent = insertEvents(db, packageId, events)
      let pArray = [pCommand, pAttribute, pEvent]
      if (pTags != null) pArray.push(pTags)
      return Promise.all(pArray)
    })
}

/**
 * Inserts tags into the database.
 * data is an array of objects, containing 'name' and 'description'
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 * @returns A promise that resolves with array of rowids.
 */
async function insertTags(db, packageId, data, clusterRef) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO TAG (PACKAGE_REF, CLUSTER_REF, NAME, DESCRIPTION) VALUES (?, ?, ?, ?)',
    data.map((tag) => [packageId, clusterRef, tag.name, tag.description])
  )
}

/**
 *
 * Inserts domains into the database.
 * data is an array of objects that must contain: name
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data Data containing name and specRef
 * @returns A promise that resolves with an array of rowids of all inserted domains.
 */
async function insertDomains(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT OR IGNORE INTO DOMAIN (PACKAGE_REF, NAME, LATEST_SPEC_REF) VALUES (?, ?, (SELECT SPEC_ID FROM SPEC WHERE PACKAGE_REF = ? AND CODE = ? ))',
    data.map((domain) => [packageId, domain.name, packageId, domain.specCode])
  )
}

/**
 * Inserts a spec into the database.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data Data contining specCode and specDescription.
 * @returns Promise of insertion.
 */
async function insertSpecs(db, packageId, data) {
  let olders = []
  data.forEach((domain) => {
    if ('older' in domain) {
      domain.older.forEach((older) => olders.push(older))
    }
  })
  if (olders.length > 0) {
    await dbApi.dbMultiInsert(
      db,
      'INSERT OR IGNORE INTO SPEC (PACKAGE_REF, CODE, DESCRIPTION, CERTIFIABLE) VALUES (?, ?, ?, ?)',
      olders.map((older) => [
        packageId,
        older.specCode,
        older.specDescription,
        older.specCertifiable ? 1 : 0,
      ])
    )
  }
  return dbApi.dbMultiInsert(
    db,
    'INSERT OR IGNORE INTO SPEC (PACKAGE_REF, CODE, DESCRIPTION, CERTIFIABLE) VALUES (?, ?, ?, ?)',
    data.map((domain) => [
      packageId,
      domain.specCode,
      domain.specDescription,
      domain.specCertifiable ? 1 : 0,
    ])
  )
}

/**
 * Inserts global attribute defaults into the database.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} clusterData array of objects that contain: code, manufacturerCode and subarrays of globalAttribute[] which contain: side, code, value
 * @returns Promise of data insertion.
 */
async function insertGlobalAttributeDefault(db, packageId, clusterData) {
  let individualClusterPromise = []
  clusterData.forEach((cluster) => {
    let args = []
    cluster.globalAttribute.forEach((ga) => {
      args.push([
        packageId,
        cluster.code,
        packageId,
        ga.code,
        ga.side,
        ga.value,
      ])
    })
    let p = dbApi
      .dbMultiInsert(
        db,
        `
    INSERT OR IGNORE INTO GLOBAL_ATTRIBUTE_DEFAULT (
      CLUSTER_REF, ATTRIBUTE_REF, DEFAULT_VALUE
    ) VALUES (
      ( SELECT CLUSTER_ID FROM CLUSTER WHERE PACKAGE_REF = ? AND CODE = ? ),
      ( SELECT ATTRIBUTE_ID FROM ATTRIBUTE WHERE PACKAGE_REF = ? AND CODE = ? AND SIDE = ? ),
      ?)
      `,
        args
      )
      .then((individualGaIds) => {
        let featureBitArgs = []
        for (let i = 0; i < individualGaIds.length; i++) {
          let id = individualGaIds[i]
          let ga = cluster.globalAttribute[i]
          if (id != null && 'featureBit' in ga) {
            ga.featureBit.forEach((fb) => {
              featureBitArgs.push([
                id,
                fb.bit,
                dbApi.toDbBool(fb.value),
                packageId,
                fb.tag,
              ])
            })
          }
        }
        if (featureBitArgs.length == 0) {
          return
        } else {
          return dbApi.dbMultiInsert(
            db,
            `
INSERT OR IGNORE INTO GLOBAL_ATTRIBUTE_BIT (
  GLOBAL_ATTRIBUTE_DEFAULT_REF,
  BIT,
  VALUE,
  TAG_REF
) VALUES (
  ?,
  ?,
  ?,
  (SELECT TAG_ID FROM TAG WHERE PACKAGE_REF = ? AND NAME = ?)
)
        `,
            featureBitArgs
          )
        }
      })
    individualClusterPromise.push(p)
  })
  return Promise.all(individualClusterPromise)
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
async function insertStructs(db, packageId, data) {
  const lastIdsArray = await dbApi.dbMultiInsert(
    db,
    'INSERT INTO STRUCT (PACKAGE_REF, NAME) VALUES (?, ?)',
    data.map((struct) => {
      return [packageId, struct.name]
    })
  )

  let clustersToLoad = []
  for (let i = 0; i < lastIdsArray.length; i++) {
    if ('clusters' in data[i]) {
      let lastId = lastIdsArray[i]
      let clusters = data[i].clusters
      clustersToLoad.push(...clusters.map((cl) => [lastId, cl]))
    }
  }
  if (clustersToLoad.length > 0)
    await dbApi.dbMultiInsert(
      db,
      `INSERT INTO STRUCT_CLUSTER ( STRUCT_REF, CLUSTER_CODE) VALUES (?,?)`,
      clustersToLoad
    )

  let itemsToLoad = []
  for (let i = 0; i < lastIdsArray.length; i++) {
    if ('items' in data[i]) {
      let lastId = lastIdsArray[i]
      let items = data[i].items
      itemsToLoad.push(
        ...items.map((item) => [
          lastId,
          item.name,
          item.type,
          item.fieldIdentifier,
          dbApi.toDbBool(item.isArray),
          dbApi.toDbBool(item.isEnum),
          item.minLength,
          item.maxLength,
          dbApi.toDbBool(item.isWritable),
          dbApi.toDbBool(item.isNullable),
          dbApi.toDbBool(item.isOptional),
          dbApi.toDbBool(item.isFabricSensitive),
        ])
      )
    }
  }

  if (itemsToLoad.length > 0)
    await dbApi.dbMultiInsert(
      db,
      `
INSERT INTO STRUCT_ITEM (
  STRUCT_REF,
  NAME,
  TYPE,
  FIELD_IDENTIFIER,
  IS_ARRAY,
  IS_ENUM,
  MIN_LENGTH,
  MAX_LENGTH,
  IS_WRITABLE,
  IS_NULLABLE,
  IS_OPTIONAL,
  IS_FABRIC_SENSITIVE
) VALUES (?,?,?,?,?,?,?,?,?,?,?, ?)`,
      itemsToLoad
    )
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
async function insertEnums(db, packageId, data) {
  const lastIdsArray = await dbApi.dbMultiInsert(
    db,
    'INSERT INTO ENUM (PACKAGE_REF, NAME, TYPE) VALUES (?, ?, ?)',
    data.map((en) => {
      return [packageId, en.name, en.type]
    })
  )

  let clustersToLoad = []
  for (let i = 0; i < lastIdsArray.length; i++) {
    if ('clusters' in data[i]) {
      let lastId = lastIdsArray[i]
      let clusters = data[i].clusters
      clustersToLoad.push(...clusters.map((cl) => [lastId, cl]))
    }
  }
  if (clustersToLoad.length > 0)
    await dbApi.dbMultiInsert(
      db,
      `INSERT INTO ENUM_CLUSTER ( ENUM_REF, CLUSTER_CODE) VALUES (?,?)`,
      clustersToLoad
    )

  let itemsToLoad = []
  for (let i = 0; i < lastIdsArray.length; i++) {
    if ('items' in data[i]) {
      let lastId = lastIdsArray[i]
      let items = data[i].items
      itemsToLoad.push(
        ...items.map((item) => [
          lastId,
          item.name,
          item.value,
          item.fieldIdentifier,
        ])
      )
    }
  }
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO ENUM_ITEM (ENUM_REF, NAME, VALUE, FIELD_IDENTIFIER) VALUES (?, ?, ?, ?)',
    itemsToLoad
  )
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
async function insertBitmaps(db, packageId, data) {
  const lastIdsArray = await dbApi.dbMultiInsert(
    db,
    'INSERT INTO BITMAP (PACKAGE_REF, NAME, TYPE) VALUES (?, ?, ?)',
    data.map((bm) => [packageId, bm.name, bm.type])
  )

  let clustersToLoad = []
  for (let i = 0; i < lastIdsArray.length; i++) {
    if ('clusters' in data[i]) {
      let lastId = lastIdsArray[i]
      let clusters = data[i].clusters
      clustersToLoad.push(...clusters.map((cl) => [lastId, cl]))
    }
  }

  if (clustersToLoad.length > 0) {
    await dbApi.dbMultiInsert(
      db,
      `INSERT INTO BITMAP_CLUSTER ( BITMAP_REF, CLUSTER_CODE) VALUES (?,?)`,
      clustersToLoad
    )
  }

  let fieldsToLoad = []
  for (let i = 0; i < lastIdsArray.length; i++) {
    if ('fields' in data[i]) {
      let lastId = lastIdsArray[i]
      let fields = data[i].fields
      fieldsToLoad.push(
        ...fields.map((field) => [
          lastId,
          field.name,
          field.mask,
          field.type,
          field.fieldIdentifier,
        ])
      )
    }
  }
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO BITMAP_FIELD (BITMAP_REF, NAME, MASK, TYPE, FIELD_IDENTIFIER) VALUES (?, ?, ?, ?, ?)',
    fieldsToLoad
  )
}

/**
 * Insert atomics into the database.
 * Data is an array of objects that must contains: name, id, description.
 * Object might also contain 'size', but possibly not.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertAtomics(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO ATOMIC (PACKAGE_REF, NAME, DESCRIPTION, ATOMIC_IDENTIFIER, ATOMIC_SIZE, IS_DISCRETE, IS_SIGNED, IS_STRING, IS_LONG, IS_CHAR) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    data.map((at) => [
      packageId,
      at.name,
      at.description,
      at.id,
      at.size,
      at.isDiscrete,
      at.isSigned,
      at.isString,
      at.isLong,
      at.isChar,
    ])
  )
}

/**
 * Inserts device types into the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data an array of objects that must contain: domain, code, profileId, name, description
 * @returns Promise of an insertion of device types.
 */
async function insertDeviceTypes(db, packageId, data) {
  return dbApi
    .dbMultiInsert(
      db,
      'INSERT INTO DEVICE_TYPE (PACKAGE_REF, DOMAIN, CODE, PROFILE_ID, NAME, DESCRIPTION) VALUES (?, ?, ?, ?, ?, ?)',
      data.map((dt) => {
        return [
          packageId,
          dt.domain,
          dt.code,
          dt.profileId,
          dt.name,
          dt.description,
        ]
      })
    )
    .then((lastIdsArray) => {
      let zclIdsPromises = []
      for (let i = 0; i < lastIdsArray.length; i++) {
        if ('clusters' in data[i]) {
          let lastId = lastIdsArray[i]
          let clusters = data[i].clusters
          // This is an array that links the generated deviceTyepRef to the cluster via generating an array of arrays,
          zclIdsPromises = Promise.all(
            clusters.map((cluster) =>
              dbApi
                .dbInsert(
                  db,
                  'INSERT INTO DEVICE_TYPE_CLUSTER (DEVICE_TYPE_REF, CLUSTER_NAME, INCLUDE_CLIENT, INCLUDE_SERVER, LOCK_CLIENT, LOCK_SERVER) VALUES (?,?,?,?,?,?)',
                  [
                    lastId,
                    cluster.clusterName,
                    cluster.client,
                    cluster.server,
                    cluster.clientLocked,
                    cluster.serverLocked,
                  ],
                  true
                )
                .then((deviceTypeClusterRef) => {
                  return {
                    dtClusterRef: deviceTypeClusterRef,
                    clusterData: cluster,
                  }
                })
            )
          ).then((dtClusterRefDataPairs) => {
            let promises = []
            promises.push(insertDeviceTypeAttributes(db, dtClusterRefDataPairs))
            promises.push(insertDeviceTypeCommands(db, dtClusterRefDataPairs))
            return Promise.all(promises)
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
async function insertDeviceTypeAttributes(db, dtClusterRefDataPairs) {
  let attributes = []
  dtClusterRefDataPairs.map((dtClusterRefDataPair) => {
    let dtClusterRef = dtClusterRefDataPair.dtClusterRef
    let clusterData = dtClusterRefDataPair.clusterData
    if ('requiredAttributes' in clusterData) {
      clusterData.requiredAttributes.forEach((attributeName) => {
        attributes.push([dtClusterRef, attributeName])
      })
    }
  })
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO DEVICE_TYPE_ATTRIBUTE (DEVICE_TYPE_CLUSTER_REF, ATTRIBUTE_NAME) VALUES (?, ?)',
    attributes
  )
}

/**
 * This handles the loading of device type command requirements into the database.
 * There is a need to post-process to attach the actual command ref after the fact
 * @param {*} db
 * @param {*} dtClusterRefDataPairs
 */
async function insertDeviceTypeCommands(db, dtClusterRefDataPairs) {
  let commands = []
  dtClusterRefDataPairs.map((dtClusterRefDataPair) => {
    let dtClusterRef = dtClusterRefDataPair.dtClusterRef
    let clusterData = dtClusterRefDataPair.clusterData
    if ('requiredCommands' in clusterData) {
      clusterData.requiredCommands.forEach((commandName) => {
        commands.push([dtClusterRef, commandName])
      })
    }
  })
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO DEVICE_TYPE_COMMAND (DEVICE_TYPE_CLUSTER_REF, COMMAND_NAME) VALUES (?, ?)',
    commands
  )
}

async function insertAccessOperations(db, packageId, operations) {
  let data = operations.map((o) => [packageId, o.name, o.description])
  return dbApi.dbMultiInsert(
    db,
    `
INSERT INTO OPERATION
  (PACKAGE_REF, NAME, DESCRIPTION)
VALUES
  (?, ?, ?)
`,
    data
  )
}

async function insertAccessRoles(db, packageId, roles) {
  let data = roles.map((r) => [packageId, r.name, r.description, r.level])
  return dbApi.dbMultiInsert(
    db,
    `
INSERT INTO ROLE
  (PACKAGE_REF, NAME, DESCRIPTION, LEVEL)
VALUES
  (?, ?, ?, ?)
`,
    data
  )
}

async function insertAccessModifiers(db, packageId, modifiers) {
  let data = modifiers.map((m) => [packageId, m.name, m.description])
  return dbApi.dbMultiInsert(
    db,
    `
INSERT INTO ACCESS_MODIFIER
  (PACKAGE_REF, NAME, DESCRIPTION)
VALUES
  (?, ?, ?)
`,
    data
  )
}

/**
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data array of objects that must have op/role/modifier
 */
async function createAccessRows(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    `
INSERT INTO ACCESS
  (OPERATION_REF, ROLE_REF, ACCESS_MODIFIER_REF)
VALUES (
  (SELECT OPERATION_ID FROM OPERATION WHERE NAME = ? AND PACKAGE_REF = ?),
  (SELECT ROLE_ID FROM ROLE WHERE NAME = ? AND PACKAGE_REF = ?),
  (SELECT ACCESS_MODIFIER_ID FROM ACCESS_MODIFIER WHERE NAME = ? AND PACKAGE_REF = ?)
)
    `,
    data.map((x) => [x.op, packageId, x.role, packageId, x.modifier, packageId])
  )
}

/**
 * Inserts a default access.
 * Default access is object that contains type and access array of {op,role,modifier}
 * @param {*} db
 * @param {*} packageId
 * @param {*} defaultAccess
 */
async function insertDefaultAccess(db, packageId, defaultAccess) {
  let ids = await createAccessRows(db, packageId, defaultAccess.access)
  return dbApi.dbMultiInsert(
    db,
    `INSERT INTO DEFAULT_ACCESS ( PACKAGE_REF, ENTITY_TYPE, ACCESS_REF) VALUES (?, ?, ?)`,
    ids.map((id) => [packageId, defaultAccess.type, id])
  )
}

async function updateEnumClusterReferences(db, packageId) {
  return dbApi.dbUpdate(
    db,
    `
UPDATE
  ENUM_CLUSTER
SET
  CLUSTER_REF =
  (
    SELECT
      CLUSTER_ID
    FROM
      CLUSTER
    WHERE
      CLUSTER.CODE = ENUM_CLUSTER.CLUSTER_CODE
    AND
      CLUSTER.PACKAGE_REF = ?
  )
WHERE
  ( SELECT PACKAGE_REF
    FROM ENUM
    WHERE ENUM.ENUM_ID = ENUM_CLUSTER.ENUM_REF
  ) = ?
  
`,
    [packageId, packageId]
  )
}

async function updateStructClusterReferences(db, packageId) {
  return dbApi.dbUpdate(
    db,
    `
UPDATE
  STRUCT_CLUSTER
SET
  CLUSTER_REF =
  (
    SELECT
      CLUSTER_ID
    FROM
      CLUSTER
    WHERE
      CLUSTER.CODE = STRUCT_CLUSTER.CLUSTER_CODE
    AND
      CLUSTER.PACKAGE_REF = ?
  )
WHERE
  (
    SELECT PACKAGE_REF
    FROM STRUCT
    WHERE STRUCT.STRUCT_ID = STRUCT_CLUSTER.STRUCT_REF
  ) = ?
`,
    [packageId, packageId]
  )
}

async function updateBitmapClusterReferences(db, packageId) {
  return dbApi.dbUpdate(
    db,
    `
UPDATE
  BITMAP_CLUSTER
SET
  CLUSTER_REF =
  (
    SELECT
      CLUSTER_ID
    FROM
      CLUSTER
    WHERE
      CLUSTER.CODE = BITMAP_CLUSTER.CLUSTER_CODE
    AND
      CLUSTER.PACKAGE_REF = ?
  )
WHERE
  (
    SELECT PACKAGE_REF
    FROM BITMAP
    WHERE BITMAP.BITMAP_ID = BITMAP_CLUSTER.BITMAP_REF
  ) = ?
`,
    [packageId, packageId]
  )
}

/**
 * Post loading actions.
 *
 * @param {*} db
 * @param {*} packageId
 */
async function updateStaticEntityReferences(db, packageId) {
  await updateEnumClusterReferences(db, packageId)
  await updateStructClusterReferences(db, packageId)
  await updateBitmapClusterReferences(db, packageId)
}

/**
 * Insert Data Type Discriminator into the database.
 * Data is all the data types that can exist with name and whether the type is
 * a baseline data type or not
 * for eg
 * If we have a type called 16BitNumber which is a UINT_16(Actual representation
 * of 16 Bit unsigned integere) then 16BitNumber is not a baseline data type but
 * UINT_16 is base line data type.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertDataTypeDiscriminator(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO DISCRIMINATOR (PACKAGE_REF, NAME) VALUES (?, ?)',
    data.map((at) => [packageId, at.name])
  )
}

/**
 * Insert all Data Types into the database.
 * data is a certain data type and it is inserted into the data type table based
 * on the type of data
 *
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertDataType(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO DATA_TYPE ( CLUSTER_REF, PACKAGE_REF, NAME, DESCRIPTION, CLUSTER_CODE, DISCRIMINATOR_REF) VALUES ( (SELECT CLUSTER_ID FROM CLUSTER WHERE CODE IS ? AND PACKAGE_REF=?), ?, ?, ?, ?, ? )',
    data.map((at) => [
      at.cluster_code,
      packageId,
      packageId,
      at.name,
      at.description,
      at.cluster_code,
      at.discriminator_ref,
    ])
  )
}

/**
 * Insert all Numbers into the Number Table.
 *
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertNumber(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO NUMBER ( NUMBER_ID, SIZE, IS_SIGNED) VALUES ( (SELECT DATA_TYPE_ID FROM DATA_TYPE WHERE PACKAGE_REF = ? AND NAME = ?), ?, ? )',
    data.map((at) => [packageId, at.name, at.size, at.is_signed])
  )
}

/**
 * Insert all Strings into the String Table.
 *
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertString(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO STRING ( STRING_ID, IS_LONG, SIZE, IS_CHAR) VALUES ( (SELECT DATA_TYPE_ID FROM DATA_TYPE WHERE PACKAGE_REF = ? AND NAME = ?), ?, ?, ? )',
    data.map((at) => [packageId, at.name, at.is_long, at.size, at.is_char])
  )
}

/**
 * Insert all Baseline Enums into the Enum Table.
 * Baseline enums are enums such as ENUM8, ENUM16 defined in the xml files
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertEnum2Atomic(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO ENUM_2 ( ENUM_ID, SIZE) VALUES ( (SELECT DATA_TYPE_ID FROM DATA_TYPE WHERE PACKAGE_REF = ? AND NAME = ? AND CLUSTER_CODE IS ?), ?)',
    data.map((at) => [packageId, at.name, at.cluster_code, at.size])
  )
}

/**
 * Insert all Enums into the Enum Table.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertEnum2(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO ENUM_2 ( ENUM_ID, SIZE) VALUES ( (SELECT DATA_TYPE_ID FROM DATA_TYPE WHERE PACKAGE_REF = ? AND NAME = ? AND CLUSTER_CODE IS ?), (SELECT CASE   WHEN ((SELECT SIZE FROM ENUM_2 INNER JOIN DATA_TYPE ON ENUM_2.ENUM_ID = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ? AND DATA_TYPE.CLUSTER_CODE= ?) IS NULL ) THEN    (SELECT SIZE FROM ENUM_2 INNER JOIN DATA_TYPE ON ENUM_2.ENUM_ID = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ?) ELSE (SELECT SIZE FROM ENUM_2 INNER JOIN DATA_TYPE ON ENUM_2.ENUM_ID = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ? AND DATA_TYPE.CLUSTER_CODE=?) END AS SIZE))',
    data.map((at) => [
      packageId,
      at.name,
      at.cluster_code,
      packageId,
      at.type,
      at.cluster_code,
      packageId,
      at.type,
      packageId,
      at.type,
      at.cluster_code,
    ])
  )
}

/**
 * Insert all Enum Items into the Enum Item Table.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertEnum2Items(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO ENUM_ITEM_2 ( ENUM_REF, NAME, VALUE, FIELD_IDENTIFIER) VALUES ( (SELECT ENUM_ID FROM ENUM_2 INNER JOIN DATA_TYPE ON ENUM_2.ENUM_ID = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ? AND DATA_TYPE.CLUSTER_CODE IS ?), ?, ?, ?)',
    data.map((at) => [
      packageId,
      at.enumName,
      at.enumClusterCode,
      at.name,
      at.value,
      at.fieldIdentifier,
    ])
  )
}

/**
 * Insert all Baseline Bitmaps into the Bitmap Table.
 * Baseline bitmaps are bitmaps such as BITMAP8, BITMAP16 defined in the xml files
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertBitmap2Atomic(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO BITMAP_2 ( BITMAP_ID, SIZE) VALUES ( (SELECT DATA_TYPE_ID FROM DATA_TYPE WHERE PACKAGE_REF = ? AND NAME = ? AND CLUSTER_CODE IS ?), ?)',
    data.map((at) => [packageId, at.name, at.cluster_code, at.size])
  )
}

/**
 * Insert all Bitmaps into the Bitmap Table.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertBitmap2(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO BITMAP_2 ( BITMAP_ID, SIZE) VALUES ( (SELECT DATA_TYPE_ID FROM DATA_TYPE WHERE PACKAGE_REF = ? AND NAME = ? AND CLUSTER_CODE IS ?), (SELECT CASE WHEN ((SELECT SIZE FROM BITMAP_2 INNER JOIN DATA_TYPE ON BITMAP_2.BITMAP_ID = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ? AND DATA_TYPE.CLUSTER_CODE= ?) IS NULL ) THEN    (SELECT SIZE FROM BITMAP_2  INNER JOIN DATA_TYPE ON BITMAP_2.BITMAP_ID  = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ?) ELSE (SELECT SIZE FROM BITMAP_2 INNER JOIN DATA_TYPE ON BITMAP_2.BITMAP_ID  = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ? AND DATA_TYPE.CLUSTER_CODE=?) END AS SIZE))',
    data.map((at) => [
      packageId,
      at.name,
      at.cluster_code,
      packageId,
      at.type,
      at.cluster_code,
      packageId,
      at.type,
      packageId,
      at.type,
      at.cluster_code,
    ])
  )
}

/**
 * Insert all Bitmap fields into the Bitmap field Table.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertBitmap2Fields(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO BITMAP_FIELD_2 ( BITMAP_REF, NAME, MASK, FIELD_IDENTIFIER) VALUES ( (SELECT BITMAP_ID FROM BITMAP_2 INNER JOIN DATA_TYPE ON BITMAP_2.BITMAP_ID = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ? AND DATA_TYPE.CLUSTER_CODE IS ?), ?, ?, ?)',
    data.map((at) => [
      packageId,
      at.bitmapName,
      at.bitmapClusterCode,
      at.name,
      at.mask,
      at.fieldIdentifier,
    ])
  )
}

/**
 * Insert all Structs into the Struct Table.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertStruct2(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO STRUCT_2 ( STRUCT_ID, SIZE) VALUES ( (SELECT DATA_TYPE_ID FROM DATA_TYPE WHERE PACKAGE_REF = ? AND NAME = ? AND CLUSTER_CODE IS ?), (SELECT CASE   WHEN ((SELECT SIZE FROM STRUCT_2 INNER JOIN DATA_TYPE ON STRUCT_2.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ? AND DATA_TYPE.CLUSTER_CODE= ?) IS NULL ) THEN    (SELECT SIZE FROM STRUCT_2 INNER JOIN DATA_TYPE ON STRUCT_2.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ?) ELSE (SELECT SIZE FROM STRUCT_2 INNER JOIN DATA_TYPE ON STRUCT_2.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ? AND DATA_TYPE.CLUSTER_CODE=?) END AS SIZE))',
    data.map((at) => [
      packageId,
      at.name,
      at.cluster_code,
      packageId,
      at.type,
      at.cluster_code,
      packageId,
      at.type,
      packageId,
      at.type,
      at.cluster_code,
    ])
  )
}

/**
 * Insert all Bitmap fields into the Bitmap field Table.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertStruct2Items(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO STRUCT_ITEM_2 ( STRUCT_REF, NAME, FIELD_IDENTIFIER, IS_ARRAY, IS_ENUM, MIN_LENGTH, MAX_LENGTH, IS_WRITABLE, IS_NULLABLE, IS_OPTIONAL, IS_FABRIC_SENSITIVE, SIZE, DATA_TYPE_REF) VALUES ( (SELECT STRUCT_ID FROM STRUCT_2 INNER JOIN DATA_TYPE ON STRUCT_2.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ? AND DATA_TYPE.CLUSTER_CODE IS ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT DATA_TYPE_ID FROM DATA_TYPE WHERE DATA_TYPE.PACKAGE_REF = ? AND DATA_TYPE.NAME = ?))',
    data.map((at) => [
      packageId,
      at.structName,
      at.structClusterCode,
      at.name,
      at.fieldIdentifier,
      at.isArray,
      at.isEnum,
      at.minLength,
      at.maxLength,
      at.isWritable,
      at.isNullable,
      at.isOptional,
      at.isFabricSensitive,
      at.size,
      packageId,
      at.type,
    ])
  )
}

exports.insertGlobals = insertGlobals
exports.insertClusterExtensions = insertClusterExtensions
exports.insertClusters = insertClusters
exports.insertDomains = insertDomains
exports.insertSpecs = insertSpecs
exports.insertGlobalAttributeDefault = insertGlobalAttributeDefault
exports.insertAtomics = insertAtomics
exports.insertStructs = insertStructs
exports.insertEnums = insertEnums
exports.insertBitmaps = insertBitmaps
exports.insertDeviceTypes = insertDeviceTypes
exports.insertTags = insertTags
exports.insertAccessModifiers = insertAccessModifiers
exports.insertAccessOperations = insertAccessOperations
exports.insertAccessRoles = insertAccessRoles
exports.insertDefaultAccess = insertDefaultAccess
exports.updateStaticEntityReferences = updateStaticEntityReferences
exports.insertDataTypeDiscriminator = insertDataTypeDiscriminator
exports.insertDataType = insertDataType
exports.insertNumber = insertNumber
exports.insertString = insertString
exports.insertEnum2Atomic = insertEnum2Atomic
exports.insertEnum2 = insertEnum2
exports.insertEnum2Items = insertEnum2Items
exports.insertBitmap2Atomic = insertBitmap2Atomic
exports.insertBitmap2 = insertBitmap2
exports.insertBitmap2Fields = insertBitmap2Fields
exports.insertStruct2 = insertStruct2
exports.insertStruct2Items = insertStruct2Items

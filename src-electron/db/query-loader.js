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

const env = require('../util/env')
const dbApi = require('./db-api.js')
const queryNotification = require('../db/query-package-notification')
const dbEnum = require('../../src-shared/db-enum.js')

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
  REMOVED_IN_REF,
  API_MATURITY
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?,
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  ?
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
  IS_FABRIC_SENSITIVE,
  PRIORITY,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
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
  IS_FABRIC_SCOPED,
  RESPONSE_NAME,
  MANUFACTURER_CODE,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF,
  IS_DEFAULT_RESPONSE_ENABLED,
  IS_LARGE_MESSAGE
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  ?, ?
)`

const INSERT_COMMAND_ARG_QUERY = `
INSERT INTO COMMAND_ARG (
  COMMAND_REF,
  NAME,
  TYPE,
  MIN,
  MAX,
  MIN_LENGTH,
  MAX_LENGTH,
  IS_ARRAY,
  PRESENT_IF,
  IS_NULLABLE,
  IS_OPTIONAL,
  COUNT_ARG,
  FIELD_IDENTIFIER,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?)
)`

// Replace here is used to prevent custom cluster extensions from being re-loaded again.
// Attribute table needs to be unique based on:
// UNIQUE("CLUSTER_REF", "PACKAGE_REF", "CODE", "MANUFACTURER_CODE")
const INSERT_ATTRIBUTE_QUERY = `
INSERT INTO ATTRIBUTE (
  CLUSTER_REF,
  PACKAGE_REF,
  CODE,
  NAME,
  TYPE,
  SIDE,
  DEFINE,
  CONFORMANCE,
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
  REMOVED_IN_REF,
  API_MATURITY,
  IS_CHANGE_OMITTED,
  PERSISTENCE
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  ?,
  ?,
  ?
)`

const SELECT_CLUSTER_SPECIFIC_DATA_TYPE = `
SELECT
  DATA_TYPE.DATA_TYPE_ID
FROM
  DATA_TYPE
INNER JOIN
  DATA_TYPE_CLUSTER
ON
  DATA_TYPE.DATA_TYPE_ID = DATA_TYPE_CLUSTER.DATA_TYPE_REF
WHERE
  DATA_TYPE.NAME = ?
AND
  DATA_TYPE.DISCRIMINATOR_REF = ?
AND
  DATA_TYPE_CLUSTER.CLUSTER_CODE = ?`

// Data types which are not associated to any cluster specifically
const SELECT_GENERIC_DATA_TYPE = `
SELECT
  DATA_TYPE.DATA_TYPE_ID
FROM
  DATA_TYPE
WHERE
  DATA_TYPE.NAME = ?
AND
  DATA_TYPE.DISCRIMINATOR_REF = ?`

/**
 * Transforms the array of attributes in a certain format and returns it.
 *
 * @param {*} clusterId
 * @param {*} packageId
 * @param {*} attributes
 * @returns Array of attribute details
 */
function attributeMap(clusterId, packageId, attributes) {
  return attributes.map((attribute) => [
    clusterId,
    packageId,
    attribute.code,
    attribute.name,
    attribute.type,
    attribute.side,
    attribute.define,
    attribute.conformance,
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
    attribute.apiMaturity,
    dbApi.toDbBool(attribute.isChangeOmitted),
    attribute.persistence
  ])
}

/**
 * Transforms the array of events in a certain format and returns it.
 *
 * @param {*} clusterId
 * @param {*} packageId
 * @param {*} events
 * @returns Array of event details
 */
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
    dbApi.toDbBool(event.isFabricSensitive),
    event.priority,
    event.introducedIn,
    packageId,
    event.removedIn,
    packageId
  ])
}

/**
 * Transforms the array of commands in a certain format and returns it.
 *
 * @param {*} clusterId
 * @param {*} packageId
 * @param {*} commands
 * @returns Array of command details
 */
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
    dbApi.toDbBool(command.isFabricScoped),
    command.responseName,
    command.manufacturerCode,
    command.introducedIn,
    packageId,
    command.removedIn,
    packageId,
    dbApi.toDbBool(command.isDefaultResponseEnabled),
    dbApi.toDbBool(command.isLargeMessage)
  ])
}

/**
 * Transforms the array of event fields in a certain format and returns it.
 *
 * @param {*} eventId
 * @param {*} packageId
 * @param {*} fields
 * @returns Array of event field details
 */
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
    packageId
  ])
}

/**
 * Transforms the array of command args in a certain format and returns it.
 *
 * @param {*} cmdId
 * @param {*} packageId
 * @param {*} args
 * @returns Array of command arg details
 */
function argMap(cmdId, packageId, args) {
  return args.map((arg) => [
    cmdId,
    arg.name,
    arg.type,
    arg.min,
    arg.max,
    arg.minLength,
    arg.maxLength,
    dbApi.toDbBool(arg.isArray),
    arg.presentIf,
    dbApi.toDbBool(arg.isNullable),
    dbApi.toDbBool(arg.isOptional),
    arg.countArg,
    arg.fieldIdentifier,
    arg.introducedIn,
    packageId,
    arg.removedIn,
    packageId
  ])
}
/**
 * Filters out duplicates in an array of objects based on specified keys and logs a warning for each duplicate found.
 * This function is used to filter out duplicates in command, attribute, and event data before inserting into the database.
 * Treats `null` and `0` as equivalent.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {Array} data - Array of objects.
 * @param {Array} keys - Array of keys to compare for duplicates (e.g., ['code', 'manufacturerCode']).
 * @param {*} elementName
 * @returns {Array} - Array of unique objects (duplicates removed).
 */
function filterDuplicates(db, packageId, data, keys, elementName) {
  let seen = new Map()
  let uniqueItems = []

  data.forEach((item, index) => {
    let anyKeysPresent = keys.some((key) => key in item)

    if (!anyKeysPresent) {
      // If all keys are missing, treat this item as unique
      uniqueItems.push(item)
    } else {
      let uniqueKey = keys
        .map((key) => (item[key] === null || item[key] === 0 ? 0 : item[key]))
        .join('|')

      if (seen.has(uniqueKey)) {
        // Log a warning with the duplicate information
        queryNotification.setNotification(
          db,
          'ERROR',
          `Duplicate ${elementName} found: ${JSON.stringify(item)}`,
          packageId
        )
      } else {
        seen.set(uniqueKey, true)
        uniqueItems.push(item)
      }
    }
  })

  return uniqueItems
}

/**
 * access data is array of objects, containing id/op/role/modifier.
 * Insert attribute access data.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} accessData
 * @returns Promise of insert on attribute access
 */
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

/**
 * access data is array of objects, containing id/op/role/modifier.
 * Insert command access data.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} accessData
 * @returns Promise of insert on command access
 */
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

/**
 * access data is array of objects, containing id/op/role/modifier.
 * Insert event access data.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} accessData
 * @returns Promise of insert on event access
 */
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

/**
 * Insert attribute details.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} attributes
 * @returns None
 */
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
          modifier: ac.modifier
        })
      }
    }
  }

  if (accessData.length > 0) {
    await insertAttributeAccessData(db, packageId, accessData)
  }
}

/**
 * Load the attribute mapping table with associated attributes
 * @param {*} db
 * @param {*} data
 * @returns attribute mapping ids of the associated attributes
 */
async function insertAttributeMappings(db, data) {
  let selectAttributeIdQuery = `
  (SELECT
    ATTRIBUTE_ID
  FROM
    ATTRIBUTE
  INNER JOIN
    CLUSTER
  ON
    ATTRIBUTE.CLUSTER_REF = CLUSTER.CLUSTER_ID
  WHERE
    ATTRIBUTE.CODE = ?
  AND
    (ATTRIBUTE.MANUFACTURER_CODE = ? OR ATTRIBUTE.MANUFACTURER_CODE IS NULL)
  AND
    CLUSTER.CODE = ?
  AND
    (CLUSTER.MANUFACTURER_CODE = ? OR CLUSTER.MANUFACTURER_CODE IS NULL)
  AND
    ATTRIBUTE.PACKAGE_REF = ?
  AND
    CLUSTER.PACKAGE_REF = ?)
  `

  // Using insert or replace to cover the use case for updated attribute mappings in a file
  return dbApi.dbMultiInsert(
    db,
    `
    INSERT OR REPLACE INTO
      ATTRIBUTE_MAPPING (ATTRIBUTE_LEFT_REF, ATTRIBUTE_RIGHT_REF)
    VALUES
      (${selectAttributeIdQuery}, ${selectAttributeIdQuery})
    `,
    data
  )
}

/**
 * Insert event details.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} events
 * @returns None
 */
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
          modifier: ac.modifier
        })
      }
    }
  }

  if (accessData.length > 0) {
    await insertEventAccessData(db, packageId, accessData)
  }
}

/**
 * Insert command details
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} commands
 * @returns None
 */
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
          modifier: ac.modifier
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
    access: []
  }
  let attributes = {
    data: [],
    access: []
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
  let rows = await dbApi.dbMultiSelect(
    db,
    `SELECT CLUSTER_ID FROM CLUSTER WHERE PACKAGE_REF IN (${dbApi.toInClause(
      knownPackages
    )}) AND CODE = ?`,
    data.map((cluster) => [cluster.code])
  )

  let commands = {
    data: [],
    args: [],
    access: []
  }
  let events = {
    data: [],
    fields: [],
    access: []
  }
  let attributes = {
    data: [],
    access: []
  }

  let i, lastId
  for (i = 0; i < rows.length; i++) {
    let row = rows[i]
    if (row != null) {
      lastId = row.CLUSTER_ID
      // NOTE: This code must stay in sync with insertClusters
      if ('commands' in data[i]) {
        let cmds = filterDuplicates(
          db,
          packageId,
          data[i].commands,
          ['code', 'manufacturerCode', 'source'],
          'command'
        ) // Removes any duplicates based of db unique constraint and logs package notification (avoids SQL error)
        commands.data.push(...commandMap(lastId, packageId, cmds))
        commands.args.push(...cmds.map((command) => command.args))
        commands.access.push(...cmds.map((command) => command.access))
      }
      if ('attributes' in data[i]) {
        let atts = filterDuplicates(
          db,
          packageId,
          data[i].attributes,
          ['code', 'manufacturerCode', 'side'],
          'attribute'
        ) // Removes any duplicates based of db unique constraint and logs package notification (avoids SQL error)
        attributes.data.push(...attributeMap(lastId, packageId, atts))
        attributes.access.push(...atts.map((at) => at.access))
      }
      if ('events' in data[i]) {
        let evs = filterDuplicates(
          db,
          packageId,
          data[i].events,
          ['code', 'manufacturerCode'],
          'event'
        ) // Removes any duplicates based of db unique constraint and logs package notification (avoids SQL error)
        events.data.push(...eventMap(lastId, packageId, evs))
        events.fields.push(...evs.map((event) => event.fields))
        events.access.push(...evs.map((event) => event.access))
      }
    } else {
      // DANGER: We got here because we are adding a cluster extension for a
      // cluster which is not defined. For eg:
      // <clusterExtension code="0x0000">
      // <attribute side="server" code="0x4000" define="SW_BUILD_ID"
      //            type="CHAR_STRING" length="16" writable="false"
      //            default="" optional="true"
      //            introducedIn="zll-1.0-11-0037-10">sw build id</attribute>
      // </clusterExtension>
      // If a cluster with code 0x0000 does not exist then we run into this
      // issue.
      let message = `Attempting to insert cluster extension for a cluster which does not
      exist. Check clusterExtension meta data in xml file.
      Cluster Code: ${data[i].code}`
      env.logWarning(message)
      queryNotification.setNotification(db, 'WARNING', message, packageId, 2)
    }
  }

  let pCommand = insertCommands(db, packageId, commands)
  let pAttribute = insertAttributes(db, packageId, attributes)
  let pEvent = insertEvents(db, packageId, events)
  return Promise.all([pCommand, pAttribute, pEvent]).catch((err) => {
    if (err.includes('SQLITE_CONSTRAINT') && err.includes('UNIQUE')) {
      env.logDebug(
        `CRC match for file with package id ${packageId}, skipping parsing.`
      )
    } else {
      throw err
    }
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
          cluster.apiMaturity
        ]
      })
    )
    .then((lastIdsArray) => {
      let commands = {
        data: [],
        args: [],
        access: []
      }
      let events = {
        data: [],
        fields: [],
        access: []
      }
      let attributes = {
        data: [],
        access: []
      }
      let pTags = null
      let pFeatures = null

      let i
      for (i = 0; i < lastIdsArray.length; i++) {
        let lastId = lastIdsArray[i]
        // NOTE: This code must stay in sync with insertClusterExtensions
        if ('commands' in data[i]) {
          let cmds = data[i].commands
          cmds = filterDuplicates(
            db,
            packageId,
            cmds,
            ['code', 'manufacturerCode', 'source'],
            'command'
          ) // Removes any duplicates based of db unique constraint and logs package notification (avoids SQL error)
          commands.data.push(...commandMap(lastId, packageId, cmds))
          commands.args.push(...cmds.map((command) => command.args))
          commands.access.push(...cmds.map((command) => command.access))
        }
        if ('attributes' in data[i]) {
          let atts = data[i].attributes
          atts = filterDuplicates(
            db,
            packageId,
            atts,
            ['code', 'manufacturerCode', 'side'],
            'attribute'
          ) // Removes any duplicates based of db unique constraint and logs package notification (avoids SQL error)
          attributes.data.push(...attributeMap(lastId, packageId, atts))
          attributes.access.push(...atts.map((at) => at.access))
        }
        if ('events' in data[i]) {
          let evs = data[i].events
          evs = filterDuplicates(
            db,
            packageId,
            evs,
            ['code', 'manufacturerCode'],
            'event'
          ) // Removes any duplicates based of db unique constraint and logs package notification (avoids SQL error)
          events.data.push(...eventMap(lastId, packageId, evs))
          events.fields.push(...evs.map((event) => event.fields))
          events.access.push(...evs.map((event) => event.access))
        }
        if ('tags' in data[i]) {
          pTags = insertTags(db, packageId, data[i].tags, lastId)
        }

        if ('features' in data[i]) {
          pFeatures = insertFeatures(db, packageId, data[i].features, lastId)
        }
      }
      let pCommand = insertCommands(db, packageId, commands)
      let pAttribute = insertAttributes(db, packageId, attributes)
      let pEvent = insertEvents(db, packageId, events)
      let pArray = [pCommand, pAttribute, pEvent]
      if (pTags != null) pArray.push(pTags)
      if (pFeatures != null) pArray.push(pFeatures)
      return Promise.all(pArray)
    })
}

/**
 * Inserts features into the database.
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 * @returns A promise that resolves with array of rowids.
 */
async function insertFeatures(db, packageId, data, clusterId) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO FEATURE (PACKAGE_REF, NAME, CODE, BIT, DEFAULT_VALUE, DESCRIPTION, CONFORMANCE, CLUSTER_REF) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    data.map((feature) => [
      packageId,
      feature.name,
      feature.code,
      feature.bit,
      feature.defaultValue,
      feature.description,
      feature.conformance,
      clusterId
    ])
  )
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
        older.specCertifiable ? 1 : 0
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
      domain.specCertifiable ? 1 : 0
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
        ga.value
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
                fb.tag
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
    'INSERT INTO ATOMIC (PACKAGE_REF, NAME, DESCRIPTION, ATOMIC_IDENTIFIER, ATOMIC_SIZE, IS_DISCRETE, IS_SIGNED, IS_STRING, IS_LONG, IS_CHAR, IS_COMPOSITE, IS_FLOAT, BASE_TYPE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
      at.isComposite,
      at.isFloat,
      at.baseType
    ])
  )
}

/**
 * Inserts endpoint composition data into the database based on the context's mandatory device type.
 * This function checks if the context's mandatory device type matches the composition code.
 * If they match, it performs an insert operation with a specific type from `dbEnum.mandatoryDeviceType`.
 * If they do not match, it performs an insert with the composition's type.
 *
 * @param {*} db - The database connection object.
 * @param {*} composition - The composition data to be inserted.
 * @param {*} context - The context containing the mandatory device type to check against.
 * @returns A promise resolved with the result of the database insert operation.
 */
async function insertEndpointComposition(db, composition, context) {
  if (parseInt(context.mandatoryDeviceTypes, 16) === composition.code) {
    return dbApi.dbInsert(
      db,
      'INSERT INTO ENDPOINT_COMPOSITION (TYPE, CODE) VALUES (?, ?)',
      [dbEnum.composition.rootNode, composition.code]
    )
  } else {
    return dbApi.dbInsert(
      db,
      'INSERT INTO ENDPOINT_COMPOSITION (TYPE, CODE) VALUES (?, ?)',
      [composition.compositionType, composition.code]
    )
  }
}

/**
 * Retrieves the endpoint composition ID for a given device type code.
 *
 * @param {*} db - The database connection object.
 * @param {Object} deviceType - The device type object containing the code.
 * @returns {Promise<number|null>} - A promise that resolves to the endpoint composition ID or null if not found.
 */
async function getEndpointCompositionIdByCode(db, deviceType) {
  const query =
    'SELECT ENDPOINT_COMPOSITION_ID FROM ENDPOINT_COMPOSITION WHERE CODE = ?'
  const result = await dbApi.dbGet(db, query, [deviceType.code])
  return result ? result.ENDPOINT_COMPOSITION_ID : null
}

/**
 * Inserts device composition records for each deviceType into the DEVICE_COMPOSITION table
 * for all endpoints in the deviceType, including endpoint-specific constraint and conformance values.
 *
 * This function constructs an SQL INSERT query to add a new record to the
 * DEVICE_COMPOSITION table for each deviceType in each endpoint. It handles the insertion
 * of the device code, endpoint composition reference, conformance, and constraint values.
 * Note that the "CONSTRAINT" column name is escaped with double quotes
 * to avoid conflicts with the SQL reserved keyword.
 *
 * @param {Object} db - The database connection object.
 * @param {Object} deviceType - The device type object containing the data to be inserted.
 * @param {number} endpointCompositionId - The ID of the endpoint composition.
 * @returns {Promise} A promise that resolves when all insertions are complete.
 */
function insertDeviceComposition(db, deviceType, endpointCompositionId) {
  // Ensure that deviceType and its necessary properties are defined
  if (!deviceType?.composition?.endpoint) {
    throw new Error('Invalid deviceType object or endpoint data')
  }

  // Make sure 'deviceType.composition.endpoint' is always an array, even if there's only one endpoint
  const endpoints = Array.isArray(deviceType.composition.endpoint)
    ? deviceType.composition.endpoint
    : [deviceType.composition.endpoint]

  // Prepare an array to hold all insert queries
  const insertQueries = []

  // Iterate over all endpoints in the deviceType and their respective deviceTypes
  for (let endpoint of endpoints) {
    // Ensure deviceType is present and handle both single value or array
    const deviceTypes = Array.isArray(endpoint.deviceType)
      ? endpoint.deviceType
      : endpoint.deviceType
        ? [endpoint.deviceType]
        : [] // Default to empty array if undefined

    // Use the $ to get the endpoint-specific conformance and constraint values
    const endpointConformance =
      endpoint.endpointComposition?.endpoint?.$.conformance ||
      deviceType.conformance
    const endpointConstraint =
      endpoint.endpointComposition?.endpoint?.$.constraint ||
      deviceType.constraint

    // Create insert queries for each deviceType in this endpoint and add them to the insertQueries array
    for (let device of deviceTypes) {
      insertQueries.push(
        dbApi.dbInsert(
          db,
          `
          INSERT INTO DEVICE_COMPOSITION (CODE, ENDPOINT_COMPOSITION_REF, CONFORMANCE, DEVICE_CONSTRAINT)
          VALUES (?, ?, ?, ?)
        `,
          [
            parseInt(device, 16), // Convert deviceType to integer, assuming it is hex
            endpointCompositionId,
            endpointConformance, // Use the endpoint's specific conformance if available
            endpointConstraint // Use the endpoint's specific constraint if available
          ]
        )
      )
    }
  }

  // Return the promise for executing all queries concurrently
  return Promise.all(insertQueries)
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
      'INSERT INTO DEVICE_TYPE (PACKAGE_REF, DOMAIN, CODE, PROFILE_ID, NAME, DESCRIPTION, CLASS, SCOPE, SUPERSET) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      data.map((dt) => {
        return [
          packageId,
          dt.domain,
          dt.code,
          dt.profileId,
          dt.name,
          dt.description,
          dt.class,
          dt.scope,
          dt.superset
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
                    cluster.serverLocked
                  ],
                  true
                )
                .then((deviceTypeClusterRef) => {
                  return {
                    dtClusterRef: deviceTypeClusterRef,
                    clusterData: cluster
                  }
                })
            )
          )
            .then((dtClusterRefDataPairs) => {
              let promises = []
              promises.push(
                insertDeviceTypeAttributes(db, dtClusterRefDataPairs)
              )
              promises.push(insertDeviceTypeCommands(db, dtClusterRefDataPairs))
              promises.push(insertDeviceTypeFeatures(db, dtClusterRefDataPairs))
              return Promise.all(promises)
            })
            .then(() => {
              // Update ENDPOINT_COMPOSITION with DEVICE_TYPE_REF
              const updateEndpointComposition = `
              UPDATE ENDPOINT_COMPOSITION
              SET DEVICE_TYPE_REF = (
                SELECT DEVICE_TYPE_ID
                FROM DEVICE_TYPE
                WHERE DEVICE_TYPE.CODE = ENDPOINT_COMPOSITION.CODE
              )
            `
              return dbApi.dbAll(db, updateEndpointComposition)
            })
            .then(() => {
              // Update DEVICE_COMPOSITION with DEVICE_TYPE_REF
              const updateDeviceComposition = `
              UPDATE DEVICE_COMPOSITION
              SET DEVICE_TYPE_REF = (
                SELECT DEVICE_TYPE_ID
                FROM DEVICE_TYPE
                WHERE DEVICE_TYPE.CODE = DEVICE_COMPOSITION.CODE
              )
            `
              return dbApi.dbAll(db, updateDeviceComposition)
            })
        }
      }
      return zclIdsPromises
    })
}

/**
 * This handles the loading of device type feature requirements into the database.
 * There is a need to post-process to attach the actual feature ref after the fact
 * @param {*} db
 * @param {*} dtClusterRefDataPairs
 */
async function insertDeviceTypeFeatures(db, dtClusterRefDataPairs) {
  let features = []
  dtClusterRefDataPairs.map((dtClusterRefDataPair) => {
    let dtClusterRef = dtClusterRefDataPair.dtClusterRef
    let clusterData = dtClusterRefDataPair.clusterData
    if ('features' in clusterData && clusterData.features.length > 0) {
      clusterData.features.forEach((feature) => {
        features.push([dtClusterRef, feature.code, feature.conformance])
      })
    }
  })
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO DEVICE_TYPE_FEATURE (DEVICE_TYPE_CLUSTER_REF, FEATURE_CODE, DEVICE_TYPE_CLUSTER_CONFORMANCE) VALUES (?, ?, ?)',
    features
  )
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

/**
 * Insert into Access operation Table.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} operations
 * @returns Promise of Access Operation insert operation.
 */
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

/**
 * Insert into Access Role Table.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} roles
 * @returns Promise of Access Role insert operation.
 */
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

/**
 * Insert into Access Modifier Table.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} modifiers
 * @returns Promise of Access Modifier insert operation.
 */
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

/**
 * This function is used as a post loading action for updating the cluster
 * references of all the data types based on their cluster code.
 * @param {*} db
 * @param {*} packageId
 * @returns promise which updates cluster references for data types
 */
async function updateDataTypeClusterReferences(db, packageId) {
  return dbApi.dbUpdate(
    db,
    `
UPDATE
  DATA_TYPE_CLUSTER
SET
  CLUSTER_REF =
  (
    SELECT
      CLUSTER_ID
    FROM
      CLUSTER
    WHERE
      CLUSTER.CODE = DATA_TYPE_CLUSTER.CLUSTER_CODE
    AND
      CLUSTER.PACKAGE_REF = ?
  )
WHERE
  ( SELECT PACKAGE_REF
    FROM DATA_TYPE
    WHERE DATA_TYPE.DATA_TYPE_ID = DATA_TYPE_CLUSTER.DATA_TYPE_REF
  ) = ?

`,
    [packageId, packageId]
  )
}

/**
 * Insert Data Type Discriminator into the database.
 * Data is all the data types that can exist with name and whether the type is
 * a baseline data type or not
 * for eg
 * If we have a type called 16BitNumber which is a UINT_16(Actual representation
 * of 16 Bit unsigned integere) then 16BitNumber is not a baseline data type but
 * UINT_16 is base line data type.
 * Note: We have an ignore to silently ignore duplicates
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertDataTypeDiscriminator(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT OR IGNORE INTO DISCRIMINATOR (PACKAGE_REF, NAME) VALUES (?, ?)',
    data.map((at) => [packageId, at.name])
  )
}

/**
 * Insert all Data Types into the database.
 * The Data Type Cluster table is updated with the data type reference and
 * cluster code. Cluster code is used later to update the cluster reference of
 * the Data Type Cluster table(see updateDataTypeClusterReferences).
 * @param {*} db
 * @param {*} packageId
 * @param {*} data certain data type which is inserted into the data type
 * table based on its type
 */
async function insertDataType(db, packageId, data) {
  const lastIdsArray = await dbApi.dbMultiInsert(
    db,
    'INSERT INTO DATA_TYPE (PACKAGE_REF, NAME, DESCRIPTION, DISCRIMINATOR_REF) VALUES ( ?, ?, ?, ?)',
    data.map((at) => [packageId, at.name, at.description, at.discriminator_ref])
  )

  let clustersToLoad = []
  for (let i = 0; i < lastIdsArray.length; i++) {
    if (data[i].cluster_code != null) {
      let lastId = lastIdsArray[i]
      let clusters = data[i].cluster_code
      let dtc = clusters.map((cl) => [lastId, parseInt(cl.$.code)])
      clustersToLoad.push(...dtc)
    }
  }
  if (clustersToLoad.length > 0)
    return dbApi.dbMultiInsert(
      db,
      `INSERT INTO DATA_TYPE_CLUSTER (DATA_TYPE_REF, CLUSTER_CODE) VALUES (?, ?)`,
      clustersToLoad
    )
  return lastIdsArray
}

/**
 * Insert all Number data types into the Number Table.
 *
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertNumber(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    `
INSERT INTO
  NUMBER (NUMBER_ID, SIZE, IS_SIGNED)
VALUES (
  (SELECT DATA_TYPE_ID FROM DATA_TYPE WHERE PACKAGE_REF = ?
    AND NAME = ?
    AND DISCRIMINATOR_REF = ?),
  ?,
  ? )`,
    data.map((at) => [
      packageId,
      at.name,
      at.discriminator_ref,
      at.size,
      at.is_signed
    ])
  )
}

/**
 * Insert all String data types into the String Table.
 *
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertString(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    `
INSERT INTO
  STRING (STRING_ID, IS_LONG, SIZE, IS_CHAR)
VALUES (
  (SELECT DATA_TYPE_ID FROM DATA_TYPE WHERE PACKAGE_REF = ?
    AND NAME = ?
    AND DISCRIMINATOR_REF = ?),
  ?,
  ?,
  ? )`,
    data.map((at) => [
      packageId,
      at.name,
      at.discriminator_ref,
      at.is_long,
      at.size,
      at.is_char
    ])
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
async function insertEnumAtomic(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    `
INSERT INTO
  ENUM (ENUM_ID, SIZE)
VALUES (
  (SELECT DATA_TYPE_ID FROM DATA_TYPE WHERE PACKAGE_REF = ?
    AND NAME = ?
    AND DISCRIMINATOR_REF = ?),
  ?)`,
    data.map((at) => [packageId, at.name, at.discriminator_ref, at.size])
  )
}

/**
 * Insert all Enums into the Enum Table.
 * Note: Unlike insertEnumAtomic this function adds the enums which are not
 * baseline enums.
 *
 * @param {*} db
 * @param {*} packageIds
 * @param {*} data
 */
async function insertEnum(db, packageIds, data) {
  return dbApi.dbMultiInsert(
    db,
    `
INSERT INTO
  ENUM (ENUM_ID, SIZE)
VALUES (
  (SELECT
    CASE
      WHEN
        (${SELECT_CLUSTER_SPECIFIC_DATA_TYPE} AND PACKAGE_REF IN (${dbApi.toInClause(
          packageIds
        )}))
      IS
        NULL
      THEN
        (${SELECT_GENERIC_DATA_TYPE} AND PACKAGE_REF IN (${dbApi.toInClause(
          packageIds
        )}))
      ELSE
        (${SELECT_CLUSTER_SPECIFIC_DATA_TYPE} AND PACKAGE_REF IN (${dbApi.toInClause(
          packageIds
        )}))
      END AS DATA_TYPE_ID),
  (SELECT
    CASE
      WHEN (
        (SELECT
          SIZE
         FROM
          ENUM
         INNER JOIN
          DATA_TYPE
         ON
          ENUM.ENUM_ID = DATA_TYPE.DATA_TYPE_ID
         WHERE
          DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
          AND DATA_TYPE.NAME = ?
          AND DATA_TYPE.DISCRIMINATOR_REF = ?)
        IS NULL )
        THEN
          (SELECT
            SIZE
          FROM
            ENUM
          INNER JOIN
            DATA_TYPE
          ON
            ENUM.ENUM_ID = DATA_TYPE.DATA_TYPE_ID
          WHERE
            DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(
              packageIds
            )}) AND DATA_TYPE.NAME = ?)
      ELSE
        (SELECT
          SIZE
         FROM
          ENUM
         INNER JOIN
          DATA_TYPE
         ON
          ENUM.ENUM_ID = DATA_TYPE.DATA_TYPE_ID
         WHERE
          DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
          AND DATA_TYPE.NAME = ?
          AND DATA_TYPE.DISCRIMINATOR_REF = ?)
    END AS SIZE))`,
    data.map((at) => [
      at.name,
      at.discriminator_ref,
      at.cluster_code ? parseInt(at.cluster_code[0].$.code, 16) : null,
      at.name,
      at.discriminator_ref,
      at.name,
      at.discriminator_ref,
      at.cluster_code ? parseInt(at.cluster_code[0].$.code, 16) : null,
      at.type,
      at.discriminator_ref,
      at.type,
      at.type,
      at.discriminator_ref
    ])
  )
}

/**
 * Insert all Enum Items into the Enum Item Table.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 */
async function insertEnumItems(db, packageId, knownPackages, data) {
  const SELECT_CLUSTER_SPECIFIC_ENUM = `
SELECT
  ENUM_ID
FROM
  ENUM
INNER JOIN
  DATA_TYPE
ON
  ENUM.ENUM_ID = DATA_TYPE.DATA_TYPE_ID
INNER JOIN
  DATA_TYPE_CLUSTER
ON
  DATA_TYPE.DATA_TYPE_ID = DATA_TYPE_CLUSTER.DATA_TYPE_REF
WHERE
  DATA_TYPE.PACKAGE_REF = ?
AND
  DATA_TYPE.NAME = ?
AND
  DATA_TYPE.DISCRIMINATOR_REF = (SELECT
                                  DISCRIMINATOR_ID
                                FROM
                                  DISCRIMINATOR
                                WHERE
                                  NAME = "ENUM"
                                AND
                                  PACKAGE_REF
                                IN
                                  (${dbApi.toInClause(knownPackages)}))
AND
  DATA_TYPE_CLUSTER.CLUSTER_CODE = ?
`
  // Enums which are not associated to any cluster specifically
  const SELECT_GENERIC_ENUM = `
SELECT
  ENUM_ID
FROM
  ENUM
INNER JOIN
  DATA_TYPE
ON
  ENUM.ENUM_ID = DATA_TYPE.DATA_TYPE_ID
WHERE
  DATA_TYPE.PACKAGE_REF = ?
AND
  DATA_TYPE.NAME = ?
AND
  DATA_TYPE.DISCRIMINATOR_REF = (SELECT
                                  DISCRIMINATOR_ID
                                FROM
                                  DISCRIMINATOR
                                WHERE
                                  NAME = "ENUM"
                                AND
                                  PACKAGE_REF
                                IN
                                  (${dbApi.toInClause(knownPackages)}))
`

  return dbApi.dbMultiInsert(
    db,
    `
  INSERT INTO
    ENUM_ITEM (ENUM_REF, NAME, VALUE, FIELD_IDENTIFIER)
  VALUES (
    (SELECT
      CASE
        WHEN
          (${SELECT_CLUSTER_SPECIFIC_ENUM})
        IS
          NULL
        THEN
          (${SELECT_GENERIC_ENUM})
        ELSE
          (${SELECT_CLUSTER_SPECIFIC_ENUM})
        END AS ENUM_ID),
    ?,
    ?,
    ?)`,
    data.map((at) => [
      packageId,
      at.enumName,
      at.enumClusterCode ? parseInt(at.enumClusterCode[0].$.code, 16) : null,
      packageId,
      at.enumName,
      packageId,
      at.enumName,
      at.enumClusterCode ? parseInt(at.enumClusterCode[0].$.code, 16) : null,
      at.name,
      at.value,
      at.fieldIdentifier
    ])
  )
}

/**
 * Insert all Baseline Bitmaps into the Bitmap Table.
 * Baseline bitmaps are bitmaps such as BITMAP8/MAP8, BITMAP16/MAP16 defined in
 * the xml files
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
async function insertBitmapAtomic(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    `
INSERT INTO
  BITMAP (BITMAP_ID, SIZE)
VALUES (
  (SELECT
    DATA_TYPE_ID
   FROM
    DATA_TYPE
   WHERE PACKAGE_REF = ? AND NAME = ? AND DISCRIMINATOR_REF = ?),
  ?)`,
    data.map((at) => [packageId, at.name, at.discriminator_ref, at.size])
  )
}

/**
 * Insert all Bitmaps into the Bitmap Table.
 * Note: Unlike insertBitmapAtomic this function adds the bitmaps which are not
 * baseline bitmaps.
 * @param {*} db
 * @param {*} packageIds
 * @param {*} data
 */
async function insertBitmap(db, packageIds, data) {
  return dbApi.dbMultiInsert(
    db,
    `
  INSERT INTO
    BITMAP (BITMAP_ID, SIZE)
  VALUES (
    (SELECT
      CASE
        WHEN
          (${SELECT_CLUSTER_SPECIFIC_DATA_TYPE} AND PACKAGE_REF IN (${dbApi.toInClause(
            packageIds
          )}))
        IS
          NULL
        THEN
          (${SELECT_GENERIC_DATA_TYPE} AND PACKAGE_REF IN (${dbApi.toInClause(
            packageIds
          )}))
        ELSE
          (${SELECT_CLUSTER_SPECIFIC_DATA_TYPE} AND PACKAGE_REF IN (${dbApi.toInClause(
            packageIds
          )}))
        END AS DATA_TYPE_ID),
    (SELECT
      CASE
        WHEN (
          (SELECT
            SIZE
           FROM
            BITMAP
           INNER JOIN
            DATA_TYPE
           ON
            BITMAP.BITMAP_ID = DATA_TYPE.DATA_TYPE_ID
           WHERE
            DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
            AND DATA_TYPE.NAME = ?
            AND DATA_TYPE.DISCRIMINATOR_REF = ?)
          IS NULL)
          THEN
            (SELECT
              SIZE
             FROM
              BITMAP
             INNER JOIN
              DATA_TYPE
             ON
              BITMAP.BITMAP_ID  = DATA_TYPE.DATA_TYPE_ID
             WHERE
              DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
              AND DATA_TYPE.NAME = ?)
        ELSE
          (SELECT
            SIZE
           FROM
            BITMAP
           INNER JOIN
            DATA_TYPE
           ON
            BITMAP.BITMAP_ID  = DATA_TYPE.DATA_TYPE_ID
           WHERE
            DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
            AND DATA_TYPE.NAME = ?
            AND DATA_TYPE.DISCRIMINATOR_REF = ?)
      END AS SIZE))`,
    data.map((at) => [
      at.name,
      at.discriminator_ref,
      at.cluster_code ? parseInt(at.cluster_code[0].$.code, 16) : null,
      at.name,
      at.discriminator_ref,
      at.name,
      at.discriminator_ref,
      at.cluster_code ? parseInt(at.cluster_code[0].$.code, 16) : null,
      at.type,
      at.discriminator_ref,
      at.type,
      at.type,
      at.discriminator_ref
    ])
  )
}

/**
 * Insert all Bitmap fields into the Bitmap field Table.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 */
async function insertBitmapFields(db, packageId, knownPackages, data) {
  const SELECT_CLUSTER_SPECIFIC_BITMAP = `
  SELECT
       BITMAP_ID
     FROM
       BITMAP
     INNER JOIN
       DATA_TYPE
     ON
       BITMAP.BITMAP_ID = DATA_TYPE.DATA_TYPE_ID
     INNER JOIN
       DATA_TYPE_CLUSTER
     ON
       DATA_TYPE.DATA_TYPE_ID = DATA_TYPE_CLUSTER.DATA_TYPE_REF
     WHERE
       DATA_TYPE.PACKAGE_REF = ?
     AND
       DATA_TYPE.NAME = ?
     AND
       DATA_TYPE.DISCRIMINATOR_REF = (SELECT
                                        DISCRIMINATOR_ID
                                      FROM
                                        DISCRIMINATOR
                                      WHERE
                                        NAME = "BITMAP"
                                      AND
                                        PACKAGE_REF
                                      IN (${dbApi.toInClause(knownPackages)}))
     AND
       DATA_TYPE_CLUSTER.CLUSTER_CODE = ?
  `
  // Bitmaps which are not associated to any cluster specifically
  const SELECT_GENERIC_BITMAP = `
  SELECT
       BITMAP_ID
     FROM
       BITMAP
     INNER JOIN
       DATA_TYPE
     ON
       BITMAP.BITMAP_ID = DATA_TYPE.DATA_TYPE_ID
     WHERE
       DATA_TYPE.PACKAGE_REF = ?
     AND
       DATA_TYPE.NAME = ?
     AND
       DATA_TYPE.DISCRIMINATOR_REF = (SELECT
                                        DISCRIMINATOR_ID
                                      FROM
                                        DISCRIMINATOR
                                      WHERE
                                        NAME = "BITMAP"
                                      AND
                                        PACKAGE_REF
                                      IN (${dbApi.toInClause(knownPackages)}))
  `

  return dbApi.dbMultiInsert(
    db,
    `
  INSERT INTO
    BITMAP_FIELD (BITMAP_REF, NAME, MASK, FIELD_IDENTIFIER, TYPE)
  VALUES (
    (SELECT
      CASE
        WHEN
          (${SELECT_CLUSTER_SPECIFIC_BITMAP})
        IS
          NULL
        THEN
          (${SELECT_GENERIC_BITMAP})
        ELSE
          (${SELECT_CLUSTER_SPECIFIC_BITMAP})
        END AS BITMAP_ID),
    ?,
    ?,
    ?,
    ?)`,
    data.map((at) => [
      packageId,
      at.bitmapName,
      at.bitmapClusterCode
        ? parseInt(at.bitmapClusterCode[0].$.code, 16)
        : null,
      packageId,
      at.bitmapName,
      packageId,
      at.bitmapName,
      at.bitmapClusterCode
        ? parseInt(at.bitmapClusterCode[0].$.code, 16)
        : null,
      at.name,
      at.mask,
      at.fieldIdentifier,
      at.type
    ])
  )
}

/**
 * Insert all Structs into the Struct Table.
 *
 * @param {*} db
 * @param {*} packageIds
 * @param {*} data
 */
async function insertStruct(db, packageIds, data) {
  return dbApi.dbMultiInsert(
    db,
    `
INSERT INTO
  STRUCT (STRUCT_ID, SIZE, IS_FABRIC_SCOPED, API_MATURITY)
VALUES (
  (SELECT
    CASE
      WHEN
        (${SELECT_CLUSTER_SPECIFIC_DATA_TYPE} AND PACKAGE_REF IN (${dbApi.toInClause(
          packageIds
        )}))
      IS
        NULL
      THEN
        (${SELECT_GENERIC_DATA_TYPE} AND PACKAGE_REF IN (${dbApi.toInClause(
          packageIds
        )}))
      ELSE
        (${SELECT_CLUSTER_SPECIFIC_DATA_TYPE} AND PACKAGE_REF IN (${dbApi.toInClause(
          packageIds
        )}))
      END AS DATA_TYPE_ID),
  (SELECT
    CASE
      WHEN (
        (SELECT
          SIZE
         FROM
          STRUCT
         INNER JOIN
          DATA_TYPE
         ON
          STRUCT.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID
         WHERE
          DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
          AND DATA_TYPE.NAME = ?
          AND DATA_TYPE.DISCRIMINATOR_REF = ?)
        IS NULL )
        THEN
          (SELECT
            SIZE
           FROM
            STRUCT
           INNER JOIN
            DATA_TYPE
           ON
            STRUCT.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID
           WHERE
            DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
            AND DATA_TYPE.NAME = ?)
      ELSE
        (SELECT
          SIZE
         FROM
          STRUCT
         INNER JOIN
          DATA_TYPE
         ON
          STRUCT.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID
         WHERE
          DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
          AND DATA_TYPE.NAME = ?
          AND
          DATA_TYPE.DISCRIMINATOR_REF = ?)
    END AS SIZE), ?, ?)`,
    data.map((at) => [
      at.name,
      at.discriminator_ref,
      at.cluster_code ? parseInt(at.cluster_code[0].$.code, 16) : null,
      at.name,
      at.discriminator_ref,
      at.name,
      at.discriminator_ref,
      at.cluster_code ? parseInt(at.cluster_code[0].$.code, 16) : null,
      at.type,
      at.discriminator_ref,
      at.type,
      at.type,
      at.discriminator_ref,
      dbApi.toDbBool(at.isFabricScoped),
      at.apiMaturity
    ])
  )
}

/**
 * Insert all Struct items into the Struct Item Table.
 *
 * @param {*} db
 * @param {*} packageIds
 * @param {*} data
 */
async function insertStructItems(db, packageIds, data) {
  const SELECT_CLUSTER_SPECIFIC_STRUCT = `
  SELECT
       STRUCT_ID
     FROM
       STRUCT
     INNER JOIN
       DATA_TYPE ON STRUCT.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID
     INNER JOIN
       DATA_TYPE_CLUSTER
     ON
       DATA_TYPE.DATA_TYPE_ID = DATA_TYPE_CLUSTER.DATA_TYPE_REF
     WHERE
       DATA_TYPE.PACKAGE_REF
     IN
       (${dbApi.toInClause(packageIds)})
     AND
       DATA_TYPE.NAME = ?
     AND
       DATA_TYPE.DISCRIMINATOR_REF = (SELECT
                                        DISCRIMINATOR_ID
                                      FROM
                                        DISCRIMINATOR
                                      WHERE
                                        NAME = "STRUCT"
                                      AND
                                        PACKAGE_REF
                                      IN
                                        (${dbApi.toInClause(packageIds)}))
     AND
       DATA_TYPE_CLUSTER.CLUSTER_CODE = ?
  `

  // Structs which are not associated to any cluster specifically
  const SELECT_GENERIC_STRUCT = `
  SELECT
       STRUCT_ID
     FROM
       STRUCT
     INNER JOIN
       DATA_TYPE ON STRUCT.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID
     WHERE
       DATA_TYPE.PACKAGE_REF
     IN
       (${dbApi.toInClause(packageIds)})
     AND
       DATA_TYPE.NAME = ?
     AND
       DATA_TYPE.DISCRIMINATOR_REF = (SELECT
                                        DISCRIMINATOR_ID
                                      FROM
                                        DISCRIMINATOR
                                      WHERE
                                        NAME = "STRUCT"
                                      AND
                                        PACKAGE_REF
                                      IN
                                        (${dbApi.toInClause(packageIds)}))
  `

  return dbApi.dbMultiInsert(
    db,
    `
  INSERT INTO
    STRUCT_ITEM (STRUCT_REF, NAME, FIELD_IDENTIFIER, IS_ARRAY, IS_ENUM, MIN_LENGTH, MAX_LENGTH, IS_WRITABLE, IS_NULLABLE, IS_OPTIONAL, IS_FABRIC_SENSITIVE, SIZE, DATA_TYPE_REF)
  VALUES (
    (SELECT
      CASE
        WHEN
          (${SELECT_CLUSTER_SPECIFIC_STRUCT})
        IS
          NULL
        THEN
          (${SELECT_GENERIC_STRUCT})
        ELSE
          (${SELECT_CLUSTER_SPECIFIC_STRUCT})
        END AS STRUCT_ID),
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    (SELECT
      DATA_TYPE_ID
     FROM
      DATA_TYPE
     WHERE
      DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
      AND DATA_TYPE.NAME = ?))`,
    data.map((at) => [
      at.structName,
      at.structClusterCode
        ? parseInt(at.structClusterCode[0].$.code, 16)
        : null,
      at.structName,
      at.structName,
      at.structClusterCode
        ? parseInt(at.structClusterCode[0].$.code, 16)
        : null,
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
      at.type
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
exports.insertDeviceTypes = insertDeviceTypes
exports.insertTags = insertTags
exports.insertAccessModifiers = insertAccessModifiers
exports.insertAccessOperations = insertAccessOperations
exports.insertAccessRoles = insertAccessRoles
exports.insertDefaultAccess = insertDefaultAccess
exports.insertDataTypeDiscriminator = insertDataTypeDiscriminator
exports.insertDataType = insertDataType
exports.insertNumber = insertNumber
exports.insertString = insertString
exports.insertEnumAtomic = insertEnumAtomic
exports.insertEnum = insertEnum
exports.insertEnumItems = insertEnumItems
exports.insertBitmapAtomic = insertBitmapAtomic
exports.insertBitmap = insertBitmap
exports.insertBitmapFields = insertBitmapFields
exports.insertStruct = insertStruct
exports.insertStructItems = insertStructItems
exports.updateDataTypeClusterReferences = updateDataTypeClusterReferences
exports.insertAttributeMappings = insertAttributeMappings
exports.insertEndpointComposition = insertEndpointComposition
exports.insertDeviceComposition = insertDeviceComposition
exports.getEndpointCompositionIdByCode = getEndpointCompositionIdByCode

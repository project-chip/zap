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
const env = require('../util/env.js')
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')
const dbEnum = require('../../src-shared/db-enum.js')

// Some loading queries that are reused few times.

const INSERT_CLUSTER_QUERY = `
INSERT INTO CLUSTER (
  PACKAGE_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME, DESCRIPTION,
  DEFINE,
  DOMAIN_NAME,
  IS_SINGLETON,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF
) VALUES (
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
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
  MANUFACTURER_CODE,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF
) VALUES (
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
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
  COUNT_ARG,
  ORDINAL,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF
) VALUES (
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
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
  IS_WRITABLE,
  DEFAULT_VALUE,
  IS_OPTIONAL,
  IS_REPORTABLE,
  MANUFACTURER_CODE,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF
) VALUES (
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
  ?,
  ?,
  ?,
  ?,
  ?,
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?),
  (SELECT SPEC_ID FROM SPEC WHERE CODE = ? AND PACKAGE_REF = ?)
)`

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
  env.logInfo(`Insert globals: ${data.length}`)
  let commandsToLoad = []
  let attributesToLoad = []
  let argsForCommands = []
  let argsToLoad = []
  let i
  for (i = 0; i < data.length; i++) {
    if ('commands' in data[i]) {
      let commands = data[i].commands
      commandsToLoad.push(
        ...commands.map((command) => [
          null, // clusterId
          packageId,
          command.code,
          command.name,
          command.description,
          command.source,
          command.isOptional,
          null, // manufacturerCode
          command.introducedIn,
          packageId,
          command.removedIn,
          packageId,
        ])
      )
      argsForCommands.push(...commands.map((command) => command.args))
    }
    if ('attributes' in data[i]) {
      let attributes = data[i].attributes
      attributesToLoad.push(
        ...attributes.map((attribute) => [
          null, // clusterId
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
          attribute.isWritable,
          attribute.defaultValue,
          attribute.isOptional,
          attribute.isReportable,
          attribute.manufacturerCode,
          attribute.introducedIn,
          packageId,
          attribute.removedIn,
          packageId,
        ])
      )
    }
  }
  let pCommand = dbApi
    .dbMultiInsert(db, INSERT_COMMAND_QUERY, commandsToLoad)
    .then((lids) => {
      let j
      for (j = 0; j < lids.length; j++) {
        let lastCmdId = lids[j]
        let args = argsForCommands[j]
        if (args != undefined && args != null) {
          argsToLoad.push(
            ...args.map((arg) => [
              lastCmdId,
              arg.name,
              arg.type,
              arg.isArray,
              arg.presentIf,
              arg.countArg,
              arg.ordinal,
              arg.introducedIn,
              packageId,
              arg.removedIn,
              packageId,
            ])
          )
        }
      }
      return dbApi.dbMultiInsert(db, INSERT_COMMAND_ARG_QUERY, argsToLoad)
    })
  let pAttribute = dbApi.dbMultiInsert(
    db,
    INSERT_ATTRIBUTE_QUERY,
    attributesToLoad
  )
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
async function insertClusterExtensions(db, packageId, data) {
  return dbApi
    .dbMultiSelect(
      db,
      'SELECT CLUSTER_ID FROM CLUSTER WHERE PACKAGE_REF = ? AND CODE = ?',
      data.map((cluster) => [packageId, cluster.code])
    )
    .then((rows) => {
      let commandsToLoad = []
      let attributesToLoad = []
      let argsForCommands = []
      let argsToLoad = []
      let i, lastId
      for (i = 0; i < rows.length; i++) {
        let row = rows[i]
        if (row != null) {
          lastId = row.CLUSTER_ID
          if ('commands' in data[i]) {
            let commands = data[i].commands
            commandsToLoad.push(
              ...commands.map((command) => [
                lastId,
                packageId,
                command.code,
                command.name,
                command.description,
                command.source,
                command.isOptional,
                command.manufacturerCode,
                command.introducedIn,
                packageId,
                command.removedIn,
                packageId,
              ])
            )
            argsForCommands.push(...commands.map((command) => command.args))
          }
          if ('attributes' in data[i]) {
            let attributes = data[i].attributes
            attributesToLoad.push(
              ...attributes.map((attribute) => [
                lastId,
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
                attribute.isWritable,
                attribute.defaultValue,
                attribute.isOptional,
                attribute.isReportable,
                attribute.manufacturerCode,
                attribute.introducedIn,
                packageId,
                attribute.removedIn,
                packageId,
              ])
            )
          }
        } else {
          // DANGER: We got here, but we don't have rows. Why not?
          // Because clusters at this point have not yet been created? Odd.
          env.logWarning(
            `Attempting to insert cluster extension, but the cluster was not found: ${data[i].code}`
          )
        }
      }
      let pCommand = dbApi
        .dbMultiInsert(db, INSERT_COMMAND_QUERY, commandsToLoad)
        .then((lids) => {
          let j
          for (j = 0; j < lids.length; j++) {
            lastId = lids[j]
            let args = argsForCommands[j]
            if (args != undefined && args != null) {
              argsToLoad.push(
                ...args.map((arg) => [
                  lastId,
                  arg.name,
                  arg.type,
                  arg.isArray,
                  arg.presentIf,
                  arg.countArg,
                  arg.ordinal,
                  arg.introducedIn,
                  packageId,
                  arg.removedIn,
                  packageId,
                ])
              )
            }
          }
          return dbApi.dbMultiInsert(db, INSERT_COMMAND_ARG_QUERY, argsToLoad)
        })
      let pAttribute = dbApi.dbMultiInsert(
        db,
        INSERT_ATTRIBUTE_QUERY,
        attributesToLoad
      )
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
          cluster.introducedIn,
          packageId,
          cluster.removedIn,
          packageId,
        ]
      })
    )
    .then((lastIdsArray) => {
      let commandsToLoad = []
      let attributesToLoad = []
      let argsForCommands = []
      let argsToLoad = []
      let i
      for (i = 0; i < lastIdsArray.length; i++) {
        let lastId = lastIdsArray[i]
        if ('commands' in data[i]) {
          let commands = data[i].commands
          commandsToLoad.push(
            ...commands.map((command) => [
              lastId,
              packageId,
              command.code,
              command.name,
              command.description,
              command.source,
              command.isOptional,
              command.manufacturerCode,
              command.introducedIn,
              packageId,
              command.removedIn,
              packageId,
            ])
          )
          argsForCommands.push(...commands.map((command) => command.args))
        }
        if ('attributes' in data[i]) {
          let attributes = data[i].attributes
          attributesToLoad.push(
            ...attributes.map((attribute) => [
              lastId,
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
              attribute.isWritable,
              attribute.defaultValue,
              attribute.isOptional,
              attribute.isReportable,
              attribute.manufacturerCode,
              attribute.introducedIn,
              packageId,
              attribute.removedIn,
              packageId,
            ])
          )
        }
      }
      let pCommand = dbApi
        .dbMultiInsert(db, INSERT_COMMAND_QUERY, commandsToLoad)
        .then((lids) => {
          let j
          for (j = 0; j < lids.length; j++) {
            let lastCmdId = lids[j]
            let args = argsForCommands[j]
            if (args != undefined && args != null) {
              argsToLoad.push(
                ...args.map((arg) => [
                  lastCmdId,
                  arg.name,
                  arg.type,
                  arg.isArray,
                  arg.presentIf,
                  arg.countArg,
                  arg.ordinal,
                  arg.introducedIn,
                  packageId,
                  arg.removedIn,
                  packageId,
                ])
              )
            }
          }
          return dbApi.dbMultiInsert(db, INSERT_COMMAND_ARG_QUERY, argsToLoad)
        })
      let pAttribute = dbApi.dbMultiInsert(
        db,
        INSERT_ATTRIBUTE_QUERY,
        attributesToLoad
      )
      return Promise.all([pCommand, pAttribute])
    })
}

exports.insertGlobals = insertGlobals
exports.insertClusterExtensions = insertClusterExtensions
exports.insertClusters = insertClusters

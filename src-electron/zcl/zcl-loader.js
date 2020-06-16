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

import fs from 'fs'
import path from 'path'
import properties from 'properties'
import { parseString } from 'xml2js'
import { dbBeginTransaction, dbCommit } from '../db/db-api.js'
import {
  forPathCrc,
  insertPathCrc,
  updatePathCrc,
} from '../db/query-package.js'
import {
  insertBitmaps,
  insertClusterExtensions,
  insertClusters,
  insertDeviceTypes,
  insertDomains,
  insertEnums,
  insertGlobals,
  insertStructs,
  updateAttributeReferencesForDeviceTypeReferences,
  updateClusterReferencesForDeviceTypeClusters,
  updateCommandReferencesForDeviceTypeReferences,
} from '../db/query-zcl.js'
const { logError, logInfo } = require('../util/env.js')
const { calculateCrc } = require('../util/util.js')

const fsp = fs.promises

/**
 * Promises to read the properties file, extract all the actual xml files, and resolve with the array of files.
 *
 * @param {*} propertiesFile
 * @returns Promise of resolved files.
 */
function collectZclFiles(propertiesFile) {
  return new Promise((resolve, reject) => {
    logInfo(`Collecting ZCL files from: ${propertiesFile}`)
    properties.parse(propertiesFile, { path: true }, (err, zclProps) => {
      logInfo(`Parsed the file...`)
      if (err) {
        logError(`Could not read file: ${propertiesFile}`)
        reject(err)
      } else {
        // We create our specific fileReader context
        var fileLocation = path.join(
          path.dirname(propertiesFile),
          zclProps.xmlRoot
        )
        var files = zclProps.xmlFile
          .split(',')
          .map((data) => path.join(fileLocation, data.trim()))
        logInfo(`Resolving: ${files}`)
        resolve(files)
      }
    })
  })
}

/**
 * Promises to read a file and resolve with the content
 *
 * @param {*} file
 * @returns promise that resolves as readFile
 */
function readZclFile(file) {
  logInfo(`Reading individual file: ${file}`)
  return fsp.readFile(file)
}

/**
 * Promises to parse the ZCL file, expecting array of [filePath, data, packageId, msg]
 *
 * @param {*} argument
 * @returns promise that resolves with the array [filePath,result,packageId,msg]
 */
function parseZclFile(argument) {
  // No data, we skip this.
  if (!('data' in argument)) {
    return Promise.resolve(argument)
  } else {
    var p = new Promise((resolve, reject) => {
      // ... otherwise, we promise to parse this.
      parseString(argument.data, (err, result) => {
        if (err) {
          logError(`Failed to parse ${argument.filePath}: ${err}`)
          reject(err)
        } else {
          argument.result = result
          delete argument.data
          resolve(argument)
        }
      })
    })
    return p
  }
}

/**
 * Prepare bitmap for database insertion.
 *
 * @param {*} bm
 * @returns Object for insertion into the database
 */
function prepareBitmap(bm) {
  var ret = { name: bm.$.name, type: bm.$.type }
  if ('field' in bm) {
    ret.fields = []
    bm.field.forEach((field) => {
      ret.fields.push({
        name: field.$.name,
        mask: field.$.mask,
      })
    })
  }
  return ret
}

/**
 * Processes bitmaps for DB insertion.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} data
 * @returns Promise of inserted bitmaps
 */
function processBitmaps(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} bitmaps.`)
  return insertBitmaps(
    db,
    packageId,
    data.map((x) => prepareBitmap(x))
  )
}

/**
 * Prepare XML cluster for insertion into the database.
 * This method can also prepare clusterExtensions.
 *
 * @param {*} cluster
 * @returns Object containing all data from XML.
 */
function prepareCluster(cluster, isExtension = false) {
  var ret = {
    isExtension: isExtension,
  }

  if (isExtension) {
    if ('$' in cluster && 'code' in cluster.$) {
      ret.code = cluster.$.code
    }
  } else {
    ret.code = cluster.code[0]
    ret.name = cluster.name[0]
    ret.description = cluster.description[0]
    ret.define = cluster.define[0]
  }

  if ('command' in cluster) {
    ret.commands = []
    cluster.command.forEach((command) => {
      var cmd = {
        code: command.$.code,
        name: command.$.name,
        description: command.description[0],
        source: command.$.source,
        isOptional: command.$.optional == 'true',
      }
      if ('arg' in command) {
        cmd.args = []
        command.arg.forEach((arg) => {
          cmd.args.push({
            name: arg.$.name,
            type: arg.$.type,
            isArray: arg.$.array == 'true' ? 1 : 0,
          })
        })
      }
      ret.commands.push(cmd)
    })
  }
  if ('attribute' in cluster) {
    ret.attributes = []
    cluster.attribute.forEach((attribute) => {
      ret.attributes.push({
        code: attribute.$.code,
        name: attribute._,
        type: attribute.$.type,
        side: attribute.$.side,
        define: attribute.$.define,
        min: attribute.$.min,
        max: attribute.$.max,
        isWritable: attribute.$.writable == 'true',
        defaultValue: attribute.$.default,
        isOptional: attribute.$.optional == 'true',
        isReportable: attribute.$.reportable == 'true',
      })
    })
  }
  return ret
}

/**
 * Process clusters for insertion into the database.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} data
 * @returns Promise of cluster insertion.
 */
function processClusters(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} clusters.`)
  return insertClusters(
    db,
    packageId,
    data.map((x) => prepareCluster(x))
  )
}

/**
 * Cluster Extension contains attributes and commands in a same way as regular cluster,
 * and it has an attribute code="0xXYZ" where code is a cluster code.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} data
 * @returns promise to resolve the clusterExtension tags
 */
function processClusterExtensions(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} cluster extensions.`)
  return insertClusterExtensions(
    db,
    packageId,
    data.map((x) => prepareCluster(x, true))
  )
}

/**
 * Processes the globals in the XML files. The `global` tag contains
 * attributes and commands in a same way as cluster or clusterExtension
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} data
 * @returns promise to resolve the globals
 */
function processGlobals(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} globals.`)
  return insertGlobals(
    db,
    packageId,
    data.map((x) => prepareCluster(x, true))
  )
}

/**
 * Convert domain from XMl to domain for DB.
 *
 * @param {*} domain
 * @returns Domain object for DB.
 */
function prepareDomain(domain) {
  return { name: domain.$.name }
}

/**
 * Process domains for insertion.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} data
 * @returns Promise of database insertion of domains.
 */
function processDomains(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} domains.`)
  return insertDomains(
    db,
    packageId,
    data.map((x) => prepareDomain(x))
  )
}

/**
 * Prepares structs for the insertion into the database.
 *
 * @param {*} struct
 * @returns Object ready to insert into the database.
 */
function prepareStruct(struct) {
  var ret = { name: struct.$.name }
  if ('item' in struct) {
    ret.items = []
    struct.item.forEach((item) => {
      ret.items.push({
        name: item.$.name,
        type: item.$.type,
      })
    })
  }
  return ret
}

/**
 * Processes structs.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} data
 * @returns Promise of inserted structs.
 */
function processStructs(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} structs.`)
  return insertStructs(
    db,
    packageId,
    data.map((x) => prepareStruct(x))
  )
}

/**
 * Prepares an enum for insertion into the database.
 *
 * @param {*} en
 * @returns An object ready to go to the database.
 */
function prepareEnum(en) {
  var ret = { name: en.$.name, type: en.$.type }
  if ('item' in en) {
    ret.items = []
    en.item.forEach((item) => {
      ret.items.push({
        name: item.$.name,
        value: item.$.value,
      })
    })
  }
  return ret
}

/**
 * Processes the enums.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} data
 * @returns A promise of inserted enums.
 */
function processEnums(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} enums.`)
  return insertEnums(
    db,
    packageId,
    data.map((x) => prepareEnum(x))
  )
}

/**
 * Preparation step for the device types.
 *
 * @param {*} deviceType
 * @returns an object containing the prepared device types.
 */
function prepareDeviceType(deviceType) {
  var ret = {
    code: deviceType.deviceId[0]['_'],
    profileId: deviceType.profileId[0]['_'],
    name: deviceType.name[0],
    description: deviceType.typeName[0],
  }
  if ('clusters' in deviceType) {
    ret.clusters = []
    deviceType.clusters.forEach((cluster) => {
      if ('include' in cluster) {
        cluster.include.forEach((include) => {
          var attributes = []
          var commands = []
          if ('requireAttribute' in include) {
            attributes = include.requireAttribute
          }
          if ('requireCommand' in include) {
            commands = include.requireCommand
          }
          ret.clusters.push({
            client: 'true' == include.$.client,
            server: 'true' == include.$.server,
            clientLocked: 'true' == include.$.clientLocked,
            serverLocked: 'true' == include.$.serverLocked,
            clusterName:
              include.$.cluster != undefined ? include.$.cluster : include._,
            requiredAttributes: attributes,
            requiredCommands: commands,
          })
        })
      }
    })
  }
  return ret
}

/**
 * Process all device types.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} data
 * @returns Promise of a resolved device types.
 */
function processDeviceTypes(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} deviceTypes.`)
  return insertDeviceTypes(
    db,
    packageId,
    data.map((x) => prepareDeviceType(x))
  )
}

/**
 * After XML parser is done with the barebones parsing, this function
 * branches the individual toplevel tags.
 *
 * @param {*} db
 * @param {*} argument
 * @returns promise that resolves when all the subtags are parsed.
 */
function processParsedZclData(db, argument) {
  var filePath = argument.filePath
  var data = argument.result
  var packageId = argument.packageId

  if (!('result' in argument)) {
    return Promise.resolve([])
  } else {
    var immediatePromises = []
    var laterPromises = []
    if ('configurator' in data) {
      if ('bitmap' in data.configurator)
        immediatePromises.push(
          processBitmaps(db, filePath, packageId, data.configurator.bitmap)
        )
      if ('cluster' in data.configurator)
        immediatePromises.push(
          processClusters(db, filePath, packageId, data.configurator.cluster)
        )
      if ('domain' in data.configurator)
        immediatePromises.push(
          processDomains(db, filePath, packageId, data.configurator.domain)
        )
      if ('enum' in data.configurator)
        immediatePromises.push(
          processEnums(db, filePath, packageId, data.configurator.enum)
        )
      if ('struct' in data.configurator)
        immediatePromises.push(
          processStructs(db, filePath, packageId, data.configurator.struct)
        )
      if ('deviceType' in data.configurator)
        immediatePromises.push(
          processDeviceTypes(
            db,
            filePath,
            packageId,
            data.configurator.deviceType
          )
        )
      if ('global' in data.configurator)
        immediatePromises.push(
          processGlobals(db, filePath, packageId, data.configurator.global)
        )
      if ('clusterExtension' in data.configurator)
        laterPromises.push(() =>
          processClusterExtensions(
            db,
            filePath,
            packageId,
            data.configurator.clusterExtension
          )
        )
    }
    // This thing resolves the immediate promises and then resolves itself with passing the later promises down the chain.
    return Promise.all(immediatePromises).then(() => laterPromises)
  }
}

/**
 * Promises to perform a post loading step.
 *
 * @param {*} db
 * @returns Promise to deal with the post-loading cleanup.
 */
function processPostLoading(db) {
  return updateClusterReferencesForDeviceTypeClusters(db)
    .then((res) => updateAttributeReferencesForDeviceTypeReferences(db))
    .then((res) => updateCommandReferencesForDeviceTypeReferences(db))
}

/**
 * Promises to qualify whether zcl file needs to be reloaded.
 * If yes, the it will resolve with {filePath, data, packageId}
 * If not, then it will resolve with {error}
 *
 * @param {*} db
 * @param {*} object
 * @returns Promise that resolves int he object of data.
 */
function qualifyZclFile(db, info) {
  return new Promise((resolve, reject) => {
    var filePath = info.filePath
    var data = info.data
    var actualCrc = info.actualCrc
    forPathCrc(
      db,
      filePath,
      (storedCrc, packageId) => {
        // This is executed if CRC is found in the database.
        if (storedCrc == actualCrc) {
          logInfo(`CRC match for file ${filePath}, skipping parsing.`)
          resolve({
            error: `${filePath} skipped`,
          })
        } else {
          logInfo(
            `CRC missmatch for file ${filePath}, package id ${packageId}, parsing.`
          )
          updatePathCrc(db, filePath, actualCrc).then(() =>
            resolve({
              filePath: filePath,
              data: data,
              packageId: packageId,
            })
          )
        }
      },
      () => {
        // This is executed if there is no CRC in the database.
        logInfo(`No CRC in the database for file ${filePath}, parsing.`)
        insertPathCrc(db, filePath, actualCrc).then((packageId) => {
          resolve({
            filePath: filePath,
            data: data,
            packageId: packageId,
          })
        })
      }
    )
  })
}

/**
 *
 * Promises to iterate over all the XML files and returns an aggregate promise
 * that will be resolved when all the XML files are done, or rejected if at least one fails.
 *
 * @param {*} db
 * @param {*} files
 * @returns Promise that resolves when all the individual promises of each file pass.
 */
function parseZclFiles(db, files) {
  logInfo(`Starting to parse ZCL files: ${files}`)
  var individualPromises = []
  files.forEach((element) => {
    var p = readZclFile(element)
      .then((data) => calculateCrc({ filePath: element, data: data }))
      .then((data) => qualifyZclFile(db, data))
      .then((result) => parseZclFile(result))
      .then((result) => processParsedZclData(db, result))
      .catch((err) => logError(err))
    individualPromises.push(p)
  })
  return Promise.all(individualPromises)
}
/**
 * Toplevel function that loads the properties file and orchestrates the promise chain.
 *
 * @export
 * @param {*} db
 * @param {*} propertiesFile
 * @returns a Promise that resolves with the db.
 */
export function loadZcl(db, propertiesFile) {
  logInfo(`Loading zcl file: ${propertiesFile}`)
  return dbBeginTransaction(db)
    .then(() => collectZclFiles(propertiesFile))
    .then((files) => parseZclFiles(db, files))
    .then((arrayOfLaterPromisesArray) => {
      var p = []
      arrayOfLaterPromisesArray.forEach((promises) => {
        promises.forEach((x) => p.push(x()))
      })
      return Promise.all(p)
    })
    .then(() => processPostLoading(db))
    .then(() => dbCommit(db))
    .then(() => db)
}

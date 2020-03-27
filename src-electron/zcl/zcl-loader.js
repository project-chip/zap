// Copyright (c) 2020 Silicon Labs. All rights reserved.

import { logInfo, logError } from '../main-process/env'
import properties from 'properties'
import path from 'path'
import fs from 'fs'
import crc from 'crc'

import { parseString } from 'xml2js'
import { forPathCrc, updatePathCrc, insertPathCrc, insertClusters, insertDomains, insertStructs, insertBitmaps, insertEnums, insertDeviceTypes, updateClusterReferencesForDeviceTypeClusters } from '../db/query'
import { dbBeginTransaction, dbCommit } from '../db/db-api'

const fsp = fs.promises

// Promises to read the properties file, extract all the actual xml files, and resolve with the array of files.
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
        var fileLocation = path.join(path.dirname(propertiesFile), zclProps.xmlRoot)
        var files = zclProps.xmlFile.split(',').map(data => path.join(fileLocation, data.trim()))
        logInfo(`Resolving: ${files}`)
        resolve(files)
      }
    })
  })
}

// Promises to read a file and resolve with the content
function readZclFile(file) {
  logInfo(`Reading individual file: ${file}`)
  return fsp.readFile(file)
}

// Promises to calculate the CRC of the file, and resolve with an array [filePath,data,crc]
function calculateCrc(filePath, data) {
  return new Promise((resolve, reject) => {
    var actualCrc = crc.crc32(data)
    logInfo(`For file: ${filePath}, got CRC: ${actualCrc}`)
    resolve([filePath, data, actualCrc])
  })
}

// Promises to parse the ZCL file, expecting array of [filePath, data, packageId, msg]
// Resolves with the array [filePath,result,packageId,msg]
function parseZclFile(argument) {
  var filePath = argument[0]
  var data = argument[1]
  var packageId = argument[2]
  var msg = argument[3]

  // No data, we skip this.
  if (data == null)
    return Promise.resolve([null, null, null, msg])
  else {
    var p = new Promise((resolve, reject) => {
      // ... otherwise, we promise to parse this.
      logInfo(`Executing XML parser on ${filePath}`)
      parseString(data, (err, result) => {
        if (err) {
          logError(`Failed to parse ${filePath}: ${err}`)
          reject(err)
        } else {
          resolve([filePath, result, packageId, null])
        }
      })
    })
    return p
  }
}

function prepareBitmap(bm) {
  var ret = { name: bm.$.name, type: bm.$.type }
  if ('field' in bm) {
    ret.fields = []
    bm.field.forEach(field => {
      ret.fields.push({
        name: field.$.name,
        mask: field.$.mask
      })
    })
  }
  return ret
}

function processBitmaps(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} bitmaps.`)
  return insertBitmaps(db, packageId, data.map(x => prepareBitmap(x)))
}

function prepareCluster(cluster) {
  var ret = {
    code: cluster.code[0],
    name: cluster.name[0],
    description: cluster.description[0],
    define: cluster.define[0]
  }
  if ('command' in cluster) {
    ret.commands = []
    cluster.command.forEach(command => {
      var cmd = {
        code: command.$.code,
        name: command.$.name,
        description: command.description[0],
        source: command.$.source,
        isOptional: command.$.optional == 'true'
      }
      if ('arg' in command) {
        cmd.args = []
        command.arg.forEach(arg => {
          cmd.args.push({
            name: arg.$.name,
            type: arg.$.type,
            isArray: (arg.$.array == "true" ? 1 : 0)
          })
        })
      }
      ret.commands.push(cmd)
    })
  }
  if ('attribute' in cluster) {
    ret.attributes = []
    cluster.attribute.forEach(attribute => {
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
        isOptional: attribute.$.optional == 'true'
      })
    })
  }
  return ret
}

function processClusters(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} clusters.`)
  return insertClusters(db, packageId, data.map(x => prepareCluster(x)))
}

function prepareDomain(domain) {
  return { name: domain.$.name }
}

function processDomains(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} domains.`)
  return insertDomains(db, packageId, data.map(x => prepareDomain(x)))
}

function prepareStruct(struct) {
  var ret = { name: struct.$.name }
  if ('item' in struct) {
    ret.items = []
    struct.item.forEach(item => {
      ret.items.push({
        name: item.$.name,
        type: item.$.type
      })
    })
  }
  return ret
}

function processStructs(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} structs.`)
  return insertStructs(db, packageId, data.map(x => prepareStruct(x)))
}

function prepareEnum(en) {
  var ret = { name: en.$.name, type: en.$.type }
  if ('item' in en) {
    ret.items = []
    en.item.forEach(item => {
      ret.items.push({
        name: item.$.name,
        value: item.$.value
      })
    })
  }
  return ret
}
function processEnums(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} enums.`)
  return insertEnums(db, packageId, data.map(x => prepareEnum(x)))
}

function prepareDeviceType(deviceType) {
  var ret = { code: deviceType.deviceId[0]['_'], profileId: deviceType.profileId[0]['_'], name: deviceType.name[0], description: deviceType.typeName[0] }
  if ('clusters' in deviceType) {
    ret.clusters = []
    deviceType.clusters.forEach(cluster => {
      if ('include' in cluster) {
        cluster.include.forEach(include => {
          ret.clusters.push({
            client: 'true' == include.$.client,
            server: 'true' == include.$.server,
            clientLocked: 'true' == include.$.clientLocked,
            serverLocked: 'true' == include.$.serverLocked,
            clusterName: (include.$.cluster != undefined ? include.$.cluster : include._)
          })
        })
      }
    })
  }
  return ret
}

function processDeviceTypes(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} deviceTypes.`)
  return insertDeviceTypes(db, packageId, data.map(x => prepareDeviceType(x)))
}
function processGlobals(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} globals.`)
  return Promise.resolve(true)
}
function processClusterExtensions(db, filePath, packageId, data) {
  logInfo(`${filePath}, ${packageId}: ${data.length} extensions.`)
  return Promise.resolve(true)
}

function processParsedZclData(db, argument) {
  var filePath = argument[0]
  var data = argument[1]
  var packageId = argument[2]
  var msg = argument[3]

  if (data == null) {
    return Promise.resolve(msg)
  } else {
    var sp = []
    if ('configurator' in data) {
      if ('bitmap' in data.configurator) sp.push(processBitmaps(db, filePath, packageId, data.configurator.bitmap))
      if ('cluster' in data.configurator) sp.push(processClusters(db, filePath, packageId, data.configurator.cluster))
      if ('domain' in data.configurator) sp.push(processDomains(db, filePath, packageId, data.configurator.domain))
      if ('enum' in data.configurator) sp.push(processEnums(db, filePath, packageId, data.configurator.enum))
      if ('struct' in data.configurator) sp.push(processStructs(db, filePath, packageId, data.configurator.struct))
      if ('deviceType' in data.configurator) sp.push(processDeviceTypes(db, filePath, packageId, data.configurator.deviceType))
      if ('global' in data.configurator) sp.push(processGlobals(db, filePath, packageId, data.configurator.global))
      if ('clusterExtension' in data.configurator) sp.push(processClusterExtensions(db, filePath, packageId, data.configurator.clusterExtension))
    }
    return Promise.all(sp)
  }
}

function processPostLoading(db) {
  return updateClusterReferencesForDeviceTypeClusters(db);
}

// Promises to qualify whether zcl file needs to be reloaded.
// If yes, the it will resolve with [filePath, data, packageId, NULL]
// If not, then it will resolve with [null, null, null, msg]
function qualifyZclFile(db, array) {
  return new Promise((resolve, reject) => {
    var filePath = array[0]
    var data = array[1]
    var actualCrc = array[2]
    forPathCrc(db, filePath, (storedCrc, packageId) => { // This is executed if CRC is found in the database.
      if (storedCrc == actualCrc) {
        logInfo(`CRC match for file ${filePath}, skipping parsing.`)
        resolve([null, null, null, `${filePath} skipped`])
      } else {
        logInfo(`CRC missmatch for file ${filePath}, package id ${packageId}, parsing.`)
        updatePathCrc(db, filePath, actualCrc).then(
          () => resolve([filePath, data, packageId, null])
        )
      }
    },
      () => { // This is executed if there is no CRC in the database.
        logInfo(`No CRC in the database for file ${filePath}, parsing.`)
        insertPathCrc(db, filePath, actualCrc).then((packageId) => {
          resolve([filePath, data, packageId, null])
        })
      })
  })
}

// Promises to iterate over all the XML files and returns an aggregate promise
// that will be resolved when all the XML files are done, or rejected if at least one fails.
function parseZclFiles(db, files) {
  logInfo(`Starting to parse ZCL files: ${files}`)
  var individualPromises = []
  files.forEach(element => {
    var p = readZclFile(element)
      .then(data => calculateCrc(element, data))
      .then(array => qualifyZclFile(db, array))
      .then(result => parseZclFile(result))
      .then(result => processParsedZclData(db, result))
      .catch(err => logError(err))
    individualPromises.push(p)
  })
  return Promise.all(individualPromises)
}

export function loadZcl(db, propertiesFile) {
  logInfo(`Loading zcl file: ${propertiesFile}`)
  return dbBeginTransaction(db).then(() => collectZclFiles(propertiesFile))
    .then((files) => parseZclFiles(db, files))
    .then(result => processPostLoading(db))
    .then(() => dbCommit(db))
    .then(() => Promise.resolve(db))
}

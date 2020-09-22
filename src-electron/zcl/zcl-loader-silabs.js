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

const fs = require('fs')
const path = require('path')
const properties = require('properties')
const xml2js = require('xml2js')
const dbApi = require('../db/db-api.js')
const queryPackage = require('../db/query-package.js')
const queryZcl = require('../db/query-zcl.js')
const env = require('../util/env.js')
const util = require('../util/util.js')
const dbEnum = require('../../src-shared/db-enum.js')
const fsp = fs.promises
const zclLoader = require('./zcl-loader.js')

/**
 * Promises to read the JSON file and resolve all the data.
 * @param {*} ctx  Context containing information about the file
 * @returns Promise of resolved file.
 */
function collectDataFromJsonFile(ctx) {
  env.logInfo(`Collecting ZCL files from JSON file: ${ctx.metadataFile}`)
  return new Promise((resolve, reject) => {
    var obj = JSON.parse(ctx.data)

    var fileLocations
    if (Array.isArray(obj.xmlRoot)) {
      fileLocations = obj.xmlRoot.map((p) =>
        path.join(path.dirname(ctx.metadataFile), p)
      )
    } else {
      fileLocations = [path.join(path.dirname(ctx.metadataFile), obj.xmlRoot)]
    }
    var zclFiles = []
    obj.xmlFile.forEach((f) => {
      for (var i = 0; i < fileLocations.length; i++) {
        var zclFile = path.resolve(fileLocations[i], f.trim())
        if (fs.existsSync(zclFile)) {
          zclFiles.push(zclFile)
          break
        }
      }
    })

    ctx.zclFiles = zclFiles

    // Manufacturers XML file.
    if (obj.manufacturersXml) {
      for (var i = 0; i < fileLocations.length; i++) {
        var manufacturerXml = path.resolve(
          fileLocations[i],
          obj.manufacturersXml.trim()
        )
        if (fs.existsSync(manufacturerXml)) {
          ctx.manufacturersXml = manufacturerXml
          break
        }
      }
    }

    // General options
    // Note that these values when put into OPTION_CODE will generally be converted to lowercase.
    if (obj.options) {
      ctx.options = obj.options
    }
    // Defaults. Note that the keys should be the categories that are listed for OPTIONS, and the value should be the OPTION_CODE
    if (obj.defaults) {
      ctx.defaults = obj.defaults
    }

    ctx.version = obj.version
    env.logInfo(`Resolving: ${ctx.zclFiles}, version: ${ctx.version}`)
    resolve(ctx)
  })
}

/**
 * Promises to read the properties file, extract all the actual xml files, and resolve with the array of files.
 *
 * @param {*} ctx Context which contains information about the propertiesFiles and data
 * @returns Promise of resolved files.
 */
function collectDataFromPropertiesFile(ctx) {
  return new Promise((resolve, reject) => {
    env.logInfo(
      `Collecting ZCL files from properties file: ${ctx.metadataFile}`
    )

    properties.parse(ctx.data, { namespaces: true }, (err, zclProps) => {
      if (err) {
        env.logError(`Could not read file: ${ctx.metadataFile}`)
        reject(err)
      } else {
        var fileLocations = zclProps.xmlRoot
          .split(',')
          .map((p) => path.join(path.dirname(ctx.metadataFile), p))
        var zclFiles = []

        // Iterate over all XML files in the properties file, and check
        // if they exist in one or the other directory listed in xmlRoot
        zclProps.xmlFile.split(',').forEach((f) => {
          for (var i = 0; i < fileLocations.length; i++) {
            var zclFile = path.resolve(fileLocations[i], f.trim())
            if (fs.existsSync(zclFile)) {
              zclFiles.push(zclFile)
              break
            }
          }
        })

        ctx.zclFiles = zclFiles
        // Manufacturers XML file.
        if (zclProps.manufacturersXml) {
          for (var i = 0; i < fileLocations.length; i++) {
            var manufacturerXml = path.resolve(
              fileLocations[i],
              zclProps.manufacturersXml.trim()
            )
            if (fs.existsSync(manufacturerXml)) {
              ctx.manufacturersXml = manufacturerXml
              break
            }
          }
        }

        // General options
        // Note that these values when put into OPTION_CODE will generally be converted to lowercase.
        if (zclProps.options) {
          ctx.options = zclProps.options
        }
        // Defaults. Note that the keys should be the categories that are listed for OPTIONS, and the value should be the OPTION_CODE
        if (zclProps.defaults) {
          ctx.defaults = zclProps.defaults
        }

        ctx.version = zclProps.version
        env.logInfo(`Resolving: ${ctx.zclFiles}, version: ${ctx.version}`)
        resolve(ctx)
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
  env.logInfo(`Reading individual file: ${file}`)
  return fsp.readFile(file)
}

/**
 * Promises to parse the ZCL file, expecting object of { filePath, data, packageId, msg }
 *
 * @param {*} argument
 * @returns promise that resolves with the array [filePath,result,packageId,msg]
 */
function parseZclFile(argument) {
  // No data, we skip this.
  if (!('data' in argument)) {
    return Promise.resolve(argument)
  } else {
    return xml2js.parseStringPromise(argument.data).then((result) => {
      argument.result = result
      delete argument.data
      return argument
    })
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
  env.logInfo(`${filePath}, ${packageId}: ${data.length} bitmaps.`)
  return queryZcl.insertBitmaps(
    db,
    packageId,
    data.map((x) => prepareBitmap(x))
  )
}

/**
 * Prepare atomic to db insertion.
 *
 * @param {*} a
 */
function prepareAtomic(a) {
  return {
    name: a.$.name,
    id: a.$.id,
    size: a.$.size,
    description: a.$.description,
  }
}
/**
 * Processes atomic types for DB insertion.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} data
 * @returns Promise of inserted bitmaps
 */
function processAtomics(db, filePath, packageId, data) {
  var types = data[0].type
  env.logInfo(`${filePath}, ${packageId}: ${types.length} atomic types.`)
  return queryZcl.insertAtomics(
    db,
    packageId,
    types.map((x) => prepareAtomic(x))
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
    ret.domain = cluster.domain[0]
    if ('$' in cluster) ret.manufacturerCode = cluster['$'].manufacturerCode
  }

  if ('command' in cluster) {
    ret.commands = []
    cluster.command.forEach((command) => {
      var cmd = {
        code: command.$.code,
        manufacturerCode: command.$.manufacturerCode,
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
        manufacturerCode: attribute.$.manufacturerCode,
        name: attribute._,
        type: attribute.$.type.toLowerCase(),
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
  env.logInfo(`${filePath}, ${packageId}: ${data.length} clusters.`)
  return queryZcl.insertClusters(
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
  env.logInfo(`${filePath}, ${packageId}: ${data.length} cluster extensions.`)
  return queryZcl.insertClusterExtensions(
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
  env.logInfo(`${filePath}, ${packageId}: ${data.length} globals.`)
  return queryZcl.insertGlobals(
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
  env.logInfo(`${filePath}, ${packageId}: ${data.length} domains.`)
  return queryZcl.insertDomains(
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
  env.logInfo(`${filePath}, ${packageId}: ${data.length} structs.`)
  return queryZcl.insertStructs(
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
  env.logInfo(`${filePath}, ${packageId}: ${data.length} enums.`)
  return queryZcl.insertEnums(
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
    domain: deviceType.domain[0],
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
  env.logInfo(`${filePath}, ${packageId}: ${data.length} deviceTypes.`)
  return queryZcl.insertDeviceTypes(
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
      if ('atomic' in data.configurator)
        immediatePromises.push(
          processAtomics(db, filePath, packageId, data.configurator.atomic)
        )
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
 * Resolve later promises.
 * This function resolves the later promises associated with processParsedZclData.
 * @param {*} laterPromises
 */
function resolveLaterPromises(laterPromises) {
  var p = []
  laterPromises.flat(1).forEach((promises) => {
    p.push(promises())
  })
  return Promise.all(p)
}

/**
 * Promises to qualify whether zcl file needs to be reloaded.
 * If yes, the it will resolve with {filePath, data, packageId}
 * If not, then it will resolve with {error}
 *
 * @param {*} db
 * @param {*} info
 * @param {*} parentPackageId
 * @returns Promise that resolves int he object of data.
 */
function qualifyZclFile(db, info, parentPackageId) {
  return new Promise((resolve, reject) => {
    var filePath = info.filePath
    var data = info.data
    var actualCrc = info.crc
    queryPackage
      .getPackageByPathAndParent(db, filePath, parentPackageId)
      .then((pkg) => {
        if (pkg == null) {
          // This is executed if there is no CRC in the database.
          env.logInfo(`No CRC in the database for file ${filePath}, parsing.`)
          return queryPackage
            .insertPathCrc(
              db,
              filePath,
              actualCrc,
              dbEnum.packageType.zclXml,
              parentPackageId
            )
            .then((packageId) => {
              resolve({
                filePath: filePath,
                data: data,
                packageId: parentPackageId,
              })
            })
        } else {
          // This is executed if CRC is found in the database.
          if (pkg.crc == actualCrc) {
            env.logInfo(
              `CRC match for file ${pkg.path} (${pkg.crc}), skipping parsing.`
            )
            resolve({
              error: `${pkg.path} skipped`,
            })
          } else {
            env.logInfo(
              `CRC missmatch for file ${pkg.path}, (${pkg.crc} vs ${actualCrc}) package id ${pkg.id}, parsing.`
            )
            return queryPackage
              .updatePathCrc(db, filePath, actualCrc, parentPackageId)
              .then(() => {
                resolve({
                  filePath: filePath,
                  data: data,
                  packageId: parentPackageId,
                })
              })
          }
        }
      })
  })
}

/**
 *
 * Promises to iterate over all the XML files and returns an aggregate promise
 * that will be resolved when all the XML files are done, or rejected if at least one fails.
 *
 * @param {*} db
 * @param {*} ctx
 * @returns Promise that resolves when all the individual promises of each file pass.
 */
function parseZclFiles(db, ctx) {
  env.logInfo(`Starting to parse ZCL files: ${ctx.zclFiles}`)
  return Promise.all(
    ctx.zclFiles.map((individualFile) => {
      return readZclFile(individualFile)
        .then((data) =>
          util.calculateCrc({ filePath: individualFile, data: data })
        )
        .then((data) => qualifyZclFile(db, data, ctx.packageId))
        .then((result) => parseZclFile(result))
        .then((result) => processParsedZclData(db, result))
        .then((result) => resolveLaterPromises(result))
        .then(() => ctx)
        .catch((err) => env.logError(err))
    })
  )
    .then(() => zclLoader.processZclPostLoading(db))
    .then(() => ctx)
}

function parseManufacturerData(db, ctx) {
  if (!ctx.manufacturersXml) return Promise.resolve(ctx)
  return readZclFile(ctx.manufacturersXml)
    .then((data) =>
      parseZclFile({ data: data }).then((manufacturerMap) =>
        queryPackage.insertOptionsKeyValues(
          db,
          ctx.packageId,
          dbEnum.packageOptionCategory.manufacturerCodes,
          manufacturerMap.result.map.mapping.map((data) => {
            let mfgPair = data['$']
            return { code: mfgPair['code'], label: mfgPair['translation'] }
          })
        )
      )
    )
    .then(() => Promise.resolve(ctx))
}

function parseOptions(db, ctx) {
  if (!ctx.options) return Promise.resolve(ctx)
  var promises = []
  promises.push(parseTextOptions(db, ctx.packageId, ctx.options.text))
  promises.push(parseBoolOptions(db, ctx.packageId, ctx.options.bool))
  return Promise.all(promises).then(() => ctx)
}

function parseTextOptions(db, pkgRef, textOptions) {
  if (!textOptions) return Promise.resolve()
  let promises = Object.keys(textOptions).map((optionKey) => {
    var val = textOptions[optionKey]
    var optionValues
    if (Array.isArray(val)) {
      optionValues = val
    } else {
      optionValues = val.split(',').map((opt) => opt.trim())
    }
    return queryPackage.insertOptionsKeyValues(
      db,
      pkgRef,
      optionKey,
      optionValues.map((optionValue) => {
        return { code: optionValue.toLowerCase(), label: optionValue }
      })
    )
  })
  return Promise.all(promises)
}

function parseBoolOptions(db, pkgRef, booleanCategories) {
  if (!booleanCategories) return Promise.resolve()
  let options
  if (Array.isArray(booleanCategories)) {
    options = booleanCategories
  } else {
    options = booleanCategories
      .split(',')
      .map((optionValue) => optionValue.trim())
  }
  var promises = []
  options.forEach((optionCategory) => {
    promises.push(
      queryPackage.insertOptionsKeyValues(db, pkgRef, optionCategory, [
        { code: 1, label: 'True' },
        { code: 0, label: 'False' },
      ])
    )
  })
  return Promise.resolve(promises)
}

function parseDefaults(db, ctx) {
  if (!ctx.defaults) return Promise.resolve(ctx)
  var promises = []
  promises.push(parseTextDefaults(db, ctx.packageId, ctx.defaults.text))
  promises.push(parseBoolDefaults(db, ctx.packageId, ctx.defaults.bool))
  return Promise.resolve(ctx)
}

function parseTextDefaults(db, pkgRef, textDefaults) {
  if (!textDefaults) return Promise.resolve()

  let promises = []
  Object.keys(textDefaults).forEach((optionCategory) => {
    var txt = textDefaults[optionCategory]
    promises.push(
      queryPackage
        .selectSpecificOptionValue(db, pkgRef, optionCategory, txt)
        .then((specificValue) => {
          if (specificValue == null) {
            throw `Default value for: ${optionCategory}/${textDefaults[optionCategory]} does not match an option.`
          } else {
            return queryPackage.insertDefaultOptionValue(
              db,
              pkgRef,
              optionCategory,
              specificValue.id
            )
          }
        })
    )
  })
  return Promise.resolve(promises)
}

function parseBoolDefaults(db, pkgRef, booleanCategories) {
  if (!booleanCategories) return Promise.resolve()

  let promises = []
  Object.keys(booleanCategories).forEach((optionCategory) => {
    promises.push(
      queryPackage
        .selectSpecificOptionValue(
          db,
          pkgRef,
          optionCategory,
          booleanCategories[optionCategory] ? 1 : 0
        )
        .then((specificValue) =>
          queryPackage.insertDefaultOptionValue(
            db,
            pkgRef,
            optionCategory,
            specificValue.id
          )
        )
    )
  })
  return Promise.resolve(promises)
}

/**
 * Toplevel function that loads the properties file and orchestrates the promise chain.
 *
 * @export
 * @param {*} db
 * @param {*} ctx The context of loading.
 * @returns a Promise that resolves with the db.
 */
function loadSilabsZcl(db, ctx, isJson = false) {
  env.logInfo(`Loading Silabs zcl file: ${ctx.metadataFile}`)
  return dbApi
    .dbBeginTransaction(db)
    .then(() => zclLoader.readMetadataFile(ctx))
    .then((ctx) => zclLoader.recordToplevelPackage(db, ctx))
    .then((ctx) => {
      if (isJson) {
        return collectDataFromJsonFile(ctx)
      } else {
        return collectDataFromPropertiesFile(ctx)
      }
    })
    .then((ctx) => zclLoader.recordVersion(ctx))
    .then((ctx) => parseZclFiles(db, ctx))
    .then((ctx) => parseManufacturerData(db, ctx))
    .then((ctx) => parseOptions(db, ctx))
    .then((ctx) => parseDefaults(db, ctx))
    .then(() => dbApi.dbCommit(db))
    .then(() => ctx)
}

exports.loadSilabsZcl = loadSilabsZcl

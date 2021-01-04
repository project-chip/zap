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
const fsp = fs.promises
const path = require('path')
const properties = require('properties')
const dbApi = require('../db/db-api.js')
const queryPackage = require('../db/query-package.js')
const queryZcl = require('../db/query-zcl.js')
const env = require('../util/env.js')
const bin = require('../util/bin.js')
const util = require('../util/util.js')
const dbEnum = require('../../src-shared/db-enum.js')
const zclLoader = require('./zcl-loader.js')
const _ = require('lodash')

/**
 * Promises to read the JSON file and resolve all the data.
 * @param {*} ctx  Context containing information about the file
 * @returns Promise of resolved file.
 */
function collectDataFromJsonFile(ctx) {
  env.logInfo(`Collecting ZCL files from JSON file: ${ctx.metadataFile}`)
  return new Promise((resolve, reject) => {
    var obj = JSON.parse(ctx.data)
    var f

    var fileLocations
    if (Array.isArray(obj.xmlRoot)) {
      fileLocations = obj.xmlRoot.map((p) =>
        path.join(path.dirname(ctx.metadataFile), p)
      )
    } else {
      fileLocations = [path.join(path.dirname(ctx.metadataFile), obj.xmlRoot)]
    }
    var zclFiles = []
    obj.xmlFile.forEach((xmlF) => {
      f = util.locateRelativeFilePath(fileLocations, xmlF)
      if (f != null) zclFiles.push(f)
    })

    ctx.zclFiles = zclFiles

    // Manufacturers XML file.
    f = util.locateRelativeFilePath(fileLocations, obj.manufacturersXml)
    if (f != null) ctx.manufacturersXml = f

    // Zcl XSD file
    f = util.locateRelativeFilePath(fileLocations, obj.zclSchema)
    if (f != null) ctx.zclSchema = f

    // Zcl Validation Script
    f = util.locateRelativeFilePath(fileLocations, obj.zclValidation)
    if (f != null) ctx.zclValidation = f

    // General options
    // Note that these values when put into OPTION_CODE will generally be converted to lowercase.
    if (obj.options) {
      ctx.options = obj.options
    }
    // Defaults. Note that the keys should be the categories that are listed for PACKAGE_OPTION, and the value should be the OPTION_CODE
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
        var f

        // Iterate over all XML files in the properties file, and check
        // if they exist in one or the other directory listed in xmlRoot
        zclProps.xmlFile.split(',').forEach((f) => {
          f = util.locateRelativeFilePath(fileLocations, f)
          if (f != null) zclFiles.push(f)
        })

        ctx.zclFiles = zclFiles
        // Manufacturers XML file.
        f = util.locateRelativeFilePath(
          fileLocations,
          zclProps.manufacturersXml
        )
        if (f != null) ctx.manufacturersXml = f

        // Zcl XSD file
        f = util.locateRelativeFilePath(fileLocations, zclProps.zclSchema)
        if (f != null) ctx.zclSchema = f

        // Zcl Validation Script
        f = util.locateRelativeFilePath(fileLocations, zclProps.zclValidation)
        if (f != null) ctx.zclValidation = f

        // General options
        // Note that these values when put into OPTION_CODE will generally be converted to lowercase.
        if (zclProps.options) {
          ctx.options = zclProps.options
        }
        // Defaults. Note that the keys should be the categories that are listed for PACKAGE_OPTION, and the value should be the OPTION_CODE
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
 * Silabs XML does not carry types with bitmap fields, but dotdot does, so they are in the schema.
 * Just to put some data in, we differentiate between "bool" and "enum" types here.
 *
 * @param {*} mask
 * @returns bool or corresponding enum
 */
function maskToType(mask) {
  var n = parseInt(mask)
  var bitCount = bin.bitCount(n)
  if (bitCount <= 1) {
    return 'bool'
  } else if (bitCount <= 8) {
    return 'enum8'
  } else if (bitCount <= 16) {
    return 'enum16'
  } else {
    return 'enum32'
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
    bm.field.forEach((field, index) => {
      ret.fields.push({
        name: field.$.name,
        mask: field.$.mask,
        type: maskToType(field.$.mask),
        ordinal: index,
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
    discrete: a.$.discrete == 'true' ? true : false,
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
 * Prepares global attribute data.
 *
 * @param {*} cluster
 * @returns Object containing the data from XML.
 */
function prepareClusterGlobalAttribute(cluster) {
  if ('globalAttribute' in cluster) {
    var ret = {}

    ret.code = parseInt(cluster.code[0], 16)
    if ('$' in cluster) {
      var mfgCode = cluster['$'].manufacturerCode
      if (mfgCode != null) ret.manufacturerCode = mfgCode
    }

    ret.globalAttribute = []
    cluster.globalAttribute.forEach((ga) => {
      if (ga.$.side == dbEnum.side.either) {
        ret.globalAttribute.push({
          code: parseInt(ga.$.code),
          side: dbEnum.side.client,
          value: ga.$.value,
        })
        ret.globalAttribute.push({
          code: parseInt(ga.$.code),
          side: dbEnum.side.server,
          value: ga.$.value,
        })
      } else {
        ret.globalAttribute.push({
          code: parseInt(ga.$.code),
          side: ga.$.side,
          value: ga.$.value,
        })
      }
    })
    return ret
  } else {
    return null
  }
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
      ret.code = parseInt(cluster.$.code)
    }
  } else {
    ret.code = parseInt(cluster.code[0])
    ret.name = cluster.name[0]
    ret.description = cluster.description[0].trim()
    ret.define = cluster.define[0]
    ret.domain = cluster.domain[0]
    ret.isSingleton = false
    if ('$' in cluster) {
      ret.manufacturerCode = cluster.$.manufacturerCode
      if (cluster.$.singleton == 'true') {
        ret.isSingleton = true
      }
    }
  }

  if ('command' in cluster) {
    ret.commands = []
    cluster.command.forEach((command) => {
      var cmd = {
        code: parseInt(command.$.code),
        manufacturerCode: command.$.manufacturerCode,
        name: command.$.name,
        description: command.description[0].trim(),
        source: command.$.source,
        isOptional: command.$.optional == 'true',
      }
      if ('arg' in command) {
        cmd.args = []
        command.arg.forEach((arg, index) => {
          cmd.args.push({
            name: arg.$.name,
            type: arg.$.type,
            isArray: arg.$.array == 'true' ? 1 : 0,
            presentIf: arg.$.presentIf,
            ordinal: index,
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
        code: parseInt(attribute.$.code),
        manufacturerCode: attribute.$.manufacturerCode,
        name: attribute._,
        type: attribute.$.type.toLowerCase(),
        side: attribute.$.side,
        define: attribute.$.define,
        min: attribute.$.min,
        max: attribute.$.max,
        minLength: 0,
        maxLength: attribute.$.length ? attribute.$.length : null,
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
 * Processes global attributes for insertion into the database.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} data
 * @returns Promise of inserted data.
 */
function processClusterGlobalAttributes(db, filePath, packageId, data) {
  var objs = []
  data.forEach((x) => {
    var p = prepareClusterGlobalAttribute(x)
    if (p != null) objs.push(p)
  })
  if (objs.length > 0) {
    return queryZcl.insertGlobalAttributeDefault(db, packageId, objs)
  } else {
    return null
  }
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
    struct.item.forEach((item, index) => {
      ret.items.push({
        name: item.$.name,
        type: item.$.type,
        ordinal: index,
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
    en.item.forEach((item, index) => {
      ret.items.push({
        name: item.$.name,
        value: item.$.value,
        ordinal: index,
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
      if ('atomic' in data.configurator) {
        immediatePromises.push(
          processAtomics(db, filePath, packageId, data.configurator.atomic)
        )
      }
      if ('bitmap' in data.configurator) {
        immediatePromises.push(
          processBitmaps(db, filePath, packageId, data.configurator.bitmap)
        )
      }
      if ('cluster' in data.configurator) {
        immediatePromises.push(
          processClusters(db, filePath, packageId, data.configurator.cluster)
        )
        laterPromises.push(() =>
          processClusterGlobalAttributes(
            db,
            filePath,
            packageId,
            data.configurator.cluster
          )
        )
      }
      if ('domain' in data.configurator) {
        immediatePromises.push(
          processDomains(db, filePath, packageId, data.configurator.domain)
        )
      }
      if ('enum' in data.configurator) {
        immediatePromises.push(
          processEnums(db, filePath, packageId, data.configurator.enum)
        )
      }
      if ('struct' in data.configurator) {
        immediatePromises.push(
          processStructs(db, filePath, packageId, data.configurator.struct)
        )
      }
      if ('deviceType' in data.configurator) {
        immediatePromises.push(
          processDeviceTypes(
            db,
            filePath,
            packageId,
            data.configurator.deviceType
          )
        )
      }
      if ('global' in data.configurator) {
        immediatePromises.push(
          processGlobals(db, filePath, packageId, data.configurator.global)
        )
      }
      if ('clusterExtension' in data.configurator) {
        laterPromises.push(() =>
          processClusterExtensions(
            db,
            filePath,
            packageId,
            data.configurator.clusterExtension
          )
        )
      }
    }
    // This thing resolves the immediate promises and then resolves itself with passing the later promises down the chain.
    return Promise.all(immediatePromises).then(() => laterPromises)
  }
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
  ctx.laterPromises = []
  env.logInfo(`Starting to parse ZCL files: ${ctx.zclFiles}`)
  return Promise.all(
    ctx.zclFiles.map((file) =>
      fsp
        .readFile(file)
        .then((data) => util.calculateCrc({ filePath: file, data: data }))
        .then((data) =>
          zclLoader.qualifyZclFile(
            db,
            data,
            ctx.packageId,
            dbEnum.packageType.zclXml
          )
        )
        .then((result) => zclLoader.parseZclFile(result))
        .then((result) => processParsedZclData(db, result))
        .then((laterPromises) => {
          laterPromises.flat(1).forEach((p) => ctx.laterPromises.push(p))
          return ctx
        })
        .catch((err) => env.logError(err))
    )
  )
    .then(() => ctx.laterPromises.map((promise) => promise()))
    .then((promiseArray) => Promise.all(promiseArray))
    .then(() => zclLoader.processZclPostLoading(db))
    .then(() => ctx)
}

/**
 * Parses the manufacturers xml.
 *
 * @param {*} db
 * @param {*} ctx
 * @returns Promise of a parsed manufacturers file.
 */
function parseManufacturerData(db, ctx) {
  if (!ctx.manufacturersXml) return Promise.resolve(ctx)
  return fsp
    .readFile(ctx.manufacturersXml)
    .then((data) =>
      zclLoader.parseZclFile({ data: data }).then((manufacturerMap) =>
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

/**
 * Parses the ZCL Schema
 * @param {*} db
 * @param {*} ctx
 */
function parseZclSchema(db, ctx) {
  if (!ctx.zclSchema || !ctx.zclValidation) return Promise.resolve(ctx)
  return fsp
    .readFile(ctx.zclSchema)
    .then((data) => util.calculateCrc({ filePath: ctx.zclSchema, data: data }))
    .then((data) =>
      zclLoader.qualifyZclFile(
        db,
        data,
        ctx.packageId,
        dbEnum.packageType.zclSchema
      )
    )
    .then((result) => {
      pkgId = result.packageId
      return result
    })
    .then(() =>
      fsp
        .readFile(ctx.zclValidation)
        .then((data) =>
          util.calculateCrc({ filePath: ctx.zclValidation, data: data })
        )
    )
    .then((data) => {
      zclLoader.qualifyZclFile(
        db,
        data,
        ctx.packageId,
        dbEnum.packageType.zclValidation
      )
    })
    .then(() => Promise.resolve(ctx))
}

/**
 * Parses and loads the text and boolean options.
 *
 * @param {*} db
 * @param {*} ctx
 * @returns promise of parsed options
 */
function parseOptions(db, ctx) {
  if (!ctx.options) return Promise.resolve(ctx)
  var promises = []
  promises.push(parseTextOptions(db, ctx.packageId, ctx.options.text))
  promises.push(parseBoolOptions(db, ctx.packageId, ctx.options.bool))
  return Promise.all(promises).then(() => ctx)
}

/**
 * Parses the text options.
 *
 * @param {*} db
 * @param {*} pkgRef
 * @param {*} textOptions
 * @returns Promise of a parsed text options.
 */
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

/**
 * Parses the boolean options.
 *
 * @param {*} db
 * @param {*} pkgRef
 * @param {*} booleanCategories
 * @returns Promise of a parsed boolean options.
 */
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
  return Promise.all(promises)
}

/**
 * Parses the default values inside the options.
 *
 * @param {*} db
 * @param {*} ctx
 * @returns Promised of parsed text and bool defaults.
 */
function parseDefaults(db, ctx) {
  if (!ctx.defaults) return Promise.resolve(ctx)
  var promises = []
  promises.push(parseTextDefaults(db, ctx.packageId, ctx.defaults.text))
  promises.push(parseBoolDefaults(db, ctx.packageId, ctx.defaults.bool))
  return Promise.all(promises).then(() => ctx)
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
          if (specificValue != null) return specificValue
          if (_.isNumber(txt)) {
            // Try to convert to hex.
            var hex = '0x' + txt.toString(16)
            return queryPackage.selectSpecificOptionValue(
              db,
              pkgRef,
              optionCategory,
              hex
            )
          } else {
            return specificValue
          }
        })
        .then((specificValue) => {
          if (specificValue == null) {
            throw `Default value for: ${optionCategory}/${txt} does not match an option.`
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
  return Promise.all(promises)
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
  return Promise.all(promises)
}

/**
 * Parses a single file.
 *
 * @param {*} db
 * @param {*} filePath
 * @returns Promise of a loaded file.
 */
function loadIndividualSilabsFile(db, filePath, boundValidator) {
  var pkgId
  return fsp
    .readFile(filePath)
    .then((data) => util.calculateCrc({ filePath: filePath, data: data }))
    .then((data) =>
      zclLoader.qualifyZclFile(
        db,
        data,
        null,
        dbEnum.packageType.zclXmlStandalone
      )
    )
    .then((result) => {
      pkgId = result.packageId
      return result
    })
    .then((result) => zclLoader.parseZclFile(result, boundValidator))
    .then((result) => {
      if (result.validation && result.validation.isValid == false) {
        throw new Error('Validation Failed')
      }
      return result
    })
    .then((result) => processParsedZclData(db, result))
    .then((laterPromises) =>
      Promise.all(laterPromises.flat(1).map((promise) => promise()))
    )
    .then(() => zclLoader.processZclPostLoading(db))
    .then(() => {
      return { packageId: pkgId }
    })
    .catch((err) => {
      return { err: err }
    })
}

/**
 * Toplevel function that loads the toplevel metafile
 * and orchestrates the promise chain.
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
    .then((ctx) => parseZclSchema(db, ctx))
    .then(() => dbApi.dbCommit(db))
    .then(() => ctx)
    .catch((err) => {
      env.logError(err)
      throw err
    })
}

exports.loadSilabsZcl = loadSilabsZcl
exports.loadIndividualSilabsFile = loadIndividualSilabsFile

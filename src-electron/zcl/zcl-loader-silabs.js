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
const queryLoader = require('../db/query-loader.js')
const env = require('../util/env')
const bin = require('../util/bin')
const util = require('../util/util.js')
const dbEnum = require('../../src-shared/db-enum.js')
const zclLoader = require('./zcl-loader.js')
const _ = require('lodash')

/**
 * Promises to read the JSON file and resolve all the data.
 * @param {*} ctx  Context containing information about the file
 * @returns Promise of resolved file.
 */
async function collectDataFromJsonFile(metadataFile, data) {
  env.logDebug(`Collecting ZCL files from JSON file: ${metadataFile}`)
  let obj = JSON.parse(data)
  let f
  let returnObject = {}

  let fileLocations
  if (Array.isArray(obj.xmlRoot)) {
    fileLocations = obj.xmlRoot.map((p) =>
      path.join(path.dirname(metadataFile), p)
    )
  } else {
    fileLocations = [path.join(path.dirname(metadataFile), obj.xmlRoot)]
  }
  let zclFiles = []
  obj.xmlFile.forEach((xmlF) => {
    f = util.locateRelativeFilePath(fileLocations, xmlF)
    if (f != null) zclFiles.push(f)
  })

  returnObject.zclFiles = zclFiles

  // Manufacturers XML file.
  f = util.locateRelativeFilePath(fileLocations, obj.manufacturersXml)
  if (f != null) returnObject.manufacturersXml = f

  // Profiles XML File
  f = util.locateRelativeFilePath(fileLocations, obj.profilesXml)
  if (f != null) returnObject.profilesXml = f

  // Zcl XSD file
  f = util.locateRelativeFilePath(fileLocations, obj.zclSchema)
  if (f != null) returnObject.zclSchema = f

  // Zcl Validation Script
  f = util.locateRelativeFilePath(fileLocations, obj.zclValidation)
  if (f != null) returnObject.zclValidation = f

  // General options
  // Note that these values when put into OPTION_CODE will generally be converted to lowercase.
  if (obj.options) {
    returnObject.options = obj.options
  }
  // Defaults. Note that the keys should be the categories that are listed for PACKAGE_OPTION, and the value should be the OPTION_CODE
  if (obj.defaults) {
    returnObject.defaults = obj.defaults
  }

  returnObject.version = obj.version
  returnObject.supportCustomZclDevice = obj.supportCustomZclDevice

  env.logDebug(
    `Resolving: ${returnObject.zclFiles}, version: ${returnObject.version}`
  )

  return returnObject
}

/**
 * Promises to read the properties file, extract all the actual xml files, and resolve with the array of files.
 *
 * @param {*} ctx Context which contains information about the propertiesFiles and data
 * @returns Promise of resolved files.
 */
async function collectDataFromPropertiesFile(metadataFile, data) {
  return new Promise((resolve, reject) => {
    env.logDebug(`Collecting ZCL files from properties file: ${metadataFile}`)

    let returnObject = {}

    properties.parse(data, { namespaces: true }, (err, zclProps) => {
      if (err) {
        env.logError(`Could not read file: ${metadataFile}`)
        reject(err)
      } else {
        let fileLocations = zclProps.xmlRoot
          .split(',')
          .map((p) => path.join(path.dirname(metadataFile), p))
        let zclFiles = []
        let f

        // Iterate over all XML files in the properties file, and check
        // if they exist in one or the other directory listed in xmlRoot
        zclProps.xmlFile.split(',').forEach((singleXmlFile) => {
          let fullPath = util.locateRelativeFilePath(
            fileLocations,
            singleXmlFile
          )
          if (fullPath != null) zclFiles.push(fullPath)
        })

        returnObject.zclFiles = zclFiles
        // Manufacturers XML file.
        f = util.locateRelativeFilePath(
          fileLocations,
          zclProps.manufacturersXml
        )
        if (f != null) returnObject.manufacturersXml = f

        // Profiles XML file.
        f = util.locateRelativeFilePath(fileLocations, zclProps.profilesXml)
        if (f != null) returnObject.profilesXml = f

        // Zcl XSD file
        f = util.locateRelativeFilePath(fileLocations, zclProps.zclSchema)
        if (f != null) returnObject.zclSchema = f

        // Zcl Validation Script
        f = util.locateRelativeFilePath(fileLocations, zclProps.zclValidation)
        if (f != null) returnObject.zclValidation = f

        // General options
        // Note that these values when put into OPTION_CODE will generally be converted to lowercase.
        if (zclProps.options) {
          returnObject.options = zclProps.options
        }
        // Defaults. Note that the keys should be the categories that are listed for PACKAGE_OPTION, and the value should be the OPTION_CODE
        if (zclProps.defaults) {
          returnObject.defaults = zclProps.defaults
        }
        returnObject.supportCustomZclDevice = zclProps.supportCustomZclDevice
        returnObject.version = zclProps.version
        env.logDebug(
          `Resolving: ${returnObject.zclFiles}, version: ${returnObject.version}`
        )
        resolve(returnObject)
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
  let n = parseInt(mask)
  let bitCount = bin.bitCount(n)
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
  let ret = { name: bm.$.name, type: bm.$.type }
  if ('field' in bm) {
    ret.fields = []
    bm.field.forEach((field, index) => {
      ret.fields.push({
        name: field.$.name,
        mask: parseInt(field.$.mask),
        type: maskToType(field.$.mask),
        fieldIdentifier: field.$.fieldId
          ? parseInt(field.$.fieldId)
          : index + 1,
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
async function processBitmaps(db, filePath, packageId, data) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} bitmaps.`)
  return queryLoader.insertBitmaps(
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
    id: parseInt(a.$.id),
    size: a.$.size,
    description: a.$.description,
    isDiscrete: a.$.discrete == 'true',
    isSigned: a.$.signed == 'true',
    isString: a.$.string == 'true',
    isLong: a.$.long == 'true',
    isChar: a.$.char == 'true',
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
async function processAtomics(db, filePath, packageId, data) {
  let types = data[0].type
  env.logDebug(`${filePath}, ${packageId}: ${types.length} atomic types.`)
  return queryLoader.insertAtomics(
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
    let ret = {}

    ret.code = parseInt(cluster.code[0], 16)
    if ('$' in cluster) {
      let mfgCode = cluster['$'].manufacturerCode
      if (mfgCode != null) ret.manufacturerCode = mfgCode
    }

    ret.globalAttribute = []
    cluster.globalAttribute.forEach((ga) => {
      let at = {
        code: parseInt(ga.$.code),
        value: ga.$.value,
      }

      if ('featureBit' in ga) {
        at.featureBit = ga.featureBit.map((fb) => {
          let content = fb._ != null ? fb._.toLowerCase() : null
          return {
            tag: fb.$.tag,
            bit: parseInt(fb.$.bit),
            value: content == '1' || content == 'true',
          }
        })
      }

      if (ga.$.side == dbEnum.side.either) {
        ret.globalAttribute.push(
          Object.assign({ side: dbEnum.side.client }, at)
        )
        ret.globalAttribute.push(
          Object.assign({ side: dbEnum.side.server }, at)
        )
      } else {
        ret.globalAttribute.push(Object.assign({ side: ga.$.side }, at))
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
  let ret = {
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
      if (cluster.$.manufacturerCode == null) {
        ret.manufacturerCode = null
      } else {
        ret.manufacturerCode = parseInt(cluster.$.manufacturerCode)
      }
      if (cluster.$.singleton == 'true') {
        ret.isSingleton = true
      }
      ret.introducedIn = cluster.$.introducedIn
      ret.removedIn = cluster.$.removedIn
    }
  }

  if ('tag' in cluster) {
    ret.tags = cluster.tag.map((tag) => prepareTag(tag))
  }

  if ('command' in cluster) {
    ret.commands = []
    cluster.command.forEach((command) => {
      let cmd = {
        code: parseInt(command.$.code),
        manufacturerCode: command.$.manufacturerCode,
        name: command.$.name,
        description: command.description[0].trim(),
        source: command.$.source,
        isOptional: command.$.optional == 'true',
        introducedIn: command.$.introducedIn,
        removedIn: command.$.removedIn,
        responseName: command.$.response == null ? null : command.$.response,
      }
      if (cmd.manufacturerCode == null) {
        cmd.manufacturerCode = ret.manufacturerCode
      } else {
        cmd.manufacturerCode = parseInt(cmd.manufacturerCode)
      }
      if ('arg' in command) {
        cmd.args = []
        command.arg.forEach((arg, index) => {
          // We are only including ones that are NOT removedIn
          if (arg.$.removedIn == null)
            cmd.args.push({
              name: arg.$.name,
              type: arg.$.type,
              isArray: arg.$.array == 'true' ? 1 : 0,
              presentIf: arg.$.presentIf,
              countArg: arg.$.countArg,
              fieldIdentifier: arg.$.fieldId
                ? parseInt(arg.$.fieldId)
                : index + 1,
              introducedIn: arg.$.introducedIn,
              removedIn: arg.$.removedIn,
            })
        })
      }
      ret.commands.push(cmd)
    })
  }
  if ('event' in cluster) {
    ret.events = []
    cluster.event.forEach((event) => {
      let ev = {
        code: parseInt(event.$.code),
        manufacturerCode: event.$.manufacturerCode,
        name: event.$.name,
        side: event.$.side,
        priority: event.$.priority,
        description: event.description[0].trim(),
        isOptional: event.$.optional == 'true',
      }
      if (ev.manufacturerCode == null) {
        ev.manufacturerCode = ret.manufacturerCode
      } else {
        ev.manufacturerCode = parseInt(ev.manufacturerCode)
      }
      if ('field' in event) {
        ev.fields = []
        event.field.forEach((field, index) => {
          if (field.$.removedIn == null) {
            ev.fields.push({
              name: field.$.name,
              type: field.$.type,
              fieldIdentifier: field.$.id ? parseInt(field.$.id) : index + 1,
              introducedIn: field.$.introducedIn,
              removedIn: field.$.removedIn,
            })
          }
        })
      }
      // We only add event if it does not have removedIn
      if (ev.removedIn == null) ret.events.push(ev)
    })
  }

  if ('attribute' in cluster) {
    ret.attributes = []
    cluster.attribute.forEach((attribute) => {
      let att = {
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
        reportMinInterval: attribute.$.reportMinInterval,
        reportMaxInterval: attribute.$.reportMaxInterval,
        reportableChange: attribute.$.reportableChange,
        reportableChangeLength: attribute.$.reportableChangeLength
          ? attribute.$.reportableChangeLength
          : null,
        isWritable: attribute.$.writable == 'true',
        defaultValue: attribute.$.default,
        isOptional: attribute.$.optional == 'true',
        isReportable: attribute.$.reportable == 'true',
        isSceneRequired: attribute.$.sceneRequired == 'true',
        introducedIn: attribute.$.introducedIn,
        removedIn: attribute.$.removedIn,
        entryType: attribute.$.entryType,
      }
      if (att.manufacturerCode == null) {
        att.manufacturerCode = ret.manufacturerCode
      } else {
        att.manufacturerCode = parseInt(att.manufacturerCode)
      }
      // If attribute has removedIn, then it's not valid any more in LATEST spec.
      if (att.removedIn == null) ret.attributes.push(att)
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
async function processClusters(db, filePath, packageId, data) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} clusters.`)
  return queryLoader.insertClusters(
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
  let objs = []
  data.forEach((x) => {
    let p = prepareClusterGlobalAttribute(x)
    if (p != null) objs.push(p)
  })
  if (objs.length > 0) {
    return queryLoader.insertGlobalAttributeDefault(db, packageId, objs)
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
async function processClusterExtensions(
  db,
  filePath,
  dataPackageId,
  knownPackages,
  data
) {
  env.logDebug(
    `${filePath}, ${dataPackageId}: ${data.length} cluster extensions.`
  )
  return queryLoader.insertClusterExtensions(
    db,
    dataPackageId,
    knownPackages,
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
async function processGlobals(db, filePath, packageId, data) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} globals.`)
  return queryLoader.insertGlobals(
    db,
    packageId,
    data.map((x) => prepareCluster(x, true))
  )
}

function prepareTag(tag) {
  return {
    name: tag.$.name,
    description: tag.$.description,
  }
}

/**
 * Processes the tags in the XML.
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} tags
 */
async function processTags(db, filePath, packageId, tags) {
  // <tag name="AB" description="Description"/>
  env.logDebug(`${filePath}, ${packageId}: ${tags.length} tags.`)
  let preparedTags = tags.map((x) => prepareTag(x))
  return queryLoader.insertTags(db, packageId, preparedTags, null)
}

/**
 * Convert domain from XMl to domain for DB.
 *
 * @param {*} domain
 * @returns Domain object for DB.
 */
function prepareDomain(domain) {
  let d = {
    name: domain.$.name,
    specCode: domain.$.spec,
    specDescription: `Latest ${domain.$.name} spec: ${domain.$.spec}`,
    specCertifiable: domain.$.certifiable == 'true',
  }
  if ('older' in domain) {
    d.older = domain.older.map((old) => {
      return {
        specCode: old.$.spec,
        specDescription: `Older ${domain.$.name} spec ${old.$.spec}`,
        specCertifiable: old.$.certifiable == 'true',
      }
    })
  }
  return d
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
async function processDomains(db, filePath, packageId, data) {
  // <domain name="ZLL" spec="zll-1.0-11-0037-10" dependsOn="zcl-1.0-07-5123-03">
  //    <older ....
  // </domain>
  env.logDebug(`${filePath}, ${packageId}: ${data.length} domains.`)
  let preparedDomains = data.map((x) => prepareDomain(x))
  let preparedSpecs = preparedDomains.filter((d) => d.specCode != null)
  let specIds = await queryLoader.insertSpecs(db, packageId, preparedSpecs)
  for (let i = 0; i < specIds.length; i++) {
    preparedDomains[i].specRef = specIds[i]
  }
  return queryLoader.insertDomains(db, packageId, preparedDomains)
}

/**
 * Prepares structs for the insertion into the database.
 *
 * @param {*} struct
 * @returns Object ready to insert into the database.
 */
function prepareStruct(struct) {
  let ret = {
    name: struct.$.name,
    cluster: [],
  }
  if ('cluster' in struct) {
    struct.cluster.forEach((cl) => {
      ret.cluster.push(parseInt(cl.$.code))
    })
  }
  if ('item' in struct) {
    ret.items = []
    struct.item.forEach((item, index) => {
      ret.items.push({
        name: item.$.name,
        type: item.$.type,
        fieldIdentifier: item.$.fieldId ? parseInt(item.$.fieldId) : index + 1,
        entryType: item.$.entryType,
        minLength: 0,
        maxLength: item.$.length ? item.$.length : null,
        isWritable: item.$.writable == 'true',
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
async function processStructs(db, filePath, packageId, data) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} structs.`)
  return queryLoader.insertStructs(
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
  let ret = {
    name: en.$.name,
    type: en.$.type,
    cluster: [],
  }
  if ('cluster' in en) {
    en.cluster.forEach((cl) => {
      ret.cluster.push(parseInt(cl.$.code))
    })
  }

  if ('item' in en) {
    ret.items = []
    en.item.forEach((item, index) => {
      ret.items.push({
        name: item.$.name,
        value: parseInt(item.$.value),
        fieldIdentifier: item.$.fieldId ? parseInt(item.$.fieldId) : index + 1,
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
async function processEnums(db, filePath, packageId, data) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} enums.`)
  return queryLoader.insertEnums(
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
  let ret = {
    code: parseInt(deviceType.deviceId[0]['_']),
    profileId: parseInt(deviceType.profileId[0]['_']),
    domain: deviceType.domain[0],
    name: deviceType.name[0],
    description: deviceType.typeName[0],
  }
  if ('clusters' in deviceType) {
    ret.clusters = []
    deviceType.clusters.forEach((cluster) => {
      if ('include' in cluster) {
        cluster.include.forEach((include) => {
          let attributes = []
          let commands = []
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
async function processDeviceTypes(db, filePath, packageId, data) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} deviceTypes.`)
  return queryLoader.insertDeviceTypes(
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
async function processParsedZclData(db, argument, previouslyKnownPackages) {
  let filePath = argument.filePath
  let data = argument.result
  let packageId = argument.packageId
  previouslyKnownPackages.add(packageId)
  let knownPackages = Array.from(previouslyKnownPackages)
  if (!('result' in argument)) {
    return []
  } else {
    let loadTagsAndDomains = []
    let loadClusters = []
    let loadTypes = []
    let loadGlobalAttributesAndClusterExtensions = []
    if ('configurator' in data) {
      if ('tag' in data.configurator) {
        loadTagsAndDomains.push(
          processTags(db, filePath, packageId, data.configurator.tag)
        )
      }
      if ('atomic' in data.configurator) {
        loadTypes.push(
          processAtomics(db, filePath, packageId, data.configurator.atomic)
        )
      }
      if ('bitmap' in data.configurator) {
        loadTypes.push(
          processBitmaps(db, filePath, packageId, data.configurator.bitmap)
        )
      }
      if ('cluster' in data.configurator) {
        loadClusters.push(
          processClusters(db, filePath, packageId, data.configurator.cluster)
        )
        loadGlobalAttributesAndClusterExtensions.push(() =>
          processClusterGlobalAttributes(
            db,
            filePath,
            packageId,
            data.configurator.cluster
          )
        )
      }
      if ('domain' in data.configurator) {
        loadTagsAndDomains.push(
          processDomains(db, filePath, packageId, data.configurator.domain)
        )
      }
      if ('enum' in data.configurator) {
        loadTypes.push(
          processEnums(db, filePath, packageId, data.configurator.enum)
        )
      }
      if ('struct' in data.configurator) {
        loadTypes.push(
          processStructs(db, filePath, packageId, data.configurator.struct)
        )
      }
      if ('deviceType' in data.configurator) {
        loadClusters.push(
          processDeviceTypes(
            db,
            filePath,
            packageId,
            data.configurator.deviceType
          )
        )
      }
      if ('global' in data.configurator) {
        loadClusters.push(
          processGlobals(db, filePath, packageId, data.configurator.global)
        )
      }
      if ('clusterExtension' in data.configurator) {
        loadGlobalAttributesAndClusterExtensions.push(() =>
          processClusterExtensions(
            db,
            filePath,
            packageId,
            knownPackages,
            data.configurator.clusterExtension
          )
        )
      }
    }
    // This thing resolves the immediate promises and then resolves itself with passing the later promises down the chain.
    await Promise.all(loadTagsAndDomains)
    await Promise.all(loadClusters)
    await Promise.all(loadTypes)
    return Promise.all(loadGlobalAttributesAndClusterExtensions)
  }
}

/**
 * This function is used for parsing each individual ZCL file at a grouped zcl file package level.
 * This should _not_ be used for custom XML addition due to custom xmls potentially relying on existing packges.
 * @param {*} db
 * @param {*} packageId
 * @param {*} file
 * @returns A promise for when the last stage of the loading pipeline finishes.
 */
async function parseSingleZclFile(db, packageId, file) {
  try {
    let fileContent = await fsp.readFile(file)
    let data = {
      filePath: file,
      data: fileContent,
      crc: util.checksum(fileContent),
    }
    let result = await zclLoader.qualifyZclFile(
      db,
      data,
      packageId,
      dbEnum.packageType.zclXml,
      false
    )
    if (result.data) {
      result.result = await util.parseXml(fileContent)
      delete result.data
    }
    return processParsedZclData(db, result, new Set())
  } catch (err) {
    err.message = `Error reading xml file: ${file}\n` + err.message
    throw err
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
async function parseZclFiles(db, packageId, zclFiles) {
  env.logDebug(`Starting to parse ZCL files: ${zclFiles}`)
  let individualFilePromise = zclFiles.map((file) =>
    parseSingleZclFile(db, packageId, file)
  )
  let individualResults = await Promise.all(individualFilePromise)
  let laterPromises = individualResults.flat(2)
  await Promise.all(laterPromises.map((promise) => promise()))
  return zclLoader.processZclPostLoading(db)
}

/**
 * Parses the manufacturers xml.
 *
 * @param {*} db
 * @param {*} ctx
 * @returns Promise of a parsed manufacturers file.
 */
async function parseManufacturerData(db, packageId, manufacturersXml) {
  let data = await fsp.readFile(manufacturersXml)

  let manufacturerMap = await util.parseXml(data)

  return queryPackage.insertOptionsKeyValues(
    db,
    packageId,
    dbEnum.packageOptionCategory.manufacturerCodes,
    manufacturerMap.map.mapping.map((datum) => {
      let mfgPair = datum['$']
      return { code: mfgPair['code'], label: mfgPair['translation'] }
    })
  )
}

/**
 * Parses the profiles xml.
 *
 * @param {*} db
 * @param {*} ctx
 * @returns Promise of a parsed profiles file.
 */
async function parseProfilesData(db, packageId, profilesXml) {
  let data = await fsp.readFile(profilesXml)

  let profilesMap = await util.parseXml(data)

  return queryPackage.insertOptionsKeyValues(
    db,
    packageId,
    dbEnum.packageOptionCategory.profileCodes,
    profilesMap.map.mapping.map((datum) => {
      let profilePair = datum['$']
      return { code: profilePair['code'], label: profilePair['translation'] }
    })
  )
}

/**
 * Parses the ZCL Schema
 * @param {*} db
 */
async function parseZclSchema(db, packageId, zclSchema, zclValidation) {
  let content = await fsp.readFile(zclSchema)
  let info = {
    filePath: zclSchema,
    data: content,
    crc: util.checksum(content),
  }
  await zclLoader.qualifyZclFile(
    db,
    info,
    packageId,
    dbEnum.packageType.zclSchema,
    false
  )
  content = await fsp.readFile(zclValidation)
  info = {
    filePath: zclValidation,
    data: content,
    crc: util.checksum(content),
  }

  return zclLoader.qualifyZclFile(
    db,
    info,
    packageId,
    dbEnum.packageType.zclValidation,
    false
  )
}

/**
 * Parses and loads the text and boolean options.
 *
 * @param {*} db
 * @returns promise of parsed options
 */
async function parseOptions(db, packageId, options) {
  let promises = []
  promises.push(parseTextOptions(db, packageId, options.text))
  promises.push(parseBoolOptions(db, packageId, options.bool))
  return Promise.all(promises)
}

/**
 * Parses the text options.
 *
 * @param {*} db
 * @param {*} pkgRef
 * @param {*} textOptions
 * @returns Promise of a parsed text options.
 */
async function parseTextOptions(db, pkgRef, textOptions) {
  if (!textOptions) return Promise.resolve()
  let promises = Object.keys(textOptions).map((optionKey) => {
    let val = textOptions[optionKey]
    let optionValues
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
async function parseBoolOptions(db, pkgRef, booleanCategories) {
  if (!booleanCategories) return Promise.resolve()
  let options
  if (Array.isArray(booleanCategories)) {
    options = booleanCategories
  } else {
    options = booleanCategories
      .split(',')
      .map((optionValue) => optionValue.trim())
  }
  let promises = []
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
async function parseDefaults(db, packageId, defaults) {
  let promises = []
  promises.push(parseTextDefaults(db, packageId, defaults.text))
  promises.push(parseBoolDefaults(db, packageId, defaults.bool))
  return Promise.all(promises)
}

async function parseTextDefaults(db, pkgRef, textDefaults) {
  if (!textDefaults) return Promise.resolve()

  let promises = []
  for (let optionCategory of Object.keys(textDefaults)) {
    let txt = textDefaults[optionCategory]
    promises.push(
      queryPackage
        .selectSpecificOptionValue(db, pkgRef, optionCategory, txt)
        .then((specificValue) => {
          if (specificValue != null) return specificValue
          if (_.isNumber(txt)) {
            // Try to convert to hex.
            let hex = '0x' + txt.toString(16)
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
  }
  return Promise.all(promises)
}

async function parseBoolDefaults(db, pkgRef, booleanCategories) {
  if (!booleanCategories) return Promise.resolve()

  let promises = []
  for (let optionCategory of Object.keys(booleanCategories)) {
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
  }
  return Promise.all(promises)
}

/**
 * Parses a single file. This function is used specifically
 * for adding a package through an existing session because of its reliance
 * on relating the new XML content to the packages associated with that session.
 * e.g. for ClusterExtensions.
 *
 * @param {*} db
 * @param {*} filePath
 * @returns Promise of a loaded file.
 */
async function loadIndividualSilabsFile(
  db,
  filePath,
  boundValidator,
  sessionId
) {
  try {
    let fileContent = await fsp.readFile(filePath)
    let data = {
      filePath: filePath,
      data: fileContent,
      crc: util.checksum(fileContent),
    }

    let result = await zclLoader.qualifyZclFile(
      db,
      data,
      null,
      dbEnum.packageType.zclXmlStandalone,
      true
    )
    let pkgId = result.packageId
    if (boundValidator != null && fileContent != null) {
      result.validation = boundValidator(fileContent)
    }
    if (result.data) {
      result.result = await util.parseXml(result.data)
      delete result.data
    }
    if (result.validation && result.validation.isValid == false) {
      throw new Error('Validation Failed')
    }
    let sessionPackages = await queryPackage.getSessionZclPackages(
      db,
      sessionId
    )
    let packageSet = new Set()
    sessionPackages.map((sessionPackage) => {
      packageSet.add(sessionPackage.packageRef)
    })
    let laterPromises = await processParsedZclData(db, result, packageSet)
    await Promise.all(
      laterPromises.flat(1).map((promise) => {
        if (promise != null && promise != undefined) return promise()
      })
    )
    await zclLoader.processZclPostLoading(db)
    return { succeeded: true, packageId: pkgId }
  } catch (err) {
    env.logError(`Error reading xml file: ${file}\n` + err.message)
    return { succeeded: false, err: err }
  }
}

/**
 * If custom device is supported, then this method creates it.
 *
 * @param {*} db
 * @param {*} ctx
 * @returns context
 */
async function processCustomZclDeviceType(db, packageId) {
  let customDeviceTypes = []
  customDeviceTypes.push({
    domain: dbEnum.customDevice.domain,
    code: dbEnum.customDevice.code,
    profileId: dbEnum.customDevice.profileId,
    name: dbEnum.customDevice.name,
    description: dbEnum.customDevice.description,
  })
  let existingCustomDevice = await queryZcl.selectDeviceTypeByCodeAndName(
    db,
    packageId,
    dbEnum.customDevice.code,
    dbEnum.customDevice.name
  )
  if (existingCustomDevice == null)
    await queryLoader.insertDeviceTypes(db, packageId, customDeviceTypes)
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
async function loadSilabsZcl(db, metafile, isJson = false) {
  let ctx = {
    metadataFile: metafile,
    db: db,
  }
  env.logDebug(`Loading Silabs zcl file: ${ctx.metadataFile}`)
  await dbApi.dbBeginTransaction(db)
  try {
    Object.assign(ctx, await util.readFileContentAndCrc(ctx.metadataFile))
    ctx.packageId = await zclLoader.recordToplevelPackage(
      db,
      ctx.metadataFile,
      ctx.crc
    )
    let ret
    if (isJson) {
      ret = await collectDataFromJsonFile(ctx.metadataFile, ctx.data)
    } else {
      ret = await collectDataFromPropertiesFile(ctx.metadataFile, ctx.data)
    }
    Object.assign(ctx, ret)
    if (ctx.version != null) {
      await zclLoader.recordVersion(db, ctx.packageId, ctx.version)
    }
    await parseZclFiles(db, ctx.packageId, ctx.zclFiles)
    if (ctx.manufacturersXml) {
      await parseManufacturerData(db, ctx.packageId, ctx.manufacturersXml)
    }
    if (ctx.profilesXml) {
      await parseProfilesData(db, ctx.packageId, ctx.profilesXml)
    }
    if (ctx.supportCustomZclDevice) {
      await processCustomZclDeviceType(db, ctx.packageId)
    }
    if (ctx.options) {
      await parseOptions(db, ctx.packageId, ctx.options)
    }
    if (ctx.defaults) {
      await parseDefaults(db, ctx.packageId, ctx.defaults)
    }
    if (ctx.zclSchema && ctx.zclValidation) {
      await parseZclSchema(db, ctx.packageId, ctx.zclSchema, ctx.zclValidation)
    }
  } catch (err) {
    env.logError(err)
    throw err
  } finally {
    dbApi.dbCommit(db)
  }
  return ctx
}

exports.loadSilabsZcl = loadSilabsZcl
exports.loadIndividualSilabsFile = loadIndividualSilabsFile

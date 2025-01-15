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
 * This module provides the APIs for ZCL/Data-Model loading.
 *
 * @module Loader API: Loader APIs
 */

const fs = require('fs')
const fsp = fs.promises
const path = require('path')
const properties = require('properties')
const dbApi = require('../db/db-api')
const queryPackage = require('../db/query-package')
const querySession = require('../db/query-session')
const queryDeviceType = require('../db/query-device-type')
const queryLoader = require('../db/query-loader')
const queryZcl = require('../db/query-zcl')
const env = require('../util/env')
const bin = require('../util/bin')
const util = require('../util/util')
const dbEnum = require('../../src-shared/db-enum')
const zclLoader = require('./zcl-loader')
const _ = require('lodash')
const querySessionNotification = require('../db/query-session-notification')
const queryPackageNotification = require('../db/query-package-notification')
const newDataModel = require('./zcl-loader-new-data-model')

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

  // General options
  // Note that these values when put into OPTION_CODE will generally be converted to lowercase.
  if (obj.options) {
    returnObject.options = obj.options
  }
  // Defaults. Note that the keys should be the categories that are listed for PACKAGE_OPTION, and the value should be the OPTION_CODE
  if (obj.defaults) {
    returnObject.defaults = obj.defaults
  }

  // Feature Flags
  if (obj.featureFlags) {
    returnObject.featureFlags = obj.featureFlags
  }

  if (obj.uiOptions) {
    returnObject.uiOptions = obj.uiOptions
  }
  // Default reportability.
  // `defaultReportable` was old thing that could be true or false.
  // We still honor it.
  returnObject.defaultReportingPolicy =
    dbEnum.reportingPolicy.defaultReportingPolicy

  if ('defaultReportable' in obj) {
    returnObject.defaultReportingPolicy = obj.defaultReportable
      ? dbEnum.reportingPolicy.suggested
      : dbEnum.reportingPolicy.optional
  }
  // Default reporting policy is the new thing that can be mandatory/optional/suggested/prohibited.
  // If it's missing, 'optional' is a default reporting policy.
  if ('defaultReportingPolicy' in obj) {
    returnObject.defaultReportingPolicy = dbEnum.reportingPolicy.resolve(
      obj.defaultReportingPolicy
    )
  }
  returnObject.version = obj.version
  returnObject.category = obj.category
  returnObject.description = obj.description
  returnObject.supportCustomZclDevice = obj.supportCustomZclDevice

  if ('listsUseAttributeAccessInterface' in obj) {
    returnObject.listsUseAttributeAccessInterface =
      obj.listsUseAttributeAccessInterface
  }

  if ('attributeAccessInterfaceAttributes' in obj) {
    returnObject.attributeAccessInterfaceAttributes =
      obj.attributeAccessInterfaceAttributes
  }
  if ('mandatoryDeviceTypes' in obj) {
    returnObject.mandatoryDeviceTypes = obj.mandatoryDeviceTypes
  }

  if ('ZCLDataTypes' in obj) {
    returnObject.ZCLDataTypes = obj.ZCLDataTypes
  } else {
    returnObject.ZCLDataTypes = [
      'ARRAY',
      'BITMAP',
      'ENUM',
      'NUMBER',
      'STRING',
      'STRUCT',
      'TYPEDEF'
    ]
  }

  if ('zcl' in obj) {
    returnObject.zcl = obj.zcl
  }

  // zcl.json can contain 'fabricHandling' toplevel key. It is expected
  // to look like this:
  //  "fabricHandling": {
  //    "automaticallyCreateFields": true,
  //    "indexFieldId": 254,
  //    "indexFieldName": "FabricIndex",
  //    "indexType": "fabric_idx"
  // },
  //
  // If this configuration is present, then special logic to automatically
  // add fabric index field to fabric-sensitive and fabric-scoped
  // things will kick in.
  //
  // If this field is not present then the special logic will not
  // happen.
  if ('fabricHandling' in obj) {
    returnObject.fabricHandling = obj.fabricHandling
  } else {
    returnObject.fabricHandling = {
      automaticallyCreateFields: false
    }
  }

  if ('newXmlFile' in obj) {
    returnObject.newXmlFile = obj.newXmlFile.map((f) =>
      path.join(path.dirname(metadataFile), f)
    )
  } else {
    returnObject.newXmlFile = []
  }

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

        // General options
        // Note that these values when put into OPTION_CODE will generally be converted to lowercase.
        if (zclProps.options) {
          returnObject.options = zclProps.options
        }
        // Defaults. Note that the keys should be the categories that are listed for PACKAGE_OPTION, and the value should be the OPTION_CODE
        if (zclProps.defaults) {
          returnObject.defaults = zclProps.defaults
        }

        // Feature Flags
        if (zclProps.featureFlags) {
          returnObject.featureFlags = zclProps.featureFlags
        }

        returnObject.supportCustomZclDevice = zclProps.supportCustomZclDevice
        returnObject.version = zclProps.version
        returnObject.description = zclProps.description
        returnObject.category = zclProps.category
        // Don't bother with allowing this in the properties file.
        // It's legacy only.
        returnObject.fabricHandling = {
          automaticallyCreateFields: false
        }
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
    isComposite: a.$.composite == 'true',
    isSigned: a.$.signed == 'true',
    isString:
      a.$.string == 'true' ||
      a.$.name.toLowerCase() == 'char_string' ||
      a.$.name.toLowerCase() == 'long_char_string' ||
      a.$.name.toLowerCase() == 'octet_string' ||
      a.$.name.toLowerCase() == 'long_octet_string',
    isLong:
      a.$.long == 'true' ||
      a.$.name.toLowerCase() == 'long_char_string' ||
      a.$.name.toLowerCase() == 'long_octet_string',
    isChar:
      a.$.char == 'true' ||
      a.$.name.toLowerCase() == 'char_string' ||
      a.$.name.toLowerCase() == 'long_char_string',
    isFloat:
      a.$.float == 'true' ||
      a.$.name.toLowerCase() === 'single' ||
      a.$.name.toLowerCase() === 'double' ||
      a.$.name.toLowerCase() === 'float',
    baseType: a.$.baseType
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
        value: ga.$.value
      }

      if ('featureBit' in ga) {
        at.featureBit = ga.featureBit.map((fb) => {
          let content = fb._ != null ? fb._.toLowerCase() : null
          return {
            tag: fb.$.tag,
            bit: parseInt(fb.$.bit),
            value: content == '1' || content == 'true'
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
 * Extract access information
 * @param {*} ac
 * @returns access tag information
 */
function extractAccessTag(ac) {
  let e = {
    op: ac.$.op,
    role: ac.$.role,
    modifier: ac.$.modifier
  }
  if ('privilege' in ac.$) {
    e.role = ac.$.privilege
  }
  return e
}

/**
 * Extract list of access information
 * @param {*} xmlElement
 * @returns array of access information
 */
function extractAccessIntoArray(xmlElement) {
  let accessArray = []
  if ('access' in xmlElement) {
    for (const ac of xmlElement.access) {
      accessArray.push(extractAccessTag(ac))
    }
  }
  return accessArray
}

/**
 * Prepare XML cluster for insertion into the database.
 * This method can also prepare clusterExtensions.
 *
 * @param {*} cluster
 * @returns Object containing all data from XML.
 */
function prepareCluster(cluster, context, isExtension = false) {
  let ret = {
    isExtension: isExtension
  }

  if (isExtension) {
    if ('$' in cluster && 'code' in cluster.$) {
      ret.code = parseInt(cluster.$.code)
    }
  } else {
    ret.code = parseInt(cluster.code[0])
    ret.name = cluster.name[0]
    ret.description = cluster.description ? cluster.description[0].trim() : ''
    ret.define = cluster.define[0]
    // handle domain data parsed from both formats:
    // <domain>General</domain> and <domain name="General"/>
    if (cluster.domain[0] && cluster.domain[0].$) {
      ret.domain = cluster.domain[0].$.name
    } else {
      ret.domain = cluster.domain[0]
    }
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
      ret.apiMaturity = cluster.$.apiMaturity
    }
  }

  if ('tag' in cluster) {
    ret.tags = cluster.tag.map((tag) => prepareTag(tag))
  }

  if ('command' in cluster) {
    ret.commands = []
    cluster.command.forEach((command) => {
      let quality = null
      if ('quality' in command) {
        quality = command.quality[0].$
      }
      let cmd = {
        code: parseInt(command.$.code),
        manufacturerCode: command.$.manufacturerCode,
        name: command.$.name,
        description: command.description ? command.description[0].trim() : '',
        source: command.$.source,
        isOptional: command.$.optional == 'true' ? true : false,
        conformance: parseConformanceFromXML(command),
        mustUseTimedInvoke: command.$.mustUseTimedInvoke == 'true',
        introducedIn: command.$.introducedIn,
        removedIn: command.$.removedIn,
        responseName: command.$.response == null ? null : command.$.response,
        isDefaultResponseEnabled:
          command.$.disableDefaultResponse == 'true' ? false : true,
        isFabricScoped: command.$.isFabricScoped == 'true',
        isLargeMessage: quality ? quality.largeMessage == 'true' : false
      }
      cmd.access = extractAccessIntoArray(command)
      if (cmd.manufacturerCode == null) {
        cmd.manufacturerCode = ret.manufacturerCode
      } else {
        cmd.manufacturerCode = parseInt(cmd.manufacturerCode)
      }
      if ('arg' in command) {
        cmd.args = []
        let lastFieldId = -1
        command.arg.forEach((arg) => {
          let defaultFieldId = lastFieldId + 1
          lastFieldId = arg.$.fieldId ? parseInt(arg.$.fieldId) : defaultFieldId
          // We are only including ones that are NOT removedIn
          if (arg.$.removedIn == null)
            cmd.args.push({
              name: arg.$.name,
              type: arg.$.type,
              min: arg.$.min,
              max: arg.$.max,
              minLength: 0,
              maxLength: arg.$.length ? arg.$.length : null,
              isArray: arg.$.array == 'true' ? 1 : 0,
              presentIf: arg.$.presentIf,
              isNullable: arg.$.isNullable == 'true' ? true : false,
              isOptional:
                arg.$.optional == 'true' || arg.$.optional == '1'
                  ? true
                  : false,
              countArg: arg.$.countArg,
              fieldIdentifier: lastFieldId,
              introducedIn: arg.$.introducedIn,
              removedIn: arg.$.removedIn
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
        conformance: parseConformanceFromXML(event),
        priority: event.$.priority,
        description: event.description ? event.description[0].trim() : '',
        isOptional: event.$.optional == 'true',
        isFabricSensitive: event.$.isFabricSensitive == 'true'
      }
      ev.access = extractAccessIntoArray(event)
      if (ev.manufacturerCode == null) {
        ev.manufacturerCode = ret.manufacturerCode
      } else {
        ev.manufacturerCode = parseInt(ev.manufacturerCode)
      }
      if ('field' in event) {
        ev.fields = []
        let lastFieldId = -1
        event.field.forEach((field) => {
          let defaultFieldId = lastFieldId + 1
          lastFieldId = field.$.id ? parseInt(field.$.id) : defaultFieldId
          if (field.$.removedIn == null) {
            ev.fields.push({
              name: field.$.name,
              type: field.$.type,
              isArray: field.$.array == 'true' ? 1 : 0,
              isNullable: field.$.isNullable == 'true' ? true : false,
              isOptional: field.$.optional == 'true' ? true : false,
              fieldIdentifier: lastFieldId,
              introducedIn: field.$.introducedIn,
              removedIn: field.$.removedIn
            })
          }
        })
      }
      if (
        context.fabricHandling &&
        context.fabricHandling.automaticallyCreateFields &&
        ev.isFabricSensitive
      ) {
        if (!ev.fields) {
          ev.fields = []
        }
        ev.fields.push({
          name: context.fabricHandling.indexFieldName,
          type: context.fabricHandling.indexType,
          isArray: false,
          isNullable: false,
          isOptional: false,
          fieldIdentifier: context.fabricHandling.indexFieldId,
          introducedIn: null,
          removedIn: null
        })
      }

      // We only add event if it does not have removedIn
      if (ev.removedIn == null) ret.events.push(ev)
    })
  }

  if ('attribute' in cluster) {
    ret.attributes = []
    cluster.attribute.forEach((attribute) => {
      let name = attribute._
      let quality = null
      if (attribute.$ && name == null) {
        name = attribute.$.name
      }
      if ('description' in attribute && name == null) {
        name = attribute.description.join('')
      }
      if ('quality' in attribute) {
        quality = attribute.quality[0].$
      }
      let reportingPolicy = context.defaultReportingPolicy
      if (attribute.$.reportable == 'true') {
        reportingPolicy = dbEnum.reportingPolicy.suggested
      } else if (attribute.$.reportable == 'false') {
        reportingPolicy = dbEnum.reportingPolicy.optional
      } else if (attribute.$.reportingPolicy != null) {
        reportingPolicy = dbEnum.reportingPolicy.resolve(
          attribute.$.reportingPolicy
        )
      }
      let storagePolicy = dbEnum.storagePolicy.any
      if (context.listsUseAttributeAccessInterface && attribute.$.entryType) {
        storagePolicy = dbEnum.storagePolicy.attributeAccessInterface
      } else if (
        context.attributeAccessInterfaceAttributes &&
        context.attributeAccessInterfaceAttributes[cluster.name] &&
        context.attributeAccessInterfaceAttributes[cluster.name].includes(name)
      ) {
        storagePolicy = dbEnum.storagePolicy.attributeAccessInterface
      }
      let att = {
        code: parseInt(attribute.$.code),
        manufacturerCode: attribute.$.manufacturerCode,
        name: name,
        type:
          attribute.$.type.toUpperCase() == attribute.$.type
            ? attribute.$.type.toLowerCase()
            : attribute.$.type,
        side: attribute.$.side,
        define: attribute.$.define,
        conformance: parseConformanceFromXML(attribute),
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
        reportingPolicy: reportingPolicy,
        storagePolicy: storagePolicy,
        isSceneRequired:
          attribute.$.sceneRequired == 'true' ||
          (quality != null && quality.scene == 'true'),
        introducedIn: attribute.$.introducedIn,
        removedIn: attribute.$.removedIn,
        isNullable: attribute.$.isNullable == 'true' ? true : false,
        entryType: attribute.$.entryType,
        mustUseTimedWrite: attribute.$.mustUseTimedWrite == 'true',
        apiMaturity: attribute.$.apiMaturity,
        isChangeOmitted: quality ? quality.changeOmitted == 'true' : false,
        persistence: quality ? quality.persistence : null
      }
      att.access = extractAccessIntoArray(attribute)
      if (att.manufacturerCode == null) {
        att.manufacturerCode = ret.manufacturerCode
      } else {
        att.manufacturerCode = parseInt(att.manufacturerCode)
      }
      // Setting max length for string type attributes when not specified by
      // the xml.
      if (
        att.type &&
        (att.type.toLowerCase() == 'long_octet_string' ||
          att.type.toLowerCase() == 'long_char_string') &&
        (att.maxLength == 0 || !att.maxLength)
      ) {
        if (context.category == 'zigbee') {
          // Setting the max length for long strings to 253 instead of 65534
          // if not already set by xml.
          env.logWarning(
            'Long string max length not set for ' +
              att.name +
              ' in xml. \
          Currently defaulting to a max length of 253 for long strings instead of 65534 \
          for space conservation and no support available for long strings in zigbee pro.'
          )
          att.maxLength = 253
        } else {
          // Setting the max length for long strings to 1024 instead of 65534
          // if not already set by xml.
          env.logWarning(
            'Long string max length not set for ' +
              att.name +
              ' in xml. \
          Currently defaulting to a max length of 1024 for long strings instead of 65534 \
          for space conservation.'
          )
          att.maxLength = 1024
        }
      }
      if (
        att.type &&
        (att.type.toLowerCase() == 'octet_string' ||
          att.type.toLowerCase() == 'char_string') &&
        (att.maxLength == 0 || !att.maxLength)
      ) {
        att.maxLength = 254
      }
      // If attribute has removedIn, then it's not valid any more in LATEST spec.
      if (att.removedIn == null) ret.attributes.push(att)
    })
  }

  if ('features' in cluster) {
    ret.features = []
    cluster.features[0].feature.forEach((feature) => {
      let f = {
        name: feature.$.name,
        code: feature.$.code,
        bit: feature.$.bit,
        defaultValue: feature.$.default,
        description: feature.$.summary,
        conformance: parseConformanceFromXML(feature)
      }

      ret.features.push(f)
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
async function processClusters(db, filePath, packageId, data, context) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} clusters.`)

  // We prepare clusters, but we ignore the ones that have already been loaded.
  let preparedClusters = data
    .map((x) => prepareCluster(x, context))
    .filter((cluster) => {
      if (
        context.clustersLoadedFromNewFiles &&
        context.clustersLoadedFromNewFiles.includes(cluster.code)
      ) {
        env.logDebug(
          `Bypassing loading of cluster ${cluster.code} from old files.`
        )
        return false
      } else {
        return true
      }
    })

  // and then run the DB process.
  return queryLoader.insertClusters(db, packageId, preparedClusters)
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
  data,
  context
) {
  env.logDebug(
    `${filePath}, ${dataPackageId}: ${data.length} cluster extensions.`
  )
  return queryLoader.insertClusterExtensions(
    db,
    dataPackageId,
    knownPackages,
    data.map((x) => prepareCluster(x, context, true))
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
async function processGlobals(db, filePath, packageId, data, context) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} globals.`)
  return queryLoader.insertGlobals(
    db,
    packageId,
    data.map((x) => prepareCluster(x, context, true))
  )
}

/**
 * Prepare tag object from tag
 * @param {*} tag
 * @returns tag information
 */
function prepareTag(tag) {
  return {
    name: tag.$.name,
    description: tag.$.description
  }
}

/**
 * Process defaultAccess tag in the XML.
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} defaultAccessList
 */
async function processDefaultAccess(
  db,
  filePath,
  packageId,
  defaultAccessList
) {
  let p = []
  for (const da of defaultAccessList) {
    let type = {
      type: da.$.type,
      access: []
    }
    for (const ac of da.access) {
      type.access.push(extractAccessTag(ac))
    }
    p.push(queryLoader.insertDefaultAccess(db, packageId, type))
  }
  return Promise.all(p)
}

/**
 * Process accessControl tag in the XML.
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} accessControlList
 */
async function processAccessControl(
  db,
  filePath,
  packageId,
  accessControlList
) {
  let operations = []
  let roles = []
  let accessModifiers = []

  for (const ac of accessControlList) {
    if ('operation' in ac) {
      for (const op of ac.operation) {
        operations.push({
          name: op.$.type,
          description: op.$.description
        })
      }
    }
    if ('role' in ac) {
      for (const role of ac.role) {
        roles.push({
          name: role.$.type,
          description: role.$.description,
          level: roles.length
        })
      }
    }
    if ('privilege' in ac) {
      for (const role of ac.privilege) {
        roles.push({
          name: role.$.type,
          description: role.$.description,
          level: roles.length
        })
      }
    }
    if ('modifier' in ac) {
      for (const modifier of ac.modifier) {
        accessModifiers.push({
          name: modifier.$.type,
          description: modifier.$.description
        })
      }
    }
  }

  let p = []
  p.push(queryLoader.insertAccessRoles(db, packageId, roles))
  p.push(queryLoader.insertAccessOperations(db, packageId, operations))
  p.push(queryLoader.insertAccessModifiers(db, packageId, accessModifiers))
  return Promise.all(p)
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
    specCertifiable: domain.$.certifiable == 'true'
  }
  if ('older' in domain) {
    d.older = domain.older.map((old) => {
      return {
        specCode: old.$.spec,
        specDescription: `Older ${domain.$.name} spec ${old.$.spec}`,
        specCertifiable: old.$.certifiable == 'true'
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
 * Prepare Data Type Discriminator for database table insertion.
 *
 * @param {*} a
 * @returns An Object
 */
function prepareDataTypeDiscriminator(a) {
  return {
    name: a.name,
    id: a.id
  }
}

/**
 * Processes Data Type Discriminator.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} zclDataTypes
 * @returns Promise of inserted Data Type Discriminators.
 */
async function processDataTypeDiscriminator(db, packageId, zclDataTypes) {
  // Loading the Data Types using ZCLDataTypes mentioned in zcl.json metadata
  // file
  let types = zclDataTypes.map((x, index) => {
    return { id: index + 1, name: x }
  })
  env.logDebug(`${packageId}: ${types.length} Data Type Discriminator.`)
  return queryLoader.insertDataTypeDiscriminator(
    db,
    packageId,
    types.map((x) => prepareDataTypeDiscriminator(x))
  )
}

/**
 * Prepare Data Types for database table insertion.
 *
 * @param {*} a
 * @param {*} dataType
 * @param {*} typeMap
 * @returns An Object
 */
function prepareDataType(a, dataType, typeMap) {
  let dataTypeRef = 0
  // The following is when the dataType is atomic
  if (!dataType && a.$.name.toLowerCase().includes(dbEnum.zclType.bitmap)) {
    dataTypeRef = typeMap.get(dbEnum.zclType.bitmap)
  } else if (
    !dataType &&
    a.$.name.toLowerCase().includes(dbEnum.zclType.enum)
  ) {
    dataTypeRef = typeMap.get(dbEnum.zclType.enum)
  } else if (
    !dataType &&
    a.$.name.toLowerCase().includes(dbEnum.zclType.string)
  ) {
    dataTypeRef = typeMap.get(dbEnum.zclType.string)
  } else if (
    !dataType &&
    a.$.name.toLowerCase().includes(dbEnum.zclType.struct)
  ) {
    dataTypeRef = typeMap.get(dbEnum.zclType.struct)
  } else if (
    !dataType &&
    a.$.name.toLowerCase().includes(dbEnum.zclType.typedef)
  ) {
    dataTypeRef = typeMap.get(dbEnum.zclType.typedef)
  } else if (!dataType) {
    dataTypeRef = typeMap.get(dbEnum.zclType.number)
  }
  return {
    name: a.$.name,
    id: parseInt(a.$.id),
    description: a.$.description ? a.$.description : a.$.name,
    discriminator_ref: dataType ? dataType : dataTypeRef,
    cluster_code: a.cluster
      ? a.cluster
      : a.$.cluster_code
        ? [{ $: { code: a.$.cluster_code[0] } }]
        : null // else case: Treating features in a cluster as a bitmap
  }
}

/**
 * Processes Data Type.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 * @param {*} dataType
 * @returns Promise of inserted Data Types into the Data Type table.
 */
async function processDataType(
  db,
  filePath,
  packageId,
  knownPackages,
  data,
  dataType
) {
  let typeMap = await zclLoader.getDiscriminatorMap(db, knownPackages)

  if (dataType == dbEnum.zclType.atomic) {
    let types = data[0].type
    env.logDebug(`${filePath}, ${packageId}: ${data.length} Atomic Data Types.`)
    return queryLoader.insertDataType(
      db,
      packageId,
      types.map((x) => prepareDataType(x, 0, typeMap))
    )
  } else if (dataType == dbEnum.zclType.enum) {
    env.logDebug(`${filePath}, ${packageId}: ${data.length} Enum Data Types.`)
    return queryLoader.insertDataType(
      db,
      packageId,
      data.map((x) =>
        prepareDataType(x, typeMap.get(dbEnum.zclType.enum), typeMap)
      )
    )
  } else if (dataType == dbEnum.zclType.bitmap) {
    env.logDebug(`${filePath}, ${packageId}: ${data.length} Bitmap Data Types.`)
    return queryLoader.insertDataType(
      db,
      packageId,
      data.map((x) =>
        prepareDataType(x, typeMap.get(dbEnum.zclType.bitmap), typeMap)
      )
    )
  } else if (dataType == dbEnum.zclType.struct) {
    env.logDebug(`${filePath}, ${packageId}: ${data.length} Struct Data Types.`)
    return queryLoader.insertDataType(
      db,
      packageId,
      data.map((x) =>
        prepareDataType(x, typeMap.get(dbEnum.zclType.struct), typeMap)
      )
    )
  } else if (dataType == dbEnum.zclType.string) {
    env.logDebug(`${filePath}, ${packageId}: ${data.length} String Data Types.`)
    return queryLoader.insertDataType(
      db,
      packageId,
      data.map((x) =>
        prepareDataType(x, typeMap.get(dbEnum.zclType.string), typeMap)
      )
    )
  } else if (dataType == dbEnum.zclType.typedef) {
    env.logDebug(`${filePath}, ${packageId}: ${data.length} Typedef Types.`)
    return queryLoader.insertDataType(
      db,
      packageId,
      data.map((x) =>
        prepareDataType(x, typeMap.get(dbEnum.zclType.typedef), typeMap)
      )
    )
  } else {
    env.logError(
      'Could not find the discriminator for the data type: ' + dataType
    )
    queryPackageNotification.setNotification(
      dnb,
      'ERROR',
      'Could not find the discriminator for the data type: ' + dataType,
      packageId,
      1
    )
  }
}

/**
 * Prepare numbers for database table insertion.
 *
 * @param {*} a
 * @param {*} dataType
 * @returns An Object
 */
function prepareNumber(a, dataType) {
  // Adding explicit exceptions for signed types when xml does not specify it
  let isSignedException = false
  if (
    (!('signed' in a.$) && a.$.name.toLowerCase() == 'single') ||
    a.$.name.toLowerCase() == 'double'
  ) {
    isSignedException = true
  }
  return {
    size: a.$.size,
    is_signed:
      'signed' in a.$
        ? a.$.signed.toLowerCase() === 'true'
          ? 1
          : 0
        : isSignedException || /^int[0-9]{1,2}s?$/.test(a.$.name)
          ? 1
          : 0,
    name: a.$.name,
    cluster_code: a.cluster ? a.cluster : null,
    discriminator_ref: dataType
  }
}

/**
 * Processes Numbers.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 * @returns Promise of inserted numbers into the number table.
 */
async function processNumber(db, filePath, packageId, knownPackages, data) {
  let typeMap = await zclLoader.getDiscriminatorMap(db, knownPackages)
  let numbers = data[0].type.filter(function (item) {
    return (
      !item.$.name.toLowerCase().includes(dbEnum.zclType.bitmap) &&
      !item.$.name.toLowerCase().includes(dbEnum.zclType.enum) &&
      !item.$.name.toLowerCase().includes(dbEnum.zclType.string) &&
      !item.$.name.toLowerCase().includes(dbEnum.zclType.struct)
    )
  })
  env.logDebug(`${filePath}, ${packageId}: ${data.length} Number Types.`)
  return queryLoader.insertNumber(
    db,
    packageId,
    numbers.map((x) => prepareNumber(x, typeMap.get(dbEnum.zclType.number)))
  )
}

/**
 * Prepare strings for database table insertion.
 *
 * @param {*} a
 * @param {*} dataType
 * @returns An Object
 */
function prepareString(a, dataType) {
  return {
    is_long: a.$.long && a.$.long.toLowerCase() == 'true' ? 1 : 0,
    size: a.$.size,
    is_char: 0,
    name: a.$.name,
    cluster_code: a.cluster ? a.cluster : null,
    discriminator_ref: dataType
  }
}

/**
 * Processes Strings.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 * @returns Promise of inserted strings into the String table.
 */
async function processString(db, filePath, packageId, knownPackages, data) {
  let typeMap = await zclLoader.getDiscriminatorMap(db, knownPackages)
  let strings = data[0].type.filter(function (item) {
    return (
      (item.$.string && item.$.string.toLowerCase() == 'true') ||
      (item.$.name && item.$.name.toLowerCase().includes('string'))
    )
  })
  env.logDebug(`${filePath}, ${packageId}: ${data.length} String Types.`)
  return queryLoader.insertString(
    db,
    packageId,
    strings.map((x) => prepareString(x, typeMap.get(dbEnum.zclType.string)))
  )
}

/**
 * Prepare enums or bitmaps for database table insertion.
 *
 * @param {*} a
 * @param {*} dataType
 * @returns An Object
 */
function prepareEnumOrBitmapAtomic(a, dataType) {
  return {
    size: a.$.size,
    name: a.$.name,
    cluster_code: a.cluster ? a.cluster : null,
    discriminator_ref: dataType
  }
}

/**
 * Processes the enums.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 * @returns A promise of inserted enums.
 */
async function processEnumAtomic(db, filePath, packageId, knownPackages, data) {
  let typeMap = await zclLoader.getDiscriminatorMap(db, knownPackages)
  let enums = data[0].type.filter(function (item) {
    return item.$.name.toLowerCase().includes('enum')
  })
  env.logDebug(`${filePath}, ${packageId}: ${data.length} Baseline Enum Types.`)
  return queryLoader.insertEnumAtomic(
    db,
    packageId,
    enums.map((x) =>
      prepareEnumOrBitmapAtomic(x, typeMap.get(dbEnum.zclType.enum))
    )
  )
}

/**
 * Prepare enums or bitmaps for database table insertion.
 *
 * @param {*} a
 * @param {*} dataType
 * @returns An Object
 */
function prepareEnumOrBitmap(db, packageId, a, dataType, typeMap) {
  // Taking care of a typo for backwards compatibility
  // for eg <enum name="Status" type="INT8U" i.e. an enum defined as int8u
  let enumIndex = typeMap.get(dbEnum.zclType.enum)
  if (
    dataType == enumIndex &&
    (a.$.type.toLowerCase().includes('int') ||
      a.$.type.toLowerCase().includes(dbEnum.zclType.bitmap))
  ) {
    let message =
      'Check type contradiction in XML metadata for ' +
      a.$.name +
      ' with type ' +
      a.$.type
    env.logWarning(message)
    queryPackageNotification.setNotification(
      db,
      'WARNING',
      message,
      packageId,
      2
    )
    a.$.type = 'enum' + a.$.type.toLowerCase().match(/\d+/g).join('')
  }
  return {
    name: a.$.name,
    type: a.$.type.toLowerCase(),
    cluster_code: a.cluster
      ? a.cluster
      : a.$.cluster_code
        ? [{ $: { code: a.$.cluster_code[0] } }]
        : null, // else case: Treating features in a cluster as a bitmap
    discriminator_ref: dataType
  }
}

/**
 * Processes the enums.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 * @returns A promise of inserted enums.
 */
async function processEnum(db, filePath, packageId, knownPackages, data) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} Enum Types.`)
  let typeMap = await zclLoader.getDiscriminatorMap(db, knownPackages)
  return queryLoader.insertEnum(
    db,
    knownPackages,
    data.map((x) =>
      prepareEnumOrBitmap(
        db,
        packageId,
        x,
        typeMap.get(dbEnum.zclType.enum),
        typeMap
      )
    )
  )
}

/**
 * Processes the enum Items.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 * @returns A promise of inserted enum items.
 */
async function processEnumItems(db, filePath, packageId, knownPackages, data) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} Enum Items.`)
  let enumItems = []
  let lastFieldId = -1
  data.forEach((e) => {
    if ('item' in e) {
      e.item.forEach((item) => {
        let defaultFieldId = lastFieldId + 1
        lastFieldId = item.$.fieldId ? parseInt(item.$.fieldId) : defaultFieldId
        enumItems.push({
          enumName: e.$.name,
          enumClusterCode: e.cluster ? e.cluster : null,
          name: item.$.name,
          value: parseInt(item.$.value),
          fieldIdentifier: lastFieldId
        })
      })
    }
  })
  return queryLoader.insertEnumItems(db, packageId, knownPackages, enumItems)
}

/**
 * Processes the bitmaps.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 * @returns A promise of inserted bitmaps.
 */
async function processBitmapAtomic(
  db,
  filePath,
  packageId,
  knownPackages,
  data
) {
  let typeMap = await zclLoader.getDiscriminatorMap(db, knownPackages)
  let bitmaps = data[0].type.filter(function (item) {
    return item.$.name.toLowerCase().includes(dbEnum.zclType.bitmap)
  })
  env.logDebug(
    `${filePath}, ${packageId}: ${data.length} Baseline Bitmap Types.`
  )
  return queryLoader.insertBitmapAtomic(
    db,
    packageId,
    bitmaps.map((x) =>
      prepareEnumOrBitmapAtomic(x, typeMap.get(dbEnum.zclType.bitmap))
    )
  )
}

/**
 * Processes the bitmaps.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 * @returns A promise of inserted bitmaps.
 */
async function processBitmap(db, filePath, packageId, knownPackages, data) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} Bitmap Types.`)
  let typeMap = await zclLoader.getDiscriminatorMap(db, knownPackages)
  return queryLoader.insertBitmap(
    db,
    knownPackages,
    data.map((x) =>
      prepareEnumOrBitmap(
        db,
        packageId,
        x,
        typeMap.get(dbEnum.zclType.bitmap),
        typeMap
      )
    )
  )
}

/**
 * Processes the bitmap fields.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 * @returns A promise of inserted bitmap fields.
 */
async function processBitmapFields(
  db,
  filePath,
  packageId,
  knownPackages,
  data
) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} Bitmap Fields.`)
  let bitmapFields = []
  let lastFieldId = -1
  if (!('features' in data)) {
    data.forEach((bm) => {
      if ('field' in bm) {
        bm.field.forEach((item) => {
          let defaultFieldId = lastFieldId + 1
          lastFieldId = item.$.fieldId
            ? parseInt(item.$.fieldId)
            : defaultFieldId
          bitmapFields.push({
            bitmapName: bm.$.name,
            bitmapClusterCode: bm.cluster ? bm.cluster : null,
            name: item.$.name,
            mask: parseInt(item.$.mask),
            fieldIdentifier: lastFieldId
          })
        })
      }
    })
    // Treating features in a cluster as a bitmap
  } else if (
    'features' in data &&
    data.features.length == 1 &&
    'feature' in data.features[0]
  ) {
    data.features[0].feature.forEach((item) => {
      bitmapFields.push({
        bitmapName: 'Feature',
        bitmapClusterCode: [{ $: { code: data.code[0] } }],
        name: item.$.name,
        mask: 1 << item.$.bit,
        fieldIdentifier: item.$.bit
      })
    })
  }
  return queryLoader.insertBitmapFields(
    db,
    packageId,
    knownPackages,
    bitmapFields
  )
}

/**
 * Prepare structs for database table insertion.
 *
 * @param {*} a
 * @param {*} dataType
 * @returns An Object
 */
function prepareStruct(a, dataType) {
  return {
    name: a.$.name,
    cluster_code: a.cluster ? a.cluster : null,
    discriminator_ref: dataType,
    isFabricScoped: a.$.isFabricScoped == 'true',
    apiMaturity: a.$.apiMaturity
  }
}

/**
 * Processes the structs.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 * @returns A promise of inserted structs.
 */
async function processStruct(db, filePath, packageId, knownPackages, data) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} Struct Types.`)
  let typeMap = await zclLoader.getDiscriminatorMap(db, knownPackages)
  return queryLoader.insertStruct(
    db,
    knownPackages,
    data.map((x) => prepareStruct(x, typeMap.get(dbEnum.zclType.struct)))
  )
}

/**
 * Processes the struct Items.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageIds
 * @param {*} data
 * @returns A promise of inserted struct items.
 */
async function processStructItems(db, filePath, packageIds, data, context) {
  env.logDebug(`${filePath}, ${packageIds}: ${data.length} Struct Items.`)
  let structItems = []
  data.forEach((si) => {
    let lastFieldId = -1
    if ('item' in si) {
      si.item.forEach((item) => {
        let defaultFieldId = lastFieldId + 1
        lastFieldId = item.$.fieldId ? parseInt(item.$.fieldId) : defaultFieldId
        structItems.push({
          structName: si.$.name,
          structClusterCode: si.cluster ? si.cluster : null,
          name: item.$.name,
          type:
            item.$.type == item.$.type.toUpperCase() && item.$.type.length > 1
              ? item.$.type.toLowerCase()
              : item.$.type,
          fieldIdentifier: lastFieldId,
          minLength: 0,
          maxLength: item.$.length ? item.$.length : null,
          isWritable: item.$.writable == 'true',
          isArray: item.$.array == 'true' ? true : false,
          isEnum: item.$.enum == 'true' ? true : false,
          isNullable: item.$.isNullable == 'true' ? true : false,
          isOptional: item.$.optional == 'true' ? true : false,
          isFabricSensitive: item.$.isFabricSensitive == 'true' ? true : false
        })
      })
    }

    if (
      context.fabricHandling &&
      context.fabricHandling.automaticallyCreateFields &&
      si.$.isFabricScoped == 'true'
    ) {
      structItems.push({
        structName: si.$.name,
        structClusterCode: si.cluster ? parseInt(si.clusterCode) : null,
        name: context.fabricHandling.indexFieldName,
        type: context.fabricHandling.indexType,
        fieldIdentifier: context.fabricHandling.indexFieldId,
        minLength: 0,
        maxLength: null,
        isWritable: false,
        isArray: false,
        isEnum: false,
        isNullable: false,
        isOptional: false,
        isFabricSensitive: false
      })
    }
  })
  return queryLoader.insertStructItems(db, packageIds, structItems)
}

/**
 * Prepare the typedef for database table insertion.
 *
 * @param {*} a
 * @param {*} dataType
 * @returns An Object
 */
function prepareTypedef(a, dataType) {
  return {
    name: a.$.name,
    cluster_code: a.cluster ? a.cluster : null,
    discriminator_ref: dataType,
    type:
      a.$.type == a.$.type.toUpperCase() && a.$.type.length > 1
        ? a.$.type.toLowerCase()
        : a.$.type
  }
}
/**
 * Processes the typedef.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} packageId
 * @param {*} knownPackages
 * @param {*} data
 * @returns A promise of inserted typedefs.
 */
async function processTypedef(db, filePath, packageId, knownPackages, data) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} Typedef Types.`)
  let typeMap = await zclLoader.getDiscriminatorMap(db, knownPackages)
  return queryLoader.insertTypedef(
    db,
    knownPackages,
    data.map((x) => prepareTypedef(x, typeMap.get(dbEnum.zclType.typedef)))
  )
}

/**
 * Prepares a device type object by extracting and transforming its properties.
 *
 * This function takes a device type object and processes its properties to create
 * a new object with a specific structure. It handles various properties such as
 * device ID, profile ID, domain, name, description, class, scope, and superset.
 * Additionally, it processes endpoint compositions and clusters if they exist.
 *
 * @param {Object} deviceType - The device type object to be prepared.
 * @returns {Object} The prepared device type object with transformed properties.
 */
function prepareDeviceType(deviceType) {
  let ret = {
    code: parseInt(deviceType.deviceId[0]['_']),
    profileId: parseInt(deviceType.profileId[0]['_']),
    domain: deviceType.domain[0],
    name: deviceType.name[0],
    description: deviceType.typeName[0],
    class: deviceType.class ? deviceType.class[0] : '',
    scope: deviceType.scope ? deviceType.scope[0] : '',
    superset: deviceType.superset ? deviceType.superset[0] : '',
    compositionType: null
  }
  if ('endpointComposition' in deviceType) {
    try {
      ret.compositionType = deviceType.endpointComposition[0].compositionType[0]
      ret.composition = deviceType.endpointComposition[0]
    } catch (error) {
      console.error('Error processing endpoint composition:', error)
    }
  }
  if ('clusters' in deviceType) {
    ret.clusters = []
    deviceType.clusters.forEach((cluster) => {
      if ('include' in cluster) {
        cluster.include.forEach((include) => {
          let attributes = []
          let commands = []
          let features = []
          if ('requireAttribute' in include) {
            attributes = include.requireAttribute
          }
          if ('requireCommand' in include) {
            commands = include.requireCommand
          }
          if ('features' in include) {
            include.features[0].feature.forEach((f) => {
              features.push({
                code: f.$.code,
                conformance: parseConformanceFromXML(f)
              })
            })
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
            features: features
          })
        })
      }
    })
  }
  return ret
}

/**
 * Processes and inserts device types into the database.
 * This function logs the number of device types being processed for debugging purposes.
 * It maps over the provided data to prepare each device type and then iterates over each prepared device type.
 * If a device type has a compositionType, it inserts the endpoint composition into the database,
 * retrieves the endpoint composition ID, and then inserts the device composition.
 * Finally, it inserts all prepared device types into the database.
 *
 * @param {*} db - The database connection object.
 * @param {string} filePath - The file path from which the device types are being processed.
 * @param {*} packageId - The package ID associated with the device types.
 * @param {Array} data - The array of device types to be processed.
 * @param {*} context - Additional context that might be required for processing.
 * @returns {Promise} A promise that resolves after all device types have been inserted into the database.
 */
async function processDeviceTypes(db, filePath, packageId, data, context) {
  env.logDebug(`${filePath}, ${packageId}: ${data.length} deviceTypes.`)
  let deviceTypes = data.map((x) => prepareDeviceType(x))
  for (let deviceType of deviceTypes) {
    if (
      deviceType.compositionType != null ||
      deviceType.code == parseInt(context.mandatoryDeviceTypes, 16)
    ) {
      await queryLoader.insertEndpointComposition(db, deviceType, context)
      if (deviceType.code !== parseInt(context.mandatoryDeviceTypes, 16)) {
        let endpointCompositionId =
          await queryLoader.getEndpointCompositionIdByCode(db, deviceType)
        await queryLoader.insertDeviceComposition(
          db,
          deviceType,
          endpointCompositionId
        )
      }
    }
  }
  return queryLoader.insertDeviceTypes(db, packageId, deviceTypes)
}

/**
 * After XML parser is done with the barebones parsing, this function
 * branches the individual toplevel tags.
 *
 * @param {*} db
 * @param {*} argument
 * @returns promise that resolves when all the subtags are parsed.
 */
async function processParsedZclData(
  db,
  argument,
  previouslyKnownPackages,
  context
) {
  let filePath = argument.filePath
  let data = argument.result
  let packageId = argument.packageId
  previouslyKnownPackages.add(packageId)
  let knownPackages = Array.from(previouslyKnownPackages)
  let featureClusters = []

  if (!('result' in argument)) {
    return []
  } else {
    let toplevel = null

    if ('configurator' in data) {
      toplevel = data.configurator
    }
    if ('zap' in data) {
      toplevel = data.zap
    }

    if (toplevel == null) return []

    // We load in multiple batches, since each batch needs to resolve
    // before the next batch can be loaded, as later data depends on
    // previous data. Final batch is delayed, meaning that
    // the promises there can't start yet, until all files are loaded.

    // Batch 1: load accessControl, tag and domain
    let batch1 = []
    if ('accessControl' in toplevel) {
      batch1.push(
        processAccessControl(db, filePath, packageId, toplevel.accessControl)
      )
    }
    if ('tag' in toplevel) {
      batch1.push(processTags(db, filePath, packageId, toplevel.tag))
    }
    if ('domain' in toplevel) {
      batch1.push(processDomains(db, filePath, packageId, toplevel.domain))
    }
    await Promise.all(batch1)

    // Batch 2: device types, globals, clusters
    let batch2 = []
    if ('deviceType' in toplevel) {
      batch2.push(
        processDeviceTypes(
          db,
          filePath,
          packageId,
          toplevel.deviceType,
          context
        )
      )
    }
    if ('global' in toplevel) {
      batch2.push(
        processGlobals(db, filePath, packageId, toplevel.global, context)
      )
    }
    if ('cluster' in toplevel) {
      featureClusters = toplevel.cluster.filter((c) => 'features' in c)
      batch2.push(
        processClusters(db, filePath, packageId, toplevel.cluster, context)
      )
    }
    await Promise.all(batch2)
    // Batch 3: Load the data type table which lists all data types
    let batch3 = []
    if (dbEnum.zclType.atomic in toplevel) {
      batch3.push(
        processDataType(
          db,
          filePath,
          packageId,
          knownPackages,
          toplevel.atomic,
          dbEnum.zclType.atomic
        )
      )
    }

    if (dbEnum.zclType.bitmap in toplevel) {
      batch3.push(
        processDataType(
          db,
          filePath,
          packageId,
          knownPackages,
          toplevel.bitmap,
          dbEnum.zclType.bitmap
        )
      )
    }

    // Treating features in a cluster as a bitmap
    if (featureClusters.length > 0) {
      featureClusters.forEach((fc) => {
        batch3.push(
          processDataType(
            db,
            filePath,
            packageId,
            knownPackages,
            [
              {
                $: {
                  name: 'Feature',
                  type: 'BITMAP32',
                  cluster_code: [fc.code[0]]
                }
              }
            ],
            dbEnum.zclType.bitmap
          )
        )
      })
    }

    if (dbEnum.zclType.enum in toplevel) {
      batch3.push(
        processDataType(
          db,
          filePath,
          packageId,
          knownPackages,
          toplevel.enum,
          dbEnum.zclType.enum
        )
      )
    }
    if (dbEnum.zclType.struct in toplevel) {
      batch3.push(
        processDataType(
          db,
          filePath,
          packageId,
          knownPackages,
          toplevel.struct,
          dbEnum.zclType.struct
        )
      )
    }
    if (dbEnum.zclType.typedef in toplevel) {
      batch3.push(
        processDataType(
          db,
          filePath,
          packageId,
          knownPackages,
          toplevel.typedef,
          dbEnum.zclType.typedef
        )
      )
    }
    await Promise.all(batch3)

    // Batch4 and Batch5: Loads the inidividual tables per data type from
    // atomics/baseline types to inherited types
    let Batch4 = []
    if (dbEnum.zclType.atomic in toplevel) {
      Batch4.push(
        processNumber(db, filePath, packageId, knownPackages, toplevel.atomic)
      )
      Batch4.push(
        processString(db, filePath, packageId, knownPackages, toplevel.atomic)
      )
      Batch4.push(
        processEnumAtomic(
          db,
          filePath,
          packageId,
          knownPackages,
          toplevel.atomic
        )
      )
      Batch4.push(
        processBitmapAtomic(
          db,
          filePath,
          packageId,
          knownPackages,
          toplevel.atomic
        )
      )
    }
    await Promise.all(Batch4)

    let Batch5 = []
    if (dbEnum.zclType.enum in toplevel) {
      Batch5.push(
        processEnum(db, filePath, packageId, knownPackages, toplevel.enum)
      )
    }
    if (dbEnum.zclType.bitmap in toplevel) {
      Batch5.push(
        processBitmap(db, filePath, packageId, knownPackages, toplevel.bitmap)
      )
    }
    if (dbEnum.zclType.typedef in toplevel) {
      Batch5.push(
        processTypedef(db, filePath, packageId, knownPackages, toplevel.typedef)
      )
    }
    // Treating features in a cluster as a bitmap
    if (featureClusters.length > 0) {
      featureClusters.forEach((fc) => {
        Batch5.push(
          processBitmap(db, filePath, packageId, knownPackages, [
            {
              $: {
                name: 'Feature',
                type: 'BITMAP32',
                cluster_code: [fc.code[0]]
              }
            }
          ])
        )
      })
    }
    if (dbEnum.zclType.struct in toplevel) {
      Batch5.push(
        processStruct(db, filePath, packageId, knownPackages, toplevel.struct)
      )
    }
    await Promise.all(Batch5)

    // Batch7: Loads the items within a bitmap, struct and enum data types
    let batch6 = []
    if (dbEnum.zclType.enum in toplevel) {
      batch6.push(
        processEnumItems(db, filePath, packageId, knownPackages, toplevel.enum)
      )
    }
    if (dbEnum.zclType.bitmap in toplevel) {
      batch6.push(
        processBitmapFields(
          db,
          filePath,
          packageId,
          knownPackages,
          toplevel.bitmap
        )
      )
    }
    // Treating features in a cluster as a bitmap
    if (featureClusters.length > 0) {
      featureClusters.forEach((fc) => {
        batch6.push(
          processBitmapFields(db, filePath, packageId, knownPackages, fc)
        )
      })
    }
    if (dbEnum.zclType.struct in toplevel) {
      batch6.push(
        processStructItems(
          db,
          filePath,
          knownPackages,
          toplevel.struct,
          context
        )
      )
    }
    await Promise.all(batch6)

    // Batch7: Loads the defaultAccess
    let Batch7 = []
    if ('defaultAccess' in toplevel) {
      Batch7.push(
        processDefaultAccess(db, filePath, packageId, toplevel.defaultAccess)
      )
    }
    if ('atomic' in toplevel) {
      Batch7.push(processAtomics(db, filePath, packageId, toplevel.atomic))
    }
    await Promise.all(Batch7)
    //}

    // Batch 8: cluster extensions and global attributes
    //   These don't start right away, but are delayed. So we don't return
    //   promises that have already started, but functions that return promises.
    let delayedPromises = []

    if ('cluster' in toplevel) {
      delayedPromises.push(() =>
        processClusterGlobalAttributes(
          db,
          filePath,
          packageId,
          toplevel.cluster
        )
      )
    }
    if ('clusterExtension' in toplevel) {
      delayedPromises.push(() =>
        processClusterExtensions(
          db,
          filePath,
          packageId,
          knownPackages,
          toplevel.clusterExtension,
          context
        )
      )
    }
    return Promise.all(delayedPromises)
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
async function parseSingleZclFile(db, packageId, file, context) {
  try {
    let fileContent = await fsp.readFile(file)
    let data = {
      filePath: file,
      data: fileContent,
      crc: util.checksum(fileContent)
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
    return processParsedZclData(db, result, new Set(), context)
  } catch (err) {
    err.message = `Error reading xml file: ${file}\n` + err.message
    throw err
  }
}

/**
 * Checks if there is a crc mismatch on any xml file. This can be used to
 * decide if there is a need to reload all the xml files. Also check if the
 * package is not loaded before.
 * @param {*} db
 * @param {*} packageId
 * @param {*} files
 * @returns the status of crc mismatch and whether a package is present in an
 * object
 */
async function isCrcMismatchOrPackageDoesNotExist(db, packageId, files) {
  let packagesNotFound = 0
  let packagesFound = 0
  let result = { isCrcMismatch: false, areSomePackagesNotLoaded: false }
  for (let file of files) {
    let fileContent = await fsp.readFile(file)
    let filePath = file
    let actualCrc = util.checksum(fileContent)

    let pkg = await queryPackage.getPackageByPathAndParent(
      db,
      filePath,
      packageId,
      false
    )

    if (pkg != null && pkg.crc != actualCrc) {
      env.logDebug(
        `CRC missmatch for file ${pkg.path}, (${pkg.crc} vs ${actualCrc}) package id ${pkg.id}, parsing.
        Mismatch with package id: ${packageId}`
      )
      result.isCrcMismatch = true
      return result
    } else if (pkg == null) {
      // This is executed if there is no CRC in the database.
      packagesNotFound++
      env.logDebug(
        `No CRC in the database for file ${filePath}. Package needs to be loaded`
      )
    } else if (pkg != null && pkg.crc == actualCrc) {
      packagesFound++
    }
  }
  result.areSomePackagesNotLoaded = !(
    packagesNotFound == files.length || packagesFound == files.length
  )
  return result
}

/**
 *
 * Promises to iterate over all the XML files and returns an aggregate promise
 * that will be resolved when all the XML files are done, or rejected if at least one fails.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} zclFiles
 * @param {*} context
 * @returns Promise that resolves when all the individual promises of each file pass.
 */
async function parseZclFiles(db, packageId, zclFiles, context) {
  env.logDebug(`Starting to parse ZCL files: ${zclFiles}`)
  // Populate the Data Type Discriminator
  if (context.ZCLDataTypes)
    await processDataTypeDiscriminator(db, packageId, context.ZCLDataTypes)

  // Load the Types File first such the atomic types are loaded and can be
  // referenced by other types
  let typesFiles = zclFiles.filter((file) => file.includes('types.xml'))
  let typeFilePromise = typesFiles.map((file) =>
    parseSingleZclFile(db, packageId, file, context)
  )
  await Promise.all(typeFilePromise)

  // Load everything apart from atomic data types
  let nonTypesFiles = zclFiles.filter((file) => !file.includes('types.xml'))
  let individualFilePromise = nonTypesFiles.map((file) =>
    parseSingleZclFile(db, packageId, file, context)
  )
  let individualResults = await Promise.all(individualFilePromise)
  let laterPromises = individualResults.flat(2)
  await Promise.all(laterPromises.map((promise) => promise()))

  // Load some missing content which was not possible before the above was done
  return zclLoader.processZclPostLoading(db, packageId)
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
 * Inside the `zcl.json` can be a `featureFlags` key, which is
 * a general purpose object. It contains keys, that map to objects.
 * Each key is a "package option category".
 * Key/velues of the object itself, end up in CODE/LABEL combinations.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} featureFlags
 * @returns array of feature flags
 */
async function parseFeatureFlags(db, packageId, featureFlags) {
  return Promise.all(
    Object.keys(featureFlags).map((featureCategory) => {
      return queryPackage.insertOptionsKeyValues(
        db,
        packageId,
        featureCategory,
        Object.keys(featureFlags[featureCategory]).map((data) => {
          return {
            code: data,
            label: featureFlags[featureCategory][data] == '1' ? true : false
          }
        })
      )
    })
  )
}

/**
 * Parses conformance from XML data.
 * The conformance could come from features, attributes, commands, or events
 *
 * Call recursive helper function to parse conformance only if the conformance exists.
 * Otherwise, return empty string directly
 *
 * An example of parsing the conformance of 'User' device type feature:
 *
 * Input operand from xml data:
 * {
 *   "$": {"code": "USR", "name": "User"},
 *   "mandatoryConform": [
 *      { "andTerm": [
 *           {
 *             "condition": [{"$": {"name": "Matter"}}],
 *             "orTerm": [
 *                 { "feature": [
 *                      { "$": {"name": "PIN"}},
 *                      { "$": {"name": "RID"}},
 *                      { "$": {"name": "FGP"}},
 *                      { "$": {"name": "FACE"}}
 *                   ]
 *                 }
 *               ]
 *            }
 *          ]
 *        }
 *    ]
 * }
 *
 * Output conformance string:
 *  "Matter & (PIN | RID | FGP | FACE)"
 *
 * @param {*} operand
 * @returns The conformance string
 */
function parseConformanceFromXML(operand) {
  let hasConformance = Object.keys(operand).some((key) =>
    key.includes('Conform')
  )
  return hasConformance ? parseConformanceRecursively(operand) : ''
}

/**
 * helper function to parse conformance or an operand in conformance recursively
 *
 * The baseLevelTerms variable include terms that can not have nested terms.
 * When they appear, stop recursing and return the name inside directly
 *
 * @param {*} operand
 * @param {*} depth
 * @param {*} parentJoinChar
 * @returns The conformance string.
 */
function parseConformanceRecursively(operand, depth = 0, parentJoinChar = '') {
  if (depth > 200) {
    throw new Error(`Maximum recursion depth exceeded
      when parsing conformance: ${JSON.stringify(operand)}`)
  }
  const baseLevelTerms = ['feature', 'condition', 'attribute', 'command']
  if (operand.mandatoryConform) {
    let insideTerm = operand.mandatoryConform[0]
    // Recurse further if insideTerm is not empty
    if (insideTerm && Object.keys(insideTerm).toString() != '$') {
      return parseConformanceRecursively(operand.mandatoryConform[0], depth + 1)
    } else {
      return 'M'
    }
  } else if (operand.optionalConform) {
    let insideTerm = operand.optionalConform[0]
    // check '$' key is not the only key in the object to handle special cases
    // e.g. '<optionalConform choice="a" more="true"/>'
    if (insideTerm && Object.keys(insideTerm).toString() != '$') {
      return `[${parseConformanceRecursively(operand.optionalConform[0], depth + 1)}]`
    } else {
      return 'O'
    }
  } else if (operand.otherwiseConform) {
    return Object.entries(operand.otherwiseConform[0])
      .map(([key, value]) =>
        parseConformanceRecursively({ [key]: value }, depth + 1)
      )
      .join(', ')
  } else if (operand.notTerm) {
    // need to surround terms inside a notTerm with '()' if it contains multiple terms
    // e.g. !(A | B) or !(A & B)
    // able to process multiple parallel notTerms, e.g. !A & !B
    return operand.notTerm
      .map((term) => {
        let nt = parseConformanceRecursively(term, depth + 1)
        return nt.includes('&') || nt.includes('|') ? `!(${nt})` : `!${nt}`
      })
      .join(` ${parentJoinChar} `)
  } else if (operand.andTerm || operand.orTerm) {
    // process andTerm and orTerm in the same logic
    // when joining multiple orTerms inside andTerms, we need to
    // surround them with '()', vice versa for andTerms inside orTerms
    // e.g. A & (B | C) or A | (B & C)
    let joinChar = operand.andTerm ? '&' : '|'
    let termKey = operand.andTerm ? 'andTerm' : 'orTerm'
    let oppositeChar = joinChar == '&' ? '|' : '&'
    return Object.entries(operand[termKey][0])
      .map(([key, value]) => {
        if (baseLevelTerms.includes(key)) {
          return value.map((operand) => operand.$.name).join(` ${joinChar} `)
        } else {
          let terms = parseConformanceRecursively(
            { [key]: value },
            depth + 1,
            joinChar
          )
          return terms.includes(oppositeChar) ? `(${terms})` : terms
        }
      })
      .join(` ${joinChar} `)
  } else if (operand.provisionalConform) {
    return 'P'
  } else if (operand.disallowConform) {
    return 'X'
  } else if (operand.deprecateConform) {
    return 'D'
  } else {
    // reach base level terms, return the name directly
    for (const term of baseLevelTerms) {
      if (operand[term]) {
        return operand[term][0].$.name
      }
    }
    // reaching here means the term is too complex to parse
    return 'desc'
  }
}

/**
 * Inside the `zcl.json` can be a `featureFlags` key, which is
 * a general purpose object. It contains keys, that map to objects.
 * Each key is a "package option category".
 * Key/velues of the object itself, end up in CODE/LABEL combinations.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} featureFlags
 * @returns Promise that loads the uiOptions object into the database.
 */
async function parseUiOptions(db, packageId, uiOptions) {
  let data = []
  Object.keys(uiOptions).map((key) => {
    data.push({
      code: key,
      label: uiOptions[key]
    })
  })
  return queryPackage.insertOptionsKeyValues(
    db,
    packageId,
    dbEnum.packageOptionCategory.ui,
    data
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
        { code: 0, label: 'False' }
      ])
    )
  })
  return Promise.all(promises)
}

/**
 * Asynchronously parses and inserts attribute access interface attributes into the database.
 * This function iterates over the attributeAccessInterfaceAttributes object, processing each cluster
 * by mapping its values to a specific structure and then inserting them into the database using
 * the insertOptionsKeyValues function.
 *
 * The main purpose of this function is to store cluster/attribute pairs including global attributes and their cluster pair
 * The ATTRIBUTE table has cluster_ref as null for global attributes so this second method was necessary
 *
 * @param {*} db - The database connection object.
 * @param {*} pkgRef - The package reference id for which the attributes are being parsed.
 * @param {*} attributeAccessInterfaceAttributes - An object containing the attribute access interface attributes,
 *                                                  structured by cluster.
 * @returns {Promise<void>} A promise that resolves when all attributes have been processed and inserted.
 */
async function parseattributeAccessInterfaceAttributes(
  db,
  pkgRef,
  attributeAccessInterfaceAttributes
) {
  const clusters = Object.keys(attributeAccessInterfaceAttributes)
  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i]
    const values = attributeAccessInterfaceAttributes[cluster]
    // Prepare the data for insertion
    const optionsKeyValues = values.map((attribute) => ({
      code: dbEnum.storagePolicy.attributeAccessInterface,
      label: attribute
    }))
    // Insert the data into the database
    try {
      await queryPackage.insertOptionsKeyValues(
        db,
        pkgRef,
        cluster,
        optionsKeyValues
      )
    } catch (error) {
      console.error(`Error inserting attributes for cluster ${cluster}:`, error)
    }
  }
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

/**
 * Parse text defaults from default options.
 * @param {*} db
 * @param {*} pkgRef
 * @param {*} textDefaults
 * @returns Array of promises
 */
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
            env.logWarning(
              'Default value for: ${optionCategory}/${txt} does not match an option for packageId: ' +
                pkgRef
            )
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

/**
 * Parse the boolean defaults inside options.
 * @param {*} db
 * @param {*} pkgRef
 * @param {*} booleanCategories
 * @returns List of promises
 */
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
async function loadIndividualSilabsFile(db, filePath, sessionId) {
  try {
    let fileContent = await fsp.readFile(filePath)
    let data = {
      filePath: filePath,
      data: fileContent,
      crc: util.checksum(fileContent)
    }

    let result = await zclLoader.qualifyZclFile(
      db,
      data,
      null,
      dbEnum.packageType.zclXmlStandalone,
      true
    )
    let pkgId = result.packageId
    if (result.data) {
      result.result = await util.parseXml(result.data)
      delete result.data
      // Just adding the cluster attribute and command extensions for a cluster
      // because they can be related to any top level package in the .zap config
      if (
        result.customXmlReload &&
        result.result.configurator &&
        result.result.configurator.clusterExtension
      ) {
        result.result = {
          configurator: {
            clusterExtension: result.result.configurator.clusterExtension
          }
        }
      } else if (
        result.customXmlReload &&
        result.result.configurator &&
        !result.result.configurator.clusterExtension
      ) {
        env.logDebug(
          `CRC match for file ${result.filePath} (${result.crc}), skipping parsing.`
        )
        delete result.result
      }
    }
    let sessionPackages = await queryPackage.getSessionZclPackages(
      db,
      sessionId
    )
    let packageSet = new Set()
    sessionPackages.map((sessionPackage) => {
      packageSet.add(sessionPackage.packageRef)
    })
    // Where do we get metadata from here???
    let laterPromises = await processParsedZclData(db, result, packageSet, {})
    await Promise.all(
      laterPromises.flat(1).map((promise) => {
        if (promise != null && promise != undefined) return promise()
      })
    )
    // Check if session partition for package exists. If not then add it.
    let sessionPartitionInfoForNewPackage =
      await querySession.selectSessionPartitionInfoFromPackageId(
        db,
        sessionId,
        pkgId
      )
    if (sessionPartitionInfoForNewPackage.length == 0) {
      let sessionPartitionInfo =
        await querySession.getAllSessionPartitionInfoForSession(db, sessionId)
      let sessionPartitionId = await querySession.insertSessionPartition(
        db,
        sessionId,
        sessionPartitionInfo.length + 1
      )
      await queryPackage.insertSessionPackage(
        db,
        sessionPartitionId,
        pkgId,
        true
      )
    }
    await zclLoader.processZclPostLoading(db, pkgId)
    return { succeeded: true, packageId: pkgId }
  } catch (err) {
    env.logError(`Error reading xml file: ${filePath}\n` + err.message)
    querySessionNotification.setNotification(
      db,
      'ERROR',
      `Error reading xml file: ${filePath}, Error Message: ` + err.message,
      sessionId,
      1,
      0
    )
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
    description: dbEnum.customDevice.description
  })
  let existingCustomDevice =
    await queryDeviceType.selectDeviceTypeByCodeAndName(
      db,
      packageId,
      dbEnum.customDevice.code,
      dbEnum.customDevice.name
    )
  if (existingCustomDevice == null)
    await queryLoader.insertDeviceTypes(db, packageId, customDeviceTypes)
}

/**
 * Load ZCL metadata
 * @param {*} db
 * @param {*} metafile
 * @returns Promise of loaded zcl json file
 */
async function loadZclJson(db, metafile) {
  return loadZclJsonOrProperties(db, metafile, true)
}

/**
 * Load ZCL metadata
 * @param {*} db
 * @param {*} metafile
 * @returns Promise of loaded zcl properties file
 */
async function loadZclProperties(db, metafile) {
  return loadZclJsonOrProperties(db, metafile, false)
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
async function loadZclJsonOrProperties(db, metafile, isJson = false) {
  let ctx = {
    metadataFile: metafile,
    db: db
  }
  let isTransactionAlreadyExisting = dbApi.isTransactionActive()
  env.logDebug(`Loading Silabs zcl file: ${metafile}`)
  if (!fs.existsSync(metafile)) {
    throw new Error(`Can't locate: ${metafile}`)
  }

  if (!isTransactionAlreadyExisting) await dbApi.dbBeginTransaction(db)

  try {
    Object.assign(ctx, await util.readFileContentAndCrc(ctx.metadataFile))
    let ret
    if (isJson) {
      ret = await collectDataFromJsonFile(ctx.metadataFile, ctx.data)
    } else {
      ret = await collectDataFromPropertiesFile(ctx.metadataFile, ctx.data)
    }
    Object.assign(ctx, ret)
    ctx.packageId = await zclLoader.recordToplevelPackage(
      db,
      ctx.metadataFile,
      ctx.crc,
      true
    )
    let packageStatus = await isCrcMismatchOrPackageDoesNotExist(
      db,
      ctx.packageId,
      ctx.zclFiles
    )
    if (packageStatus.isCrcMismatch || packageStatus.areSomePackagesNotLoaded) {
      await queryPackage.updatePackageIsInSync(db, ctx.packageId, 0)
      ctx.packageId = await zclLoader.recordToplevelPackage(
        db,
        ctx.metadataFile,
        ctx.crc,
        false
      )
    }

    if (
      ctx.version != null ||
      ctx.category != null ||
      ctx.description != null
    ) {
      await zclLoader.recordVersion(
        db,
        ctx.packageId,
        ctx.version,
        ctx.category,
        ctx.description
      )
    }

    // Load the new XML files and collect which clusters were already loaded,
    // so that they can be ommited while loading the old files.
    let newFileResult = await newDataModel.parseNewXmlFiles(
      db,
      ctx.packageId,
      ctx.newXmlFile
    )
    ctx.clustersLoadedFromNewFiles = newFileResult.clusterIdsLoaded
    ctx.newFileErrors = newFileResult.errorFiles
    await parseZclFiles(db, ctx.packageId, ctx.zclFiles, ctx)
    // Validate that our attributeAccessInterfaceAttributes, if present, is
    // sane.
    if (ctx.attributeAccessInterfaceAttributes) {
      let all_known_clusters = await queryZcl.selectAllClusters(
        db,
        ctx.packageId
      )
      for (let clusterName of Object.keys(
        ctx.attributeAccessInterfaceAttributes
      )) {
        let known_cluster = all_known_clusters.find(
          (c) => c.name == clusterName
        )
        if (!known_cluster) {
          throw new Error(
            `\n\nUnknown cluster "${clusterName}" in attributeAccessInterfaceAttributes\n\n`
          )
        }
        let known_cluster_attributes =
          await queryZcl.selectAttributesByClusterIdIncludingGlobal(
            db,
            known_cluster.id,
            ctx.packageId
          )
        for (let attrName of ctx.attributeAccessInterfaceAttributes[
          clusterName
        ]) {
          if (!known_cluster_attributes.find((a) => a.name == attrName)) {
            throw new Error(
              `\n\nUnknown attribute "${attrName}" in attributeAccessInterfaceAttributes["${clusterName}"]\n\n`
            )
          }
        }
      }
    }

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
    if (ctx.attributeAccessInterfaceAttributes) {
      await parseattributeAccessInterfaceAttributes(
        db,
        ctx.packageId,
        ctx.attributeAccessInterfaceAttributes
      )
    }
    if (ctx.featureFlags) {
      await parseFeatureFlags(db, ctx.packageId, ctx.featureFlags)
    }
    if (ctx.uiOptions) {
      await parseUiOptions(db, ctx.packageId, ctx.uiOptions)
    }
  } catch (err) {
    env.logError(err)
    queryPackageNotification.setNotification(db, 'ERROR', err, ctx.packageId, 1)
    throw err
  } finally {
    if (!isTransactionAlreadyExisting) await dbApi.dbCommit(db)
  }
  return ctx
}

exports.loadIndividualSilabsFile = loadIndividualSilabsFile
exports.loadZclJson = loadZclJson
exports.loadZclProperties = loadZclProperties

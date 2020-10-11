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

const env = require('../util/env.js')
const path = require('path')
const zclLoader = require('./zcl-loader')
const dbApi = require('../db/db-api.js')
const queryZcl = require('../db/query-zcl.js')
const queryPackage = require('../db/query-package.js')
const dbEnum = require('../../src-shared/db-enum.js')
const util = require('../util/util.js')

/**
 * Promises to read the properties file, extract all the actual xml files, and resolve with the array of files.
 *
 * @param {*} ctx Context which contains information about the metadataFiles and data
 * @returns Promise of resolved files.
 */
function collectDataFromLibraryXml(ctx) {
  env.logInfo(`Collecting ZCL files from: ${ctx.metadataFile}`)
  return zclLoader
    .readZclFile(ctx.metadataFile)
    .then((data) =>
      util.calculateCrc({ filePath: ctx.metadataFile, data: data })
    )
    .then((data) => zclLoader.parseZclFile(data))
    .then((data) => {
      var result = data.result
      var zclLib = result['zcl:library']
      ctx.version = '1.0'
      ctx.zclFiles = zclLib['xi:include'].map((f) =>
        path.join(path.dirname(ctx.metadataFile), f.$.href)
      )
      ctx.zclFiles.push(ctx.metadataFile)
      return ctx
    })
}

function processParsedZclData(db, argument) {}
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
  var perFilePromise = []

  ctx.zclClusters = []
  ctx.zclGlobalAttributes = []
  ctx.zclGlobalCommands = []
  ctx.zclDeviceTypes = []
  ctx.zclManufacturers = []

  ctx.zclFiles.forEach((file) => {
    env.logInfo(`Starting to parse Dotdot ZCL file: ${file}`)
    var p = zclLoader
      .readZclFile(file)
      .then((data) => util.calculateCrc({ filePath: file, data: data }))
      .then((data) => zclLoader.qualifyZclFile(db, data, ctx.packageId))
      .then((result) => zclLoader.parseZclFile(result))
      .then((r) => {
        var result = r.result

        if (result == null) {
          return Promise.resolve([])
        }

        if (result['zcl:cluster']) {
          ctx.zclClusters.push(result['zcl:cluster'])
        } else if (result['zcl:global']) {
          var global = result['zcl:global']
          ctx.zclGlobalTypes = global['type:type']
          ctx.zclGlobalAttributes = global.attributes[0].attribute
          ctx.zclGlobalCommands = global.commands[0].command
        } else if (result['zcl:library']) {
          var global = result['zcl:library']
          ctx.zclTypes = global['type:type']
        } else if (result['zcl:device']) {
          var deviceTypes = result['zcl:device']
          if (ctx.zclDeviceTypes === undefined) {
            ctx.zclDeviceTypes = deviceTypes['deviceType']
          } else {
            ctx.zclDeviceTypes = ctx.zclDeviceTypes.concat(
              deviceTypes['deviceType']
            )
          }
        } else if (result['map']) {
          var manufacturers = result['map']
          ctx.zclManufacturers = manufacturers['mapping']
        } else {
          //TODO: What to do with "derived clusters", we skip them here but we should probably
          //      extend the DB schema to allow this since we don't really handle it
          env.logInfo(`Didn't find anything relevant, Skipping file ${file}`)
        }
      })
    perFilePromise.push(p)
  })

  return Promise.all(perFilePromise).then(() => ctx)
}

/**
 * The Dotdot ZCL XML doesn't use the 0x prefix, but it's a nice thing to have and Silabs xml
 * does use this so this helper function normalizes the use of hex
 *
 * TODO: Is this the right thing to do?
 *
 * @param {*} value the string value to be normalized
 * @returns Either the normalized hex string (with the 0x prefix) or the original
 */
function normalizeHexValue(value) {
  let ret = value
  try {
    parseInt(value, 16) //check if this is a hex value
    if (!value.includes('0x')) {
      ret = '0x' + value.toUpperCase()
    }
  } catch (error) {}
  return ret
}

/**
 * Prepare XML attributes for entry into the DB
 *
 * @param {*} attributes an array of attributes
 * @param {*} side the side the attribute is on either "client" or "server"
 * @returns Array containing all data from XML ready to be inserted into the DB.
 */
function prepareAttributes(attributes, side, types, cluster = null) {
  var ret = []
  var atts =
    attributes.attribute === undefined ? attributes : attributes.attribute
  for (var i = 0; i < atts.length; i++) {
    let a = atts[i]
    env.logInfo(`Preparing attribute ${side} ${a.$.name}`)
    ret.push({
      code: parseInt(normalizeHexValue(a.$.id)),
      //manufacturerCode: '', // TODO: no manuf code in dotdot xml
      name: a.$.name,
      type: a.$.type.toLowerCase(),
      side: side,
      define: a.$.name,
      min: normalizeHexValue(a.$.min),
      max: normalizeHexValue(a.$.max),
      isWritable: a.$.writable == 'true',
      defaultValue: normalizeHexValue(a.$.default),
      isOptional: !(a.$.required == 'true'),
      //isReportable: 'true', // TODO: reportability not listed in dotdot xml
    })
    // TODO: Attributes have types and they may not be unique so we prepend the cluster name
    prepareAttributeType(a, types, cluster)
  }
  return ret
}

/**
 * Prepare XML commands for entry into the DB
 *
 * @param {*} commands an array of commands
 * @param {*} side the side the command is on either "client" or "server"
 * @returns Array containing all data from XML ready to be inserted in to the DB.
 */
function prepareCommands(commands, side) {
  var ret = []
  var cmds = commands.command === undefined ? commands : commands.command
  for (var i = 0; i < cmds.length; i++) {
    let c = cmds[i]
    env.logInfo(`Preparing command ${side} ${c.$.name}`)
    var pcmd = {
      code: parseInt(normalizeHexValue(c.$.id)),
      //manufacturerCode: '', //TODO: no manuf code for dotdot xml
      name: c.$.name,
      //description: '', // TODO: no description for dotdot xml
      source: side,
      isOptional: !(c.$.required == 'true'),
    }
    if ('fields' in c) {
      pcmd.args = []
      c.fields.forEach((fields) => {
        var fds = fields.field === undefined ? fields : fields.field
        for (var j = 0; j < fds.length; j++) {
          let f = fds[j]
          env.logInfo(`Preparing field ${f.$.name}`)
          pcmd.args.push({
            name: f.$.name,
            type: f.$.type,
            //isArray: 0, //TODO: no indication of array type in dotdot xml
          })
        }
      })
    }
    ret.push(pcmd)
  }
  return ret
}

/**
 * Prepare XML cluster for insertion into the database.
 * This method can also prepare clusterExtensions.
 *
 * @param {*} cluster
 * @param {*} isExtension if this is an extension or not (there are none in dotdot xml)
 * @param {*} types types object into which cluster can put types it might have
 * @returns Object containing all data from XML.
 */
function prepareCluster(cluster, isExtension = false, types) {
  var ret = {
    isExtension: isExtension,
  }

  if (isExtension) {
    // TODO: no current handling of extensions in the dotdot zcl
  } else {
    ret.code = parseInt(normalizeHexValue(cluster.$.id))
    ret.name = cluster.$.name
    //ret.description = '' // TODO: no description in dotdot zcl
    ret.define = cluster.$.name // TODO: no define in dotdot zcl
    ret.domain = cluster.classification[0].$.role
    //ret.manufacturerCode = '' // TODO: no manufacturer code in dotdot zcl
    ret.revision = cluster.$.revision // TODO: revision present in dotdot zcl
  }
  var sides = [
    { name: 'server', value: cluster.server },
    { name: 'client', value: cluster.client },
  ]
  ret.commands = []
  ret.attributes = []
  sides.forEach((side) => {
    if (!(side.value === undefined)) {
      if ('attributes' in side.value[0]) {
        side.value[0].attributes.forEach((attributes) => {
          ret.attributes = ret.attributes.concat(
            prepareAttributes(attributes, side.name, types, cluster)
          )
        })
      }
      if ('commands' in side.value[0]) {
        side.value[0].commands.forEach((commands) => {
          ret.commands = ret.commands.concat(
            prepareCommands(commands, side.name)
          )
        })
      }
    }
  })
  // give the cluster a chance to populate types
  if ('type:type' in cluster) {
    prepareTypes(cluster['type:type'], types)
  }
  return ret
}

/**
 *
 * Parses xml type into the atomic object for insertion into the DB
 *
 * @param {*} type an xml object which conforms to the atomic format in the dotdot xml
 * @returns object ready for insertion into the DB
 */
function prepareAtomic(type) {
  return {
    name: type.$.short,
    id: normalizeHexValue(type.$.id),
    //size: '', // TODO: size not defined in dotdot xml
    description: type.$.name,
  }
}

/**
 *
 * Parses xml type into the bitmap object for insertion into the DB
 *
 * @param {*} type an xml object which conforms to the bitmap format in the dotdot xml
 * @param {*} fromAttribute a boolean indicating if this is coming from an attribute or not
 * @returns object ready for insertion into the DB
 */
function prepareBitmap(type, fromAttribute = false, cluster = null) {
  var ret
  if (fromAttribute) {
    ret = {
      //TODO: Bitmaps from cluster attributes may not be unique by name so we prepend the cluster
      //      name to the bitmap name (as we do in the Silabs xml)
      name: cluster ? cluster.$.name + type.$.name : type.$.name,
      type: type.$.type,
    }
  } else {
    ret = { name: type.$.short, type: type.bitmap[0].element[0].$.type }
  }
  if ('bitmap' in type) {
    ret.fields = []
    type.bitmap[0].element.map((e) => {
      ret.fields.push({
        name: e.$.name,
        mask: normalizeHexValue(e.$.mask),
      })
    })
  }
  return ret
}

/**
 *
 * Parses xml type into the enum object for insertion into the DB
 *
 * @param {*} type an xml object which conforms to the enum format in the dotdot xml
 * @returns object ready for insertion into the DB
 */
function prepareEnum(type, fromAttribute = false, cluster = null) {
  var ret
  if (fromAttribute) {
    ret = {
      // TODO: Enums from cluster attributes may not be unique by name so we prepend the cluster
      //       name to the enum name (as we do in the Silabs xml)
      name: cluster ? cluster.$.name + type.$.name : type.$.name,
      type: type.$.type,
    }
  } else {
    ret = { name: type.$.short, type: type.$.inheritsFrom }
  }
  if ('restriction' in type) {
    ret.items = []
    type.restriction[0]['type:enumeration'].map((e) => {
      ret.items.push({
        name: e.$.name,
        value: normalizeHexValue(e.$.value),
      })
    })
  }
  return ret
}

/**
 *
 * Parses xml type into the struct object for insertion into the DB
 *
 * @param {*} type an xml object which conforms to the struct format in the dotdot xml
 * @returns object ready for insertion into the DB
 */
function prepareStruct(type) {
  var ret = { name: type.$.short }
  if ('restriction' in type) {
    ret.items = []
    type.restriction[0]['type:sequence'].map((sequence) => {
      sequence.field.map((field) => {
        ret.items.push({
          name: field.$.name,
          type: field.$.type,
        })
      })
    })
  }
  return ret
}

/**
 *
 * Parses xml types into the types object for insertion into the DB
 *
 * @param {*} zclTypes an array of xml types
 * @param {*} types an object which includes arrays for enums, bitmaps etc...
 */
function prepareTypes(zclTypes, types) {
  if (zclTypes == undefined) return
  zclTypes.map((type) => {
    if ('bitmap' in type) {
      types.bitmaps.push(prepareBitmap(type))
    } else if (
      'restriction' in type &&
      'type:enumeration' in type.restriction[0]
    ) {
      types.enums.push(prepareEnum(type))
    } else if (
      'restriction' in type &&
      'type:sequence' in type.restriction[0]
    ) {
      types.structs.push(prepareStruct(type))
    } else {
      types.atomics.push(prepareAtomic(type))
    }
  })
}

/**
 *
 * Parses xml types into the types object for insertion into the DB
 *
 * @param {*} attribute an attribute with the type in it
 * @param {*} types an object which includes arrays for enums, bitmaps etc...
 * @param {*} cluster the cluster that the attribute belongs to (used presently for uniqueness of the type name)
 */
function prepareAttributeType(attribute, types, cluster) {
  if ('bitmap' in attribute) {
    types.bitmaps.push(prepareBitmap(attribute, true, cluster))
  } else if (
    'restriction' in attribute &&
    'type:enumeration' in attribute.restriction[0]
  ) {
    types.enums.push(prepareEnum(attribute, true, cluster))
  }
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
    profileId: '0x0000', //There is no profileId in Dotdot device descriptions
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
 *
 * Promises to iterate over all the XML files and returns an aggregate promise
 * that will be resolved when all the XML files are done, or rejected if at least one fails.
 *
 * @param {*} db
 * @param {*} ctx
 * @returns Promise that resolves when all the individual promises of each file pass.
 */
function loadZclData(db, ctx) {
  env.logInfo(
    `Starting to load Dotdot ZCL data in to DB for: ${ctx.metadataFile}, clusters length=${ctx.zclClusters.length}`
  )
  let types = { atomics: [], enums: [], bitmaps: [], structs: [] }
  prepareTypes(ctx.zclTypes, types)
  prepareTypes(ctx.zclGlobalTypes, types)
  var cs = []
  ctx.zclClusters.forEach((cluster) => {
    env.logInfo(`loading cluster: ${cluster.$.name}`)
    var c = prepareCluster(cluster, false, types)
    cs.push(c)
  })
  // Global attributes don't have a side listed, so they have to be looped through once for each side
  var gas = []
  ctx.zclGlobalAttributes.forEach((a) => {
    var pa = prepareAttributes([a], 'server', types)
    gas = gas.concat(pa)
    pa = prepareAttributes([a], 'client', types)
    gas = gas.concat(pa)
  })
  var gs = [
    {
      attributes: gas,
      commands: prepareCommands(ctx.zclGlobalCommands, ''),
    },
  ]
  var ds = []
  ctx.zclDeviceTypes.forEach((deviceType) => {
    env.logInfo(`loading device: ${deviceType.typeName[0]}`)
    var d = prepareDeviceType(deviceType)
    ds.push(d)
  })
  return queryZcl
    .insertClusters(db, ctx.packageId, cs)
    .then(() =>
      queryPackage.insertOptionsKeyValues(
        db,
        ctx.packageId,
        dbEnum.packageOptionCategory.manufacturerCodes,
        ctx.zclManufacturers.map((data) => {
          let mfgPair = data['$']
          return { code: mfgPair['code'], label: mfgPair['translation'] }
        })
      )
    )
    .then(() => queryZcl.insertDeviceTypes(db, ctx.packageId, ds))
    .then(() => queryZcl.insertGlobals(db, ctx.packageId, gs))
    .then(() => queryZcl.insertAtomics(db, ctx.packageId, types.atomics))
    .then(() => queryZcl.insertEnums(db, ctx.packageId, types.enums))
    .then(() => queryZcl.insertBitmaps(db, ctx.packageId, types.bitmaps))
    .then(() => queryZcl.insertStructs(db, ctx.packageId, types.structs))
}

/**
 * Toplevel function that loads the xml library file and orchestrates the promise chain.
 *
 * @export
 * @param {*} db
 * @param {*} ctx Context of loading.
 * @returns a Promise that resolves with the db.
 */
function loadDotdotZcl(db, ctx) {
  env.logInfo(`Loading Dotdot zcl file: ${ctx.metadataFile}`)
  return dbApi
    .dbBeginTransaction(db)
    .then(() => zclLoader.readMetadataFile(ctx))
    .then((ctx) => zclLoader.recordToplevelPackage(db, ctx))
    .then((ctx) => collectDataFromLibraryXml(ctx))
    .then((ctx) => zclLoader.recordVersion(ctx))
    .then((ctx) => parseZclFiles(db, ctx))
    .then((ctx) => loadZclData(db, ctx))
    .then(() => zclLoader.processZclPostLoading(db))
    .then(() => dbApi.dbCommit(db))
    .then(() => ctx)
}

exports.loadDotdotZcl = loadDotdotZcl

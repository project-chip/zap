const env = require('../util/env.js')
const path = require('path')
const zclLoader = require('./zcl-loader')
const dbApi = require('../db/db-api.js')
const fs = require('fs')
const xml2js = require('xml2js')
const queryZcl = require('../db/query-zcl.js')

/**
 * Promises to read the properties file, extract all the actual xml files, and resolve with the array of files.
 *
 * @param {*} ctx Context which contains information about the propertiesFiles and data
 * @returns Promise of resolved files.
 */
function collectData(ctx) {
  return new Promise((resolve, reject) => {
    env.logInfo(`Collecting ZCL files from: ${ctx.propertiesFile}`)
    let xml_string = fs.readFileSync(ctx.propertiesFile, 'utf8')
    var zclLib = new Array()
    xml2js.parseString(xml_string, function (err, result) {
      if (err) {
        reject(err)
      }
      ctx.version = '1.0'
      zclLib = result['zcl:library']
    })
    ctx.zclTypes = zclLib['type:type']
    ctx.zclFiles = zclLib['xi:include']
    resolve(ctx)
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
  return new Promise((resolve, reject) => {
    ctx.zclClusters = new Array()
    ctx.zclGlobalAttributes = new Array()
    ctx.zclGlobalCommands = new Array()
    ctx.zclFiles.forEach((file) => {
      env.logInfo(`Starting to parse Dotdot ZCL file: ${file.$.href}`)
      let xml_string = fs.readFileSync(
        path.dirname(ctx.propertiesFile) + '/' + file.$.href,
        'utf8'
      )
      xml2js.parseString(xml_string, function (err, result) {
        if (err) {
          reject(err)
        }
        if (result['zcl:cluster']) {
          ctx.zclClusters.push(result['zcl:cluster'])
        } else if (result['zcl:global']) {
          var global = result['zcl:global']
          ctx.zclGlobalAttributes = global.attributes[0].attribute
          ctx.zclGlobalCommands = global.commands[0].command
        }
      })
    })
    resolve(ctx)
  })
}

/**
 * Prepare XML attributes for entry into the DB
 *
 * @param {*} attributes an array of attributes
 * @param {*} side the side the attribute is on either "client" or "server"
 * @returns Array containing all data from XML ready to be inserted into the DB.
 */
function prepareAttributes(attributes, side) {
  ret = []
  atts = attributes.attribute === undefined ? attributes : attributes.attribute
  for (i = 0; i < atts.length; i++) {
    let a = atts[i]
    env.logInfo(`Preparing attribute ${side} ${a.$.name}`)
    ret.push({
      code: a.$.id,
      manufacturerCode: '', // no manuf code in dotdot xml
      name: a.$.name,
      type: a.$.type.toLowerCase(),
      side: side,
      define: a.$.define,
      min: a.$.min,
      max: a.$.max,
      isWritable: a.$.writable == 'true',
      defaultValue: a.$.default,
      isOptional: 'true', // optionality not listed in dotdot xml
      isReportable: 'true', // reportability not listed in dotdot xml
    })
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
  ret = []
  cmds = commands.command === undefined ? commands : commands.command
  for (i = 0; i < cmds.length; i++) {
    let c = cmds[i]
    env.logInfo(`Preparing command ${side} ${c.$.name}`)
    var pcmd = {
      code: c.$.id,
      manufacturerCode: '', //no manuf code for dotdot zcl
      name: c.$.name,
      description: '', // no description for dotdot zcl
      source: side,
      isOptional: 'true', // optionality of commands is not defined in dotdot zcl
    }
    if ('fields' in c) {
      pcmd.args = []
      c.fields.forEach((fields) => {
        fds = fields.field === undefined ? fields : fields.field
        for (j = 0; j < fds.length; j++) {
          let f = fds[j]
          env.logInfo(`Preparing field ${f.$.name}`)
          pcmd.args.push({
            name: f.$.name,
            type: f.$.type,
            isArray: 0, //no indication of array type in dotdot zcl
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
    // no current handling of extensions in the dotdot zcl
  } else {
    ret.code = cluster.$.id
    ret.name = cluster.$.name
    ret.description = '' // no description in dotdot zcl
    ret.define = '' // no define in dotdot zcl
    ret.domain = cluster.classification[0].$.role
    ret.manufacturerCode = '' // no manufacturer code in dotdot zcl
    ret.revision = cluster.$.revision // revision present in dotdot zcl
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
            prepareAttributes(attributes, side.name)
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

function prepareAtomic(type) {
  return {
    name: type.$.short,
    id: type.$.id,
    size: '', // size not defined in dotdot xml
    description: type.$.name,
  }
}
function prepareBitmap(type) {
  var ret = { name: type.$.short, type: type.bitmap[0].element[0].$.type }
  if ('bitmap' in type) {
    ret.fields = []
    type.bitmap[0].element.map((e) => {
      ret.fields.push({
        name: e.$.name,
        mask: e.$.mask,
      })
    })
  }
  return ret
}
function prepareEnum(type) {
  var ret = { name: type.$.short, type: type.$.inheritsFrom }
  if ('restriction' in type) {
    ret.items = []
    type.restriction[0]['type:enumeration'].map((e) => {
      ret.items.push({
        name: e.$.name,
        value: e.$.value,
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
  zclTypes.map((type) => {
    if ('bitmap' in type) {
      types.bitmaps.push(prepareBitmap(type))
    } else if (
      'restriction' in type &&
      'type:enumeration' in type.restriction[0]
    ) {
      types.enums.push(prepareEnum(type))
    } else {
      types.atomics.push(prepareAtomic(type))
    } // TODO: structs?
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
function loadZclData(db, ctx) {
  env.logInfo(
    `Starting to load Dotdot ZCL data in to DB for: ${ctx.propertiesFile}, clusters length=${ctx.zclClusters.length}`
  )
  let types = { atomics: [], enums: [], bitmaps: [], structs: [] }
  prepareTypes(ctx.zclTypes, types)
  cs = []
  ctx.zclClusters.forEach((cluster) => {
    env.logInfo(`loading cluster: ${cluster.$.name}`)
    var c = prepareCluster(cluster, false, types)
    cs.push(c)
  })
  let gs = [
    {
      attributes: prepareAttributes(ctx.zclGlobalAttributes, ''),
      commands: prepareCommands(ctx.zclGlobalCommands, ''),
    },
  ]
  return queryZcl
    .insertClusters(db, ctx.packageId, cs)
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
 * @param {*} propertiesFile
 * @returns a Promise that resolves with the db.
 */
function loadDotdotZcl(db, ctx) {
  env.logInfo(`Loading Dotdot zcl file: ${ctx.propertiesFile}`)
  return dbApi
    .dbBeginTransaction(db)
    .then(() => zclLoader.readPropertiesFile(ctx))
    .then((ctx) => zclLoader.recordToplevelPackage(db, ctx))
    .then((ctx) => collectData(ctx))
    .then((ctx) => zclLoader.recordVersion(ctx))
    .then((ctx) => parseZclFiles(db, ctx))
    .then((ctx) => loadZclData(db, ctx))
    .then(() => dbApi.dbCommit(db))
    .then(() => ctx)
}

exports.loadDotdotZcl = loadDotdotZcl

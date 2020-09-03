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
          ctx.zclGlobalAttributes = global.attributes.attribute
          ctx.zclGlobalCommands = global.commands.command
        }
      })
    })
    resolve(ctx)
  })
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
    // no current handling of extensions in the dotdot zcl
  } else {
    ret.code = cluster.$.id
    ret.name = cluster.$.name
    ret.description = '' // no description in dotdot zcl
    ret.define = '' // no define in dotdot zcl
    ret.domain = cluster.classification[0].$.role
    ret.manufacturerCode = '' // no manufacturer code in dotdot zcl
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
          for (i = 0; i < attributes.attribute.length; i++) {
            let a = attributes.attribute[i]
            env.logInfo(`Recording Attribute ${side.name} ${a.$.name}`)
            ret.attributes.push({
              code: a.$.id,
              manufacturerCode: '', // no manuf code in dotdot xml
              name: a.$.name,
              type: a.$.type.toLowerCase(),
              side: side.name,
              define: a.$.define,
              min: a.$.min,
              max: a.$.max,
              isWritable: a.$.writable == 'true',
              defaultValue: a.$.default,
              isOptional: 'true', // optionality not listed in dotdot xml
              isReportable: 'true', // reportability not listed in dotdot xml
            })
          }
        })
      }
      if ('commands' in side.value[0]) {
        side.value[0].commands.forEach((commands) => {
          for (i = 0; i < commands.command.length; i++) {
            let c = commands.command[i]
            env.logInfo(`Recording Command ${side.name} ${c.$.name}`)
            var cmd = {
              code: c.$.id,
              manufacturerCode: '', //no manuf code for dotdot zcl
              name: c.$.name,
              description: '', // no description for dotdot zcl
              source: side.name,
              isOptional: 'true', // optionality of commands is not defined in dotdot zcl
            }
            if ('fields' in c) {
              cmd.args = []
              c.fields.forEach((fields) => {
                for (j = 0; j < fields.field.length; j++) {
                  let f = fields.field[j]
                  env.logInfo(`Recording Field ${f.$.name}`)
                  cmd.args.push({
                    name: f.$.name,
                    type: f.$.type,
                    isArray: 0, //no indication of array type in dotdot zcl
                  })
                }
              })
            }
            ret.commands.push(cmd)
          }
        })
      }
    }
  })
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
    `Starting to load Dotdot ZCL data in to DB for: ${ctx.propertiesFile}, clusters length=${ctx.zclClusters.length}`
  )
  cs = []
  ctx.zclClusters.forEach((cluster) => {
    env.logInfo(`loading cluster: ${cluster.$.name}`)
    var c = prepareCluster(cluster, false)
    cs.push(c)
  })
  return queryZcl.insertClusters(db, ctx.packageId, cs)
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

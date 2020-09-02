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
  var sides = [cluster.server, cluster.client]
  ret.commands = []
  ret.attributes = []
  sides.forEach((side) => {
    if (!(side === undefined)) {
      var commands = side[0].commands
      if (!(commands === undefined)) {
        commands.forEach((command) => {
          var cmd = {
            code: command.command[0].$.id,
            manufacturerCode: '', //no manuf code for dotdot zcl
            name: command.command[0].$.name,
            description: '', // no description for dotdot zcl
            source: side,
            isOptional: 'true', // optionality of commands is not defined in dotdot zcl
          }
          ret.commands.push(cmd)
        })
      }
    }
  })
  /*
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
  } */
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

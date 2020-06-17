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

const path = require('path')
const yaml = require('yaml')
const fs = require('fs')
const queryZcl = require('../db/query-zcl.js')

function cleanse(name) {
  var ret = name.replace(/-/g, '_')
  ret = ret.replace(/ /g, '_')
  ret = ret.replace(/\//g, '_')
  ret = ret.replace(/\./g, '_')
  ret = ret.replace(/\(/g, '')
  ret = ret.replace(/\)/g, '')
  ret = ret.replace(/\#/g, '')
  ret = ret.replace(/\:/g, '_')
  ret = ret.toLowerCase()
  return ret
}

function toSlcc(obj) {
  var ret = '---\n'
  return ret.concat(yaml.stringify(obj))
}

// Device types
function deviceTypeContribFileName(deviceType) {
  return 'zcl_device_type_' + cleanse(deviceType.label) + '.zapcontrib'
}

function createDeviceTypeComponent(deviceType) {
  return {
    id: 'zcl_device_type_' + cleanse(deviceType.label),
    label: deviceType.label,
    description: deviceType.caption,
    package: 'Zigbee',
    category: 'Zigbee|Zigbee Cluster Library|Device Type',
    quality: 'production',
    root_path: 'app/zigbee/component',
    config_file: [
      {
        path: deviceTypeContribFileName(deviceType),
        directory: 'zap',
      },
    ],
  }
}

function createDeviceTypeContrib(deviceType) {
  var output = Object.assign({}, deviceType)
  delete output.id
  return output
}

function generateSingleDeviceTypeZapContrib(ctx, deviceType) {
  var fileName = path.join(
    ctx.generationDir,
    deviceTypeContribFileName(deviceType)
  )
  var output = JSON.stringify(createDeviceTypeContrib(deviceType))
  if (ctx.dontWrite) return Promise.resolve()
  else return fs.promises.writeFile(fileName, output)
}

function generateSingleDeviceTypeSlcc(ctx, deviceType) {
  var fileName = path.join(
    ctx.generationDir,
    'zcl_device_type_' + cleanse(deviceType.label) + '.slcc'
  )

  var output = toSlcc(createDeviceTypeComponent(deviceType))
  if (ctx.dontWrite) return Promise.resolve()
  else return fs.promises.writeFile(fileName, output)
}

// Cluster definitions

function clusterDefContribFileName(cluster) {
  return 'zcl_cluster_def_' + cleanse(cluster.label) + '.zapcontrib'
}

function createClusterDefComponent(cluster) {
  return {
    id: 'zcl_cluster_' + cleanse(cluster.label) + '_def',
    label: cluster.label,
    description: cluster.caption,
    package: 'Zigbee',
    category: 'Zigbee|Zigbee Cluster Library|Configuration',
    quality: 'production',
    root_path: 'app/zigbee/component',
    config_file: [
      {
        path: clusterDefContribFileName(cluster),
        directory: 'zap',
      },
    ],
  }
}

function createClusterDefContrib(cluster) {
  var clusterOut = Object.assign({}, cluster)
  delete clusterOut.id
  return {
    cluster: clusterOut,
    type: 'def',
  }
}

function generateSingleClusterDefContrib(ctx, cluster) {
  var fileName = path.join(
    ctx.generationDir,
    clusterDefContribFileName(cluster)
  )
  var output = JSON.stringify(createClusterDefContrib(cluster))
  if (ctx.dontWrite) return Promise.resolve()
  else return fs.promises.writeFile(fileName, output)
}

function generateSingleClusterDefSlcc(ctx, cluster) {
  var fileName = path.join(
    ctx.generationDir,
    'zcl_cluster_def_' + cleanse(cluster.label) + '.slcc'
  )
  var output = toSlcc(createClusterDefComponent(cluster))
  if (ctx.dontWrite) return Promise.resolve()
  else return fs.promises.writeFile(fileName, output)
}

// Cluster implementations
function clusterImpContribFileName(cluster) {
  return 'zcl_cluster_imp_' + cleanse(cluster.label) + '.zapcontrib'
}

function createClusterImpComponent(cluster) {
  return {
    id: 'zcl_cluster_' + cleanse(cluster.label) + '_imp',
    label: cluster.label,
    description: cluster.caption,
    package: 'Zigbee',
    category: 'Zigbee|Zigbee Cluster Library|Implementation',
    quality: 'production',
    root_path: 'app/zigbee/component',
    config_file: [
      {
        path: clusterImpContribFileName(cluster),
        directory: 'zap',
      },
    ],
  }
}

function createClusterImpContrib(cluster) {
  var clusterOut = Object.assign({}, cluster)
  delete clusterOut.id
  return {
    cluster: clusterOut,
    type: 'imp',
  }
}

function generateSingleClusterImpContrib(ctx, cluster) {
  var fileName = path.join(
    ctx.generationDir,
    clusterImpContribFileName(cluster)
  )
  var output = JSON.stringify(createClusterImpContrib(cluster))
  if (ctx.dontWrite) return Promise.resolve()
  else return fs.promises.writeFile(fileName, output)
}

function generateSingleClusterImpSlcc(ctx, cluster) {
  var fileName = path.join(
    ctx.generationDir,
    'zcl_cluster_imp_' + cleanse(cluster.label) + '.slcc'
  )
  var output = toSlcc(createClusterImpComponent(cluster))
  if (ctx.dontWrite) return Promise.resolve()
  else return fs.promises.writeFile(fileName, output)
}

// Commands
function createCommand(componentId, cluster, command) {
  return {
    id: componentId,
    label: command.label,
    package: 'Zigbee',
    category:
      'Zigbee|Zigbee Cluster Library|Configuration|' +
      cluster.label +
      '|Commands',
    quality: 'production',
    root_path: 'app/zigbee/component',
  }
}

function generateSingleCommandSlcc(ctx, cluster, command) {
  var clusterName = cleanse(cluster.label)
  var commandName = cleanse(command.label)
  var componentId = `zcl_cluster_${clusterName}_command_${commandName}`
  var fileName = path.join(ctx.generationDir, componentId + '.slcc')

  var output = toSlcc(createCommand(componentId, cluster, command))

  if (ctx.dontWrite) return Promise.resolve()
  else return fs.promises.writeFile(fileName, output)
}

function generateSingleClusterCommands(ctx, cluster) {
  return queryZcl
    .selectCommandsByClusterId(ctx.db, cluster.id)
    .then((commandsArray) => {
      var promises = []
      commandsArray.forEach((command) => {
        promises.push(generateSingleCommandSlcc(ctx, cluster, command))
      })
      return Promise.all(promises)
    })
}

// Attributes
function createAttribute(componentId, cluster, attribute) {
  return {
    id: componentId,
    label: attribute.label,
    package: 'Zigbee',
    category:
      'Zigbee|Zigbee Cluster Library|Configuration|' +
      cluster.label +
      '|Attributes',
    quality: 'production',
    root_path: 'app/zigbee/component',
  }
}

function generateSingleAttributeSlcc(ctx, cluster, attribute) {
  var clusterName = cleanse(cluster.label)
  var attributeName = cleanse(attribute.label)
  var componentId = `zcl_cluster_${clusterName}_attribute_${attributeName}`
  var fileName = path.join(ctx.generationDir, componentId + '.slcc')

  var output = toSlcc(createAttribute(componentId, cluster, attribute))

  if (ctx.dontWrite) return Promise.resolve()
  else return fs.promises.writeFile(fileName, output)
}

function generateSingleClusterAttributes(ctx, cluster) {
  return queryZcl
    .selectAttributesByClusterId(ctx.db, cluster.id)
    .then((attributesArray) => {
      var promises = []
      attributesArray.forEach((attribute) => {
        promises.push(generateSingleAttributeSlcc(ctx, cluster, attribute))
      })
      return Promise.all(promises)
    })
}

function generateDeviceTypes(ctx) {
  return queryZcl.selectAllDeviceTypes(ctx.db).then((deviceTypeArray) => {
    var promises = []
    console.log(`Generating ${deviceTypeArray.length} device types`)
    deviceTypeArray.forEach((element) => {
      promises.push(generateSingleDeviceTypeSlcc(ctx, element))
      promises.push(generateSingleDeviceTypeZapContrib(ctx, element))
    })
    return Promise.all(promises)
  })
}

function generateClusters(ctx) {
  return queryZcl.selectAllClusters(ctx.db).then((clustersArray) => {
    var promises = []
    console.log(`Generating ${clustersArray.length} clusters`)
    clustersArray.forEach((element) => {
      promises.push(generateSingleClusterDefSlcc(ctx, element))
      promises.push(generateSingleClusterDefContrib(ctx, element))
      promises.push(generateSingleClusterImpSlcc(ctx, element))
      promises.push(generateSingleClusterImpContrib(ctx, element))
      promises.push(generateSingleClusterAttributes(ctx, element))
      promises.push(generateSingleClusterCommands(ctx, element))
    })
    return Promise.all(promises)
  })
}

/**
 * Using SDK generation templates it returns a promise of created files.
 *
 * @param {*} ctx Contains generationDir, templateDir, db and options dontWrite which can prevent final writing.
 */
function runSdkGeneration(ctx) {
  console.log(
    `Generating SDK artifacts into ${ctx.generationDir}, using templates from ${ctx.templateDir}`
  )
  var promises = []
  promises.push(generateDeviceTypes(ctx))
  promises.push(generateClusters(ctx))

  var mainPromise
  if (ctx.dontWrite) {
    mainPromise = Promise.all(promises)
  } else {
    mainPromise = fs.promises
      .mkdir(ctx.generationDir, { recursive: true })
      .then(() => Promise.all(promises))
  }

  return mainPromise
}

exports.runSdkGeneration = runSdkGeneration

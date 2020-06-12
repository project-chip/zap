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

import * as QueryZcl from '../db/query-zcl'
import path from 'path'
import yaml from 'yaml'
import * as fs from 'fs'
import { logError } from '../util/env'

function cleanse(name) {
  var ret = name.replace(/-/g, '_')
  var ret = ret.replace(/ /g, '_')
  var ret = ret.replace(/\//g, '_')
  var ret = ret.toLowerCase()
  return ret
}

function createDeviceTypeComponent(deviceType) {
  return {
    id: 'zcl_device_type_' + cleanse(deviceType.label),
    label: deviceType.label,
    description: deviceType.caption,
    package: 'Zigbee',
    category: 'Zigbee|Zigbee Cluster Library|Device Type',
    quality: 'production',
  }
}

function createClusterDefComponent(cluster) {
  return {
    id: 'zcl_cluster_' + cleanse(cluster.label) + '_def',
    label: cluster.label,
    description: cluster.caption,
    package: 'Zigbee',
    category: 'Zigbee|Zigbee Cluster Library|Configuration',
    quality: 'production',
  }
}

function createClusterImpComponent(cluster) {
  return {
    id: 'zcl_cluster_' + cleanse(cluster.label) + '_imp',
    label: cluster.label,
    description: cluster.caption,
    package: 'Zigbee',
    category: 'Zigbee|Zigbee Cluster Library|Implementation',
    quality: 'production',
  }
}

function generateSingleDeviceType(ctx, deviceType) {
  var fileName = path.join(
    ctx.generationDir,
    'zcl_device_type_' + cleanse(deviceType.label) + '.slcc'
  )

  console.log(`   - ${fileName}`)

  var output = yaml.stringify(createDeviceTypeComponent(deviceType))
  if (ctx.dontWrite) return Promise.resolve()
  else return fs.promises.writeFile(fileName, output)
}

function generateSingleCluster(ctx, cluster) {
  var fileName = path.join(
    ctx.generationDir,
    'zcl_cluster_def_' + cleanse(cluster.label) + '.slcc'
  )
  console.log(`   - ${fileName}`)
  var output = yaml.stringify(createClusterDefComponent(cluster))
  if (ctx.dontWrite) return Promise.resolve()
  else return fs.promises.writeFile(fileName, output)
}

function generateSingleClusterImplementation(ctx, cluster) {
  var fileName = path.join(
    ctx.generationDir,
    'zcl_cluster_imp_' + cleanse(cluster.label) + '.slcc'
  )
  console.log(`   - ${fileName}`)
  var output = yaml.stringify(createClusterImpComponent(cluster))
  if (ctx.dontWrite) return Promise.resolve()
  else return fs.promises.writeFile(fileName, output)
}

function generateDeviceTypes(ctx) {
  return QueryZcl.selectAllDeviceTypes(ctx.db).then((deviceTypeArray) => {
    var promises = []
    console.log(`Generating ${deviceTypeArray.length} device types`)
    deviceTypeArray.forEach((element) => {
      promises.push(generateSingleDeviceType(ctx, element))
    })
    return Promise.all(promises)
  })
}

function generateClusters(ctx) {
  return QueryZcl.selectAllClusters(ctx.db).then((clustersArray) => {
    var promises = []
    console.log(`Generating ${clustersArray.length} clusters`)
    clustersArray.forEach((element) => {
      promises.push(generateSingleCluster(ctx, element))
      promises.push(generateSingleClusterImplementation(ctx, element))
    })
    return Promise.all(promises)
  })
}

/**
 * Using SDK generation templates it returns a promise of created files.
 *
 * @param {*} ctx Contains generationDir, templateDir, db and options dontWrite which can prevent final writing.
 */
export function runSdkGeneration(ctx) {
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

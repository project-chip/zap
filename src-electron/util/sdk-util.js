/**
 *
 *    Copyright (c) 2022 Silicon Labs
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
const util = require('./util')

/**
 * @module JS API: SDK utilities
 */

/**
 * This function reads in the sdk.json that is passed as sdkPath,
 * and resolve the promise with the sdk object.
 * logger is used for printouts.
 *
 * @param {*} sdkPath
 * @param {*} logger
 */
async function readSdkJson(
  sdkPath,
  options = {
    logger: (msg) => {},
  }
) {
  options.logger(`    👈 read in: ${sdkPath}`)
  let data = await fsp.readFile(sdkPath)
  let sdk = JSON.parse(data)

  // Runtime derived data goes here
  sdk.rt = {}

  options.logger(`    👉 sdk information: ${sdk.meta.description}`)

  let sdkRoot = path.join(path.dirname(sdkPath), sdk.meta.sdkRoot)
  options.logger(`    👉 sdk location: ${sdkRoot}`)
  let featureLevelMatch = util.matchFeatureLevel(
    sdk.meta.requiredFeatureLevel,
    sdk.meta.description
  )
  if (!featureLevelMatch.match) {
    options.logger(`⛔ ${featureLevelMatch.message}`)
    throw featureLevelMatch.message
  }

  options.logger('🐝 Resolving ZCL metafiles')
  sdk.rt.zclMetafiles = {}
  for (let key of Object.keys(sdk.zcl)) {
    let p = path.join(sdkRoot, sdk.zcl[key])
    options.logger(`    👈 ${p}`)
    sdk.rt.zclMetafiles[key] = p
  }

  options.logger('🐝 Resolving generation template metafiles')
  sdk.rt.genTemplates = {}
  for (let key of Object.keys(sdk.templates)) {
    let p = path.join(sdkRoot, sdk.templates[key])
    options.logger(`    👈 ${p}`)
    sdk.rt.genTemplates[key] = p
  }

  options.logger('🐝 Resolving generation patterns')
  sdk.rt.generateCommands = []
  for (let gen of sdk.generation) {
    let inputFile = path.join(sdkRoot, sdk.zapFiles[gen.zapFile])
    let outputDirectory = path.join(sdkRoot, gen.output)
    sdk.rt.generateCommands.push({
      inputFile: inputFile,
      outputDirectory: outputDirectory,
      template: gen.template,
    })
  }
  return sdk
}

exports.readSdkJson = readSdkJson

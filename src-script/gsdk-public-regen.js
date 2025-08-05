#!/usr/bin/env node
/**
 *
 *    Copyright (c) 2023 Silicon Labs
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

// This script can be used to regenerate all zap-related artifacts on the
// public Silicon Labs GSDK at: https://github.com/SiliconLabs/gecko_sdk
const path = require('path')
const fs = require('fs')
const scriptUtil = require('./script-util')
const env = require('../src-electron/util/env')
const process = require('process')

/**
 * GSDK generation process.
 * @param {*} argv
 */
async function run(argv) {
  let gsdkDir = argv[0]
  let outputDir = argv[1]

  if (gsdkDir == null) {
    throw Error(
      `Missing argument. Usage: gsdk-public-regen <SDK directory> <output directory>`
    )
  }

  if (outputDir == null) {
    throw Error(
      `Missing argument. Usage: gsdk-public-regen <SDK directory> <output directory>`
    )
  }
  fs.mkdirSync(outputDir, { recursive: true })

  console.log(
    env.formatMessage('👉', ` Detecting GSDK at directory ${gsdkDir} ...`)
  )
  if (!fs.existsSync(path.join(gsdkDir, 'gecko_sdk.slcs'))) {
    throw Error(
      `Invalid location. Directory ${gsdkDir} does not look like a gecko sdk.`
    )
  }
  console.log(env.formatMessage('👍', ` Gecko SDK detected.`))

  let zclJson = path.join(gsdkDir, 'app/zcl/zcl-zap.json')
  if (!fs.existsSync(zclJson)) {
    throw Error(`Invalid zcl.json. File ${zclJson} does not exist.`)
  } else {
    console.log(env.formatMessage('👍', ` ZCL metafile: ${zclJson}`))
  }

  let templateJson = path.join(
    gsdkDir,
    'protocol/zigbee/app/framework/gen-template/gen-templates.json'
  )
  if (!fs.existsSync(templateJson)) {
    throw Error(`Invalid template.json. File ${templateJson} does not exist.`)
  } else {
    console.log(env.formatMessage('👍', ` Templates metafile: ${templateJson}`))
  }

  let zapFileRoot = path.join(gsdkDir, 'protocol/zigbee/app/framework/')

  let zapFiles = await scriptUtil.locateRecursively(zapFileRoot, '.*\\.zap$')

  console.log(env.formatMessage('👍', ` Located ${zapFiles.length} zap files:`))
  zapFiles.forEach((f) => console.log(env.formatMessage('👉', `  ${f}`)))

  let cmdArgs = [
    'node',
    scriptUtil.mainPath(false),
    'generate',
    '--unhandled-rejections=strict'
  ]

  cmdArgs.push('-o')
  cmdArgs.push(outputDir + '/{index}/')
  cmdArgs.push('--gen')
  cmdArgs.push(templateJson)
  cmdArgs.push('--zcl')
  cmdArgs.push(zclJson)
  cmdArgs.push('--in')
  cmdArgs.push(...zapFiles)
  scriptUtil.executeCmd(null, 'npx', cmdArgs)
}

run(process.argv.slice(2))
  .then(() => {
    console.log(env.formatMessage('😎', ` Done!`))
  })
  .catch((err) => {
    console.log(env.formatMessage('⛔', `Error: ${err.message}\n========\n`))
    console.log(err)
    process.exit(1)
  })

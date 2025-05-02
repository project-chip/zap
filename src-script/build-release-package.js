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

const scriptUtil = require('./script-util.js')
const os = require('os')
const path = require('path')
const fs = require('fs')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

/**
 *
 * @param {*} osName
 * @param {*} outputPath
 */
async function buildForOS(osName, outputPath) {
  switch (osName) {
    case 'm':
      console.log(`Building for Mac... Output: ${outputPath}`)
      await scriptUtil.executeCmd({}, 'npm', ['run', 'pkg:mac']) // Building zap-cli
      await scriptUtil.executeCmd({}, 'npm', ['run', 'pack:mac']) // Building electron app
      if (outputPath) {
        await scriptUtil.executeCmd({}, 'mv', [
          './dist/zap-mac-x64.zip',
          path.join(outputPath, 'zap-mac-x64.zip')
        ])
        await scriptUtil.executeCmd({}, 'mv', [
          './dist/zap-mac-arm64.zip',
          path.join(outputPath, 'zap-mac-arm64.zip')
        ])
      }
      break

    case 'w':
      console.log(`Building for Windows... Output: ${outputPath}`)
      await scriptUtil.executeCmd({}, 'npm', ['run', 'pkg:win']) // Building zap-cli
      await scriptUtil.executeCmd({}, 'npm', ['run', 'pack:win']) // Building electron app
      if (outputPath) {
        await scriptUtil.executeCmd({}, 'mv', [
          'dist/zap-win-x64.zip',
          path.join(outputPath, 'zap-win-x64.zip')
        ])
        await scriptUtil.executeCmd({}, 'mv', [
          'dist/zap-win-arm64.zip',
          path.join(outputPath, 'zap-win-arm64.zip')
        ])
      }
      break

    case 'l':
      console.log(`Building for Linux... Output: ${outputPath}`)
      await scriptUtil.executeCmd({}, 'npm', ['run', 'pkg:linux']) // Building zap-cli
      await scriptUtil.executeCmd({}, 'npm', ['run', 'pack:linux']) // Building electron app
      if (outputPath) {
        await scriptUtil.executeCmd({}, 'mv', [
          'dist/zap-linux-x64.zip',
          path.join(outputPath, 'zap-linux-x64.zip')
        ])
        await scriptUtil.executeCmd({}, 'mv', [
          'dist/zap-linux-arm64.zip',
          path.join(outputPath, 'zap-linux-arm64.zip')
        ])
        await scriptUtil.executeCmd({}, 'mv', [
          'dist/zap-linux-amd64.deb',
          path.join(outputPath, 'zap-linux-amd64.deb')
        ])
        await scriptUtil.executeCmd({}, 'mv', [
          'dist/zap-linux-x64_64.rpm',
          path.join(outputPath, 'zap-linux-x64_64.rpm')
        ])
      }
      break

    default:
      console.error(`Error: Unsupported platform: ${osName}`)
      process.exit(1)
  }
}

const argv = yargs(hideBin(process.argv))
  .option('platform', {
    alias: 'p',
    type: 'string',
    description: 'Specify the platform(s) to build for (m, w, l)'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Specify the output directory for the build files'
  })
  .help()
  .strict().argv

let targets = argv.platform
let outputPath = argv.output

if (outputPath && !fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true })
  console.log(`Created output directory: ${outputPath}`)
}

if (!targets) {
  const currentPlatform = os.platform()
  switch (currentPlatform) {
    case 'darwin':
      targets = 'm' // Mac
      break
    case 'win32':
      targets = 'w' // Windows
      break
    case 'linux':
      targets = 'l' // Linux
      break
    default:
      console.error(`Error: Unsupported platform: ${currentPlatform}`)
      process.exit(1)
  }
  console.log(`No target specified. Defaulting to current system: ${targets}`)
}

const targetPlatforms = targets.split('')

targetPlatforms.forEach(async (target) => {
  await buildForOS(target, outputPath)
})

#!/usr/bin/env node
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

const scriptUtil = require('./script-util.js')

//workaround: executeCmd()/spawn() fails silently without complaining about missing path to electron
process.env.PATH = process.env.PATH + ':/usr/local/bin/'
let startTime = process.hrtime()
let args = process.argv.slice(2)
let executor = null
if (
  args[0] == 'generate' ||
  args[0] == 'selfCheck' ||
  args[0] == 'analyze' ||
  args[0] == 'convert' ||
  args[0] == 'server'
) {
  executor = 'node'
} else {
  executor = 'electron'
}

scriptUtil
  .stampVersion()
  .then(() => scriptUtil.rebuildSpaIfNeeded())
  .then(() => {
    let cmdArgs = ['src-electron/main-process/electron-main.js']

    if (executor === 'electron' && process.platform == 'linux') {
      if (!process.env.DISPLAY) {
        console.log(`
⛔ You are on Linux and you are attempting to run zap in UI mode without DISPLAY set.
⛔ Please set your DISPLAY environment variable or run zap-start.js with a command that does not require DISPLAY.`)
        process.exit(1)
      }
    }
    cmdArgs.push(...args)
    return scriptUtil.executeCmd(null, executor, cmdArgs)
  })
  .then(() => {
    let endTime = process.hrtime(startTime)
    console.log(
      `😎 All done: ${endTime[0]}s, ${Math.round(endTime[1] / 1000000)}ms.`
    )
    process.exit(0)
  })
  .catch((err) => {
    console.log(err)
    process.exit(1)
  })

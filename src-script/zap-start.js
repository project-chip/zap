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

scriptUtil
  .stampVersion()
  .then(() => scriptUtil.rebuildSpaIfNeeded())
  .then((ctx) => {
    let cmdArgs = ['src-electron/main-process/electron-main.js']
    args = process.argv.slice(2)
    let executor = null
    if (
      args[0] == 'generate' ||
      args[0] == 'selfCheck' ||
      args[0] == 'analyze' ||
      args[0] == 'convert' ||
      args[0] == 'server'
    )
      executor = 'node'
    else executor = 'electron'
    cmdArgs.push(...args)
    return scriptUtil.executeCmd(ctx, executor, cmdArgs)
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

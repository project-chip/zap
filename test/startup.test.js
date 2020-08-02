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
 *
 *
 * @jest-environment node
 */
const path = require('path')
const fs = require('fs')
const startup = require('../src-electron/main-process/startup.js')
const env = require('../src-electron/util/env.js')
const args = require('../src-electron/util/args.js')

test('startup: start generation', () => {
  var testGenDir = path.join(env.appDirectory(), 'test-gen')
  if (!fs.existsSync(testGenDir)) fs.mkdirSync(testGenDir)
  return startup.startGeneration(
    testGenDir,
    args.genTemplateJsonFile,
    args.zclPropertiesFile,
    null,
    {
      quit: false,
      log: false,
    }
  )
}, 5000)

test('startup: start sdk regen', () => {
  var testGenDir = path.join(env.appDirectory(), 'test-sdkgen')
  if (!fs.existsSync(testGenDir)) fs.mkdirSync(testGenDir)
  return startup.startSdkGeneration(testGenDir, args.zclPropertiesFile, {
    quit: false,
  })
}, 5000)

test('startup: self-check', () => {
  return startup.startSelfCheck({ log: false, quit: false })
})

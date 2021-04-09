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
const testUtil = require('./test-util.js')

test('startup: start generation', () => {
  let testGenDir = path.join(path.join(__dirname, '.zap/'), 'test-gen')
  if (!fs.existsSync(testGenDir)) fs.mkdirSync(testGenDir, { recursive: true })
  return startup.startGeneration(
    { skipPostGeneration: true },
    testGenDir,
    testUtil.testZigbeeGenerationTemplates,
    args.zclPropertiesFile,
    null,
    {
      quit: false,
      logger: (msg) => {},
    }
  )
}, 10000)

test('startup: self-check', () => {
  return startup.startSelfCheck({ logger: (msg) => {}, quit: false })
}, 5000)

test('startup: convert', () => {
  let files = []
  files.push(path.join(__dirname, 'resource/test-light.isc'))
  let output = '{basename}.conversion'
  let testOutputFile = path.join(__dirname, 'resource/test-light.conversion')
  return startup
    .startConvert(files, output, {
      quit: false,
      noZapFileLog: true,
      logger: (msg) => {},
    })
    .then(() => {
      expect(fs.existsSync(testOutputFile)).toBeTruthy()
      fs.unlinkSync(testOutputFile)
    })
}, 5000)

test('startup: analyze', () => {
  let files = []
  files.push(path.join(__dirname, 'resource/test-light.isc'))
  return startup.startAnalyze(files, {
    quit: false,
    cleanDb: false,
    logger: (msg) => {},
  })
}, 5000)

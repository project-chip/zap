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
const fsPromise = require('fs').promises
const startup = require('../src-electron/main-process/startup')
const env = require('../src-electron/util/env')
const testUtil = require('./test-util')
const dbApi = require('../src-electron/db/db-api')
const querySession = require('../src-electron/db/query-session')
const util = require('../src-electron/util/util')
let originalContent

beforeAll(async () => {
  env.setDevelopmentEnv()
  // Save the original file content before tests. Used for uc upgrade testiing
  originalContent = await fsPromise.readFile(
    path.join(__dirname, './resource/upgrade/multi-protocol.zap'),
    'utf-8'
  )
  originalContentLight = await fsPromise.readFile(
    path.join(__dirname, './resource/upgrade/light.zap'),
    'utf-8'
  )
})

afterAll(async () => {
  // Restore the original file content after tests. Used for uc upgrade testing
  await fsPromise.writeFile(
    path.join(__dirname, './resource/upgrade/multi-protocol.zap'),
    originalContent,
    'utf-8'
  )
  await fsPromise.writeFile(
    path.join(__dirname, './resource/upgrade/light.zap'),
    originalContentLight,
    'utf-8'
  )
})

test(
  'startup: start generation',
  () => {
    let testGenDir = path.join(path.join(__dirname, '.zap/'), 'test-gen')
    if (!fs.existsSync(testGenDir))
      fs.mkdirSync(testGenDir, { recursive: true })
    return startup.startGeneration(
      {
        skipPostGeneration: true,
        output: testGenDir,
        generationTemplate: testUtil.testTemplate.zigbee,
        zclProperties: env.builtinSilabsZclMetafile(),
        zapFiles: null
      },
      {
        quitFunction: null,
        logger: (msg) => {}
      }
    )
  },
  testUtil.timeout.long()
)

test(
  'startup: Test Generation that updates the .zap file',
  async () => {
    let zapFile = path.join(__dirname, './resource/upgrade/light.zap')
    let testGenDir = path.join(path.join(__dirname, '.zap/'), 'test-gen')
    if (!fs.existsSync(testGenDir))
      fs.mkdirSync(testGenDir, { recursive: true })
    // Check if the copied file exists
    const fileExists = await fsPromise
      .stat(zapFile)
      .then(() => true)
      .catch(() => false)
    expect(fileExists).toBe(true)

    // Read the content of the original file
    let fileContent = await fsPromise.readFile(
      path.join(__dirname, './resource/upgrade/light.zap'),
      'utf-8'
    )
    // Look for upgraded packages before upgrading the .zap file
    expect(fileContent).toContain(
      '../../../../../gen-template/gen-templates.json'
    )
    expect(fileContent).toContain(
      '../../../../../../../../../app/zcl/zcl-zap.json'
    )

    let testGenerationResults = path.join(
      __dirname,
      'resource/upgrade/test-generation-light.conversion.results.yaml'
    )

    await startup.startGeneration(
      {
        skipPostGeneration: true,
        output: testGenDir,
        generationTemplate: [testUtil.testTemplate.zigbee],
        zclProperties: [env.builtinSilabsZclMetafile()],
        zapFiles: [zapFile],
        upgradeZapFile: true,
        genResultFile: testGenerationResults
      },
      {
        quitFunction: null,
        logger: (msg) => {}
      }
    )

    // Read the content of the copied file
    fileContent = await fsPromise.readFile(
      path.join(__dirname, './resource/upgrade/light.zap'),
      'utf-8'
    )
    // Look for upgraded packages in the .zap file
    expect(fileContent).toContain(
      '../../gen-template/zigbee/gen-templates.json'
    )
    expect(fileContent).toContain('../../../zcl-builtin/silabs/zcl.json"')
  },
  testUtil.timeout.long()
)

test(
  'startup: self-check',
  () => {
    return startup.startSelfCheck(
      {
        zclProperties: env.builtinSilabsZclMetafile()
      },
      { logger: (msg) => {}, quit: false }
    )
  },
  testUtil.timeout.long()
)

test(
  'startup: convert',
  () => {
    let files = []
    files.push(path.join(__dirname, 'resource/isc/test-light.isc'))
    let output = '{basename}.conversion'
    let testOutputFile = path.join(
      __dirname,
      'resource/isc/test-light.conversion'
    )
    let testConversionResults = path.join(
      __dirname,
      'resource/isc/test-light.conversion.results.yaml'
    )

    return startup
      .startConvert(
        {
          zapFiles: files,
          output: output,
          zclProperties: env.builtinSilabsZclMetafile(),
          noZapFileLog: true,
          results: testConversionResults
        },
        {
          quitFunction: null,
          logger: (msg) => {}
        }
      )
      .then(() => {
        expect(fs.existsSync(testOutputFile)).toBeTruthy()
        fs.unlinkSync(testOutputFile)

        expect(fs.existsSync(testConversionResults)).toBeTruthy()
        fs.unlinkSync(testConversionResults)
      })
  },
  testUtil.timeout.long()
)

test(
  'startup: upgrade',
  async () => {
    // Check if the copied file exists
    const fileExists = await fsPromise
      .stat(path.join(__dirname, './resource/upgrade/multi-protocol.zap'))
      .then(() => true)
      .catch(() => false)
    expect(fileExists).toBe(true)

    let upgradeDirectory = path.join(__dirname, 'resource/upgrade')
    let testUpgradeResults = path.join(
      __dirname,
      'resource/upgrade/test-upgrade.conversion.results.yaml'
    )

    await startup
      .upgradeZapFile(
        {
          d: upgradeDirectory,
          zclProperties: [
            env.locateProjectResource('./zcl-builtin/silabs/zcl-zigbee.json'),
            env.locateProjectResource('./zcl-builtin/matter/zcl-matter.json')
          ],
          noZapFileLog: true,
          results: testUpgradeResults,
          generationTemplate: [
            env.locateProjectResource(
              './test/gen-template/zigbee/gen-templates-zigbee.json'
            ),
            env.locateProjectResource(
              './test/gen-template/matter/gen-templates-matter.json'
            )
          ],
          noLoadingFailure: true
        },
        {
          quitFunction: null,
          logger: (msg) => {}
        }
      )
      .then(() => {
        expect(fs.existsSync(testUpgradeResults)).toBeTruthy()
        fs.unlinkSync(testUpgradeResults)
      })

    // Read the content of the copied file
    const fileContent = await fsPromise.readFile(
      path.join(__dirname, './resource/upgrade/multi-protocol.zap'),
      'utf-8'
    )
    // Look for upgraded packages in the .zap file

    expect(fileContent).toContain(
      '../../gen-template/zigbee/gen-templates-zigbee.json'
    )
    expect(fileContent).toContain(
      '../../gen-template/matter/gen-templates-matter.json'
    )
    expect(fileContent).toContain(
      '../../../zcl-builtin/silabs/zcl-zigbee.json"'
    )
    expect(fileContent).toContain('../../../zcl-builtin/matter/zcl-matter.json')
  },
  testUtil.timeout.long()
)

test(
  'startup: analyze',
  () => {
    let files = []
    files.push(path.join(__dirname, 'resource/isc/test-light.isc'))
    return startup.startAnalyze(
      {
        zapFiles: files,
        zclProperties: env.builtinSilabsZclMetafile()
      },
      {
        quitFunction: null,
        cleanDb: false,
        logger: (msg) => {}
      }
    )
  },
  testUtil.timeout.long()
)

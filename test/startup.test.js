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
const importJs = require('../src-electron/importexport/import')
const genEngine = require('../src-electron/generator/generation-engine')
let originalContent
let originalContentLightMatter
let db
let originalSingletonContent

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('startup')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  env.setDevelopmentEnv()
  // Save the original file content before tests. Used for uc upgrade testing
  originalContent = await fsPromise.readFile(
    path.join(__dirname, './resource/upgrade/multi-protocol.zap'),
    'utf-8'
  )
  originalContentLight = await fsPromise.readFile(
    path.join(__dirname, './resource/upgrade/light.zap'),
    'utf-8'
  )
  originalContentLightMatter = await fsPromise.readFile(
    path.join(__dirname, './resource/upgrade/lighting-matter.zap'),
    'utf-8'
  )
  let testZapFile = path.join(
    __dirname,
    './resource/test-singleton-upgrade.zap'
  )

  // Save original content for restoration
  originalSingletonContent = await fsPromise.readFile(testZapFile, 'utf-8')
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
  await fsPromise.writeFile(
    path.join(__dirname, './resource/upgrade/lighting-matter.zap'),
    originalContentLightMatter,
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

    const matterFileExists = await fsPromise
      .stat(path.join(__dirname, './resource/upgrade/lighting-matter.zap'))
      .then(() => true)
      .catch(() => false)
    expect(matterFileExists).toBe(true)

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
        const upgradeResultsContent = fs.readFileSync(
          testUpgradeResults,
          'utf-8'
        )

        // Matter and Zigbee specific multi-protocol app tests
        expect(upgradeResultsContent).toMatch(
          /Cluster Revision attribute default value updated to 2 for Localization\n.*Configuration cluster on endpoint 0 matter/
        )
        expect(upgradeResultsContent).toMatch(
          /Cluster Revision attribute default value updated to 2 for ZLL\n.*Commissioning cluster on endpoint 1 zigbee/
        )
        expect(upgradeResultsContent).toMatch(
          /Cluster Revision attribute default value updated to 2 for Descriptor\n.*cluster on endpoint 1 matter/
        )

        // Only the level control of matter should be updated and not zigbee because matter applied that upgrade rule
        expect(upgradeResultsContent).toMatch(
          /Current Value attribute's default value updated to 10 for Level Control\n.*cluster on endpoint 1 matter/
        )
        expect(upgradeResultsContent).not.toMatch(
          /Current Value attribute's default value updated to 10 for Level Control\n.*cluster on endpoint 1 zigbee/
        )

        // Only the on/off of zigbee should be updated and not matter because zigbee applied that upgrade rule
        expect(upgradeResultsContent).toMatch(
          /On\/Off attribute default value updated to 1 for On\/Off cluster on endpoint\n.*1 zigbee/
        )
        expect(upgradeResultsContent).not.toMatch(
          /On\/Off attribute default value updated to 1 for On\/Off cluster on endpoint\n.*1 matter/
        )

        // Testing the order(priority) in which upgrade rules were run
        // Making sure lower priority tests are run first
        expect(upgradeResultsContent).toMatch(
          /Cluster Revision attribute default value updated to 2 for ZLL\n.*Commissioning cluster on endpoint 1 zigbee.*\n.*\n.*\n.*On\/Off attribute default value updated to 1 for On\/Off cluster on endpoint\n.*1 zigbee/
        )
        expect(upgradeResultsContent).toMatch(
          /Cluster Revision attribute default value updated to 2 for Descriptor\n.*cluster on endpoint 1 matter.*\n.*\n.*\n.*Current Value attribute's default value updated to 10 for Level Control\n.*cluster on endpoint 1 matter/
        )

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

    // Import the upgraded file for multiprotocol
    let importRes = await importJs.importDataFromFile(
      db,
      path.join(__dirname, './resource/upgrade/multi-protocol.zap'),
      { sessionId: null }
    )
    expect(importRes.errors.length).toBe(0)
    expect(importRes.warnings.length).toBe(0)

    // Check that generation happens successfully with the upgraded file
    let genResultMatter = await genEngine.generate(
      db,
      importRes.sessionId,
      importRes.templateIds[0],
      {},
      {
        generateOnly: 'endpoint-config.c',
        disableDeprecationWarnings: true
      }
    )
    // Check for the specific string in the generated content
    expect(genResultMatter.content['endpoint-config.c']).not.toContain(
      `{ 0x0000FFFD, ZAP_TYPE(INT16U), 2, 0, ZAP_SIMPLE_DEFAULT(1) }`
    )
    expect(genResultMatter.content['endpoint-config.c']).toContain(
      `{ 0x0000FFFD, ZAP_TYPE(INT16U), 2, 0, ZAP_SIMPLE_DEFAULT(2) }`
    )

    // Import the upgraded file for matter
    let importResMatter = await importJs.importDataFromFile(
      db,
      path.join(__dirname, './resource/upgrade/lighting-matter.zap'),
      { sessionId: null }
    )
    expect(importResMatter.errors.length).toBe(0)
    expect(importResMatter.warnings.length).toBe(0)

    // Check that generation happens successfully with the upgraded file
    let genResultMatterLight = await genEngine.generate(
      db,
      importResMatter.sessionId,
      importResMatter.templateIds[0],
      {},
      {
        generateOnly: 'endpoint-config.c',
        disableDeprecationWarnings: true
      }
    )
    // Check for the specific string in the generated content
    expect(genResultMatterLight.content['endpoint-config.c']).not.toContain(
      `{ 0x0000FFFD, ZAP_TYPE(INT16U), 2, 0, ZAP_SIMPLE_DEFAULT(1) }`
    )
    expect(genResultMatterLight.content['endpoint-config.c']).toContain(
      `{ 0x0000FFFD, ZAP_TYPE(INT16U), 2, 0, ZAP_SIMPLE_DEFAULT(2) }`
    )
  },
  testUtil.timeout.long()
)

test(
  'startup: open with singleton upgrade rule execution',
  async () => {
    let testZapFile = path.join(
      __dirname,
      './resource/test-singleton-upgrade.zap'
    )

    try {
      // Check if the test file exists
      const fileExists = await fsPromise
        .stat(testZapFile)
        .then(() => true)
        .catch(() => false)
      expect(fileExists).toBe(true)

      // Read the original content to verify singleton attributes exist captured in beforeAll
      expect(originalSingletonContent).toContain('"singleton": 1')

      // Import the file with upgrade package to trigger upgrade rules
      let importRes = await importJs.importDataFromFile(db, testZapFile, {
        sessionId: null
      })

      expect(importRes.errors.length).toBe(0)
      expect(importRes.warnings.length).toBe(0)

      // Save the session data back to file to persist the upgrade changes
      let exportJs = require('../src-electron/importexport/export')
      await exportJs.exportDataIntoFile(
        db,
        importRes.sessionId,
        testZapFile,
        {}
      )

      // Read the saved file content to verify singleton attributes were changed to false
      let upgradedContent = await fsPromise.readFile(testZapFile, 'utf-8')

      // Parse JSON to verify singleton values are now false
      let upgradedZapData = JSON.parse(upgradedContent)

      // Verify the file no longer contains singleton: true or singleton: 1
      expect(upgradedContent).not.toContain('"singleton": 1')
    } finally {
      // Restore original file content
      await fsPromise.writeFile(testZapFile, originalSingletonContent, 'utf-8')
    }
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

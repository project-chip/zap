/**
 *
 *    Copyright (c) 2025 Silicon Labs
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

const genEngine = require('../src-electron/generator/generation-engine')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const querySession = require('../src-electron/db/query-session')
const testUtil = require('./test-util')

let db
// endpoint_config_v2.h asks for the mask, endpoint_config.h does not.
let withMask
let withoutMask

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('no-default-value-mask')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
  let templateContext = await genEngine.loadTemplates(
    db,
    testUtil.testTemplate.matter3
  )
  let sessionId = await querySession.createBlankSession(db)
  await importJs.importDataFromFile(
    db,
    testUtil.matterTestFile.allClustersFileFormat2,
    { sessionId: sessionId }
  )
  let genResult = await genEngine.generate(
    db,
    sessionId,
    templateContext.packageId,
    {},
    { disableDeprecationWarnings: true }
  )
  expect(genResult.hasErrors).toEqual(false)
  withMask = genResult.content['endpoint_config_v2.h']
  withoutMask = genResult.content['endpoint_config.h']
}, testUtil.timeout.long())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'A blank attribute is flagged, so its generated zero is not read as configured',
  () => {
    expect(withMask).toContain(
      '{ 0x00000005, ZAP_TYPE(ENUM8), 1, ZAP_ATTRIBUTE_MASK(READABLE) | ZAP_ATTRIBUTE_MASK(NULLABLE) | ZAP_ATTRIBUTE_MASK(NO_DEFAULT_VALUE), ZAP_EMPTY_DEFAULT() }, /* LastNetworkingStatus */'
    )
  },
  testUtil.timeout.short()
)

test(
  'A blank nullable attribute is flagged, even though null is generated for it',
  () => {
    // This is the case the mask exists for: ZAP fills in the encoding of null
    // for a nullable attribute that was left blank, and that is otherwise
    // indistinguishable from a configured null.
    expect(withMask).toContain(
      '{ 0x00000000, ZAP_TYPE(TEMPERATURE), 2, ZAP_ATTRIBUTE_MASK(READABLE) | ZAP_ATTRIBUTE_MASK(NULLABLE) | ZAP_ATTRIBUTE_MASK(NO_DEFAULT_VALUE), ZAP_SIMPLE_DEFAULT(0x8000) }, /* LocalTemperature */'
    )
    // A configured null, on the other hand, is a value: 0xFF is the encoding of
    // null for this type and it carries no mask.
    expect(withMask).toContain(
      '{ 0x00000011, ZAP_TYPE(INT8U), 1, ZAP_ATTRIBUTE_MASK(WRITABLE) | ZAP_ATTRIBUTE_MASK(READABLE) | ZAP_ATTRIBUTE_MASK(NULLABLE), ZAP_SIMPLE_DEFAULT(0xFF) }, /* OnLevel */'
    )
  },
  testUtil.timeout.short()
)

test(
  'A blank attribute with a min and a max is flagged too',
  () => {
    // The default value is behind a pointer to a min/max/value triplet here,
    // which is the other place a generated zero could be mistaken for a
    // configured one.
    expect(withMask).toContain(
      '{ 0x00000002, ZAP_TYPE(ENUM8), 1, ZAP_ATTRIBUTE_MASK(MIN_MAX) | ZAP_ATTRIBUTE_MASK(WRITABLE) | ZAP_ATTRIBUTE_MASK(READABLE) | ZAP_ATTRIBUTE_MASK(NO_DEFAULT_VALUE), ZAP_MIN_MAX_DEFAULTS_INDEX(28) }, /* ScheduleProgrammingVisibility */'
    )
  },
  testUtil.timeout.short()
)

test(
  'An attribute whose default value is dropped is flagged',
  () => {
    // CurrentHeapFree is answered by the attribute access interface, so its
    // default value is not generated at all and nothing should read the zero
    // that is left behind.
    expect(withMask).toContain(
      '{ 0x00000001, ZAP_TYPE(INT64U), 8, ZAP_ATTRIBUTE_MASK(EXTERNAL_STORAGE) | ZAP_ATTRIBUTE_MASK(READABLE) | ZAP_ATTRIBUTE_MASK(NO_DEFAULT_VALUE), ZAP_EMPTY_DEFAULT() }, /* CurrentHeapFree */'
    )
  },
  testUtil.timeout.short()
)

test(
  'A configured value of zero is not flagged',
  () => {
    expect(withMask).toContain(
      '{ 0x00000000, ZAP_TYPE(BOOLEAN), 1, ZAP_ATTRIBUTE_MASK(READABLE), ZAP_SIMPLE_DEFAULT(0x00) }, /* OnOff */'
    )
  },
  testUtil.timeout.short()
)

test(
  'Every generated empty default value is flagged',
  () => {
    // The mask is only useful if it is exhaustive: an unflagged attribute has
    // to be one whose value was configured.
    let unflagged = withMask
      .split('\n')
      .filter(
        (line) =>
          line.includes('ZAP_EMPTY_DEFAULT()') &&
          line.includes('ZAP_ATTRIBUTE_MASK') &&
          !line.includes('NO_DEFAULT_VALUE')
      )
    expect(unflagged).toEqual([])
  },
  testUtil.timeout.short()
)

test(
  'A template that does not ask for the mask never gets it',
  () => {
    expect(withoutMask).not.toContain('NO_DEFAULT_VALUE')
  },
  testUtil.timeout.short()
)

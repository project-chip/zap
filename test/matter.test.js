const matter = require('../src-electron/sdk/matter.js')
const testUtil = require('./test-util')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const zclLoader = require('../src-electron/zcl/zcl-loader')

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('gen-matter-1')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  let ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
  zclPackageId = ctx.packageId
}, testUtil.timeout.long())

test(
  'forced external',
  async () => {
    let forcedExternal = await matter.getForcedExternalStorage(db, zclPackageId)
    expect(forcedExternal.length).toBeGreaterThan(0)
    forcedExternal.forEach((item) => {
      expect(item).toHaveProperty('optionLabel')
      expect(item).toHaveProperty('optionCategory')
    })
  },
  testUtil.timeout.long()
)

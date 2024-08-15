const matter = require('../src-electron/sdk/matter.js')
const testUtil = require('./test-util')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const dbEnum = require('../src-shared/db-enum.js')

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('gen-matter-1')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion(),
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
  testUtil.timeout.long(),
)
test('compute storage policy new config', async () => {
  const result1 = await matter.computeStorageOptionNewConfig(
    dbEnum.storagePolicy.attributeAccessInterface,
  )
  expect(result1).toEqual(dbEnum.storageOption.external)
  const result2 = await matter.computeStorageOptionNewConfig(
    dbEnum.storagePolicy.any,
  )
  expect(result2).toEqual(dbEnum.storageOption.ram)
})

const types = require('../src-electron/util/types')
const env = require('../src-electron/util/env')

beforeAll(() => {
  env.setDevelopmentEnv()
})

test('ZCL types nullable strings', () => {
  let r
  r = types.nullStringDefaultValue('char_string')
  expect(r).toContain('0xFF,')

  r = types.nullStringDefaultValue('long_char_string')
  expect(r).toContain('0xFF, 0xFF,')
})

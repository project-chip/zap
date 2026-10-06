const types = require('../src-electron/util/types')
const env = require('../src-electron/util/env')

beforeAll(() => {
  env.setDevelopmentEnv()
})

test('ZCL types nullable strings', () => {
  let r
  // Name form (sync atomic-root helpers)
  r = types.nullStringDefaultValue('char_string')
  expect(r).toContain('0xFF,')

  r = types.nullStringDefaultValue('long_char_string')
  expect(r).toContain('0xFF, 0xFF,')

  // Preferred object form from ATOMIC / determineType
  r = types.nullStringDefaultValue({ isString: true, isLong: false })
  expect(r).toContain('0xFF,')
  expect(r).not.toContain('0xFF, 0xFF,')

  r = types.nullStringDefaultValue({ isString: true, isLong: true })
  expect(r).toContain('0xFF, 0xFF,')
})

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

  const shortAlias = { isString: true, isLong: false }
  expect(types.isString(shortAlias)).toBe(true)
  expect(types.isOneBytePrefixedString(shortAlias)).toBe(true)
  expect(types.longTypeDefaultValue(4, shortAlias, 'abc')).toContain(
    "3, 'a', 'b', 'c'"
  )

  const longAlias = { isString: true, isLong: true }
  expect(types.isTwoBytePrefixedString(longAlias)).toBe(true)
  expect(types.nullStringDefaultValue(longAlias)).toContain('0xFF, 0xFF,')
})

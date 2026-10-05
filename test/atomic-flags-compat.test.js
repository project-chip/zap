/**
 *
 *    Copyright (c) 2026 Silicon Labs
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
 * @jest-environment node
 */

const path = require('path')
const dbApi = require('../src-electron/db/db-api')
const queryZcl = require('../src-electron/db/query-zcl')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const env = require('../src-electron/util/env')
const types = require('../src-electron/util/types')
const overridable = require('../src-electron/generator/overridable')
const validation = require('../src-electron/validation/validation')
const testUtil = require('./test-util')
const testQuery = require('./test-query')

const legacyZclMetafile = path.join(
  __dirname,
  'resource/legacy-atomic-flags/zcl.json'
)

beforeAll(() => {
  env.setDevelopmentEnv()
})

/**
 * Older SDKs omit string/long/char/float XML attributes on root atomics.
 * Latest ZAP must still treat those roots the same as historical name-based
 * classification.
 */
test(
  'Legacy atomic XML without string/float attrs still sets ATOMIC flags',
  async () => {
    let db = await dbApi.initRamDatabase()
    try {
      await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())
      let ctx = await zclLoader.loadZcl(db, legacyZclMetafile)
      let packageId = ctx.packageId
      let pkgs = [packageId]

      let octet = await queryZcl.selectAtomicType(db, pkgs, 'octet_string')
      expect(octet).toBeDefined()
      expect(octet.isString).toBe(true)
      expect(octet.isLong).toBe(false)
      expect(octet.isChar).toBe(false)

      let charStr = await queryZcl.selectAtomicType(db, pkgs, 'char_string')
      expect(charStr.isString).toBe(true)
      expect(charStr.isChar).toBe(true)
      expect(charStr.isLong).toBe(false)

      let longOctet = await queryZcl.selectAtomicType(
        db,
        pkgs,
        'long_octet_string'
      )
      expect(longOctet.isString).toBe(true)
      expect(longOctet.isLong).toBe(true)
      expect(longOctet.isChar).toBe(false)

      let longChar = await queryZcl.selectAtomicType(
        db,
        pkgs,
        'long_char_string'
      )
      expect(longChar.isString).toBe(true)
      expect(longChar.isLong).toBe(true)
      expect(longChar.isChar).toBe(true)

      // Matter-style float roots (name single/double, no float="true")
      let single = await queryZcl.selectAtomicType(db, pkgs, 'single')
      expect(single.isFloat).toBe(true)
      let dbl = await queryZcl.selectAtomicType(db, pkgs, 'double')
      expect(dbl.isFloat).toBe(true)

      // Zigbee-style float_* roots without float="true"
      expect(
        (await queryZcl.selectAtomicType(db, pkgs, 'float_semi')).isFloat
      ).toBe(true)
      expect(
        (await queryZcl.selectAtomicType(db, pkgs, 'float_single')).isFloat
      ).toBe(true)
      expect(
        (await queryZcl.selectAtomicType(db, pkgs, 'float_double')).isFloat
      ).toBe(true)

      // Roots still land in STRING table via name classification
      expect(
        await queryZcl.selectStringByName(db, 'octet_string', pkgs)
      ).toBeDefined()
      expect(
        await queryZcl.selectStringByName(db, 'char_string', pkgs)
      ).toBeDefined()

      // Alias without baseType must NOT become a string (old behavior)
      let ipadr = await queryZcl.selectAtomicType(db, pkgs, 'ipadr')
      expect(ipadr.isString).toBe(false)
      expect(
        await queryZcl.selectStringByName(db, 'ipadr', pkgs)
      ).toBeUndefined()

      // Async helpers and sync root-name helpers agree on legacy roots
      expect(await types.isStringType(db, pkgs, 'octet_string')).toBe(true)
      expect(await types.isStringType(db, pkgs, 'ipadr')).toBe(false)
      expect(await types.isFloatType(db, pkgs, 'single')).toBe(true)
      expect(types.isString('CHAR_STRING')).toBe(true)
      expect(types.isString('octet_string')).toBe(true)
      expect(types.isFloat('FLOAT_SEMI')).toBe(true)
      expect(types.isFloat('single')).toBe(true)
      expect(types.isOneBytePrefixedString('char_string')).toBe(true)
      expect(types.isTwoBytePrefixedString('long_octet_string')).toBe(true)

      // C mapping for string roots without relying only on new flags
      expect(overridable.atomicType({ name: 'octet_string', size: null })).toBe(
        'uint8_t *'
      )
      expect(overridable.atomicType({ name: 'char_string', size: null })).toBe(
        'uint8_t *'
      )

      // Validation: string default on char_string must not be Invalid Integer
      let sid = await testQuery.createSession(
        db,
        'USER',
        'SESSION',
        legacyZclMetafile
      )
      let issues = await validation.validateSpecificAttribute(
        { defaultValue: 'hello' },
        { type: 'char_string', name: 'Label', isNullable: false },
        db,
        sid
      )
      expect(issues.defaultValue).not.toContain('Invalid Integer')
    } finally {
      await dbApi.closeDatabase(db)
    }
  },
  testUtil.timeout.medium()
)

/**
 * New-format Matter XML (attrs + baseType) must keep alias inheritance.
 */
test(
  'Current Matter XML with attrs and baseType still aliases to octet_string',
  async () => {
    let db = await dbApi.initRamDatabase()
    try {
      await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())
      let ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
      let packageId = ctx.packageId
      let pkgs = [packageId]

      let hwadr = await queryZcl.selectAtomicType(db, pkgs, 'hwadr')
      expect(hwadr.isString).toBe(true)
      expect(hwadr.baseType).toBe('octet_string')
      expect(await queryZcl.selectStringByName(db, 'hwadr', pkgs)).toBeDefined()

      let octet = await queryZcl.selectAtomicType(db, pkgs, 'octet_string')
      expect(octet.isString).toBe(true)
    } finally {
      await dbApi.closeDatabase(db)
    }
  },
  testUtil.timeout.medium()
)

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
const {
  exportedNamesByFunction,
  applyExportedHelperNames,
  renderHelperDocs
} = require('../src-script/generate-template-helper-docs.js')

test('documents the exported helper name rather than the internal function', () => {
  const source = `
function chipAsPrivilege(options) {
  return ''
}
exports.chip_as_privilege = chipAsPrivilege
`
  expect(exportedNamesByFunction(source).get('chipAsPrivilege')).toBe(
    'chip_as_privilege'
  )
})

test('prefers the live export over a deprecated camelCase alias', () => {
  const source = `
exports.feature_bits = featureBits
exports.global_attribute_default = attributeDefault
exports.indent = ident
exports.ident = dep(ident, { to: 'indent' })
exports.is_equal = isEqual
exports.isEqual = dep(isEqual, { to: 'is_equal' })
exports.as_snake_case = asUnderscoreLowercase
exports.as_underscore_lowercase = asUnderscoreLowercase
exports.asUnderscoreLowercase = dep(asUnderscoreLowercase, {
  to: 'as_underscore_lowercase'
})
exports.as_bytes = asBytes
exports.asBytes = dep(asBytes, { to: 'as_bytes' })
exports.as_bytes = dep(
  asBytes,
  'as_bytes has been deprecated'
)
exports.if_manufacturing_specific_cluster = dep(
  if_manufacturing_specific_cluster,
  { to: 'if_mfg_specific_cluster' }
)
`
  const names = exportedNamesByFunction(source)
  expect(names.get('featureBits')).toBe('feature_bits')
  expect(names.get('attributeDefault')).toBe('global_attribute_default')
  expect(names.get('ident')).toBe('indent')
  expect(names.get('isEqual')).toBe('is_equal')
  expect(names.get('asUnderscoreLowercase')).toBe('as_underscore_lowercase')
  expect(names.get('asBytes')).toBe('as_bytes')
  expect(names.get('if_manufacturing_specific_cluster')).toBe(
    'if_manufacturing_specific_cluster'
  )
})

test('renaming a short helper does not rewrite a longer sibling name', () => {
  const doclets = [
    {
      kind: 'function',
      name: 'access',
      longname: 'module:Templating API: Access helpers~access',
      id: 'module:Templating API: Access helpers~access',
      meta: { filename: 'helper-access.js' }
    },
    {
      kind: 'function',
      name: 'default_access',
      longname: 'module:Templating API: Access helpers~default_access',
      id: 'module:Templating API: Access helpers~default_access',
      meta: { filename: 'helper-access.js' }
    }
  ]
  const mapsByFile = new Map([
    ['helper-access.js', new Map([['access', 'chip_as_privilege']])]
  ])
  applyExportedHelperNames(doclets, mapsByFile)
  expect(doclets[0].name).toBe('chip_as_privilege')
  expect(doclets[0].longname).toBe(
    'module:Templating API: Access helpers~chip_as_privilege'
  )
  expect(doclets[0].id).toBe(
    'module:Templating API: Access helpers~chip_as_privilege'
  )
  expect(doclets[1].name).toBe('default_access')
  expect(doclets[1].longname).toBe(
    'module:Templating API: Access helpers~default_access'
  )
})

test('generated future-helper docs use if_future and set_future', () => {
  const markdown = renderHelperDocs([
    path.join(__dirname, '../src-electron/generator/helper-future.js')
  ])
  expect(markdown).toContain('~if_future(options)')
  expect(markdown).toContain('~set_future(options)')
  expect(markdown).not.toContain('ifFuture')
  expect(markdown).not.toContain('setFuture')
})

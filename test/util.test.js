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
 * @jest-environment jsdom
 */

const util = require('../src/util/util')
const util2 = require('../src-electron/util/util')
const { timeout } = require('./test-util')

test(
  'Clean symbol',
  () => {
    expect(util.asHex('-1', 4)).toEqual('-1')
    expect(util.asHex(null, 4)).toEqual('')
    expect(util.asHex('123', 4)).toEqual('0x007B')
    expect(util.asHex('0x123', 4)).toEqual('0x0123')
    expect(util.asHex(123, 4)).toEqual('0x007B')
  },
  timeout.short()
)

test(
  'Pattern format',
  () => {
    expect(util2.patternFormat('{a}{b}', { a: 1, b: 2 })).toEqual('12')
    expect(util2.patternFormat('{a}{b}', { a: 10, b: 2 })).toEqual('102')
    expect(util2.patternFormat('{a:hexuppercase}{b}', { a: 10, b: 2 })).toEqual(
      'A2'
    )
    expect(util2.patternFormat('{a:hexlowercase}{b}', { a: 10, b: 2 })).toEqual(
      'a2'
    )
    expect(
      util2.patternFormat(
        '{a:tocamelcase} {b:tosnakecase} {b:tosnakecaseallcaps} {a:tokensintouppercamelcase} {c:tokensintouppercamelcase} {d:tokensintouppercamelcase}',
        {
          a: 'some string',
          b: 'another string',
          c: 'PM2.5 Concentration Measurement',
          d: 'FOO2.5 BAR Baz'
        }
      )
    ).toEqual(
      'someString another_string ANOTHER_STRING SomeString Pm25ConcentrationMeasurement Foo25BarBaz'
    )
  },
  timeout.short()
)

// extractUcClusterCode and getClusterIdsByUcComponents together back the
// "Required SLC Component not installed" warning. They reduce UC component
// ids to a canonical short cluster code so selected ids (from Studio's tree)
// and required ids (from the ZCL extension's component map) can be compared
// regardless of which prefix format the source happens to use.
test(
  'extractUcClusterCode: collapses all known id formats to the short code',
  () => {
    // Studio tree leaf, zigbee
    expect(
      util.extractUcClusterCode(
        'studiocomproot-Zigbee-Cluster_Library-Common-zigbee_basic'
      )
    ).toEqual('zigbee_basic')

    // Studio tree leaf, matter
    expect(
      util.extractUcClusterCode(
        'studiocomproot-Matter-Clusters-Common-matter_basic'
      )
    ).toEqual('matter_basic')

    // %extension form used by the ZCL extension required-component map
    expect(util.extractUcClusterCode('%extension-zigbee%zigbee_basic')).toEqual(
      'zigbee_basic'
    )
    expect(
      util.extractUcClusterCode('%extension-matter%matter_level_control')
    ).toEqual('matter_level_control')

    // Composite path with %extension inside (what Studio sends for matter)
    expect(
      util.extractUcClusterCode(
        'matter:1.0.0-Matter-Clusters-%extension-matter%matter_level_control'
      )
    ).toEqual('matter_level_control')

    // Bare short code passes through
    expect(util.extractUcClusterCode('zigbee_basic')).toEqual('zigbee_basic')

    // Defensive cases
    expect(util.extractUcClusterCode(null)).toEqual('')
    expect(util.extractUcClusterCode(undefined)).toEqual('')
    expect(util.extractUcClusterCode('')).toEqual('')
  },
  timeout.short()
)

test(
  'getClusterIdsByUcComponents: maps mixed zigbee+matter components to short codes',
  () => {
    const components = [
      { id: 'studiocomproot-Zigbee-Cluster_Library-Common-zigbee_basic' },
      { id: 'studiocomproot-Zigbee-Cluster_Library-HA-zigbee_on_off' },
      {
        id: 'matter:1.0.0-Matter-Clusters-%extension-matter%matter_level_control'
      },
      { id: '%extension-matter%matter_basic' }
    ]
    expect(util.getClusterIdsByUcComponents(components)).toEqual([
      'zigbee_basic',
      'zigbee_on_off',
      'matter_level_control',
      'matter_basic'
    ])
  },
  timeout.short()
)

test(
  'getClusterIdsByUcComponents + extractUcClusterCode: matter and zigbee required ids both match',
  () => {
    // Mirrors the comparison in common-mixin's missingUcComponentDependencies:
    //   selectedIds = getClusterIdsByUcComponents(selected)
    //   missing    = required.filter(r => !selectedIds.includes(extractUcClusterCode(r)))
    const selected = [
      { id: 'studiocomproot-Zigbee-Cluster_Library-Common-zigbee_basic' },
      {
        id: 'matter:1.0.0-Matter-Clusters-%extension-matter%matter_level_control'
      }
    ]
    const selectedIds = util.getClusterIdsByUcComponents(selected)

    // Required ids come from the ZCL extension in %extension-...%name form.
    const required = [
      '%extension-zigbee%zigbee_basic',
      '%extension-matter%matter_level_control'
    ]
    const missing = required.filter(
      (id) => !selectedIds.includes(util.extractUcClusterCode(id))
    )
    expect(missing).toEqual([])

    // Anything genuinely not in selected stays in the missing list.
    const requiredWithGap = [
      '%extension-zigbee%zigbee_basic',
      '%extension-zigbee%zigbee_on_off' // not selected
    ]
    const missingWithGap = requiredWithGap.filter(
      (id) => !selectedIds.includes(util.extractUcClusterCode(id))
    )
    expect(missingWithGap).toEqual(['%extension-zigbee%zigbee_on_off'])
  },
  timeout.short()
)

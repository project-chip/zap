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

const templateEngine = require('../src-electron/generator/template-engine.js')
const fs = require('fs')
const path = require('path')
const { timeout } = require('./test-util.js')

test(
  'helper functions need to be snake_case without uppercase characters unless they are deprecated',
  () => {
    let helpers = templateEngine.allBuiltInHelpers()
    expect(Object.keys(helpers.api).length).toBeGreaterThan(10)
    for (const x of Object.keys(helpers.api)) {
      expect(helpers.api[x]).not.toBeNull()
      let n = x
      if (!helpers.api[x].isDeprecated) expect(n.toLowerCase()).toEqual(n)
    }
  },
  timeout.short()
)

test(
  'check that there is no overlapping duplicates',
  () => {
    let helpers = templateEngine.allBuiltInHelpers()
    let dups = helpers.duplicates.join(', ')
    expect(dups).toBe('')
  },
  timeout.short()
)

test(
  'compare APIs against the baseline',
  () => {
    let apiFromFile = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'helper-api-baseline.json'))
    )
    let helpers = templateEngine.allBuiltInHelpers()

    let errorMessage = ''

    apiFromFile.forEach((api) => {
      let fn = api.name
      let apiFn = helpers.api[fn]
      if (apiFn == undefined) {
        errorMessage += `Helper ${fn} has been removed, breaking the API.\n`
      }
      if (api.isDeprecated) {
        if (!apiFn.isDeprecated)
          errorMessage += `Helper ${fn} has been deprecated, but now it's not any more.\n`
      }
    })
    expect(errorMessage).toEqual('')
  },
  timeout.short()
)

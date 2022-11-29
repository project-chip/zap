#!/usr/bin/env node
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
 */

const templateEngine = require('../dist/src-electron/generator/template-engine')
const fs = require('fs')

let helpers = templateEngine.allBuiltInHelpers()
let ar = []

if (helpers.duplicates.length > 0) {
  console.log(`API has duplicates: ${helpers.duplicates}`)
  process.exit(1)
}

for (const key of Object.keys(helpers.api)) {
  let helper = { name: key, isDeprecated: helpers.api[key].isDeprecated }
  if (helpers.category[key] != null) {
    helper.category = helpers.category[key]
  }
  ar.push(helper)
}

ar.sort((a, b) => a.name.localeCompare(b.name))

let json = JSON.stringify(ar)

fs.writeFileSync('test/helper-api-baseline.json', json)

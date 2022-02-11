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

const scriptUtil = require('./script-util.js')

let cypressMode = 'run'

if (process.argv.length > 2) {
  cypressMode = process.argv[2]
}

if (cypressMode == '-?') {
  console.log(`Usage: zap-uitest.js [ MODE | -? ]

This program executes the Cypress unit tests. 
Valid modes:
   run  -  [default] Executes all the Cypress tests in the headless mode. You might need to run via xvfb-run in a headless environment.
   open -  Executes Cypress UI for manual run of the tests.`)
  process.exit(0)
}

let returnCode = 0
let svr = scriptUtil.executeCmd(null, 'npm', ['run', 'zap-devserver'])

let cyp = scriptUtil.executeCmd(null, 'npx', [
  'start-test',
  'quasar dev',
  'http-get://localhost:8080',
  `cypress ${cypressMode}`,
])

cyp
  .then(() => {
    returnCode = 0
    scriptUtil.executeCmd(null, 'npm', ['run', 'stop'])
  })
  .catch(() => {
    returnCode = 1
    scriptUtil.executeCmd(null, 'npm', ['run', 'stop'])
  })

svr.then(() => {
  if (returnCode == 0) {
    console.log('😎 All done: Cypress tests passed and server shut down.')
    process.exit(0)
  } else {
    console.log('⛔ Error: Cypress tests failed, server shut down.')
    process.exit(returnCode)
  }
})

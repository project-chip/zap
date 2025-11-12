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
const env = require('../src-electron/util/env')

let browserToUse = 'chrome'
let cypressMode = 'run'
let testsType = 'zigbee'

// This is a test only. Set to true only
// if you want the action to technically pass,
// even if the tests actually fail.
let ignoreErrorCode = false

if (process.argv.length > 2) {
  cypressMode = process.argv[2]
}

if (process.argv.length > 3) {
  testsType = process.argv[3]
}

if (process.argv.length > 4) {
  browserToUse = process.argv[4]
}

/**
 * Print ZAP usage information.
 */
function printUsage() {
  console.log(`Usage: zap-uitest.js [ MODE | -? ] [matter|zigbee] [browser]

This program executes the Cypress unit tests.
Valid modes:
   run  -  [default] Executes all the Cypress tests in the headless mode.
   open -  Executes Cypress UI for manual run of the tests.`)
  process.exit(0)
}

if (cypressMode == '-?') {
  printUsage()
}

let svrCmd
let fixturesConfig
if (testsType == 'zigbee') {
  svrCmd = 'zigbeezap-devserver'
  fixturesConfig = ''
} else if (testsType == 'matter') {
  svrCmd = 'matterzap-devserver'
  fixturesConfig = '--config fixturesFolder=cypress/matterFixtures'
} else {
  printUsage()
}

let returnCode = 0
let svr = scriptUtil.executeCmd(null, 'npm', ['run', svrCmd])

let cyp = scriptUtil.executeCmd(null, 'npx', [
  'start-test',
  'quasar dev',
  'http-get://localhost:9070',
  `npx cypress ${cypressMode} --browser ${browserToUse} --env mode=${testsType} ${fixturesConfig}`
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
    console.log(
      env.formatEmojiMessage(
        '😎',
        'All done: Cypress tests passed and server shut down.'
      )
    )
    process.exit(0)
  } else if (ignoreErrorCode) {
    console.log(
      env.formatEmojiMessage(
        '⚠️',
        'There was an error code, but will be ignored. Please check logs.'
      )
    )
    process.exit(0)
  } else {
    console.log(
      env.formatEmojiMessage(
        '⛔',
        'Error: Cypress tests failed, server shut down.'
      )
    )
    process.exit(returnCode)
  }
})

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
const fsExtra = require('fs-extra')
const env = require('../src-electron/util/env')

//workaround: executeCmd()/spawn() fails silently without complaining about missing path to electron
process.env.PATH = process.env.PATH + ':/usr/local/bin/'

/**
 * Execute the coverage report script.
 */
async function executeScript() {
  try {
    // Create directory if it does not exist
    await fsExtra.ensureDir('reports')

    if (fsExtra.existsSync('cypress-coverage/coverage-final.json')) {
      await fsExtra.copy(
        'cypress-coverage/coverage-final.json',
        'reports/from-cypress.json'
      )
    }

    if (fsExtra.existsSync('jest-coverage/coverage-final.json')) {
      await fsExtra.copy(
        'jest-coverage/coverage-final.json',
        'reports/from-jest.json'
      )
    }

    scriptUtil.executeCmd({}, 'npx', ['nyc', 'merge', 'reports'])

    await fsExtra.move('coverage.json', '.nyc_output/out.json', {
      overwrite: true
    })

    scriptUtil.executeCmd(
      {},
      'npx',
      'nyc report --reporter lcov --reporter text --report-dir coverage'.split(
        ' '
      )
    )

    console.log(
      env.formatEmojiMessage(
        '✅',
        'Please find the combined report (Jest & Cypress) at ./coverage/lcov-report/index.html'
      )
    )
  } catch (err) {
    console.log(
      'Error in generating reports at zap-combine-reports.js file and executeScript function: ' +
        err
    )
  }
}

executeScript()

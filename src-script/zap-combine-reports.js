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
 * Normalize coverage data structure
 * @param {*} coverageData
 * @returns normalized coverage data
 */
function normalizeCoverageData(coverageData) {
  // If it has a 'data' wrapper (Jest format), extract it
  if (coverageData.data && typeof coverageData.data === 'object') {
    return coverageData.data
  }
  // Otherwise return as-is (Cypress format)
  return coverageData
}

/**
 * Check if coverage data is valid (has actual coverage info)
 * @param {*} coverageData
 * @returns boolean
 */
function isValidCoverageData(coverageData) {
  if (!coverageData || typeof coverageData !== 'object') {
    return false
  }

  // Check if it has at least one file with coverage data
  const keys = Object.keys(coverageData)
  return (
    keys.length > 0 &&
    keys.some(
      (key) =>
        coverageData[key] &&
        typeof coverageData[key] === 'object' &&
        'path' in coverageData[key]
    )
  )
}

/**
 * Execute the coverage report script.
 */
async function executeScript() {
  try {
    // Create directory if it does not exist
    await fsExtra.ensureDir('.nyc_output')

    let hasCoverage = false
    let combinedCoverage = {}

    if (fsExtra.existsSync('cypress-coverage/coverage-final.json')) {
      const cypressData = await fsExtra.readJson(
        'cypress-coverage/coverage-final.json'
      )
      const normalizedCypress = normalizeCoverageData(cypressData)

      if (isValidCoverageData(normalizedCypress)) {
        // Merge into combined coverage
        Object.assign(combinedCoverage, normalizedCypress)
        console.log('✅ Cypress coverage found and processed')
        hasCoverage = true
      } else {
        console.log(
          '⚠️ Cypress coverage file found but contains no valid coverage data'
        )
      }
    } else {
      console.log(
        '⚠️ No Cypress coverage file found at cypress-coverage/coverage-final.json'
      )
    }

    if (fsExtra.existsSync('jest-coverage/coverage-final.json')) {
      const jestData = await fsExtra.readJson(
        'jest-coverage/coverage-final.json'
      )
      const normalizedJest = normalizeCoverageData(jestData)

      if (isValidCoverageData(normalizedJest)) {
        // Merge into combined coverage (Jest data will override Cypress if same files)
        Object.assign(combinedCoverage, normalizedJest)
        console.log('✅ Jest coverage found and processed')
        hasCoverage = true
      } else {
        console.log(
          '⚠️ Jest coverage file found but contains no valid coverage data'
        )
      }
    } else {
      console.log(
        '⚠️ No Jest coverage file found at jest-coverage/coverage-final.json'
      )
    }

    if (!hasCoverage) {
      console.log(
        '❌ No valid coverage data found to combine. Run tests first.'
      )
      return
    }

    // Validate that we have coverage data after combining
    if (Object.keys(combinedCoverage).length === 0) {
      console.log(
        '❌ No coverage data found after normalization and combination'
      )
      return
    }

    // Write the combined coverage directly to .nyc_output
    await fsExtra.writeJson('.nyc_output/out.json', combinedCoverage, {
      spaces: 2
    })
    console.log('✅ Coverage files merged successfully')

    // Generate final report
    await scriptUtil.executeCmd(
      {},
      'npx',
      'nyc report --reporter lcov --reporter text --report-dir coverage'.split(
        ' '
      )
    )

    console.log(
      `✅ Combined coverage report generated at ./coverage/lcov-report/index.html`
    )
  } catch (err) {
    console.log('Error in generating reports:', err)
    process.exit(1)
  }
}

executeScript()

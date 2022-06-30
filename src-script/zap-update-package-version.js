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

/**
 * Script that updates the version in package.json
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

if (
  process.argv[2] == '-?' ||
  process.argv[2] == '--?' ||
  process.argv[2] == '--help'
) {
  console.log('Usage: zap-update-package-version.js [-fake|-real]\n')
  console.log('  fake: adds the fake version to package.json for committing')
  console.log('  real: adds the real version to package.json for building')
  console.log('\nIf no command is passed, script just prints out the version.')
  process.exit(0)
}

let packageJson = path.join(__dirname, '../package.json')
let output = ''
let mode = 'print'

if (process.argv[2] == '-fake') mode = 'fake'
if (process.argv[2] == '-real') mode = 'real'

const stream = fs.createReadStream(packageJson)
const rl = readline.createInterface({
  input: stream,
  crlfDelay: Infinity,
})

let wasChanged
let cnt = 0
let versionPrinted = ''

rl.on('line', (line) => {
  if (cnt < 10 && line.includes('"version":')) {
    let d = new Date()
    let output
    if (mode == 'real') {
      output = `  "version": "${d.getFullYear()}.${
        d.getMonth() + 1
      }.${d.getDate()}",`
    } else if (mode == 'fake') {
      output = `  "version": "0.0.0",`
    } else {
      output = line
    }

    if (output == line) {
      wasChanged = false
    } else {
      line = output
      wasChanged = true
    }
    versionPrinted = line
  }
  output = output.concat(line + '\n')
  cnt++
})

rl.on('close', () => {
  if (wasChanged) {
    console.log(
      '⛔ Version in package.json was out of date. It was automatically updated. Review and commit again, please.'
    )
    fs.writeFileSync(packageJson, output)
    console.log('Updated the package.json!')
  } else {
    console.log('😎 Version in package.json was not changed.')
  }
  console.log(`🔍 Version output: ${versionPrinted}`)
  process.exit(wasChanged ? 1 : 0)
})

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

let packageJson = path.join(__dirname, '../package.json')
let output = ''

const stream = fs.createReadStream(packageJson)
const rl = readline.createInterface({
  input: stream,
  crlfDelay: Infinity,
})

let wasChanged
let cnt = 0
rl.on('line', (line) => {
  if (cnt < 10 && line.includes('"version":')) {
    let d = new Date()
    let output = `  "version": "${d.getFullYear()}.${
      d.getMonth() + 1
    }.${d.getDate()}",`

    if (output == line) {
      wasChanged = false
    } else {
      line = output
      wasChanged = true
    }
  }
  output = output.concat(line + '\n')
  cnt++
})

rl.on('close', () => {
  if (wasChanged) {
    fs.writeFileSync(packageJson, output)
    console.log('Updated the package.json!')
  }
  process.exit(wasChanged ? 1 : 0)
})

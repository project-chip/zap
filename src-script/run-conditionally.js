#!/usr/bin/env node
/**
 *
 *    Copyright (c) 2023 Silicon Labs
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

const scriptUtil = require('./script-util')
const packageJson = require('../package.json')

let args = process.argv.slice(2)

let condition = args[0]
let command = args.slice(1)

function isConditionMet(condition) {
  if (condition === 'true' || condition === '1') return true
  if (condition === 'false' || condition === '0') return false

  if (condition.includes('==')) {
    let split = condition.split('==')
    let packageJsonTokens = split[0].split('.')

    let val = packageJson
    for (let tok of packageJsonTokens) {
      val = val[tok]
      if (val == null) {
        return false
      }
    }

    return `${val}` === split[1]
  }

  // Unknown condition
  return false
}

async function runConditionally(condition, command) {
  if (isConditionMet(condition)) {
    return scriptUtil.executeCmd(null, command[0], command.slice(1))
  } else {
    console.log(
      `Condition is not met: ${condition}. Skipping the execution of: ${command}`,
    )
    return true
  }
}

runConditionally(condition, command)
  .then(() => {
    console.log('Success.')
    process.exit
  })
  .catch((err) => {
    console.log('Failure to run command. Return value:')
    console.log(err)
    process.exit(1)
  })

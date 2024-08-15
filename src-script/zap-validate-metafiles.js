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
 * Script that validates metafiles.
 */

const fs = require('fs')
const path = require('path')

const expectedLockfileVersion = 3
const expectedVersion = '0.0.0'

let packageLockJson = path.join(__dirname, '../package-lock.json')

let content = fs.readFileSync(packageLockJson)

let packageLock = JSON.parse(content)

console.log(`Lockfile version: ${packageLock.lockfileVersion}`)
if (packageLock.lockfileVersion != expectedLockfileVersion) {
  console.error(
    `package-lock.json is expected to have lockfileVersion ${expectedLockfileVersion}. Found: ${packageLock.lockfileVersion}.
Check your npm version.`,
  )
  process.exit(1)
}

console.log(`Application version: ${packageLock.version}`)
if (packageLock.version != expectedVersion) {
  console.error(
    `package-lock.json is expected to have version ${expectedVersion}. Found: ${packageLock.version}`,
  )
  process.exit(1)
}

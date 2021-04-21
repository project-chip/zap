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

const path = require('path')
const fs = require('fs')

let packageJson = path.join(__dirname, '../package.json')
let featureLevelInPackageJson = JSON.parse(fs.readFileSync(packageJson))
  .featureLevel

let apackInfo = path.join(__dirname, '../apack.info')
let data = fs.readFileSync(apackInfo).toString()
const lookFor = 'featureLevel='
let i = data.indexOf(lookFor)
let j = data.indexOf('\n', i + lookFor.length)
let slice = data.slice(i + lookFor.length, j)
let featureLevelInApackInfo = parseInt(slice)

if (featureLevelInApackInfo != featureLevelInPackageJson) {
  console.log(
    `⛔ Feature level missmatch: ${featureLevelInApackInfo} in apack.info vs ${featureLevelInPackageJson} in package.json. Please make sure both apack.info and package.json have the same feature level.`
  )
  process.exit(1)
} else {
  console.log(`😎 Feature level check: ${featureLevelInApackInfo}`)
  process.exit(0)
}

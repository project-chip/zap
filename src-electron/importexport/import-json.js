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
const util = require('../util/util.js')
const dbEnum = require('../../src-shared/db-enum.js')
/**
 * Parses JSON file and creates a state object out of it, which is passed further down the chain.
 *
 * @param {*} filePath
 * @param {*} data
 * @returns Promise of parsed JSON object
 */
async function readJsonData(filePath, data) {
  let state = JSON.parse(data)
  if (!('featureLevel' in state)) {
    state.featureLevel = 0
  }
  var status = util.matchFeatureLevel(state.featureLevel)

  if (status.match) {
    if (!'keyValuePairs' in state) {
      state.keyValuePairs = []
    }
    state.filePath = filePath
    state.keyValuePairs.push({
      key: dbEnum.sessionKey.filePath,
      value: filePath,
    })
    return state
  } else {
    throw status.message
  }
}

exports.readJsonData = readJsonData

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

/**
 * This function gets the state from database and converts it for a given file format.
 *
 * @param {*} state
 * @param {*} fileFormat
 */
function convertToFile(state) {
  if (state.fileFormat && state.fileFormat > 0) {
    for (let ept of state.endpointTypes) {
      // First only retain enabled clusters
      let onlyEnabledClusters = []
      for (let c of ept.clusters) {
        if (c.enabled === 1 || c.enabled === true) {
          onlyEnabledClusters.push(c)
        }
      }
      ept.clusters = onlyEnabledClusters

      // Now remove all non-included attributes
      for (let c of ept.clusters) {
        if (c.attributes) {
          let onlyIncludedAttributes = []
          for (let a of c.attributes) {
            if (a.included === 1 || a.included === true) {
              onlyIncludedAttributes.push(a)
            }
          }
          c.attributes = onlyIncludedAttributes
        }
      }
    }
    return state
  } else {
    return state
  }
}

/**
 * This function gets the JSON from the file, and converts it to the correct database state
 */
function convertFromFile(state) {
  if (state.fileFormat) {
    return state
  } else {
    return state
  }
}

exports.convertFromFile = convertFromFile
exports.convertToFile = convertToFile

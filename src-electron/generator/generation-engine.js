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
 * @module JS API: generator logic
 */

const fs = require('fs')
const util = require('../util/util.js')

/**
 * Given a path, it will read generation template object into memory.
 *
 * @param {*} context.path
 * @returns context.object, context.crc
 */
function loadGenTemplate(context) {
  return new Promise((resolve, reject) => {
    fs.readFile(context.path, (err, data) => {
      if (err) reject(err)
      context.data = data
      resolve(context)
    })
      .then((context) => util.calculateCrc(context))
      .then((context) => {
        context.object = JSON.parse(context.data)
        return context
      })
      .then((context) => resolve(context))
  })
}

exports.loadGenTemplate = loadGenTemplate

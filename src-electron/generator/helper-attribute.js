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

const queryZcl = require('../db/query-zcl.js')
const queryCommand = require('../db/query-command.js')
const queryEvent = require('../db/query-event.js')
const dbEnum = require('../../src-shared/db-enum.js')
const templateUtil = require('./template-util.js')
const helperC = require('./helper-c.js')
const env = require('../util/env.js')
const types = require('../util/types.js')

/**
 * Valid within a cluster context, requires code.
 *
 * @returns Produces attribute defaults.
 */
async function zclAttributeDefault(options) {
  // If used at the toplevel, 'this' is the toplevel context object.
  // when used at the cluster level, 'this' is a cluster
  let code = parseInt(options.hash.code)

  let promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => {
      if ('id' in this) {
        return []
      } else {
        throw new Error('Requires an id inside the context.')
      }
    })
    .then((atts) => templateUtil.collectBlocks(atts, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

exports.zcl_attribute_default = zclAttributeDefault

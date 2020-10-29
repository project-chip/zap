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

const queryZcl = require('../db/query-zcl')

/**
 * @module JS API: type related utilities
 */

/**
 * This function resolves with the size of a given type.
 * -1 means that this size is variable.
 *
 * @param {*} db
 * @param {*} zclPackageId
 * @param {*} type
 */
function typeSize(db, zclPackageId, type) {
  return queryZcl.getAtomicSizeFromType(db, zclPackageId, type)
}

exports.typeSize = typeSize

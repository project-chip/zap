/**
 *
 *    Copyright (c) 2021 Silicon Labs
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
 * This module provides queries related to access.
 *
 * @module DB API: access queries.
 */
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')

async function selectAccessOperations(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT NAME, DESCRIPTION FROM OPERATION WHERE PACKAGE_REF = ? ORDER BY NAME
`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.accessOperation))
}

async function selectAccessRoles(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT NAME, DESCRIPTION FROM ROLE WHERE PACKAGE_REF = ? ORDER BY NAME
    `,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.accessRole))
}

async function selectAccessModifiers(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT NAME, DESCRIPTION FROM ACCESS_MODIFIER WHERE PACKAGE_REF = ? ORDER BY NAME
    `,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.accessModifier))
}

exports.selectAccessModifiers = selectAccessModifiers
exports.selectAccessRoles = selectAccessRoles
exports.selectAccessOperations = selectAccessOperations

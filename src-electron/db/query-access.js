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

async function selectDefaultAccess(db, packageId, type) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  OPERATION.NAME AS OP_NAME,
  ROLE.NAME AS ROLE_NAME,
  ACCESS_MODIFIER.NAME AS MODIFIER_NAME
FROM
  DEFAULT_ACCESS AS DA
INNER JOIN
  ACCESS AS A
ON
  DA.ACCESS_REF = A.ACCESS_ID
LEFT JOIN OPERATION
ON A.OPERATION_REF = OPERATION.OPERATION_ID
LEFT JOIN ROLE
ON A.ROLE_REF = ROLE.ROLE_ID
LEFT JOIN ACCESS_MODIFIER
ON A.ACCESS_MODIFIER_REF = ACCESS_MODIFIER.ACCESS_MODIFIER_ID
WHERE DA.PACKAGE_REF = ? AND DA.ENTITY_TYPE = ?
ORDER BY OPERATION.NAME, ROLE.NAME, ACCESS_MODIFIER.NAME
`,
      [packageId, type]
    )
    .then((rows) => rows.map(dbMapping.map.access))
}

exports.selectAccessModifiers = selectAccessModifiers
exports.selectAccessRoles = selectAccessRoles
exports.selectAccessOperations = selectAccessOperations
exports.selectDefaultAccess = selectDefaultAccess

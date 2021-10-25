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
 * This module provides queries for enums.
 *
 * @module DB API: zcl database access
 */
const dbApi = require('./db-api')
const dbMapping = require('./db-mapping')

/**
 * Retrieves all the enums in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of enums.
 */
async function selectAllEnums(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `SELECT ENUM_ID, NAME, TYPE FROM ENUM  WHERE PACKAGE_REF = ? ORDER BY NAME`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.enum))
}

/**
 * Retrieves all the enums in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of enums.
 */
async function selectClusterEnums(db, packageId, clusterId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  E.ENUM_ID,
  E.NAME,
  E.TYPE
FROM
  ENUM AS E
INNER JOIN
  ENUM_CLUSTER AS EC
ON
  E.ENUM_ID = EC.ENUM_REF
WHERE
  E.PACKAGE_REF = ?
  AND EC.CLUSTER_REF = ?
ORDER BY E.NAME`,
      [packageId, clusterId]
    )
    .then((rows) => rows.map(dbMapping.map.enum))
}

/**
 * Returns an enum by ID.
 * @param {*} db
 * @param {*} id
 * @returns enum
 */
async function selectAllEnumItemsById(db, id) {
  return dbApi
    .dbAll(
      db,
      'SELECT NAME, VALUE FROM ENUM_ITEM WHERE ENUM_REF = ? ORDER BY FIELD_IDENTIFIER',
      [id]
    )
    .then((rows) => rows.map(dbMapping.map.enumItem))
}

async function selectAllEnumItems(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  EI.NAME,
  EI.VALUE,
  EI.ENUM_REF
FROM
  ENUM_ITEM AS EI
INNER JOIN
  ENUM AS E
ON
  E.ENUM_ID = EI.ENUM_REF
WHERE
  E.PACKAGE_REF = ?
ORDER BY EI.ENUM_REF, EI.FIELD_IDENTIFIER`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.enumItem))
}

async function selectEnumById(db, id) {
  return dbApi
    .dbGet(db, 'SELECT ENUM_ID, NAME, TYPE FROM ENUM WHERE ENUM_ID = ?', [id])
    .then(dbMapping.map.enum)
}

async function selectEnumByName(db, name, packageId) {
  return dbApi
    .dbGet(
      db,
      'SELECT ENUM_ID, NAME, TYPE FROM ENUM WHERE NAME = ? AND PACKAGE_REF = ? ORDER BY NAME',
      [name, packageId]
    )
    .then(dbMapping.map.enum)
}

// exports
exports.selectAllEnums = selectAllEnums
exports.selectClusterEnums = selectClusterEnums
exports.selectAllEnumItemsById = selectAllEnumItemsById
exports.selectAllEnumItems = selectAllEnumItems
exports.selectEnumById = selectEnumById
exports.selectEnumByName = selectEnumByName

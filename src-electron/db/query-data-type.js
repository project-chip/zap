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
 * This module provides queries for data types
 */

const dbApi = require('./db-api')
const dbMapping = require('./db-mapping')
const cacheKey = 'dataType'
const dbCache = require('./db-cache')
const queryZcl = require('./query-zcl')
const envConfig = require('../util/env')
const dbEnum = require('../../src-shared/db-enum.js')

/**
 * Gathers the data type information of an entry based on data type id along
 * with its actual type from disciminator table.
 * @param db
 * @param id
 * @returns Data type information
 */
async function selectDataTypeById(db, id) {
  return dbApi
    .dbGet(
      db,
      `
  SELECT
    DATA_TYPE.DATA_TYPE_ID,
    DATA_TYPE.NAME AS NAME,
    DATA_TYPE.DESCRIPTION,
    DATA_TYPE.DISCRIMINATOR_REF,
    DATA_TYPE.PACKAGE_REF,
    DISCRIMINATOR.NAME AS DISCRIMINATOR_NAME
  FROM
    DATA_TYPE
  INNER JOIN
    DISCRIMINATOR
  ON
    DATA_TYPE.DISCRIMINATOR_REF = DISCRIMINATOR.DISCRIMINATOR_ID
  WHERE
    DATA_TYPE_ID = ?`,
      [id]
    )
    .then(dbMapping.map.dataType)
}

/**
 * Select a data type matched from cache
 * @param db
 * @param id
 * @returns Data Type or undefined
 */
async function selectDataTypeByIdFromCache(db, id) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  return cache.byId[id]
}

/**
 * Gathers the data type information of an entry based on data type name along
 * with its actual type from disciminator table.
 * @param db
 * @param name
 * @param packageId
 * @returns Data type information
 */
async function selectDataTypeByName(db, name, packageId) {
  return dbApi
    .dbGet(
      db,
      `
  SELECT
    DATA_TYPE.DATA_TYPE_ID,
    DATA_TYPE.NAME AS NAME,
    DATA_TYPE.DESCRIPTION,
    DATA_TYPE.DISCRIMINATOR_REF,
    DATA_TYPE.PACKAGE_REF,
    DISCRIMINATOR.NAME AS DISCRIMINATOR_NAME
  FROM
    DATA_TYPE
  INNER JOIN
    DISCRIMINATOR
  ON
    DATA_TYPE.DISCRIMINATOR_REF = DISCRIMINATOR.DISCRIMINATOR_ID
  WHERE
    (DATA_TYPE.NAME = ? OR DATA_TYPE.NAME = ?) AND DATA_TYPE.PACKAGE_REF = ?`,
      [name, name.toLowerCase(), packageId]
    )
    .then(dbMapping.map.dataType)
}

/**
 * Gathers All the data types
 * @param db
 * @param packageId
 * @returns All data types
 */
async function selectAllDataTypes(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
  SELECT
    DATA_TYPE.DATA_TYPE_ID,
    DATA_TYPE.NAME AS NAME,
    DATA_TYPE.DESCRIPTION,
    DATA_TYPE.DISCRIMINATOR_REF,
    DATA_TYPE.PACKAGE_REF,
    DISCRIMINATOR.NAME AS DISCRIMINATOR_NAME
  FROM
    DATA_TYPE
  INNER JOIN
    DISCRIMINATOR
  ON
    DATA_TYPE.DISCRIMINATOR_REF = DISCRIMINATOR.DISCRIMINATOR_ID
  WHERE DATA_TYPE.PACKAGE_REF = ?`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.dataType))
}

/**
 * Select a Data type matched from cache
 * @param {*} db
 * @param {*} name
 * @param {*} packageId
 * @returns data type or undefined
 */
async function selectDataTypeByNameFromCache(db, name, packageId) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  return cache.byName[name]
}

/**
 * Return the size of the given value whether it be a reference to it in the data
 * type table in the form of a number or be it the name of the type in the form
 * if string.
 * @param {*} db
 * @param {*} packageId
 * @param {*} value
 * @returns The size of the given value
 */
async function selectSizeFromType(db, packageId, value) {
  // Step 1: Extracting the data type based on type id or type name
  let dataType = null
  if (typeof value === 'number') {
    dataType = await queryZcl.selectDataTypeById(db, value)
  } else if (typeof value === 'string') {
    dataType = await queryZcl.selectDataTypeByName(db, value, packageId)
  }

  // Step 2: Find the size based on the type of data
  try {
    if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.bitmap
    ) {
      let bt = await queryZcl.selectBitmapByName(db, packageId, dataType.name)
      return bt.size
    } else if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.enum
    ) {
      let et = await queryZcl.selectEnumByName(db, dataType.name, packageId)
      return et.size
    } else if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.number
    ) {
      let nt = await queryZcl.selectNumberByName(db, packageId, dataType.name)
      return nt.size
    } else if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.struct
    ) {
      return null
    } else if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.string
    ) {
      return null
    } else {
      return null
    }
  } catch (err) {
    envConfig.logError(
      'Could not find the size of type: ' + dataType.name + ' : ' + err
    )
  }
}

exports.selectDataTypeById = selectDataTypeById
exports.selectDataTypeByName = selectDataTypeByName
exports.selectAllDataTypes = selectAllDataTypes
exports.selectSizeFromType = selectSizeFromType

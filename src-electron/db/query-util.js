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
 * This module provides a place for creating generic queries which are common
 * across different query files.
 *
 * @module DB API: zcl database access
 */

const dbApi = require('./db-api')

/**
 * Formulate a sqlite query string for a data type from the given cluster ID and package IDs.
 * @param {*} typeDiscriminator
 * @param {*} clusterId
 * @param {*} packageIds
 * @returns SQLite query string
 */
function sqlQueryForDataTypeByNameAndClusterId(
  typeDiscriminator,
  clusterId = null,
  packageIds
) {
  let typeTableName = typeDiscriminator.toUpperCase()
  let numberExtensionString =
    typeDiscriminator == 'number' ? 'NUMBER.IS_SIGNED, ' : ''
  let checkLowerCaseString =
    typeDiscriminator != 'number' && typeDiscriminator != 'struct'
      ? 'OR DATA_TYPE.NAME = ?'
      : ''
  let structExtensionString =
    typeDiscriminator == 'struct'
      ? 'STRUCT.IS_FABRIC_SCOPED, DATA_TYPE.DISCRIMINATOR_REF, '
      : ''
  let selectQueryString = `
  SELECT
      ${typeTableName}.${typeTableName}_ID,
      ${structExtensionString}
      DATA_TYPE.NAME AS NAME,
      ${numberExtensionString}
      ${typeTableName}.SIZE AS SIZE
    FROM ${typeTableName}
    INNER JOIN
      DATA_TYPE
    ON
      ${typeTableName}.${typeTableName}_ID = DATA_TYPE.DATA_TYPE_ID `

  let clusterQueryExtension = `
  INNER JOIN
    DATA_TYPE_CLUSTER
  ON
    DATA_TYPE_CLUSTER.DATA_TYPE_REF = ${typeTableName}.${typeTableName}_ID `

  let whereClause = `
  WHERE
    (DATA_TYPE.NAME = ? ${checkLowerCaseString})
    AND DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)}) `

  let whereClauseClusterExtension = `
    AND DATA_TYPE_CLUSTER.CLUSTER_REF = ? `

  let queryWithoutClusterId = selectQueryString + whereClause
  let queryWithClusterId =
    selectQueryString +
    clusterQueryExtension +
    whereClause +
    whereClauseClusterExtension
  return clusterId ? queryWithClusterId : queryWithoutClusterId
}

/**
 * Formulate a sqlite query string for a data type from the given cluster name and package IDs.
 * @param {*} typeDiscriminator
 * @param {*} name data type name
 * @param {*} clusterName
 * @param {*} packageIds
 * @param {*} options
 * @returns SQLite query string
 */
function sqlQueryForDataTypeByNameAndClusterName(
  typeDiscriminator,
  name,
  clusterName,
  packageIds,
  options = {}
) {
  let typeTableName = typeDiscriminator.toUpperCase()
  let numberExtensionString =
    typeDiscriminator == 'number' ? 'NUMBER.IS_SIGNED, ' : ''
  let checkLowerCaseString =
    typeDiscriminator != 'number' && typeDiscriminator != 'struct'
      ? `OR DATA_TYPE.NAME = '${name}'`
      : ''
  let structExtensionString =
    typeDiscriminator == 'struct'
      ? 'STRUCT.IS_FABRIC_SCOPED, DATA_TYPE.DISCRIMINATOR_REF, '
      : ''
  let selectQueryString = `
  SELECT
    ${typeTableName}.${typeTableName}_ID,
    ${structExtensionString}
    DATA_TYPE.NAME AS NAME,
    (SELECT COUNT(1) FROM DATA_TYPE_CLUSTER WHERE DATA_TYPE_CLUSTER.DATA_TYPE_REF = ${typeTableName}.${typeTableName}_ID) AS ${typeTableName}_CLUSTER_COUNT,
    ${numberExtensionString}
    ${typeTableName}.SIZE AS SIZE,
    CLUSTER.NAME AS CLUSTER_NAME
  FROM ${typeTableName}
  INNER JOIN
    DATA_TYPE
  ON
    ${typeTableName}.${typeTableName}_ID = DATA_TYPE.DATA_TYPE_ID
  LEFT JOIN
    DATA_TYPE_CLUSTER
  ON
    DATA_TYPE_CLUSTER.DATA_TYPE_REF = ${typeTableName}.${typeTableName}_ID 
  LEFT JOIN
    CLUSTER
  ON
    DATA_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
  WHERE
    (DATA_TYPE.NAME = '${name}' ${checkLowerCaseString})
  AND
    DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)}) `

  let whereClause = !options.ignoreClusterWhereClause
    ? clusterName
      ? `AND CLUSTER.NAME = '${clusterName}'`
      : `AND CLUSTER.NAME IS NULL`
    : ``

  let resultingQuery = selectQueryString + whereClause
  return resultingQuery
}

exports.sqlQueryForDataTypeByNameAndClusterId =
  sqlQueryForDataTypeByNameAndClusterId
exports.sqlQueryForDataTypeByNameAndClusterName =
  sqlQueryForDataTypeByNameAndClusterName

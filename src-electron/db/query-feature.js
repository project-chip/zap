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
 * This module provides queries for features.
 *
 * @module DB API: feature related queries
 */
const dbApi = require('./db-api')
const dbMapping = require('./db-mapping')

/**
 * Get all device type features associated with a list of device type refs and an endpoint.
 * Join ENDPOINT_TYPE_ATTRIBUTE and ATTRIBUTE table to get featureMap attribute associated with the feature,
 * so the frontend could get and set featureMap bit easier.
 * Only return features with cluster on the side specified in the device type.
 *
 * @export
 * @param {*} db
 * @param {*} deviceTypeRefs
 * @param {*} endpointTypeRef
 * @returns All feature information and device type conformance
 * with associated device type, cluster, and featureMap attribute details
 */
async function getFeaturesByDeviceTypeRefs(
  db,
  deviceTypeRefs,
  endpointTypeRef
) {
  let arg = []
  let deviceTypeRefsSql = deviceTypeRefs.map(() => '?').join(', ')
  arg.push(...deviceTypeRefs)
  arg.push(endpointTypeRef)
  let features = await dbApi.dbAll(
    db,
    `
    SELECT
			D.DESCRIPTION AS DEVICE_TYPE_NAME,
			DC.DEVICE_TYPE_CLUSTER_ID,
      DC.CLUSTER_REF,
			DC.CLUSTER_NAME,
			DC.INCLUDE_SERVER,
			DC.INCLUDE_CLIENT,
			DF.DEVICE_TYPE_CLUSTER_CONFORMANCE,
			F.FEATURE_ID,
			F.NAME AS FEATURE_NAME,
			F.CODE,
			F.BIT,
			F.DESCRIPTION,
			ETC.ENDPOINT_TYPE_CLUSTER_ID,
			ETA.ENDPOINT_TYPE_ATTRIBUTE_ID AS FEATURE_MAP_ATTRIBUTE_ID,
			ETA.DEFAULT_VALUE AS FEATURE_MAP_VALUE
    FROM
			DEVICE_TYPE D
    JOIN
			DEVICE_TYPE_CLUSTER DC
    ON 
			D.DEVICE_TYPE_ID = DC.DEVICE_TYPE_REF
    JOIN
			DEVICE_TYPE_FEATURE DF
    ON 
			DC.DEVICE_TYPE_CLUSTER_ID = DF.DEVICE_TYPE_CLUSTER_REF
    JOIN
			FEATURE F
    ON
			DF.FEATURE_REF = F.FEATURE_ID
    JOIN
			ENDPOINT_TYPE_CLUSTER ETC
    ON
			DC.CLUSTER_REF = ETC.CLUSTER_REF
    JOIN
			ENDPOINT_TYPE_ATTRIBUTE ETA
    ON
			ETC.ENDPOINT_TYPE_CLUSTER_ID = ETA.ENDPOINT_TYPE_CLUSTER_REF
    JOIN
			ATTRIBUTE A
    ON
			ETA.ATTRIBUTE_REF = A.ATTRIBUTE_ID
    WHERE
			D.DEVICE_TYPE_ID IN (${deviceTypeRefsSql})
    AND
			ETC.ENDPOINT_TYPE_REF = ?
    AND
			A.NAME = 'FeatureMap'
    AND
			A.CODE = 65532
    AND
			(
				(DC.INCLUDE_SERVER = 1 AND ETC.SIDE = 'server')
					OR
				(DC.INCLUDE_CLIENT = 1 AND ETC.SIDE = 'client')
			)
    ORDER BY
			D.DEVICE_TYPE_ID,
			DC.CLUSTER_REF,
			F.FEATURE_ID
    `,
    arg
  )
  let deviceTypeFeatures = features.map(dbMapping.map.deviceTypeFeature)

  /* For a device type feature under the same endpoint and cluster, but different device types,  
    merge their rows into one and combine their device type names into a list. */
  let result = []
  deviceTypeFeatures.forEach((row) => {
    const key = `${row.endpointTypeClusterId}-${row.featureId}`
    if (key in result) {
      let existingRow = result[key]
      if (!existingRow.deviceTypes.includes(row.deviceType)) {
        existingRow.deviceTypes.push(row.deviceType)
      }
    } else {
      result[key] = {
        ...row,
        deviceTypes: [row.deviceType]
      }
      delete result[key].deviceType
    }
  })

  return Object.values(result)
}

/**
 * Check if any non-empty conformance data exist in ATTRIBUTE, COMMAND,
 * and DEVICE_TYPE_FEATURE table.
 *
 * @export
 * @param {*} db
 * @returns boolean value indicating if conformance data exists
 */
async function checkIfConformanceDataExist(db) {
  try {
    let deviceTypeFeatureRows = await dbApi.dbAll(
      db,
      'SELECT DEVICE_TYPE_CLUSTER_CONFORMANCE FROM DEVICE_TYPE_FEATURE'
    )
    let hasFeatureConformanceData = deviceTypeFeatureRows.some((row) => {
      return (
        row.DEVICE_TYPE_CLUSTER_CONFORMANCE &&
        row.DEVICE_TYPE_CLUSTER_CONFORMANCE.trim() != ''
      )
    })
    let attributeRows = await dbApi.dbAll(
      db,
      'SELECT CONFORMANCE FROM ATTRIBUTE'
    )
    let commandRows = await dbApi.dbAll(db, 'SELECT CONFORMANCE FROM COMMAND')
    let hasConformanceData = (rows) =>
      rows.some((row) => row.CONFORMANCE && row.CONFORMANCE.trim() != '')
    return (
      hasConformanceData(attributeRows) &&
      hasConformanceData(commandRows) &&
      hasFeatureConformanceData
    )
  } catch (err) {
    return false
  }
}

exports.getFeaturesByDeviceTypeRefs = getFeaturesByDeviceTypeRefs
exports.checkIfConformanceDataExist = checkIfConformanceDataExist

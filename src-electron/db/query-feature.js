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
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')

/**
 * Get all device type features related a list of device type refs
 * @param {*} db
 * @param {*} deviceTypeRefs
 * @returns All feature information and device type conformance
 * with associated device type and cluster details
 */
async function getFeaturesByDeviceTypeRefs(db, deviceTypeRefs) {
  let deviceTypeRefsSql = deviceTypeRefs.map(() => '?').join(', ')
  let features = await dbApi.dbAll(
    db,
    `
    SELECT
        d.DESCRIPTION AS DEVICE_TYPE_NAME,
        dc.CLUSTER_NAME,
        df.DEVICE_TYPE_CLUSTER_CONFORMANCE,
        f.FEATURE_ID,
        f.NAME AS FEATURE_NAME,
        f.CODE,
        f.BIT,
        f.DEFAULT_VALUE,
        f.DESCRIPTION
    FROM
        DEVICE_TYPE d
    JOIN
        DEVICE_TYPE_CLUSTER dc
    ON 
        d.DEVICE_TYPE_ID = dc.DEVICE_TYPE_REF
    JOIN
        DEVICE_TYPE_FEATURE df
    ON 
        dc.DEVICE_TYPE_CLUSTER_ID = df.DEVICE_TYPE_CLUSTER_REF
    JOIN
        FEATURE f
    ON
        df.FEATURE_REF = f.FEATURE_ID
    WHERE
        d.DEVICE_TYPE_ID IN (${deviceTypeRefsSql})
    ORDER BY
        d.DEVICE_TYPE_ID,
        dc.CLUSTER_REF,
        f.FEATURE_ID
    `,
    deviceTypeRefs
  )
  return features.map(dbMapping.map.deviceTypeFeature)
}

exports.getFeaturesByDeviceTypeRefs = getFeaturesByDeviceTypeRefs

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
 * Get all device type features associated with a list of device type refs and an endpoint.
 * Join ENDPOINT_TYPE_ATTRIBUTE and ATTRIBUTE table to get featureMap attribute associated with the feature
 * so the frontend could get and set featureMap bit easier.
 * Only return features with cluster on the side specified in the deivce type
 * @param {*} db
 * @param {*} deviceTypeRefs
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
        d.DESCRIPTION AS DEVICE_TYPE_NAME,
        dc.DEVICE_TYPE_CLUSTER_ID,
        dc.CLUSTER_NAME,
        dc.INCLUDE_SERVER,
        dc.INCLUDE_CLIENT,
        df.DEVICE_TYPE_CLUSTER_CONFORMANCE,
        f.FEATURE_ID,
        f.NAME AS FEATURE_NAME,
        f.CODE,
        f.BIT,
        f.DESCRIPTION,
        etc.ENDPOINT_TYPE_CLUSTER_ID,
        eta.ENDPOINT_TYPE_ATTRIBUTE_ID AS FEATUREMAP_ATTRIBUTE_ID,
        eta.DEFAULT_VALUE AS FEATUREMAP_VALUE
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
    JOIN
        ENDPOINT_TYPE_CLUSTER etc
    ON
        dc.CLUSTER_REF = etc.CLUSTER_REF
    JOIN
        ENDPOINT_TYPE_ATTRIBUTE eta
    ON
        etc.ENDPOINT_TYPE_CLUSTER_ID = eta.ENDPOINT_TYPE_CLUSTER_REF
    JOIN
        ATTRIBUTE a
    ON
        eta.ATTRIBUTE_REF = a.ATTRIBUTE_ID
    WHERE
        d.DEVICE_TYPE_ID IN (${deviceTypeRefsSql})
    AND
        etc.ENDPOINT_TYPE_REF = ?
    AND
        a.NAME = 'FeatureMap'
    AND
        a.CODE = 65532
    AND
        (
            (dc.INCLUDE_SERVER = 1 AND etc.SIDE = 'server')
            OR
            (dc.INCLUDE_CLIENT = 1 AND etc.SIDE = 'client')
        )
    ORDER BY
        d.DEVICE_TYPE_ID,
        dc.CLUSTER_REF,
        f.FEATURE_ID
    `,
    arg
  )
  return features.map(dbMapping.map.deviceTypeFeature)
}

exports.getFeaturesByDeviceTypeRefs = getFeaturesByDeviceTypeRefs

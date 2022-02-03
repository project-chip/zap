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
 * This module provides queries related to commands.
 *
 * @module DB API: command queries.
 */
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')

/**
 * Returns the count of the number of cluster commands with cli for a cluster
 * @param {*} db
 * @param {*} endpointTypes
 * @param {*} endpointClusterId
 */
async function selectCliCommandCountFromEndpointTypeCluster(
  db,
  endpointTypes,
  endpointClusterId
) {
  let endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  let res = await dbApi.dbAll(
    db,
    `
SELECT
  COUNT(*) AS COUNT
FROM
  COMMAND
INNER JOIN CLUSTER
  ON COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
INNER JOIN ENDPOINT_TYPE_CLUSTER
  ON ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
INNER JOIN PACKAGE_OPTION
  ON PACKAGE_OPTION.OPTION_CODE = COMMAND.NAME
WHERE ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF IN (${endpointTypeIds})
  AND ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ?
        `,
    [endpointClusterId]
  )
  return res[0].COUNT
}

/**
 *
 * @param db
 * @param endpointClusterId
 * Returns: A promise with all commands with cli for a given cluster id
 */
async function selectCliCommandsFromCluster(db, endpointClusterId) {
  let mapFunction = (x) => {
    return {
      name: x.NAME,
      code: x.CODE,
      mfgCode: x.MANUFACTURER_CODE,
      source: x.SOURCE,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND.NAME,
  COMMAND.CODE,
  COMMAND.MANUFACTURER_CODE,
  COMMAND.SOURCE
FROM
  COMMAND
INNER JOIN
  CLUSTER
ON
  COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
INNER JOIN
  PACKAGE_OPTION
ON
  PACKAGE_OPTION.OPTION_CODE = COMMAND.NAME
WHERE CLUSTER.CLUSTER_ID = ?`,
      [endpointClusterId]
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * All available cluster command detals across all endpoints and clusters.
 * @param db
 * @param endpointTypes
 * @returns Available Cluster command details across given endpoints and clusters.
 * Note: The relationship between the endpoint_type_cluster being enabled and a
 * endpoint_type_command is indirect. The reason for this being the endpoint
 * type command is not precisely linked to the sides of the cluster as commands
 * do not belong to a side of a cluster like an attribute.
 */
async function selectAllAvailableClusterCommandDetailsFromEndpointTypes(
  db,
  endpointTypes
) {
  let endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  let mapFunction = (x) => {
    return {
      id: x.CLUSTER_ID,
      clusterName: x.CLUSTER_NAME,
      clusterCode: x.CLUSTER_CODE,
      clusterDefine: x.CLUSTER_DEFINE,
      commandMfgCode: x.COMMAND_MANUFACTURER_CODE,
      clusterMfgCode: x.CLUSTER_MANUFACTURER_CODE,
      clusterSide: x.CLUSTER_SIDE,
      clusterEnabled: x.CLUSTER_ENABLED,
      endpointClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
      numberOfClusterSidesEnabled: x.NO_OF_CLUSTER_SIDES_ENABLED,
      commandName: x.COMMAND_NAME,
      commandSource: x.COMMAND_SOURCE,
      commandCode: x.COMMAND_CODE,
      incoming: x.INCOMING,
      outgoing: x.OUTGOING,
      mfgCommandCount: x.MANUFACTURING_SPECIFIC_COMMAND_COUNT,
    }
  }

  return dbApi
    .dbAll(
      db,
      `
SELECT * FROM (
SELECT
  CLUSTER.CLUSTER_ID,
  CLUSTER.NAME AS CLUSTER_NAME,
  CLUSTER.CODE AS CLUSTER_CODE,
  CLUSTER.DEFINE AS CLUSTER_DEFINE,
  COMMAND.MANUFACTURER_CODE AS COMMAND_MANUFACTURER_CODE,
  CLUSTER.MANUFACTURER_CODE AS CLUSTER_MANUFACTURER_CODE,
  ENDPOINT_TYPE_CLUSTER.SIDE AS CLUSTER_SIDE,
  ENDPOINT_TYPE_CLUSTER.ENABLED AS CLUSTER_ENABLED,
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID,
  COUNT(*) OVER (PARTITION BY CLUSTER.MANUFACTURER_CODE, CLUSTER.NAME, COMMAND.MANUFACTURER_CODE, COMMAND.NAME) AS NO_OF_CLUSTER_SIDES_ENABLED,
  COMMAND.NAME AS COMMAND_NAME,
  COMMAND.SOURCE AS COMMAND_SOURCE,
  COMMAND.CODE AS COMMAND_CODE,
  ENDPOINT_TYPE_COMMAND.INCOMING AS INCOMING,
  ENDPOINT_TYPE_COMMAND.OUTGOING AS OUTGOING,
  COUNT(COMMAND.MANUFACTURER_CODE) OVER () AS MANUFACTURING_SPECIFIC_COMMAND_COUNT
FROM 
  COMMAND
INNER JOIN 
  ENDPOINT_TYPE_COMMAND
ON 
  ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
INNER JOIN 
  CLUSTER
ON 
  CLUSTER.CLUSTER_ID = COMMAND.CLUSTER_REF
INNER JOIN 
  ENDPOINT_TYPE_CLUSTER
ON 
  ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
WHERE
  ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF IN (${endpointTypeIds})
  AND ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
  AND ENDPOINT_TYPE_CLUSTER.SIDE IN ("client", "server") AND ENDPOINT_TYPE_CLUSTER.ENABLED=1
  AND (
        (ENDPOINT_TYPE_COMMAND.INCOMING=1 AND COMMAND.SOURCE!=ENDPOINT_TYPE_CLUSTER.SIDE) OR
        (ENDPOINT_TYPE_COMMAND.OUTGOING=1 AND COMMAND.SOURCE=ENDPOINT_TYPE_CLUSTER.SIDE)
      )
GROUP BY 
  CLUSTER.MANUFACTURER_CODE, 
  CLUSTER.NAME, 
  COMMAND.MANUFACTURER_CODE, 
  COMMAND.NAME, 
  ENDPOINT_TYPE_CLUSTER.SIDE ) 
GROUP BY 
  CLUSTER_MANUFACTURER_CODE, 
  CLUSTER_NAME, 
  COMMAND_MANUFACTURER_CODE, 
  COMMAND_NAME 
ORDER BY 
  CLUSTER_MANUFACTURER_CODE, CLUSTER_CODE, COMMAND_MANUFACTURER_CODE, COMMAND_CODE`
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * All Clusters with available incoming or outgoing commands.
 * @param db
 * @param endpointTypes
 * @param uniqueClusterCodes
 * @param isIncoming
 * @returns All Clusters with side that have available incoming or outgoing
 * commands.
 * uniqueClusterCodes can be used to get unique clusters based on a cluster code
 * and this can eliminate duplicate cluster code entries when manufacturing
 * specific clusters exist with the same cluster code.
 * Note: The relationship between the endpoint_type_cluster being enabled and a
 * endpoint_type_command is indirect. The reason for this being the endpoint
 * type command is not precisely linked to the sides of the cluster as commands
 * do not belong to a side of a cluster like an attribute.
 */
async function selectAllClustersWithIncomingOrOutgoingCommands(
  db,
  endpointTypes,
  uniqueClusterCodes,
  isIncoming
) {
  let endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  let sqlGroupBy = uniqueClusterCodes ? 'CLUSTER.CODE' : 'CLUSTER.NAME'
  let isIncomingOrOutgoingSql = isIncoming
    ? `ENDPOINT_TYPE_COMMAND.INCOMING = 1 AND COMMAND.SOURCE != ENDPOINT_TYPE_CLUSTER.SIDE`
    : `ENDPOINT_TYPE_COMMAND.OUTGOING = 1 AND COMMAND.SOURCE == ENDPOINT_TYPE_CLUSTER.SIDE`
  let mapFunction = (x) => {
    return {
      id: x.CLUSTER_ID,
      clusterName: x.CLUSTER_NAME,
      code: x.CLUSTER_CODE,
      clusterDefine: x.CLUSTER_DEFINE,
      clusterMfgCode: x.MANUFACTURER_CODE,
      clusterSide: x.CLUSTER_SIDE,
      clusterEnabled: x.CLUSTER_ENABLED,
      endpointClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
CLUSTER.CLUSTER_ID,
CLUSTER.NAME AS CLUSTER_NAME,
CLUSTER.CODE AS CLUSTER_CODE,
CLUSTER.DEFINE AS CLUSTER_DEFINE,
CLUSTER.MANUFACTURER_CODE AS MANUFACTURER_CODE,
ENDPOINT_TYPE_CLUSTER.SIDE AS CLUSTER_SIDE,
ENDPOINT_TYPE_CLUSTER.ENABLED AS CLUSTER_ENABLED,
ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
FROM
COMMAND
INNER JOIN
ENDPOINT_TYPE_COMMAND
ON
ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
INNER JOIN
CLUSTER
ON
CLUSTER.CLUSTER_ID = COMMAND.CLUSTER_REF
INNER JOIN
ENDPOINT_TYPE_CLUSTER
ON
ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
WHERE
ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF IN (${endpointTypeIds})
AND ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
AND ENDPOINT_TYPE_CLUSTER.SIDE IN ("client", "server")
AND ENDPOINT_TYPE_CLUSTER.ENABLED = 1 AND ${isIncomingOrOutgoingSql}
GROUP BY
${sqlGroupBy}, ENDPOINT_TYPE_CLUSTER.SIDE ORDER BY CLUSTER.NAME, ENDPOINT_TYPE_CLUSTER.SIDE`
    )
    .then((rows) => rows.map(mapFunction))
}
/**
 * All Clusters with available incoming commands.
 * @param db
 * @param endpointTypes
 * @param uniqueClusterCodes
 * @returns All Clusters with side that have available incoming commands.
 * uniqueClusterCodes can be used to get unique clusters based on a cluster code
 * and this can eliminate duplicate cluster code entries when manufacturing
 * specific clusters exist with the same cluster code.
 * Note: The relationship between the endpoint_type_cluster being enabled and a
 * endpoint_type_command is indirect. The reason for this being the endpoint
 * type command is not precisely linked to the sides of the cluster as commands
 * do not belong to a side of a cluster like an attribute.
 */
async function selectAllClustersWithIncomingCommands(
  db,
  endpointTypes,
  uniqueClusterCodes = false
) {
  return selectAllClustersWithIncomingOrOutgoingCommands(
    db,
    endpointTypes,
    uniqueClusterCodes,
    true
  )
}
/**
 * All Clusters with available outgoing commands.
 * @param db
 * @param endpointTypes
 * @param uniqueClusterCodes
 * @returns All Clusters with side that have available outgoing commands.
 * uniqueClusterCodes can be used to get unique clusters based on a cluster code
 * and this can eliminate duplicate cluster code entries when manufacturing
 * specific clusters exist with the same cluster code.
 * Note: The relationship between the endpoint_type_cluster being enabled and a
 * endpoint_type_command is indirect. The reason for this being the endpoint
 * type command is not precisely linked to the sides of the cluster as commands
 * do not belong to a side of a cluster like an attribute.
 */
async function selectAllClustersWithOutgoingCommands(
  db,
  endpointTypes,
  uniqueClusterCodes = false
) {
  return selectAllClustersWithIncomingOrOutgoingCommands(
    db,
    endpointTypes,
    uniqueClusterCodes,
    false
  )
}

/**
 * All Manufacturing Clusters with available incoming commands for a given
 * cluster code.
 * @param db
 * @param endpointTypes
 * @returns  All Manufacturing Clusters with available incoming commands for a
 * given cluster code.
 * Note: The relationship between the endpoint_type_cluster being enabled and a
 * endpoint_type_command is indirect. The reason for this being the endpoint
 * type command is not precisely linked to the sides of the cluster as commands
 * do not belong to a side of a cluster like an attribute.
 */
async function selectMfgClustersWithIncomingCommandsForClusterCode(
  db,
  endpointTypes,
  clusterCode
) {
  let endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  let mapFunction = (x) => {
    return {
      id: x.CLUSTER_ID,
      clusterName: x.CLUSTER_NAME,
      code: x.CLUSTER_CODE,
      clusterDefine: x.CLUSTER_DEFINE,
      clusterMfgCode: x.MANUFACTURER_CODE,
      clusterSide: x.CLUSTER_SIDE,
      clusterEnabled: x.CLUSTER_ENABLED,
      endpointClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
    }
  }

  return dbApi
    .dbAll(
      db,
      `
SELECT
  CLUSTER.CLUSTER_ID,
  CLUSTER.NAME AS CLUSTER_NAME,
  CLUSTER.CODE AS CLUSTER_CODE,
  CLUSTER.DEFINE AS CLUSTER_DEFINE,
  CLUSTER.MANUFACTURER_CODE AS MANUFACTURER_CODE,
  ENDPOINT_TYPE_CLUSTER.SIDE AS CLUSTER_SIDE,
  ENDPOINT_TYPE_CLUSTER.ENABLED AS CLUSTER_ENABLED,
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
FROM
  COMMAND
INNER JOIN
  ENDPOINT_TYPE_COMMAND
ON
  ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
INNER JOIN
  CLUSTER
ON
  CLUSTER.CLUSTER_ID = COMMAND.CLUSTER_REF
INNER JOIN
  ENDPOINT_TYPE_CLUSTER
ON
  ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
WHERE
  ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF IN (${endpointTypeIds})
  AND ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
  AND ENDPOINT_TYPE_CLUSTER.SIDE IN ("client", "server")
  AND ENDPOINT_TYPE_CLUSTER.ENABLED = 1
  AND ENDPOINT_TYPE_COMMAND.INCOMING = 1
  AND COMMAND.SOURCE != ENDPOINT_TYPE_CLUSTER.SIDE
  AND CLUSTER.CODE = ${clusterCode}
GROUP BY
  CLUSTER.NAME, ENDPOINT_TYPE_CLUSTER.SIDE 
ORDER BY 
  CLUSTER.NAME, ENDPOINT_TYPE_CLUSTER.SIDE`
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * All Clusters with available incoming commands. This function seeks to consolidate endpoint type clusters
 * that are differentiated by sides into one entry.
 * @param db
 * @param endpointTypes
 * @returns All Clusters that have available incoming commands.
 * Note: The relationship between the endpoint_type_cluster being enabled and a
 * endpoint_type_command is indirect. The reason for this being the endpoint
 * type command is not precisely linked to the sides of the cluster as commands
 * do not belong to a side of a cluster like an attribute.
 */
async function selectAllClustersWithIncomingCommandsCombined(
  db,
  endpointTypes
) {
  let uncombinedClusters = selectAllClustersWithIncomingCommands(
    db,
    endpointTypes
  )
  let reduceFunction = (combinedClusters, currentValue) => {
    // Find out if current cluster is in combinedClusters, or just use currentValue otherwise.
    let newVal = combinedClusters.has(currentValue.id)
      ? combinedClusters.get(currentValue.id)
      : currentValue

    //Add side enabled keys
    if (currentValue.clusterSide == 'client') {
      newVal['clientSideEnabled'] = true
    } else if (currentValue.clusterSide == 'server') {
      newVal['serverSideEnabled'] = true
    }
    // Delete extraneous keys
    delete newVal['clusterSide']
    delete newVal['enabled']

    combinedClusters.set(currentValue.id, newVal)
    return combinedClusters
  }
  return uncombinedClusters.then((rows) => {
    return Array.from(
      rows.reduce(reduceFunction, new Map()),
      (value, key) => value[1]
    )
  })
}

/**
 * This function returns all incoming commands that are on enabled sides for a cluster.
 * @param db
 * @param endpointTypes
 * @param clName
 * @param clientSideEnabled
 * @param serverSideEnabled
 * @param isMfgSpecific
 * @return All commands that are enabled on their incoming side. This is unique based on the command name across a cluster.
 *
 */
async function selectAllIncomingCommandsForClusterCombined(
  db,
  endpointTypes,
  clName,
  clientSideEnabled,
  serverSideEnabled,
  isMfgSpecific
) {
  let client = clientSideEnabled
    ? await selectAllIncomingCommandsForCluster(
        db,
        endpointTypes,
        clName,
        'client',
        isMfgSpecific
      )
    : []
  let server = serverSideEnabled
    ? await selectAllIncomingCommandsForCluster(
        db,
        endpointTypes,
        clName,
        'server',
        isMfgSpecific
      )
    : []
  // The assumption here is that, given that this is inside a cluster already; that the command name are unique and sufficient outside of
  // the clusterSide duplication.
  let combinedClusters = client.concat(server)

  let reduceFunction = (combinedMap, currentValue) => {
    if (!combinedMap.has(currentValue.commandName)) {
      combinedMap.set(currentValue.commandName, currentValue)
    }
    return combinedMap
  }

  return Array.from(
    combinedClusters.reduce(reduceFunction, new Map()),
    (value, key) => value[1]
  )
}

/**
 *
 * @param db
 * @param endpointTypes
 * @param clName
 * @param clSide
 * @param isMfgSpecific
 * @param isIncoming
 * @returns Incoming or Outgoing commands for a given cluster
 */
async function selectAllIncomingOrOutgoingCommandsForCluster(
  db,
  endpointTypes,
  clName,
  clSide,
  isMfgSpecific,
  isIncoming
) {
  let endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  let mfgSpecificString =
    isMfgSpecific === undefined
      ? ``
      : isMfgSpecific
      ? ` AND COMMAND.MANUFACTURER_CODE IS NOT NULL `
      : ` AND COMMAND.MANUFACTURER_CODE IS NULL `
  let isIncomingOrOutgoingSql = isIncoming
    ? `ENDPOINT_TYPE_COMMAND.INCOMING=1 AND COMMAND.SOURCE!=ENDPOINT_TYPE_CLUSTER.SIDE`
    : `ENDPOINT_TYPE_COMMAND.OUTGOING=1 AND COMMAND.SOURCE==ENDPOINT_TYPE_CLUSTER.SIDE`
  let mapFunction = (x) => {
    return {
      clusterId: x.CLUSTER_ID,
      clusterName: x.CLUSTER_NAME,
      clusterCode: x.CLUSTER_CODE,
      clusterDefine: x.CLUSTER_DEFINE,
      commandMfgCode: x.COMMAND_MANUFACTURER_CODE,
      clusterSide: x.CLUSTER_SIDE,
      clusterEnabled: x.CLUSTER_ENABLED,
      endpointClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
      numberOfClusterSidesEnabled: x.NO_OF_CLUSTER_SIDES_ENABLED,
      id: x.COMMAND_ID,
      commandName: x.COMMAND_NAME,
      commandSource: x.COMMAND_SOURCE,
      code: x.COMMAND_CODE,
      mustUseTimedInvoke: dbApi.fromDbBool(x.MUST_USE_TIMED_INVOKE),
      responseName: x.RESPONSE_NAME,
      responseRef: x.RESPONSE_REF,
      incoming: x.INCOMING,
      outgoing: x.OUTGOING,
      mfgCommandCount: x.MANUFACTURING_SPECIFIC_COMMAND_COUNT,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  CLUSTER.CLUSTER_ID,
  CLUSTER.NAME AS CLUSTER_NAME,
  CLUSTER.CODE AS CLUSTER_CODE,
  CLUSTER.DEFINE AS CLUSTER_DEFINE,
  COMMAND.MANUFACTURER_CODE AS COMMAND_MANUFACTURER_CODE,
  ENDPOINT_TYPE_CLUSTER.SIDE AS CLUSTER_SIDE,
  ENDPOINT_TYPE_CLUSTER.ENABLED AS CLUSTER_ENABLED,
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID,
  COUNT(*) OVER (PARTITION BY CLUSTER.NAME, COMMAND.NAME) AS NO_OF_CLUSTER_SIDES_ENABLED,
  COMMAND.COMMAND_ID AS COMMAND_ID,
  COMMAND.NAME AS COMMAND_NAME,
  COMMAND.SOURCE AS COMMAND_SOURCE,
  COMMAND.CODE AS COMMAND_CODE,
  COMMAND.MUST_USE_TIMED_INVOKE AS MUST_USE_TIMED_INVOKE,
  COMMAND.RESPONSE_NAME AS RESPONSE_NAME,
  COMMAND.RESPONSE_REF AS RESPONSE_REF,
  ENDPOINT_TYPE_COMMAND.INCOMING AS INCOMING,
  ENDPOINT_TYPE_COMMAND.OUTGOING AS OUTGOING,
  COUNT(COMMAND.MANUFACTURER_CODE) OVER () AS MANUFACTURING_SPECIFIC_COMMAND_COUNT
FROM COMMAND
INNER JOIN ENDPOINT_TYPE_COMMAND
ON ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
INNER JOIN CLUSTER
ON CLUSTER.CLUSTER_ID = COMMAND.CLUSTER_REF
INNER JOIN ENDPOINT_TYPE_CLUSTER
ON ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
WHERE ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF IN (${endpointTypeIds})
AND ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
AND ENDPOINT_TYPE_CLUSTER.SIDE IN ("client", "server") AND ENDPOINT_TYPE_CLUSTER.ENABLED=1 AND ${isIncomingOrOutgoingSql}
AND CLUSTER.NAME = "${clName}" AND ENDPOINT_TYPE_CLUSTER.SIDE = "${clSide}" 
${mfgSpecificString} GROUP BY COMMAND.NAME`
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 *
 * @param db
 * @param endpointTypes
 * @param clName
 * @param clSide
 * @param isMfgSpecific
 * @returns Incoming Commands for a given cluster
 */
async function selectAllIncomingCommandsForCluster(
  db,
  endpointTypes,
  clName,
  clSide,
  isMfgSpecific
) {
  return selectAllIncomingOrOutgoingCommandsForCluster(
    db,
    endpointTypes,
    clName,
    clSide,
    isMfgSpecific,
    true
  )
}

/**
 *
 * @param db
 * @param endpointTypes
 * @param clName
 * @param clSide
 * @param isMfgSpecific
 * @returns Outgoing Commands for a given cluster
 */
async function selectAllOutgoingCommandsForCluster(
  db,
  endpointTypes,
  clName,
  clSide,
  isMfgSpecific
) {
  return selectAllIncomingOrOutgoingCommandsForCluster(
    db,
    endpointTypes,
    clName,
    clSide,
    isMfgSpecific,
    false
  )
}

/**
 * Returns all incoming commands.
 * @param {*} db
 * @param {*} endpointTypes
 * @param {*} isMfgSpecific
 * @returns promise of all incoming commands.
 */
async function selectAllIncomingCommands(db, endpointTypes, isMfgSpecific) {
  let endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  let mfgSpecificString =
    isMfgSpecific === undefined
      ? ``
      : isMfgSpecific
      ? ` AND COMMAND.MANUFACTURER_CODE IS NOT NULL `
      : ` AND COMMAND.MANUFACTURER_CODE IS NULL `
  let mapFunction = (x) => {
    return {
      clusterId: x.CLUSTER_ID,
      clusterName: x.CLUSTER_NAME,
      clusterCode: x.CLUSTER_CODE,
      clusterDefine: x.CLUSTER_DEFINE,
      commandMfgCode: x.COMMAND_MANUFACTURER_CODE,
      clusterSide: x.CLUSTER_SIDE,
      clusterEnabled: x.CLUSTER_ENABLED,
      endpointClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
      numberOfClusterSidesEnabled: x.NO_OF_CLUSTER_SIDES_ENABLED,
      id: x.COMMAND_ID,
      commandName: x.COMMAND_NAME,
      commandSource: x.COMMAND_SOURCE,
      code: x.COMMAND_CODE,
      mustUseTimedInvoke: dbApi.fromDbBool(x.MUST_USE_TIMED_INVOKE),
      incoming: x.INCOMING,
      outgoing: x.OUTGOING,
      mfgCommandCount: x.MANUFACTURING_SPECIFIC_COMMAND_COUNT,
    }
  }

  return dbApi
    .dbAll(
      db,
      `
SELECT
  CLUSTER.CLUSTER_ID,
  CLUSTER.NAME AS CLUSTER_NAME,
  CLUSTER.CODE AS CLUSTER_CODE,
  CLUSTER.DEFINE AS CLUSTER_DEFINE,
  COMMAND.MANUFACTURER_CODE AS COMMAND_MANUFACTURER_CODE,
  ENDPOINT_TYPE_CLUSTER.SIDE AS CLUSTER_SIDE,
  ENDPOINT_TYPE_CLUSTER.ENABLED AS CLUSTER_ENABLED,
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID,
  COUNT(*) OVER (PARTITION BY CLUSTER.NAME, COMMAND.NAME) AS NO_OF_CLUSTER_SIDES_ENABLED,
  COMMAND.COMMAND_ID AS COMMAND_ID,
  COMMAND.NAME AS COMMAND_NAME,
  COMMAND.SOURCE AS COMMAND_SOURCE,
  COMMAND.CODE AS COMMAND_CODE,
  COMMAND.MUST_USE_TIMED_INVOKE AS MUST_USE_TIMED_INVOKE,
  ENDPOINT_TYPE_COMMAND.INCOMING AS INCOMING,
  ENDPOINT_TYPE_COMMAND.OUTGOING AS OUTGOING,
  COUNT(COMMAND.MANUFACTURER_CODE) OVER () AS MANUFACTURING_SPECIFIC_COMMAND_COUNT
FROM COMMAND
INNER JOIN ENDPOINT_TYPE_COMMAND
ON ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
INNER JOIN CLUSTER
ON CLUSTER.CLUSTER_ID = COMMAND.CLUSTER_REF
INNER JOIN ENDPOINT_TYPE_CLUSTER
ON ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
WHERE ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF IN (${endpointTypeIds})
AND ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
AND ENDPOINT_TYPE_CLUSTER.SIDE IN ("client", "server") AND ENDPOINT_TYPE_CLUSTER.ENABLED=1
AND ENDPOINT_TYPE_COMMAND.INCOMING=1 AND COMMAND.SOURCE!=ENDPOINT_TYPE_CLUSTER.SIDE 
${mfgSpecificString} GROUP BY CLUSTER.NAME, COMMAND.NAME
ORDER BY CLUSTER.NAME, COMMAND.NAME`
    )
    .then((rows) => rows.map(mapFunction))
}

async function selectCommandByCode(
  db,
  packageId,
  clusterCode,
  commandCode,
  mfgCode = null
) {
  if (clusterCode == null) {
    return selectGlobalCommandByCode(db, packageId, commandCode, mfgCode)
  } else {
    return selectNonGlobalCommandByCode(
      db,
      packageId,
      clusterCode,
      commandCode,
      mfgCode
    )
  }
}

async function selectNonGlobalCommandByCode(
  db,
  packageId,
  clusterCode,
  commandCode,
  mfgCode = null
) {
  let query = `
  SELECT
    C.COMMAND_ID,
    C.CLUSTER_REF,
    C.PACKAGE_REF,
    C.CODE,
    C.MANUFACTURER_CODE,
    C.NAME,
    C.DESCRIPTION,
    C.SOURCE,
    C.IS_OPTIONAL,
    C.MUST_USE_TIMED_INVOKE,
    C.RESPONSE_REF
  FROM COMMAND AS C
  INNER JOIN CLUSTER AS CL
  ON CL.CLUSTER_ID = C.CLUSTER_REF
  WHERE
    C.PACKAGE_REF = ?
    AND C.CODE = ?
    AND CL.CODE = ?`
  let args
  if (mfgCode == null || mfgCode == 0) {
    query = query + ` AND C.MANUFACTURER_CODE IS NULL`
    args = [packageId, commandCode, clusterCode]
  } else {
    query = query + ` AND C.MANUFACTURER_CODE = ?`
    args = [packageId, commandCode, clusterCode, mfgCode]
  }

  return dbApi.dbGet(db, query, args).then(dbMapping.map.command)
}

async function selectGlobalCommandByCode(
  db,
  packageId,
  commandCode,
  mfgCode = null
) {
  let query = `
  SELECT
    C.COMMAND_ID,
    C.CLUSTER_REF,
    C.PACKAGE_REF,
    C.CODE,
    C.MANUFACTURER_CODE,
    C.NAME,
    C.DESCRIPTION,
    C.SOURCE,
    C.IS_OPTIONAL,
    C.MUST_USE_TIMED_INVOKE,
    C.RESPONSE_REF
  FROM
    COMMAND AS C
  WHERE
    C.PACKAGE_REF = ?
    AND C.CODE = ?`
  let args
  if (mfgCode == null || mfgCode == 0) {
    query = query + ` AND C.MANUFACTURER_CODE IS NULL`
    args = [packageId, commandCode]
  } else {
    query = query + ` AND C.MANUFACTURER_CODE = ?`
    args = [packageId, commandCode, mfgCode]
  }

  return dbApi.dbGet(db, query, args).then(dbMapping.map.command)
}

async function selectCommandById(db, id) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  COMMAND_ID,
  CLUSTER_REF,
  PACKAGE_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  SOURCE,
  IS_OPTIONAL,
  MUST_USE_TIMED_INVOKE,
  RESPONSE_REF
FROM COMMAND
  WHERE COMMAND_ID = ?`,
      [id]
    )
    .then(dbMapping.map.command)
}

/**
 * Retrieves commands for a given cluster Id.
 * This method DOES NOT retrieve global commands, since those have a cluster_ref = null
 *
 * @param {*} db
 * @param {*} clusterId
 * @returns promise of an array of command rows, which represent per-cluster commands, excluding global commands.
 */
async function selectCommandsByClusterId(db, clusterId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  SOURCE,
  IS_OPTIONAL,
  MUST_USE_TIMED_INVOKE,
  RESPONSE_REF
FROM COMMAND WHERE CLUSTER_REF = ?
ORDER BY CODE`,
      [clusterId]
    )
    .then((rows) => rows.map(dbMapping.map.command))
}

async function selectAllCommandsWithArguments(db, packageId) {
  let mapFunction = (x) => {
    return {
      id: x.COMMAND_ID,
      commandId: x.COMMAND_ID,
      commandCode: x.CODE,
      commandMfgCode: x.MANUFACTURER_CODE,
      name: x.NAME,
      commandName: x.NAME,
      commandDescription: x.DESCRIPTION,
      commandSource: x.SOURCE,
      commandIsOptional: dbApi.fromDbBool(x.IS_OPTIONAL),
      commandMustUseTimedInvoke: dbApi.fromDbBool(x.MUST_USE_TIMED_INVOKE),
      clusterName: x.CLUSTER_NAME,
      clusterCode: x.CLUSTER_CODE,
      clusterMfgCode: x.CLUSTER_MANUFACTURER_CODE,
      argName: x.ARG_NAME,
      argType: x.ARG_TYPE,
      argFieldId: x.FIELD_IDENTIFIER,
      argIsArray: dbApi.fromDbBool(x.ARG_IS_ARRAY),
      argPresentIf: x.ARG_PRESENT_IF,
      argIsNullable: dbApi.fromDbBool(x.ARG_IS_NULLABLE),
      argCountArg: x.ARG_COUNT_ARG,
      argIntroducedIn: x.INTRODUCED_IN_REF,
      argRemovedIn: x.REMOVED_IN_REF,
    }
  }
  let rows = await dbApi.dbAll(
    db,
    `
SELECT
  CO.COMMAND_ID,
  CO.CLUSTER_REF,
  CO.CODE,
  CO.MANUFACTURER_CODE,
  CO.NAME,
  CO.DESCRIPTION,
  CO.SOURCE,
  CO.IS_OPTIONAL,
  CO.MUST_USE_TIMED_INVOKE,
  CO.RESPONSE_REF,
  CL.NAME AS CLUSTER_NAME,
  CL.CODE AS CLUSTER_CODE,
  CL.MANUFACTURER_CODE AS CLUSTER_MANUFACTURER_CODE,
  CA.NAME AS ARG_NAME,
  CA.TYPE AS ARG_TYPE,
  CA.FIELD_IDENTIFIER,
  CA.IS_ARRAY AS ARG_IS_ARRAY,
  CA.PRESENT_IF AS ARG_PRESENT_IF,
  CA.IS_NULLABLE AS ARG_IS_NULLABLE,
  CA.COUNT_ARG AS ARG_COUNT_ARG,
  CA.INTRODUCED_IN_REF,
  CA.REMOVED_IN_REF
FROM
  COMMAND AS CO
INNER JOIN
  CLUSTER AS CL
ON
  CL.CLUSTER_ID = CO.CLUSTER_REF
LEFT JOIN
  COMMAND_ARG AS CA
ON
  CA.COMMAND_REF = CO.COMMAND_ID
WHERE
  CO.PACKAGE_REF = ?
ORDER BY
  CL.CODE, CO.SOURCE, CO.CODE,  CA.FIELD_IDENTIFIER`,
    [packageId]
  )
  rows = rows.map(mapFunction)
  let reduction = rows.reduce((total, current) => {
    let lastItem = null
    if (total.length > 0) lastItem = total[total.length - 1]

    let extractArg = (x) => {
      const ret = {
        name: x.argName,
        label: x.argName,
        type: x.argType,
        fieldId: x.argFieldId,
        isArray: x.argIsArray,
        presentIf: x.argPresentIf,
        isNullable: x.argIsNullable,
        countArg: x.argCountArg,
        introducedIn: x.argIntroducedIn,
        removedIn: x.argRemovedIn,
        introducedInRef: x.argIntroducedIn,
        removedInRef: x.argRemovedIn,
      }
      delete x.argName
      delete x.argType
      delete x.argFieldId
      delete x.argIsArray
      delete x.argPresentIf
      delete x.argIsNullable
      delete x.argCountArg
      delete x.argIntroducedIn
      delete x.argRemovedIn
      return ret
    }
    if (
      lastItem == null ||
      !(
        lastItem.commandCode == current.commandCode &&
        lastItem.commandMfgCode == current.commandMfgCode &&
        lastItem.commandSource == current.commandSource &&
        lastItem.clusterCode == current.clusterCode &&
        lastItem.clusterMfgCode == current.clusterMfgCode
      )
    ) {
      // We have a new command
      current.commandArgs = []
      current.argCount = 0
      if (current.argName != null) {
        current.commandArgs.push(extractArg(current))
        current.argCount++
      }
      total.push(current)
    } else {
      // We just aggregate args.
      if (current.argName != null) {
        lastItem.commandArgs.push(extractArg(current))
        lastItem.argCount++
      }
    }

    return total
  }, [])
  return reduction
}

/**
 *
 * @param db
 * @param packageId
 * @returns all commands along with their cluster information
 */
async function selectAllCommandsWithClusterInfo(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND.COMMAND_ID,
  COMMAND.CLUSTER_REF,
  COMMAND.CODE,
  COMMAND.MANUFACTURER_CODE,
  COMMAND.NAME,
  COMMAND.DESCRIPTION,
  COMMAND.SOURCE,
  COMMAND.IS_OPTIONAL,
  COMMAND.MUST_USE_TIMED_INVOKE,
  COMMAND.RESPONSE_REF,
  CLUSTER.NAME AS CLUSTER_NAME,
  CLUSTER.CODE AS CLUSTER_CODE
FROM COMMAND
INNER JOIN CLUSTER ON CLUSTER.CLUSTER_ID = COMMAND.CLUSTER_REF
  WHERE COMMAND.PACKAGE_REF = ?
ORDER BY CLUSTER.CODE, COMMAND.CODE`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.command))
}

async function selectAllCommands(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  SOURCE,
  IS_OPTIONAL,
  MUST_USE_TIMED_INVOKE,
  RESPONSE_REF
FROM COMMAND
  WHERE PACKAGE_REF = ?
ORDER BY CODE`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.command))
}

async function selectAllCommandsBySource(db, source, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  SOURCE,
  IS_OPTIONAL,
  MUST_USE_TIMED_INVOKE,
  RESPONSE_REF
FROM COMMAND
WHERE
  SOURCE = ?
  AND PACKAGE_REF = ?
ORDER BY CODE`,
      [source, packageId]
    )
    .then((rows) => rows.map(dbMapping.map.command))
}

/**
 * Retrieves filtered commands for a given cluster Id based on the source.
 * This method DOES NOT retrieve global commands, since those have a cluster_ref = null
 *
 * @param {*} db
 * @param {*} clusterId
 * @returns promise of an array of command rows, which represent per-cluster commands, excluding global commands.
 */
async function selectCommandsByClusterIdAndSource(
  db,
  clusterId,
  source,
  packageId
) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  SOURCE,
  IS_OPTIONAL,
  MUST_USE_TIMED_INVOKE
FROM COMMAND
WHERE
  CLUSTER_REF = ?
  AND SOURCE = ?
  AND PACKAGE_REF = ?
ORDER BY CODE`,
      [clusterId, source, packageId]
    )
    .then((rows) => rows.map(dbMapping.map.command))
}

async function selectAllGlobalCommands(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  SOURCE,
  IS_OPTIONAL,
  MUST_USE_TIMED_INVOKE,
  RESPONSE_REF
FROM COMMAND
WHERE CLUSTER_REF IS NULL AND PACKAGE_REF = ?
ORDER BY CODE`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.command))
}

async function selectAllClusterCommands(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  SOURCE,
  IS_OPTIONAL,
  MUST_USE_TIMED_INVOKE,
  RESPONSE_REF
FROM COMMAND
WHERE CLUSTER_REF IS NOT NULL AND PACKAGE_REF = ?
ORDER BY CODE`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.command))
}

async function selectAllCommandArguments(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND_ARG.COMMAND_REF,
  COMMAND_ARG.FIELD_IDENTIFIER,
  COMMAND_ARG.NAME,
  COMMAND_ARG.TYPE,
  COMMAND_ARG.IS_ARRAY,
  COMMAND_ARG.PRESENT_IF,
  COMMAND_ARG.IS_NULLABLE,
  COMMAND_ARG.IS_OPTIONAL,
  COMMAND_ARG.INTRODUCED_IN_REF,
  COMMAND_ARG.REMOVED_IN_REF,
  COMMAND_ARG.COUNT_ARG
FROM COMMAND_ARG, COMMAND
WHERE
  COMMAND_ARG.COMMAND_REF = COMMAND.COMMAND_ID
  AND COMMAND.PACKAGE_REF = ?
ORDER BY COMMAND_REF, FIELD_IDENTIFIER`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.commandArgument))
}

/**
 * Get the number of command arguments for a command
 *
 * @param {*} db
 * @param {*} commandId
 * @param {*} [packageId=null]
 * @returns A promise with number of command arguments for a command
 */
async function selectCommandArgumentsCountByCommandId(db, commandId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT COUNT(*) AS count
FROM COMMAND_ARG WHERE COMMAND_REF = ? `,
      [commandId]
    )
    .then((res) => res[0].count)
}

/**
 * Extract the command arguments for a command
 *
 * @param {*} db
 * @param {*} commandId
 * @param {*} [packageId=null]
 * @returns A promise with command arguments for a command
 */
async function selectCommandArgumentsByCommandId(db, commandId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND_REF,
  FIELD_IDENTIFIER,
  NAME,
  TYPE,
  IS_ARRAY,
  PRESENT_IF,
  IS_NULLABLE,
  IS_OPTIONAL,
  INTRODUCED_IN_REF,
  REMOVED_IN_REF,
  COUNT_ARG
FROM COMMAND_ARG
WHERE COMMAND_REF = ?
ORDER BY FIELD_IDENTIFIER`,
      [commandId]
    )
    .then((rows) => rows.map(dbMapping.map.commandArgument))
}

/**
 * This method returns all commands, joined with their
 * respective arguments and clusters, so it's a long query.
 * If you are just looking for a quick query across all commands
 * use the selectAllCommands query.
 *
 * @param {*} db
 * @param {*} packageId
 * @returns promise that resolves into a list of all commands and arguments.
 */
async function selectCommandTree(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  CMD.COMMAND_ID,
  CMD.CLUSTER_REF,
  CMD.CODE,
  CMD.MANUFACTURER_CODE,
  CMD.NAME,
  CMD.DESCRIPTION,
  CMD.SOURCE,
  CMD.IS_OPTIONAL,
  CMD.MUST_USE_TIMED_INVOKE,
  CMD.RESPONSE_REF,
  CL.CODE AS CLUSTER_CODE,
  CL.NAME AS CLUSTER_NAME,
  CL.NAME AS CLUSTER_NAME,
  CL.DEFINE AS CLUSTER_DEFINE_NAME,
  CA.NAME AS ARG_NAME,
  CA.TYPE AS ARG_TYPE,
  CA.IS_ARRAY AS ARG_IS_ARRAY,
  CA.PRESENT_IF AS ARG_PRESENT_IF,
  CA.IS_NULLABLE AS ARG_IS_NULLABLE,
  CA.COUNT_ARG AS ARG_COUNT_ARG
FROM 
  COMMAND AS CMD
LEFT JOIN
  CLUSTER AS CL
ON
  CMD.CLUSTER_REF = CL.CLUSTER_ID
LEFT JOIN
  COMMAND_ARG AS CA
ON
  CMD.COMMAND_ID = CA.COMMAND_REF
WHERE CMD.PACKAGE_REF = ?
ORDER BY CL.CODE, CMD.CODE, CA.FIELD_IDENTIFIER`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.command))
}

/**
 * After the data is loaded from XML, we need to link the command request/responses
 * RESPONSE_REF fields together.
 * This is done in a 2 ways:
 *    - for commands that already have RESPONSE_NAME, it is used.
 *    - for commands that have Request/Response names, those names are matched.
 * In both cases, RESPONSE_REF is properly linked.
 *
 * @param {*} db
 */
async function updateCommandRequestResponseReferences(db, packageId) {
  // First we link up all the cases where the response_for_name is present
  await dbApi.dbUpdate(
    db,
    `
UPDATE
  COMMAND
SET
  RESPONSE_REF =
  ( SELECT
      CMD_REF.COMMAND_ID
    FROM
      COMMAND AS CMD_REF
    WHERE
      ( CMD_REF.NAME = COMMAND.RESPONSE_NAME ) AND (
        ( CMD_REF.CLUSTER_REF = COMMAND.CLUSTER_REF )
        OR
        ( CMD_REF.CLUSTER_REF IS NULL AND COMMAND.CLUSTER_REF IS NULL )
      ) AND (
        ( CMD_REF.PACKAGE_REF = COMMAND.PACKAGE_REF)
      )
  )
WHERE
  COMMAND.RESPONSE_NAME IS NOT NULL
  AND COMMAND.PACKAGE_REF = ?
  `,
    [packageId]
  )

  // Then we link up the ones where the "response/request" names match.
  await dbApi.dbUpdate(
    db,
    `
UPDATE
  COMMAND
SET
  RESPONSE_REF =
  (
    SELECT
      CMD_REF.COMMAND_ID
    FROM
      COMMAND AS CMD_REF
    WHERE
      ( CMD_REF.NAME = COMMAND.NAME||'Response'
        OR
        CMD_REF.NAME = REPLACE(COMMAND.NAME, 'Request', '')||'Response'
      ) AND (
        ( CMD_REF.CLUSTER_REF = COMMAND.CLUSTER_REF )
        OR
        ( CMD_REF.CLUSTER_REF IS NULL AND COMMAND.CLUSTER_REF IS NULL )
        ) AND (
          ( CMD_REF.PACKAGE_REF = COMMAND.PACKAGE_REF)
        )
  )
WHERE
  COMMAND.NAME NOT LIKE '%Response' AND COMMAND.RESPONSE_NAME IS NULL
    `
  )
}

function commandMapFunction(x) {
  return {
    id: x.COMMAND_ID,
    name: x.NAME,
    code: x.CODE,
    commandSource: x.SOURCE,
    source: x.SOURCE,
    mustUseTimedInvoke: dbApi.fromDbBool(x.MUST_USE_TIMED_INVOKE),
    mfgCode: x.MANUFACTURER_CODE,
    incoming: x.INCOMING,
    outgoing: x.OUTGOING,
    description: x.DESCRIPTION,
    clusterSide: x.SIDE,
    clusterName: x.CLUSTER_NAME,
    clusterDefine: x.CLUSTER_DEFINE,
    isClusterEnabled: x.ENABLED,
    responseRef: x.RESPONSE_REF,
  }
}

/**
 * Returns a promise of data for commands inside an endpoint type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the command data.
 */
async function selectAllCommandDetailsFromEnabledClusters(
  db,
  endpointsAndClusters
) {
  let endpointTypeClusterRef = endpointsAndClusters
    .map((ep) => ep.endpointTypeClusterRef)
    .toString()
  return dbApi
    .dbAll(
      db,
      `
  SELECT
    COMMAND.COMMAND_ID,
    COMMAND.NAME,
    COMMAND.CODE,
    COMMAND.SOURCE,
    COMMAND.MANUFACTURER_CODE,
    COMMAND.DESCRIPTION,
    COMMAND.RESPONSE_REF,
    COMMAND.MUST_USE_TIMED_INVOKE,
    ENDPOINT_TYPE_CLUSTER.SIDE,
    CLUSTER.NAME AS CLUSTER_NAME,
    ENDPOINT_TYPE_CLUSTER.ENABLED
  FROM COMMAND
  INNER JOIN CLUSTER
  ON COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
  INNER JOIN ENDPOINT_TYPE_CLUSTER
  ON CLUSTER.CLUSTER_ID = ENDPOINT_TYPE_CLUSTER.CLUSTER_REF
  WHERE ENDPOINT_TYPE_CLUSTER.CLUSTER_REF in (${endpointTypeClusterRef})
  GROUP BY COMMAND.NAME
        `
    )
    .then((rows) => rows.map(commandMapFunction))
}

/**
 *
 * @param db
 * @param endpointsAndClusters
 * @returns  Returns a promise of data for commands with cli inside an endpoint type.
 */
async function selectAllCliCommandDetailsFromEnabledClusters(
  db,
  endpointsAndClusters
) {
  let endpointTypeClusterRef = endpointsAndClusters
    .map((ep) => ep.endpointTypeClusterRef)
    .toString()
  return dbApi
    .dbAll(
      db,
      `
  SELECT
    COMMAND.COMMAND_ID,
    COMMAND.NAME,
    COMMAND.CODE,
    COMMAND.SOURCE,
    COMMAND.MANUFACTURER_CODE,
    COMMAND.DESCRIPTION,
    COMMAND.RESPONSE_REF,
    COMMAND.MUST_USE_TIMED_INVOKE,
    ENDPOINT_TYPE_CLUSTER.SIDE,
    CLUSTER.NAME AS CLUSTER_NAME,
    CLUSTER.DEFINE AS CLUSTER_DEFINE,
    ENDPOINT_TYPE_CLUSTER.ENABLED
  FROM COMMAND
  INNER JOIN CLUSTER
  ON COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
  INNER JOIN ENDPOINT_TYPE_CLUSTER
  ON CLUSTER.CLUSTER_ID = ENDPOINT_TYPE_CLUSTER.CLUSTER_REF
  INNER JOIN PACKAGE_OPTION
  ON PACKAGE_OPTION.OPTION_CODE = COMMAND.NAME
  WHERE ENDPOINT_TYPE_CLUSTER.CLUSTER_REF in (${endpointTypeClusterRef}) AND ENDPOINT_TYPE_CLUSTER.ENABLED=1
  GROUP BY COMMAND.NAME, CLUSTER.NAME
        `
    )
    .then((rows) => rows.map(commandMapFunction))
}

/**
 * Returns a promise of data for commands inside an endpoint type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the command data.
 */
async function selectCommandDetailsFromAllEndpointTypesAndClusters(
  db,
  endpointsAndClusters,
  doGroupBy
) {
  let endpointTypeIds = endpointsAndClusters
    .map((ep) => ep.endpointId)
    .toString()
  let endpointClusterIds = endpointsAndClusters
    .map((ep) => ep.endpointClusterId)
    .toString()
  let query = `
  SELECT
    C.COMMAND_ID,
    C.NAME,
    C.CODE,
    C.SOURCE,
    C.MANUFACTURER_CODE,
    C.DESCRIPTION,
    C.RESPONSE_REF,
    C.MUST_USE_TIMED_INVOKE,
    ETC.INCOMING,
    ETC.OUTGOING,
    ETCL.SIDE,
    ETCL.ENABLED,
    CLUSTER.NAME AS CLUSTER_NAME
  FROM
    COMMAND AS C
  INNER JOIN
    ENDPOINT_TYPE_COMMAND AS ETC
  ON
    C.COMMAND_ID = ETC.COMMAND_REF
  INNER JOIN
    ENDPOINT_TYPE_CLUSTER AS ETCL
  ON
    ETC.ENDPOINT_TYPE_CLUSTER_REF = ETCL.ENDPOINT_TYPE_CLUSTER_ID
  INNER JOIN
    CLUSTER
  ON
    C.CLUSTER_REF = CLUSTER.CLUSTER_ID
  WHERE
    ETC.ENDPOINT_TYPE_REF IN (${endpointTypeIds}) 
    AND ETC.ENDPOINT_TYPE_CLUSTER_REF in (${endpointClusterIds}) `

  if (doGroupBy) {
    // See: https://github.com/project-chip/zap/issues/192
    query = query + ` GROUP BY C.NAME, C.COMMAND_ID`
  }

  return dbApi.dbAll(db, query).then((rows) => rows.map(commandMapFunction))
}

/**
 * Returns a promise of data for manufacturing/non-manufacturing specific commands
 * inside an endpoint type.
 *
 * @param db
 * @param endpointTypeId
 * @returns Promise that resolves with the manufacturing/non-manufacturing
 * specific command data.
 */
async function selectCommandDetailsFromAllEndpointTypesAndClustersUtil(
  db,
  endpointsAndClusters,
  isManufacturingSpecific
) {
  let endpointTypeIds = endpointsAndClusters
    .map((ep) => ep.endpointId)
    .toString()
  let endpointClusterIds = endpointsAndClusters
    .map((ep) => ep.endpointClusterId)
    .toString()
  return dbApi
    .dbAll(
      db,
      `
  SELECT
    COMMAND.COMMAND_ID,
    COMMAND.NAME,
    COMMAND.CODE,
    COMMAND.SOURCE,
    COMMAND.MANUFACTURER_CODE,
    ENDPOINT_TYPE_COMMAND.INCOMING,
    ENDPOINT_TYPE_COMMAND.OUTGOING,
    COMMAND.DESCRIPTION,
    COMMAND.RESPONSE_REF,
    COMMAND.MUST_USE_TIMED_INVOKE,
    ENDPOINT_TYPE_CLUSTER.SIDE,
    CLUSTER.NAME AS CLUSTER_NAME,
    ENDPOINT_TYPE_CLUSTER.ENABLED
  FROM
    COMMAND
  INNER JOIN
    ENDPOINT_TYPE_COMMAND
  ON
    COMMAND.COMMAND_ID = ENDPOINT_TYPE_COMMAND.COMMAND_REF
  INNER JOIN
    ENDPOINT_TYPE_CLUSTER
  ON
    ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
  INNER JOIN
    CLUSTER
  ON
    COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
  WHERE
    ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF IN (${endpointTypeIds})
    AND ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF in (${endpointClusterIds})
    AND COMMAND.MANUFACTURER_CODE IS ${
      isManufacturingSpecific ? `NOT` : ``
    } NULL
  GROUP BY COMMAND.NAME
        `
    )
    .then((rows) => rows.map(commandMapFunction))
}

/**
 * Returns a promise of data for manufacturing specific commands inside an endpoint type.
 *
 * @param db
 * @param endpointTypeId
 * @returns Promise that resolves with the manufacturing specific command data.
 */
async function selectManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters(
  db,
  endpointsAndClusters
) {
  return selectCommandDetailsFromAllEndpointTypesAndClustersUtil(
    db,
    endpointsAndClusters,
    true
  )
}

/**
 * Returns a promise of data for commands with no manufacturing specific information inside an endpoint type.
 *
 * @param db
 * @param endpointTypeId
 * @returns Promise that resolves with the non-manufacturing specific command data.
 */
async function selectNonManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters(
  db,
  endpointsAndClusters
) {
  return selectCommandDetailsFromAllEndpointTypesAndClustersUtil(
    db,
    endpointsAndClusters,
    false
  )
}

exports.selectCliCommandCountFromEndpointTypeCluster =
  selectCliCommandCountFromEndpointTypeCluster
exports.selectCliCommandsFromCluster = selectCliCommandsFromCluster
exports.selectAllAvailableClusterCommandDetailsFromEndpointTypes =
  selectAllAvailableClusterCommandDetailsFromEndpointTypes
exports.selectAllClustersWithIncomingCommands =
  selectAllClustersWithIncomingCommands
exports.selectAllClustersWithIncomingCommandsCombined =
  selectAllClustersWithIncomingCommandsCombined
exports.selectAllIncomingCommandsForCluster =
  selectAllIncomingCommandsForCluster
exports.selectAllIncomingCommandsForClusterCombined =
  selectAllIncomingCommandsForClusterCombined
exports.selectAllCommands = selectAllCommands
exports.selectCommandsByClusterId = selectCommandsByClusterId
exports.selectCommandById = selectCommandById
exports.selectCommandByCode = selectCommandByCode
exports.selectAllCommandsBySource = selectAllCommandsBySource
exports.selectCommandsByClusterIdAndSource = selectCommandsByClusterIdAndSource
exports.selectAllGlobalCommands = selectAllGlobalCommands
exports.selectAllClusterCommands = selectAllClusterCommands
exports.selectAllCommandArguments = selectAllCommandArguments
exports.selectCommandArgumentsCountByCommandId =
  selectCommandArgumentsCountByCommandId
exports.selectCommandArgumentsByCommandId = selectCommandArgumentsByCommandId
exports.selectCommandTree = selectCommandTree
exports.updateCommandRequestResponseReferences =
  updateCommandRequestResponseReferences

exports.selectAllCommandDetailsFromEnabledClusters =
  selectAllCommandDetailsFromEnabledClusters
exports.selectAllCliCommandDetailsFromEnabledClusters =
  selectAllCliCommandDetailsFromEnabledClusters

exports.selectCommandDetailsFromAllEndpointTypesAndClusters =
  selectCommandDetailsFromAllEndpointTypesAndClusters
exports.selectManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters =
  selectManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters
exports.selectNonManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters =
  selectNonManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters
exports.selectAllIncomingCommands = selectAllIncomingCommands
exports.selectMfgClustersWithIncomingCommandsForClusterCode =
  selectMfgClustersWithIncomingCommandsForClusterCode
exports.selectAllCommandsWithClusterInfo = selectAllCommandsWithClusterInfo
exports.selectAllCommandsWithArguments = selectAllCommandsWithArguments
exports.selectAllClustersWithOutgoingCommands =
  selectAllClustersWithOutgoingCommands
exports.selectAllOutgoingCommandsForCluster =
  selectAllOutgoingCommandsForCluster

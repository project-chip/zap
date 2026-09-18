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

/**
 * This module provides the API to access zcl specific information.
 *
 * @module REST API: user data
 */

const queryPackage = require('../db/query-package')
const queryZcl = require('../db/query-zcl')
const queryEndpointType = require('../db/query-endpoint-type')
const dbEnum = require('../../src-shared/db-enum')
const util = require('../util/util')
const env = require('../util/env')
const ucComponent = require('../../src-shared/uc-component-id')

/**
 * Session gen-templates package that matches the cluster's ZCL package category.
 * Falls back to the first session templates package when category is missing
 * or no matching templates package exists.
 * @param {*} db
 * @param {*} sessionId
 * @param {*} cluster
 * @returns {Promise<number|null>}
 */
async function getSessionGenTemplatesPackageIdForCluster(
  db,
  sessionId,
  cluster
) {
  let pkgs = await queryPackage.getSessionPackagesByType(
    db,
    sessionId,
    dbEnum.packageType.genTemplatesJson
  )
  if (pkgs.length == 0) {
    return null
  }

  let match = pkgs[0]
  if (cluster && cluster.packageRef) {
    let zclPkg = await queryPackage.getPackageByPackageId(
      db,
      cluster.packageRef
    )
    if (zclPkg && zclPkg.category) {
      let byCategory = pkgs.find((p) => p.category === zclPkg.category)
      if (byCategory) {
        match = byCategory
      } else {
        env.logWarning(
          `No gen-templates package with category(${zclPkg.category}) for clusterId(${cluster.id}); falling back to first session templates package.`
        )
      }
    }
  }

  return match.id
}

/**
 * Package extensions for an entity, merged across every session gen-templates
 * package. Property metadata comes from the first package that defines it;
 * defaults from later packages are concatenated.
 * @param {*} db
 * @param {*} sessionId
 * @param {*} entity
 * @returns {Promise<Array>}
 */
async function getMergedSessionPackageExtensions(db, sessionId, entity) {
  let pkgs = await queryPackage.getSessionPackagesByType(
    db,
    sessionId,
    dbEnum.packageType.genTemplatesJson
  )
  let mergedByProperty = new Map()
  for (const pkg of pkgs) {
    if (pkg.id == null) continue
    let exts = await queryPackage.selectPackageExtension(db, pkg.id, entity)
    for (const ext of exts) {
      let existing = mergedByProperty.get(ext.property)
      if (!existing) {
        mergedByProperty.set(ext.property, {
          ...ext,
          defaults: Array.isArray(ext.defaults) ? ext.defaults.slice() : []
        })
      } else if (Array.isArray(ext.defaults) && ext.defaults.length > 0) {
        existing.defaults = existing.defaults.concat(ext.defaults)
      }
    }
  }
  return Array.from(mergedByProperty.values())
}

/**
 * Promise that return a list of component Ids required by a specific cluster
 * @param {*} db
 * @param {*} sessionId
 * @param {*} clusterId
 * @param {*} side
 * @returns {*} array of componentIds
 */
async function getComponentIdsByCluster(db, sessionId, clusterId, side) {
  try {
    let cluster = await queryZcl.selectClusterById(db, clusterId)
    if (!cluster) {
      env.logWarning(`Failed to retrieve cluster via clusterId(${clusterId}).`)
      return []
    }

    let id = await getSessionGenTemplatesPackageIdForCluster(
      db,
      sessionId,
      cluster
    )
    if (id == null) {
      return []
    }

    let extensions = await queryPackage.selectPackageExtension(
      db,
      id,
      dbEnum.packageExtensionEntity.cluster
    )
    let componentIds = []
    side.forEach((zclRole) => {
      let clusterKey = `${cluster.label.toLowerCase()}-${zclRole}`
      let ids = util.getClusterExtensionDefault(
        extensions,
        'component',
        clusterKey
      )
      componentIds = componentIds.concat(ucComponent.splitComponentIds(ids))
    })
    return componentIds
  } catch (err) {
    env.logWarning(
      `Failed to retrieve component ids required by clusterId(${clusterId}) from cluster extension mapping.`,
      err
    )
    return []
  }
}

/**
 * From a candidate remove list, drop any component that is still required by
 * another enabled cluster (or the same cluster on another endpoint).
 * Enabled clusters come from selectUsedEndpointTypeIds +
 * selectAllClustersDetailsFromEndpointTypes (same pattern as ClustersHelper /
 * helper-shared-config). Mapping to UC ids reuses getComponentIdsByCluster.
 * @param {*} db
 * @param {*} sessionId
 * @param {string[]} componentIds
 * @returns {Promise<string[]>}
 */
async function filterOutComponentsStillRequired(db, sessionId, componentIds) {
  if (!componentIds || componentIds.length === 0) {
    return []
  }

  let stillRequired = new Set()
  let endpointTypes = await queryEndpointType.selectUsedEndpointTypeIds(
    db,
    sessionId
  )
  if (endpointTypes.length > 0) {
    let clusters =
      await queryEndpointType.selectAllClustersDetailsFromEndpointTypes(
        db,
        endpointTypes
      )
    for (const cluster of clusters) {
      if (!cluster.id || !cluster.side) continue
      let ids = await getComponentIdsByCluster(db, sessionId, cluster.id, [
        cluster.side
      ])
      for (const componentId of ids) {
        stillRequired.add(ucComponent.extractUcClusterCode(componentId))
        // Also keep the full id so exact-string comparisons still work.
        stillRequired.add(String(componentId).toLowerCase().trim())
      }
    }
  }

  return componentIds.filter((id) => {
    if (!id) return false
    let full = String(id).toLowerCase().trim()
    let short = ucComponent.extractUcClusterCode(id)
    return !stillRequired.has(full) && !stillRequired.has(short)
  })
}

exports.getComponentIdsByCluster = getComponentIdsByCluster
exports.filterOutComponentsStillRequired = filterOutComponentsStillRequired
exports.getMergedSessionPackageExtensions = getMergedSessionPackageExtensions

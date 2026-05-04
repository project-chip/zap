/**
 *
 *    Copyright (c) 2025 Silicon Labs
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
 * Runs existing ZCL / data-model validators across an entire session (all endpoints,
 * endpoint types, included attributes, and per-cluster conformance).
 *
 * @module Validation API: validate all session elements
 */

const validation = require('./validation.js')
const conformChecker = require('./conformance-checker.js')
const queryEndpoint = require('../db/query-endpoint.js')
const queryEndpointType = require('../db/query-endpoint-type.js')
const queryZcl = require('../db/query-zcl.js')
const queryCommand = require('../db/query-command.js')
const queryDeviceType = require('../db/query-device-type.js')
const queryPackage = require('../db/query-package.js')
const dbEnum = require('../../src-shared/db-enum.js')

/**
 * @param {*} db
 * @param {*} sessionId
 * @param {*} options
 * @param {boolean} [options.conformance=true] Run conformance checks (feature map / mandatory elements).
 * @param {boolean} [options.persistConformanceNotifications=false] If true, conformance issues are also written to SESSION_NOTICE.
 * @returns {Promise<object>} Aggregated validation report
 */
async function validateAll(db, sessionId, options = {}) {
  const conformanceEnabled = options.conformance !== false
  const persistConformanceNotifications =
    options.persistConformanceNotifications === true

  const endpointRows = []
  const attributeRows = []
  const conformanceRows = []

  let errorCount = 0
  let attributesChecked = 0
  let clustersChecked = 0

  const endpoints = await queryEndpoint.selectAllEndpoints(db, sessionId)

  /** @type {Map<number, number[]>} endpoint type id -> sorted endpoint identifier numbers */
  const endpointIdentifiersByEndpointTypeId = new Map()
  for (const ep of endpoints) {
    const tid = ep.endpointTypeRef
    if (!endpointIdentifiersByEndpointTypeId.has(tid)) {
      endpointIdentifiersByEndpointTypeId.set(tid, [])
    }
    endpointIdentifiersByEndpointTypeId.get(tid).push(ep.endpointIdentifier)
  }
  for (const list of endpointIdentifiersByEndpointTypeId.values()) {
    list.sort((a, b) => a - b)
  }

  for (const ep of endpoints) {
    const issues = await validation.validateEndpoint(db, ep.id)
    const epIssues = {
      endpointId: issues.endpointId || [],
      networkId: issues.networkId || []
    }
    // The shared validation helpers (isValidNumberString / extractIntegerValue)
    // treat null/undefined as 0 because Number(null) === 0. That's fine for the
    // UI's runtime checks but lets a malformed .zap file slip through the
    // headless validate path, so we explicitly catch null/empty values here.
    if (ep.endpointIdentifier == null || ep.endpointIdentifier === '') {
      if (!epIssues.endpointId.includes('EndpointId is missing')) {
        epIssues.endpointId.push('EndpointId is missing')
      }
    }
    if (ep.networkId == null || ep.networkId === '') {
      if (!epIssues.networkId.includes('NetworkId is missing')) {
        epIssues.networkId.push('NetworkId is missing')
      }
    }
    const hasEpIssues =
      epIssues.endpointId.length > 0 || epIssues.networkId.length > 0
    if (hasEpIssues) {
      errorCount += epIssues.endpointId.length + epIssues.networkId.length
      endpointRows.push({
        endpointDbId: ep.id,
        endpointId: ep.endpointIdentifier,
        issues: epIssues
      })
    }
  }

  const endpointTypes = await queryEndpointType.selectAllEndpointTypes(
    db,
    sessionId
  )

  for (const et of endpointTypes) {
    const endpointTypeId = et.endpointTypeId
    const attrs = await queryZcl.selectEndpointTypeAttributesByEndpointId(
      db,
      endpointTypeId
    )
    for (const row of attrs) {
      if (!row.included) continue
      if (row.storageOption === dbEnum.storageOption.external) continue
      attributesChecked++
      const result = await validation.validateAttribute(
        db,
        endpointTypeId,
        row.attributeRef,
        row.clusterRef,
        sessionId
      )
      const dvIssues = result.defaultValue || []
      if (dvIssues.length > 0) {
        errorCount += dvIssues.length
        let attributeName = ''
        let clusterName = ''
        const attrDef = await queryZcl.selectAttributeById(db, row.attributeRef)
        if (attrDef) attributeName = attrDef.name
        const clusterDef = await queryZcl.selectClusterById(db, row.clusterRef)
        if (clusterDef) clusterName = clusterDef.name

        const endpointIdentifiers =
          endpointIdentifiersByEndpointTypeId.get(endpointTypeId) || []

        attributeRows.push({
          endpointIdentifiers,
          endpointIdentifierLabel:
            endpointIdentifiers.length > 0
              ? endpointIdentifiers.join(', ')
              : '',
          endpointTypeId,
          clusterName,
          clusterRef: row.clusterRef,
          attributeName,
          attributeRef: row.attributeRef,
          defaultValue: row.defaultValue,
          issues: dvIssues
        })
      }
    }
  }

  if (conformanceEnabled) {
    const allZclPackageIds = await queryPackage.getSessionZclPackageIds(
      db,
      sessionId
    )
    /** Per-endpoint warning bucket: key = `${endpointDbId}:${clusterRef}`. */
    const conformanceByCluster = new Map()
    const addConformanceWarning = ({
      endpointDbId,
      endpointId,
      clusterRef,
      clusterName,
      message
    }) => {
      const key = `${endpointDbId}:${clusterRef ?? '_'}`
      let bucket = conformanceByCluster.get(key)
      if (!bucket) {
        bucket = {
          endpointDbId,
          endpointId,
          clusterRef,
          clusterName,
          warnings: []
        }
        conformanceByCluster.set(key, bucket)
      }
      bucket.warnings.push(message)
      errorCount++
    }

    const deviceTypeCache = new Map()
    /** endpoint type id -> mandatory attribute / command lists across enabled clusters */
    const endpointTypeMandatoryCache = new Map()

    for (const ep of endpoints) {
      const endpointTypeId = ep.endpointTypeRef
      let deviceTypeRefs = deviceTypeCache.get(endpointTypeId)
      if (!deviceTypeRefs) {
        const etd = await queryDeviceType.selectDeviceTypesByEndpointTypeId(
          db,
          endpointTypeId
        )
        deviceTypeRefs = etd.map((x) => x.deviceTypeRef)
        deviceTypeCache.set(endpointTypeId, deviceTypeRefs)
      }

      // ---- Feature-map / element conformance from XML ----
      const clusters = await queryEndpoint.selectEndpointClusters(
        db,
        endpointTypeId
      )
      for (const cluster of clusters) {
        clustersChecked++
        const warnings = await conformChecker.setConformanceWarnings(
          db,
          ep.endpointIdentifier,
          endpointTypeId,
          cluster.endpointTypeClusterId,
          deviceTypeRefs,
          cluster,
          sessionId,
          { persistNotifications: persistConformanceNotifications }
        )
        if (warnings && warnings.length > 0) {
          for (const w of warnings) {
            addConformanceWarning({
              endpointDbId: ep.id,
              endpointId: ep.endpointIdentifier,
              clusterRef: cluster.id,
              clusterName: cluster.name,
              message: w
            })
          }
        }
      }

      // ---- Mandatory cluster compliance (attributes + commands) ----
      // Mirrors clusterComplianceForAttributes / clusterComplianceForCommands
      // in import-json.js, but recomputed live from current state.
      let mandatory = endpointTypeMandatoryCache.get(endpointTypeId)
      if (!mandatory) {
        mandatory = await collectMandatoryClusterElements(
          db,
          endpointTypeId,
          allZclPackageIds
        )
        endpointTypeMandatoryCache.set(endpointTypeId, mandatory)
      }

      const endpointTypeAttributes =
        await queryZcl.selectEndpointTypeAttributesByEndpointId(
          db,
          endpointTypeId
        )
      const endpointTypeCommands =
        await queryZcl.selectEndpointTypeCommandsByEndpointId(
          db,
          endpointTypeId
        )
      const includedAttrIds = new Set(
        endpointTypeAttributes
          .filter((a) => a.included)
          .map((a) => a.attributeRef)
      )
      const cmdEnablement = new Map()
      for (const c of endpointTypeCommands) {
        cmdEnablement.set(c.commandRef, {
          incoming: !!c.incoming,
          outgoing: !!c.outgoing
        })
      }

      for (const ma of mandatory.attributes) {
        if (includedAttrIds.has(ma.id)) continue
        addConformanceWarning({
          endpointDbId: ep.id,
          endpointId: ep.endpointIdentifier,
          clusterRef: ma.clusterRef,
          clusterName: ma.clusterName,
          message: `Check Cluster Compliance on endpoint: ${ep.endpointIdentifier}, cluster: ${ma.clusterName}, mandatory attribute: ${ma.name} needs to be enabled`
        })
      }
      for (const mc of mandatory.commands) {
        const enab = cmdEnablement.get(mc.id) || {
          incoming: false,
          outgoing: false
        }
        // import-json only flags incoming side here (matches existing UX).
        if (mc.isIncoming && !enab.incoming) {
          addConformanceWarning({
            endpointDbId: ep.id,
            endpointId: ep.endpointIdentifier,
            clusterRef: mc.clusterRef,
            clusterName: mc.clusterName,
            message: `Check Cluster Compliance on endpoint: ${ep.endpointIdentifier}, cluster: ${mc.clusterName} ${mc.clusterSide}, mandatory command: ${mc.name} incoming needs to be enabled`
          })
        } else if (!mc.isIncoming && !enab.outgoing) {
          addConformanceWarning({
            endpointDbId: ep.id,
            endpointId: ep.endpointIdentifier,
            clusterRef: mc.clusterRef,
            clusterName: mc.clusterName,
            message: `Check Cluster Compliance on endpoint: ${ep.endpointIdentifier}, cluster: ${mc.clusterName} ${mc.clusterSide}, mandatory command: ${mc.name} outgoing needs to be enabled`
          })
        }
      }

      // ---- Device type compliance (clusters/attrs/cmds required by device type) ----
      const dtcRows = await collectDeviceTypeRequirements(db, endpointTypeId)
      const epClusterMap = {}
      for (const c of await queryZcl.selectEndpointTypeClustersByEndpointTypeId(
        db,
        endpointTypeId
      )) {
        epClusterMap[c.clusterRef] = epClusterMap[c.clusterRef] || {}
        epClusterMap[c.clusterRef][c.side] = c.enabled
      }
      for (const r of dtcRows.clusters) {
        const present = epClusterMap[r.clusterRef] || {}
        if (r.includeClient && r.lockClient && !present.client) {
          addConformanceWarning({
            endpointDbId: ep.id,
            endpointId: ep.endpointIdentifier,
            clusterRef: r.clusterRef,
            clusterName: r.clusterName,
            message: `Check Device Type Compliance on endpoint: ${ep.endpointIdentifier}, device type: ${r.deviceTypeName}, cluster: ${r.clusterName} client needs to be enabled`
          })
        }
        if (r.includeServer && r.lockServer && !present.server) {
          addConformanceWarning({
            endpointDbId: ep.id,
            endpointId: ep.endpointIdentifier,
            clusterRef: r.clusterRef,
            clusterName: r.clusterName,
            message: `Check Device Type Compliance on endpoint: ${ep.endpointIdentifier}, device type: ${r.deviceTypeName}, cluster: ${r.clusterName} server needs to be enabled`
          })
        }
      }
      const epAttrEnabled = new Set(
        endpointTypeAttributes
          .filter((a) => a.included)
          .map((a) => a.attributeRef)
      )
      for (const r of dtcRows.attributes) {
        if (epAttrEnabled.has(r.attributeRef)) continue
        addConformanceWarning({
          endpointDbId: ep.id,
          endpointId: ep.endpointIdentifier,
          clusterRef: r.clusterRef,
          clusterName: r.clusterName,
          message: `Check Device Type Compliance on endpoint: ${ep.endpointIdentifier}, device type: ${r.deviceTypeName}, cluster: ${r.clusterName}, attribute: ${r.name} needs to be enabled`
        })
      }
      for (const r of dtcRows.commands) {
        const enab = cmdEnablement.get(r.commandRef) || {
          incoming: false,
          outgoing: false
        }
        const incomingMissing = !enab.incoming
        const outgoingMissing = !enab.outgoing
        if (
          r.includeClient &&
          r.commandSource === 'client' &&
          outgoingMissing
        ) {
          addConformanceWarning({
            endpointDbId: ep.id,
            endpointId: ep.endpointIdentifier,
            clusterRef: r.clusterRef,
            clusterName: r.clusterName,
            message: `Check Device Type Compliance on endpoint: ${ep.endpointIdentifier}, device type: ${r.deviceTypeName}, cluster: ${r.clusterName} client, command: ${r.name} outgoing needs to be enabled`
          })
        }
        if (
          r.includeClient &&
          r.commandSource === 'server' &&
          incomingMissing
        ) {
          addConformanceWarning({
            endpointDbId: ep.id,
            endpointId: ep.endpointIdentifier,
            clusterRef: r.clusterRef,
            clusterName: r.clusterName,
            message: `Check Device Type Compliance on endpoint: ${ep.endpointIdentifier}, device type: ${r.deviceTypeName}, cluster: ${r.clusterName} client, command: ${r.name} incoming needs to be enabled`
          })
        }
        if (
          r.includeServer &&
          r.commandSource === 'client' &&
          incomingMissing
        ) {
          addConformanceWarning({
            endpointDbId: ep.id,
            endpointId: ep.endpointIdentifier,
            clusterRef: r.clusterRef,
            clusterName: r.clusterName,
            message: `Check Device Type Compliance on endpoint: ${ep.endpointIdentifier}, device type: ${r.deviceTypeName}, cluster: ${r.clusterName} server, command: ${r.name} incoming needs to be enabled`
          })
        }
        if (
          r.includeServer &&
          r.commandSource === 'server' &&
          outgoingMissing
        ) {
          addConformanceWarning({
            endpointDbId: ep.id,
            endpointId: ep.endpointIdentifier,
            clusterRef: r.clusterRef,
            clusterName: r.clusterName,
            message: `Check Device Type Compliance on endpoint: ${ep.endpointIdentifier}, device type: ${r.deviceTypeName}, cluster: ${r.clusterName} server, command: ${r.name} outgoing needs to be enabled`
          })
        }
      }
    }

    for (const bucket of conformanceByCluster.values()) {
      conformanceRows.push(bucket)
    }
  }

  return {
    summary: {
      errors: errorCount,
      warnings: 0,
      attributes: attributesChecked,
      endpoints: endpoints.length,
      clusters: clustersChecked
    },
    endpoints: endpointRows,
    attributes: attributeRows,
    conformance: conformanceRows
  }
}

/**
 * Collect mandatory (non-optional, non-global) attributes and mandatory commands
 * across every enabled cluster on an endpoint type.
 *
 * Mirrors getMandatoryClusterAttributes / getMandatoryClusterCommands in
 * import-json.js, returning a flat list with cluster context attached.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {number[]} packageIds
 * @returns {Promise<{attributes: object[], commands: object[]}>}
 */
async function collectMandatoryClusterElements(db, endpointTypeId, packageIds) {
  const epClusters = await queryZcl.selectEndpointTypeClustersByEndpointTypeId(
    db,
    endpointTypeId
  )
  const attributes = []
  const commands = []
  for (const epc of epClusters) {
    if (!epc.enabled) continue
    const cluster = await queryZcl.selectClusterById(db, epc.clusterRef)
    if (!cluster) continue

    const clusterAttrs =
      await queryZcl.selectAttributesByClusterIdAndSideIncludingGlobal(
        db,
        epc.clusterRef,
        packageIds,
        epc.side
      )
    for (const a of clusterAttrs) {
      // ignore global attributes (clusterRef null) and optional ones
      if (a.isOptional || a.clusterRef == null) continue
      attributes.push({
        id: a.id,
        name: a.name,
        clusterRef: epc.clusterRef,
        clusterName: cluster.name,
        side: epc.side
      })
    }

    const clusterCmds = await queryCommand.selectCommandsByClusterId(
      db,
      epc.clusterRef,
      packageIds
    )
    for (const c of clusterCmds) {
      if (c.isOptional) continue
      commands.push({
        id: c.id,
        name: c.name,
        clusterRef: epc.clusterRef,
        clusterName: cluster.name,
        clusterSide: epc.side,
        // import-json: isIncoming when source side != cluster side
        isIncoming: c.source !== epc.side
      })
    }
  }
  return { attributes, commands }
}

/**
 * Collect device-type required clusters / attributes / commands for an endpoint type.
 *
 * Mirrors deviceTypeClustersAttributesAndCommands in import-json.js and joins in
 * names + side flags so the validator can report compliance gaps without re-querying.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns {Promise<{clusters: object[], attributes: object[], commands: object[]}>}
 */
async function collectDeviceTypeRequirements(db, endpointTypeId) {
  const dts = await queryDeviceType.selectDeviceTypesByEndpointTypeId(
    db,
    endpointTypeId
  )
  const clusters = []
  const attributes = []
  const commands = []
  for (const dt of dts) {
    const deviceType = await queryDeviceType.selectDeviceTypeById(
      db,
      dt.deviceTypeRef
    )
    const dtName = deviceType ? deviceType.name : ''

    const dtClusters =
      await queryDeviceType.selectDeviceTypeClustersByDeviceTypeRef(
        db,
        dt.deviceTypeRef
      )
    for (const dtc of dtClusters) {
      clusters.push({
        deviceTypeRef: dt.deviceTypeRef,
        deviceTypeName: dtName,
        clusterRef: dtc.clusterRef,
        clusterName: dtc.clusterName,
        includeClient: !!dtc.includeClient,
        includeServer: !!dtc.includeServer,
        lockClient: !!dtc.lockClient,
        lockServer: !!dtc.lockServer
      })
    }

    const dtAttrs =
      await queryDeviceType.selectDeviceTypeAttributesByDeviceTypeRef(
        db,
        dt.deviceTypeRef
      )
    for (const a of dtAttrs) {
      if (a.attributeRef == null) continue
      const dtCluster = await queryDeviceType
        .selectDeviceTypeClusterByDeviceTypeClusterId(
          db,
          a.deviceTypeClusterRef
        )
        .catch(() => null)
      if (!dtCluster) continue
      const cluster = await queryZcl.selectClusterById(db, dtCluster.clusterRef)
      attributes.push({
        deviceTypeRef: dt.deviceTypeRef,
        deviceTypeName: dtName,
        clusterRef: dtCluster.clusterRef,
        clusterName: cluster ? cluster.name : '',
        attributeRef: a.attributeRef,
        name: a.name,
        includeClient: !!dtCluster.includeClient,
        includeServer: !!dtCluster.includeServer
      })
    }

    const dtCmds =
      await queryDeviceType.selectDeviceTypeCommandsByDeviceTypeRef(
        db,
        dt.deviceTypeRef
      )
    for (const c of dtCmds) {
      if (c.commandRef == null) continue
      const dtCluster = await queryDeviceType
        .selectDeviceTypeClusterByDeviceTypeClusterId(
          db,
          c.deviceTypeClusterRef
        )
        .catch(() => null)
      if (!dtCluster) continue
      const cluster = await queryZcl.selectClusterById(db, dtCluster.clusterRef)
      commands.push({
        deviceTypeRef: dt.deviceTypeRef,
        deviceTypeName: dtName,
        clusterRef: dtCluster.clusterRef,
        clusterName: cluster ? cluster.name : '',
        commandRef: c.commandRef,
        name: c.name,
        commandSource: c.source,
        includeClient: !!dtCluster.includeClient,
        includeServer: !!dtCluster.includeServer
      })
    }
  }
  return { clusters, attributes, commands }
}

exports.validateAll = validateAll

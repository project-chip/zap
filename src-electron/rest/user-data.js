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
 * This module provides the REST API to the user specific data.
 *
 * @module REST API: user data
 */

const env = require('../util/env')
const queryZcl = require('../db/query-zcl.js')
const queryAttribute = require('../db/query-attribute.js')
const queryCommand = require('../db/query-command.js')
const queryEvent = require('../db/query-event.js')
const queryFeature = require('../db/query-feature')
const queryConfig = require('../db/query-config.js')
const upgrade = require('../sdk/matter.js')
const querySessionNotification = require('../db/query-session-notification.js')
const queryPackageNotification = require('../db/query-package-notification')
const queryEndpointType = require('../db/query-endpoint-type.js')
const queryEndpoint = require('../db/query-endpoint.js')
const querySession = require('../db/query-session.js')
const queryPackage = require('../db/query-package.js')
const sharedClusterState = require('../util/shared-cluster-state.js')
const asyncValidation = require('../validation/async-validation.js')
const validation = require('../validation/validation.js')
const validateAll = require('../validation/validate-all.js')
const restApi = require('../../src-shared/rest-api.js')
const dbEnum = require('../../src-shared/db-enum.js')
const { StatusCodes } = require('http-status-codes')
const configurationOperation = require('./operation-adapter.js')

/** Runs one shared operation for each distinct endpoint type in a GUI edit. */
async function applyOperationToEndpointTypes(
  db,
  request,
  endpointTypeIds,
  name,
  params
) {
  const endpoints = await queryEndpoint.selectAllEndpoints(
    db,
    request.zapSessionId
  )
  for (const endpointTypeId of [...new Set(endpointTypeIds.map(Number))]) {
    const endpoint = endpoints.find(
      (candidate) => Number(candidate.endpointTypeRef) === endpointTypeId
    )
    if (endpoint == null) {
      throw new Error(`No endpoint uses endpoint type ${endpointTypeId}`)
    }
    await configurationOperation.execute(db, request, name, {
      ...params,
      endpointId: endpoint.id
    })
  }
}

/**
 * HTTP GET: session key values
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetSessionKeyValues(db) {
  return async (request, response) => {
    let sessionId = request.zapSessionId
    let sessionKeyValues = await querySession.getAllSessionKeyValues(
      db,
      sessionId
    )
    response.status(StatusCodes.OK).json(sessionKeyValues)
  }
}
/**
 * HTTP GET: endpoint ids of endpoints within a specified session
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetEndpointIds(db) {
  return async (request, response) => {
    let sessionId = request.zapSessionId
    let endpoints = await queryEndpoint.selectAllEndpoints(db, sessionId)
    let endpointIds = []
    endpoints.forEach((endpoint) => {
      endpointIds.push(endpoint.endpointIdentifier)
    })
    response.status(StatusCodes.OK).json(endpointIds)
  }
}

/**
 * HTTP GET: device type features
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetDeviceTypeFeatures(db) {
  return async (request, response) => {
    let { deviceTypeRefs, endpointTypeRef } = request.query
    if (Array.isArray(deviceTypeRefs) && deviceTypeRefs.length > 0) {
      let deviceTypeFeatures = await queryFeature.getFeaturesByDeviceTypeRefs(
        db,
        deviceTypeRefs,
        endpointTypeRef
      )
      response.status(StatusCodes.OK).json(deviceTypeFeatures)
    } else {
      response.status(StatusCodes.OK).json([])
    }
  }
}

/**
 * HTTP POST: elements to be updated after toggle a feature.
 * Set related warnings if user confirmed the change or change is disabled.
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostCheckConformOnFeatureUpdate(db) {
  return async (request, response) => {
    let { featureData, endpointId, cluster, enabled } = request.body
    const outcome = await configurationOperation.execute(
      db,
      request,
      'feature.preview',
      {
        endpoint: endpointId,
        cluster: cluster || featureData.cluster,
        feature: featureData.code,
        enabled,
        persistWarning: true
      }
    )
    response.status(StatusCodes.OK).json(
      outcome.preview || {
        attributesToUpdate: [],
        commandsToUpdate: [],
        eventsToUpdate: [],
        displayWarning: false,
        warningMessage: '',
        disableChange: false
      }
    )
  }
}

/** Applies a confirmed feature change through the shared operation core. */
function httpPostApplyFeatureUpdate(db) {
  return async (request, response) => {
    const { endpoint, cluster, feature, enabled } = request.body
    const outcome = await configurationOperation.execute(
      db,
      request,
      enabled ? 'feature.enable' : 'feature.disable',
      { endpoint, cluster, feature }
    )
    response.status(StatusCodes.OK).json(outcome)
  }
}

/**
 * HTTP POST: required and unsupported cluster elements based on conformance
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostRequiredElements(db) {
  return async (request, response) => {
    const { endpoint, cluster } = request.body
    const outcome = await configurationOperation.execute(
      db,
      request,
      'feature.requirements',
      { endpoint, cluster }
    )
    response.status(StatusCodes.OK).json(outcome.requirements)
  }
}

/**
 * HTTP GET: feature map attribute in an endpoint type cluster
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetFeatureMapAttribute(db) {
  return async (request, response) => {
    let { attributeId, clusterId, endpointTypeId } = request.query
    let featureMapAttribute = await queryZcl.selectEndpointTypeAttribute(
      db,
      endpointTypeId,
      attributeId,
      clusterId
    )

    response.status(StatusCodes.OK).json(featureMapAttribute)
  }
}

/**
 * HTTP GET: session get notifications
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetSessionNotifications(db) {
  return async (request, response) => {
    let sessionId = request.zapSessionId
    let notifications = await querySessionNotification.getNotification(
      db,
      sessionId
    )
    response.status(StatusCodes.OK).json(notifications)
  }
}

/**
 * HTTP DELETE: session delete notifications
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpDeleteSessionNotification(db) {
  return async (request, response) => {
    let id = request.query.id
    let resp = await querySessionNotification.deleteNotification(db, id)
    response.status(StatusCodes.OK).json(resp)
  }
}

/**
 * HTTP GET: package get notifications
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetPackageNotifications(db) {
  return async (request, response) => {
    let notifications = await queryPackageNotification.getAllNotification(db)
    response.status(StatusCodes.OK).json(notifications)
  }
}

/**
 * HTTP GET: package get notifications
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetPackageNotificationsByPackageId(db) {
  return async (request, response) => {
    let packageId = request.params.packageId
    let notifications =
      await queryPackageNotification.getNotificationByPackageId(db, packageId)
    response.status(StatusCodes.OK).json(notifications)
  }
}

/**
 * HTTP DELETE: session delete notifications
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpDeletePackageNotification(db) {
  return async (request, response) => {
    let id = request.query.id
    let resp = await queryPackageNotification.deleteNotification(db, id)
    response.status(StatusCodes.OK).json(resp)
  }
}

/**
 * HTTP GET: session get unseen session notification count
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetUnseenNotificationCount(db) {
  return async (request, response) => {
    let sessionId = request.zapSessionId
    let notificationCount =
      await querySessionNotification.getUnseenNotificationCount(db, sessionId)
    response.status(StatusCodes.OK).json(notificationCount)
  }
}

/**
 * HTTP GET: session update all session notifications to be SEEN
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetUnseenNotificationAndUpdate(db) {
  return async (request, response) => {
    let unseenIds = request.query.unseenIds
    let resp = await querySessionNotification.markNotificationsAsSeen(
      db,
      unseenIds
    )
    response.status(StatusCodes.OK).json(resp)
  }
}

/**
 * HTTP POST: save session key value
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostSaveSessionKeyValue(db) {
  return async (request, response) => {
    let { key, value } = request.body
    let sessionId = request.zapSessionId
    env.logDebug(`[${sessionId}]: Saving: ${key} => ${value}`)
    await querySession.updateSessionKeyValue(db, sessionId, key, value)
    response.status(StatusCodes.OK).json({
      key: key,
      value: value
    })
  }
}

/**
 * HTTP POST: cluster
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostCluster(db) {
  return async (request, response) => {
    let { id, side, flag, endpointTypeId } = request.body

    try {
      for (const clusterSide of Array.isArray(side) ? side : [side]) {
        await applyOperationToEndpointTypes(
          db,
          request,
          [endpointTypeId],
          flag ? 'cluster.enable' : 'cluster.disable',
          { clusterId: id, side: clusterSide }
        )
      }

      response
        .status(StatusCodes.OK)
        .json({
          endpointTypeId,
          id,
          side,
          flag
        })
        .send()
    } catch (err) {
      response
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message, stack: err.stack })
    }
  }
}

/**
 * Handles a POST request to retrieve forced external storage options.
 *
 * This function is designed to be used as a middleware in an Express.js route. It extracts the session ID from the request,
 * queries the database for package information associated with that session, and then retrieves forced external storage
 * options for the identified package. The results are sent back to the client as a JSON response.
 *
 * @param {Object} db - The database connection object.
 * @returns {Function} An asynchronous function that takes Express.js request and response objects.
 */
function httpPostForcedExternal(db) {
  return async (request, response) => {
    let sessionId = request.zapSessionId
    let packages = await queryPackage.getPackageSessionPackagePairBySessionId(
      db,
      sessionId
    )
    let packageIds = packages.map((item) => item.pkg.id)
    let forcedExternal = await upgrade.getForcedExternalStorage(db, packageIds)
    response.status(StatusCodes.OK).json(forcedExternal)
  }
}

/**
 * HTTP POST attribute update
 *
 * @param {*} db
 * @returns callback for the express uri registration */
function httpPostAttributeUpdate(db) {
  return async (request, response) => {
    let {
      action,
      endpointTypeIdList,
      selectedEndpoint,
      id,
      value,
      listType,
      clusterRef,
      attributeSide,
      reportMinInterval,
      reportMaxInterval,
      reportableChange
    } = request.body
    if (!Array.isArray(endpointTypeIdList) || !endpointTypeIdList.length) {
      return response.status(StatusCodes.BAD_REQUEST).json()
    }

    let changes = {}
    switch (listType) {
      case restApi.updateKey.init:
        changes.initialize = true
        break
      case restApi.updateKey.attributeSelected:
        changes.enabled = value
        break
      case restApi.updateKey.attributeStorage:
        changes.storage = value
        break
      case restApi.updateKey.attributeDefault:
        changes.default = value
        break
      case restApi.updateKey.attributeSingleton:
        changes.singleton = value
        break
      case restApi.updateKey.attributeBounded:
        changes.bounded = value
        break
      case restApi.updateKey.attributeReporting:
        changes.reporting = value
        break
      case restApi.updateKey.attributeReportMin:
        changes.minInterval = value
        break
      case restApi.updateKey.attributeReportMax:
        changes.maxInterval = value
        break
      case restApi.updateKey.attributeReportChange:
        changes.reportableChange = value
        break
      default:
        return response.status(StatusCodes.BAD_REQUEST).json({
          error: `Unknown attribute update key ${listType}`
        })
    }
    if (reportMinInterval != null) changes.minInterval = reportMinInterval
    if (reportMaxInterval != null) changes.maxInterval = reportMaxInterval
    if (reportableChange != null) changes.reportableChange = reportableChange

    await applyOperationToEndpointTypes(
      db,
      request,
      endpointTypeIdList,
      'attribute.set',
      {
        clusterId: clusterRef,
        attributeId: id,
        side: attributeSide,
        ...changes
      }
    )
    // send latest value to frontend to update UI
    let eptAttr = await queryZcl.selectEndpointTypeAttribute(
      db,
      selectedEndpoint,
      id,
      clusterRef
    )

    // only return 1 validation result.
    // error isn't endpoint specific.
    // endpointTypeId doesn't matter since all attributes are the seame.
    let validationData = await validation.validateAttribute(
      db,
      selectedEndpoint,
      id,
      clusterRef,
      request.zapSessionId
    )

    response.status(StatusCodes.OK).json({
      action: action,
      endpointTypeIdList: endpointTypeIdList,
      clusterRef: clusterRef,
      id: id,
      added: value,
      listType: listType,
      validationIssues: validationData,
      endpointTypeAttributeData: eptAttr
    })
  }
}

/**
 * HTTP POST: command update
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostCommandUpdate(db) {
  return async (request, response) => {
    let {
      action,
      endpointTypeIdList,
      id,
      value,
      listType,
      clusterRef,
      commandSide
    } = request.body
    let isIncoming = null

    switch (listType) {
      case 'selectedIn':
        isIncoming = true
        break
      case 'selectedOut':
        isIncoming = false
        break
      default:
        break
    }

    if (isIncoming == null) {
      return response.status(StatusCodes.BAD_REQUEST).json({
        error: `Unknown command update key ${listType}`
      })
    }
    await applyOperationToEndpointTypes(
      db,
      request,
      endpointTypeIdList,
      value ? 'command.enable' : 'command.disable',
      {
        clusterId: clusterRef,
        commandId: id,
        direction: isIncoming ? 'in' : 'out'
      }
    )

    response.status(StatusCodes.OK).json({
      action: action,
      endpointTypeIdList: endpointTypeIdList,
      id: id,
      added: value,
      listType: listType,
      side: commandSide,
      clusterRef: clusterRef
    })
  }
}

/**
 * HTTP POST: command update
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostEventUpdate(db) {
  return async (request, response) => {
    let { action, endpointTypeId, id, value, listType, clusterRef, eventSide } =
      request.body
    await applyOperationToEndpointTypes(
      db,
      request,
      [endpointTypeId],
      value ? 'event.enable' : 'event.disable',
      { clusterId: clusterRef, eventId: id, side: eventSide }
    )

    response.status(StatusCodes.OK).json({
      action: action,
      endpointTypeId: endpointTypeId,
      id: id,
      added: value,
      listType: listType,
      side: eventSide,
      clusterRef: clusterRef
    })
  }
}

/**
 * HTTP GET: initial state
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetInitialState(db) {
  return async (request, response) => {
    let sessionId = request.zapSessionId
    let state = { endpointTypes: [], endpoints: [], sessionKeyValues: [] }

    try {
      let session = await querySession.getSessionFromSessionId(db, sessionId)
      if (session) await asyncValidation.initAsyncValidation(db, session)

      let results = await Promise.all([
        queryEndpointType.selectAllEndpointTypes(db, sessionId),
        queryEndpoint.selectAllEndpoints(db, sessionId),
        querySession.getAllSessionKeyValues(db, sessionId)
      ])

      state.endpointTypes = results[0]
      state.endpoints = results[1]
      state.sessionKeyValues = results[2]
    } catch (error) {
      console.error(error)
    }

    response.status(StatusCodes.OK).json(state)
  }
}

/**
 * HTTP GET: option
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetOption(db) {
  return async (request, response) => {
    const { category } = request.params
    let sessionId = request.zapSessionId
    let packages = await queryPackage.getSessionPackages(db, sessionId)
    let p = packages.map((pkg) =>
      queryPackage.selectAllOptionsValues(db, pkg.packageRef, category)
    )
    let data = await Promise.all(p)
    data = data.flat(1)
    response.status(StatusCodes.OK).json(data)
  }
}

/**
 * HTTP GET: ui_options
 * @param {*} db
 * @returns  UI options from all packages.
 */
function httpGetUiOptions(db) {
  return async (request, response) => {
    let sessionId = request.zapSessionId
    let packages = await queryPackage.getSessionPackages(db, sessionId)
    let zclPackage = await queryPackage.getZclPropertiesPackage(db, packages)
    let data = []
    if (zclPackage != null && zclPackage.length > 0)
      data = await queryPackage.selectAllUiOptions(db, zclPackage[0].id)
    response.status(StatusCodes.OK).json(data)
  }
}

/**
 * HTTP GET: Project packages
 */
function httpGetPackages(db) {
  return async (request, response) => {
    let sessionId = request.zapSessionId
    let packageSessionPackagePairs =
      await queryPackage.getPackageSessionPackagePairBySessionId(db, sessionId)
    response.status(StatusCodes.OK).json(packageSessionPackagePairs)
  }
}

/**
 * HTTP GET: All Packages
 */
function httpGetAllPackages(db) {
  return async (request, response) => {
    let packages = await queryPackage.getAllPackages(db)
    response.status(StatusCodes.OK).json({ packages })
  }
}

/**
 * HTTP POST: Add new project package
 */
function httpPostAddNewPackage(db) {
  return async (req, res) => {
    let sessionId = req.zapSessionId
    let filePath = req.body.path
    try {
      await configurationOperation.execute(db, req, 'package.add', {
        xml: [filePath]
      })
      res.status(StatusCodes.OK).json({
        isValid: true,
        sessionId: sessionId
      })
    } catch (err) {
      res.status(StatusCodes.OK).json({
        isValid: false,
        err: err.message || String(err)
      })
    }
  }
}

/**
 * HTTP POST: Unify all Attributes / Command states if a certain cluster is enabled
 *            on more than one endpoint.
 *
 * 1) In Zigbee world, the Attribute / Command configurations is a global singleton entity.
 *    If one cluster is enabled by more than 1 endpoint, the attribute states (on/off) should be
 *    identical across each endpoint.
 *    To emulate the global singleton entity, this function ensures Attribute changes
 *    are applied to all endpoint specific attribute fields.
 *    When unify event is triggered, this function will align all shared Attribute/Command states
 *    to the first matching entry from beginning of the endpoint list.
 * 2) (native case in ZAP) In Matter, the Attribute configuration are endpoint specific.
 *
 */
function httpPostShareClusterStatesAcrossEndpoints(db) {
  return async (request, response) => {
    let { endpointTypeIdList } = request.body
    let sessionId = request.zapSessionId
    let packageIds = await queryPackage.getSessionPackagesByType(
      db,
      sessionId,
      dbEnum.packageType.zclProperties
    )
    packageIds = packageIds.map(function getId(item) {
      return item.id
    })
    if (!Array.isArray(endpointTypeIdList) || endpointTypeIdList.length < 1) {
      return response.status(StatusCodes.BAD_REQUEST).send()
    }

    let result = await sharedClusterState.shareClusterStatesAcrossEndpoints(
      db,
      endpointTypeIdList,
      packageIds
    )

    return response.status(StatusCodes.OK).json(result)
  }
}

/**
 * Delete the session package.
 *
 * @param {*} db
 * @returns HTTP Response for delete operation
 */
function httpDeleteSessionPackage(db) {
  return async (request, response) => {
    let { sessionRef, packageRef } = request.query
    let sessionPartitionInfo =
      await querySession.selectSessionPartitionInfoFromPackageId(
        db,
        sessionRef,
        packageRef
      )
    let removed = await queryPackage.deleteSessionPackage(
      db,
      sessionPartitionInfo[0].sessionPartitionId,
      packageRef
    )

    response.status(StatusCodes.OK).json({
      successful: removed > 0,
      sessionRef: sessionRef,
      packageRef: packageRef
    })
  }
}

/**
 * Creating a duplicate for endpoint
 *
 * @param {*} db
 * @returns newly created endpoint id
 */
function httpPostDuplicateEndpoint(db) {
  return async (req, res) => {
    let endpointId = req.body.id
    let endpointIdentifier = req.body.endpointIdentifier
    let endpointTypeId = req.body.endpointTypeId
    let outcome = await configurationOperation.execute(
      db,
      req,
      'endpoint.duplicate',
      {
        endpointId: endpointId,
        newEndpoint: endpointIdentifier,
        endpointTypeId: endpointTypeId
      }
    )
    res.status(StatusCodes.OK).json({ id: outcome.id })
  }
}

/**
 * Creating a duplicate for endpoint-type and endpoint-type-attributes
 *
 * @param {*} db
 * @returns newly created endpoint-type id
 */
function httpPostDuplicateEndpointType(db) {
  return async (request, response) => {
    let { endpointTypeId } = request.body
    let outcome = await configurationOperation.execute(
      db,
      request,
      'endpointtype.duplicate',
      { endpointTypeId: endpointTypeId }
    )

    response.status(StatusCodes.OK).json({
      id: outcome.id
    })
  }
}

/**
 * Check if conformance data exists in the database
 *
 * @param {*} db
 * @returns boolean value of data exist or not
 */
function httpGetConformDataExists(db) {
  return async (request, response) => {
    let conformDataExists = await queryFeature.checkIfConformanceDataExist(db)
    response.status(StatusCodes.OK).json(conformDataExists)
  }
}

/**
 * HTTP GET: validate entire session (all endpoints, attribute defaults, conformance).
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetValidateAll(db) {
  return async (request, response) => {
    try {
      const report = await validateAll.validateAll(db, request.zapSessionId, {
        persistConformanceNotifications: false
      })
      response.status(StatusCodes.OK).json(report)
    } catch (err) {
      env.logError(err)
      response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: err.message || String(err)
      })
    }
  }
}

/**
 * Disable obsolete attributes, commands, events, and features enabled by an
 * older configuration, and notify the user about each affected element.
 */
function httpPostDisableObsoleteElements(db) {
  return async (request, response) => {
    const elements = await queryConfig.disableObsoleteElements(
      db,
      request.zapSessionId,
      request.body.endpointTypeId
    )
    response.status(StatusCodes.OK).json(elements)
  }
}

/**
 * duplicate all clusters and attributes of an old endpoint type, using oldEndpointType id and newly created endpointType id
 *
 * @param {*} db
 * @param {*} oldEndpointTypeId
 * @param {*} newEndpointTypeId
 */
async function duplicateEndpointTypeClusters(
  db,
  oldEndpointTypeId,
  newEndpointTypeId
) {
  let oldEndpointTypeClusters = await queryConfig.selectEndpointClusters(
    db,
    oldEndpointTypeId
  )
  oldEndpointTypeClusters.forEach(async (endpointTypeCluster) => {
    let newEndpointTypeClusterId =
      await queryConfig.insertOrReplaceClusterState(
        db,
        newEndpointTypeId,
        endpointTypeCluster.clusterRef,
        endpointTypeCluster.side,
        endpointTypeCluster.enabled
      )
    let oldAttributes =
      await queryAttribute.selectEndpointTypeAttributesByEndpointTypeRefAndClusterRef(
        db,
        oldEndpointTypeId,
        endpointTypeCluster.endpointTypeClusterId
      )
    oldAttributes.forEach(async (attrubute) => {
      await queryAttribute.duplicateEndpointTypeAttribute(
        db,
        newEndpointTypeClusterId,
        attrubute
      )
    })
    let oldCommands =
      await queryCommand.selectEndpointTypeCommandsByEndpointTypeRefAndClusterRef(
        db,
        oldEndpointTypeId,
        endpointTypeCluster.endpointTypeClusterId
      )
    oldCommands.forEach(async (command) => {
      await queryCommand.duplicateEndpointTypeCommand(
        db,
        newEndpointTypeClusterId,
        command
      )
    })
    let oldEvents =
      await queryEvent.selectEndpointTypeEventsByEndpointTypeRefAndClusterRef(
        db,
        oldEndpointTypeId,
        endpointTypeCluster.endpointTypeClusterId
      )
    oldEvents.forEach(async (event) => {
      await queryEvent.duplicateEndpointTypeEvent(
        db,
        newEndpointTypeClusterId,
        event
      )
    })
  })
}

exports.post = [
  {
    uri: restApi.uri.forcedExternal,
    callback: httpPostForcedExternal
  },
  {
    uri: restApi.uri.cluster,
    callback: httpPostCluster
  },
  {
    uri: restApi.uri.attributeUpdate,
    callback: httpPostAttributeUpdate
  },
  {
    uri: restApi.uri.commandUpdate,
    callback: httpPostCommandUpdate
  },
  {
    uri: restApi.uri.eventUpdate,
    callback: httpPostEventUpdate
  },
  {
    uri: restApi.uri.saveSessionKeyValue,
    callback: httpPostSaveSessionKeyValue
  },
  {
    uri: restApi.uri.addNewPackage,
    callback: httpPostAddNewPackage
  },
  {
    uri: restApi.uri.shareClusterStatesAcrossEndpoints,
    callback: httpPostShareClusterStatesAcrossEndpoints
  },
  {
    uri: restApi.uri.duplicateEndpoint,
    callback: httpPostDuplicateEndpoint
  },
  {
    uri: restApi.uri.duplicateEndpointType,
    callback: httpPostDuplicateEndpointType
  },
  {
    uri: restApi.uri.checkConformOnFeatureUpdate,
    callback: httpPostCheckConformOnFeatureUpdate
  },
  {
    uri: restApi.uri.applyFeatureUpdate,
    callback: httpPostApplyFeatureUpdate
  },
  {
    uri: restApi.uri.disableObsoleteElements,
    callback: httpPostDisableObsoleteElements
  },
  {
    uri: restApi.uri.requiredElements,
    callback: httpPostRequiredElements
  }
]

exports.get = [
  {
    uri: restApi.uri.endpointIds,
    callback: httpGetEndpointIds
  },
  {
    uri: restApi.uri.getAllSessionKeyValues,
    callback: httpGetSessionKeyValues
  },
  {
    uri: restApi.uri.deviceTypeFeatures,
    callback: httpGetDeviceTypeFeatures
  },
  {
    uri: restApi.uri.sessionNotification,
    callback: httpGetSessionNotifications
  },
  {
    uri: restApi.uri.packageNotification,
    callback: httpGetPackageNotifications
  },
  {
    uri: restApi.uri.packageNotificationById,
    callback: httpGetPackageNotificationsByPackageId
  },
  {
    uri: restApi.uri.unseenNotificationCount,
    callback: httpGetUnseenNotificationCount
  },
  {
    uri: restApi.uri.updateNotificationToSeen,
    callback: httpGetUnseenNotificationAndUpdate
  },
  {
    uri: restApi.uri.initialState,
    callback: httpGetInitialState
  },
  {
    uri: `${restApi.uri.option}/:category`,
    callback: httpGetOption
  },
  {
    uri: restApi.uri.uiOptions,
    callback: httpGetUiOptions
  },
  {
    uri: restApi.uri.packages,
    callback: httpGetPackages
  },
  {
    uri: restApi.uri.getAllPackages,
    callback: httpGetAllPackages
  },
  {
    uri: restApi.uri.conformDataExists,
    callback: httpGetConformDataExists
  },
  {
    uri: restApi.uri.validate,
    callback: httpGetValidateAll
  },
  {
    uri: restApi.uri.featureMapAttribute,
    callback: httpGetFeatureMapAttribute
  }
]

exports.delete = [
  {
    uri: restApi.uri.sessionPackage,
    callback: httpDeleteSessionPackage
  },
  {
    uri: restApi.uri.deleteSessionNotification,
    callback: httpDeleteSessionNotification
  },
  {
    uri: restApi.uri.deletePackageNotification,
    callback: httpDeletePackageNotification
  }
]

exports.patch = []

//Exports added for testing
exports.httpPostDuplicateEndpointType = httpPostDuplicateEndpointType

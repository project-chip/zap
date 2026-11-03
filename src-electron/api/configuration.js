/**
 * Public application API for reading and changing a loaded ZAP configuration.
 * HTTP handlers, the CLI, and post-import scripts adapt their inputs and
 * outputs here instead of dispatching operations independently.
 */

const operations = require('../operations.js')
const operationRunner = require('../util/operation-runner.js')
const queryEndpoint = require('../db/query-endpoint.js')
const queryEndpointType = require('../db/query-endpoint-type.js')
const queryConfig = require('../db/query-config.js')
const queryFeature = require('../db/query-feature.js')
const queryPackage = require('../db/query-package.js')
const querySession = require('../db/query-session.js')
const queryZcl = require('../db/query-zcl.js')
const sharedClusterState = require('../util/shared-cluster-state.js')
const validation = require('../validation/validation.js')
const validateAll = require('../validation/validate-all.js')
const matterSdk = require('../sdk/matter.js')

/** Creates the context passed to configuration operations. */
function createContext(db, sessionId, options = {}) {
  return {
    db: db,
    sessionId: sessionId,
    category: options.category == null ? null : options.category,
    zapFile: options.zapFile,
    unresolvedCustomXml: options.unresolvedCustomXml || [],
    studioIntegration: options.studioIntegration === true,
    logger: options.logger || (() => {})
  }
}

/** Runs an operation in an existing configuration context. */
function execute(ctx, name, params, onSharedState) {
  return operationRunner.execute(ctx, name, params, onSharedState)
}

/** Runs an operation for a loaded GUI or CLI session. */
function executeForSession(db, sessionId, name, params, options = {}) {
  return execute(createContext(db, sessionId, options), name, params)
}

/** Adapts an HTTP request to the session-oriented configuration API. */
function executeRequest(db, request, name, params, options = {}) {
  return executeForSession(db, request.zapSessionId, name, params, options)
}

/** Creates and reconciles the standard root-node endpoint. */
function createRootNode(ctx, onSharedState) {
  return operationRunner.createRootNode(ctx, onSharedState)
}

/** Reads endpoints from a session, optionally narrowed to a category. */
function readEndpointsForSession(db, sessionId, category = null) {
  return operations.readEndpoints(createContext(db, sessionId), category)
}

/** Finds one endpoint by its database row ID. */
async function readEndpointById(db, sessionId, endpointId) {
  const endpoints = await readEndpointsForSession(db, sessionId)
  return endpoints.find(
    (endpoint) => Number(endpoint.id) === Number(endpointId)
  )
}

/** Reads the configured endpoint identifiers for a session. */
async function readEndpointIds(db, sessionId) {
  const endpoints = await readEndpointsForSession(db, sessionId)
  return endpoints.map((endpoint) => endpoint.endpointIdentifier)
}

/** Resolves a parent endpoint identifier to its database reference. */
function readParentEndpointRef(db, sessionId, endpointIdentifier) {
  return queryEndpoint.getParentEndpointRef(db, endpointIdentifier, sessionId)
}

/** Reads the root-node composition for a loaded session. */
async function readInitialComposition(db, sessionId) {
  const packages = await queryPackage.getPackageSessionPackagePairBySessionId(
    db,
    sessionId
  )
  const packageIds = packages.map((item) => item.pkg.id)
  const rootNodes = await queryEndpoint.getRootNode(db, packageIds)
  return rootNodes[0]
}

/** Loads the endpoint and session state used to initialize the UI. */
async function readInitialState(db, sessionId) {
  const session = await querySession.getSessionFromSessionId(db, sessionId)
  if (session) {
    await require('../validation/async-validation.js').initAsyncValidation(
      db,
      session
    )
  }
  const [endpointTypes, endpoints, sessionKeyValues] = await Promise.all([
    queryEndpointType.selectAllEndpointTypes(db, sessionId),
    readEndpointsForSession(db, sessionId),
    querySession.getAllSessionKeyValues(db, sessionId)
  ])
  return {
    endpointTypes: endpointTypes,
    endpoints: endpoints,
    sessionKeyValues: sessionKeyValues
  }
}

/** Reads key-value options attached to a session. */
function readSessionKeyValues(db, sessionId) {
  return querySession.getAllSessionKeyValues(db, sessionId)
}

/** Reads packages of one type attached to a session. */
function readSessionPackagesByType(db, sessionId, packageType) {
  return queryPackage.getSessionPackagesByType(db, sessionId, packageType)
}

/** Reads package option values for one session category. */
async function readOptions(db, sessionId, category) {
  const packages = await queryPackage.getSessionPackages(db, sessionId)
  const values = await Promise.all(
    packages.map((pkg) =>
      queryPackage.selectAllOptionsValues(db, pkg.packageRef, category)
    )
  )
  return values.flat(1)
}

/** Reads user-interface options from the session's ZCL package. */
async function readUiOptions(db, sessionId) {
  const packages = await queryPackage.getSessionPackages(db, sessionId)
  const zclPackages = await queryPackage.getZclPropertiesPackage(db, packages)
  if (zclPackages == null || zclPackages.length === 0) return []
  return queryPackage.selectAllUiOptions(db, zclPackages[0].id)
}

/** Reads package metadata attached to a session. */
function readPackageSessionPairs(db, sessionId) {
  return queryPackage.getPackageSessionPackagePairBySessionId(db, sessionId)
}

/** Reads all packages available to a session. */
function readAllPackages(db) {
  return queryPackage.getAllPackages(db)
}

/** Reads storage requirements imposed by the session's data model. */
async function readForcedExternalStorage(db, sessionId) {
  const packages = await readPackageSessionPairs(db, sessionId)
  return matterSdk.getForcedExternalStorage(
    db,
    packages.map((item) => item.pkg.id)
  )
}

/** Stores one session key-value option. */
function saveSessionValue(db, sessionId, key, value) {
  return querySession.updateSessionKeyValue(db, sessionId, key, value)
}

/** Removes a package from a session and returns the deleted-row count. */
async function deleteSessionPackage(db, sessionId, packageRef) {
  const partitions = await querySession.selectSessionPartitionInfoFromPackageId(
    db,
    sessionId,
    packageRef
  )
  if (partitions.length === 0) return 0
  return queryPackage.deleteSessionPackage(
    db,
    partitions[0].sessionPartitionId,
    packageRef
  )
}

/** Reconciles shared cluster state for the selected endpoint types. */
function shareClusterStatesAcrossEndpoints(db, endpointTypeIds, packageIds) {
  return sharedClusterState.shareClusterStatesAcrossEndpoints(
    db,
    endpointTypeIds,
    packageIds
  )
}

/** Disables obsolete elements on an endpoint type. */
function disableObsoleteElements(db, sessionId, endpointTypeId) {
  return queryConfig.disableObsoleteElements(db, sessionId, endpointTypeId)
}

/** Reports whether the loaded data model has conformance metadata. */
function hasConformanceData(db) {
  return queryFeature.checkIfConformanceDataExist(db)
}

/** Reads feature requirements attached to the selected device types. */
function readDeviceTypeFeatures(db, deviceTypeRefs, endpointTypeRef) {
  return queryFeature.getFeaturesByDeviceTypeRefs(
    db,
    deviceTypeRefs,
    endpointTypeRef
  )
}

/** Reads an attribute state from an endpoint type and cluster. */
function readEndpointTypeAttribute(db, endpointTypeId, attributeId, clusterId) {
  return queryZcl.selectEndpointTypeAttribute(
    db,
    endpointTypeId,
    attributeId,
    clusterId
  )
}

/** Validates an endpoint after a configuration edit. */
function validateEndpoint(db, endpointId) {
  return validation.validateEndpoint(db, endpointId)
}

/** Validates an attribute after a configuration edit. */
function validateAttribute(db, endpointId, attributeId, clusterId, sessionId) {
  return validation.validateAttribute(
    db,
    endpointId,
    attributeId,
    clusterId,
    sessionId
  )
}

/** Validates all endpoints and elements in a loaded session. */
function validateSession(db, sessionId, options = {}) {
  return validateAll.validateAll(db, sessionId, options)
}

exports.createContext = createContext
exports.execute = execute
exports.executeForSession = executeForSession
exports.executeRequest = executeRequest
exports.createRootNode = createRootNode
exports.readEndpointsForSession = readEndpointsForSession
exports.readEndpointById = readEndpointById
exports.readEndpointIds = readEndpointIds
exports.readParentEndpointRef = readParentEndpointRef
exports.readInitialComposition = readInitialComposition
exports.readInitialState = readInitialState
exports.readSessionKeyValues = readSessionKeyValues
exports.readSessionPackagesByType = readSessionPackagesByType
exports.readOptions = readOptions
exports.readUiOptions = readUiOptions
exports.readPackageSessionPairs = readPackageSessionPairs
exports.readAllPackages = readAllPackages
exports.readForcedExternalStorage = readForcedExternalStorage
exports.saveSessionValue = saveSessionValue
exports.deleteSessionPackage = deleteSessionPackage
exports.shareClusterStatesAcrossEndpoints = shareClusterStatesAcrossEndpoints
exports.disableObsoleteElements = disableObsoleteElements
exports.hasConformanceData = hasConformanceData
exports.readDeviceTypeFeatures = readDeviceTypeFeatures
exports.readEndpointTypeAttribute = readEndpointTypeAttribute
exports.validateEndpoint = validateEndpoint
exports.validateAttribute = validateAttribute
exports.validateSession = validateSession
exports.operationNames = operations.operationNames
exports.readEndpoints = operations.readEndpoints
exports.readClusters = operations.readClusters
exports.readAttributes = operations.readAttributes
exports.readCommands = operations.readCommands
exports.readAvailableClusters = operations.readAvailableClusters
exports.readFeatures = operations.readFeatures
exports.findCluster = operations.findCluster
exports.findAttribute = operations.findAttribute
exports.findCommand = operations.findCommand
exports.findEvent = operations.findEvent

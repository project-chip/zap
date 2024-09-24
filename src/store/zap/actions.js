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

import { axiosRequests } from '../../boot/axios'
import * as Util from '../../util/util.js'
import restApi from '../../../src-shared/rest-api.js'
import dbEnum from '../../../src-shared/db-enum.js'

const http = require('http-status-codes')

/**
 * Show or hide dev tools in ZAP.
 * @param {*} context
 */
export function updateShowDevTools(context) {
  context.commit('updateShowDevTools')
}

/**
 * Update exceptions in ZAP.
 * @param {*} context
 * @param {*} data
 */
export function updateExceptions(context, data) {
  context.commit('updateExceptions', data)
  context.commit('toggleShowExceptionIcon', true)
}

/**
 * Update the information text for ZAP.
 * @param {*} context
 * @param {*} text
 */
export function updateInformationText(context, text) {
  axiosRequests
    .$serverPost(restApi.uri.saveSessionKeyValue, {
      key: dbEnum.sessionKey.informationText,
      value: text
    })
    .then((response) => {
      context.commit('updateInformationText', text)
    })
}

/**
 * Update the clusters in ZAP UI.
 * @param {*} context
 */
export async function updateClusters(context) {
  let deviceTypes = await axiosRequests.$serverGet(
    restApi.uri.zclDeviceType + 'all'
  )
  axiosRequests.$serverGet(restApi.uri.zclCluster + 'all').then((response) => {
    response.data.deviceTypes = deviceTypes
    context.commit('updateClusters', response.data)
  })
}

/**
 * Update the atomic data typess.
 * @param {*} context
 */
export function updateAtomics(context) {
  axiosRequests.$serverGet(restApi.uri.zclAtomics + 'all').then((response) => {
    context.commit('updateAtomics', response.data)
  })
}

/**
 * Update the selected cluster in ZAP UI.
 * @param {*} context
 * @param {*} cluster
 */
export async function updateSelectedCluster(context, cluster) {
  let res = await axiosRequests.$serverGet(
    restApi.uri.zclCluster + `${cluster.id}`
  )
  context.commit('updateSelectedCluster', [cluster])
  updateAttributes(context, res.data.attributeData || [])
  updateCommands(context, res.data.commandData || [])
  updateEvents(context, res.data.eventData || [])
}

/**
 * Update the attributes for ZAP UI.
 * @param {*} context
 * @param {*} attributes
 */
export function updateAttributes(context, attributes) {
  context.commit('updateAttributes', attributes)
}

/**
 * Update the commands for ZAP UI.
 * @param {*} context
 * @param {*} commands
 */
export function updateCommands(context, commands) {
  context.commit('updateCommands', commands)
}

/**
 * Update the events for ZAP UI.
 * @param {*} context
 * @param {*} events
 */
export function updateEvents(context, events) {
  context.commit('updateEvents', events)
}

/**
 * Update the device types for ZAP UI.
 * @param {*} context
 */
export function updateZclDeviceTypes(context) {
  axiosRequests
    .$serverGet(restApi.uri.zclDeviceType + 'all')
    .then((response) => {
      let deviceTypes = response.data || []
      let deviceTypeObjects = {}
      deviceTypes.forEach((deviceType) => {
        deviceTypeObjects[deviceType.id] = {
          code: deviceType.code,
          profileId: deviceType.profileId,
          label: deviceType.label,
          description: deviceType.caption,
          domain: deviceType.domain,
          packageRef: deviceType.packageRef
        }
      })
      context.commit('updateZclDeviceTypes', deviceTypeObjects)
    })
}

/**
 * Update endpoint configuration for ZAP UI.
 * @param {*} context
 * @param {*} endpointConfigs
 */
export function updateEndpointConfigs(context, endpointConfigs) {
  context.commit('updateEndpointConfigs', endpointConfigs)
}

/**
 * * Update selected ZAP configuration.
 * @param {*} context
 * @param {*} configurationName
 */
export function selectConfiguration(context, configurationName) {
  context.commit('selectConfiguration', configurationName)
}

/**
 * Initialize the selected ZAP attribute.
 * @param {*} context
 * @param {*} selectionContext
 * @returns
 */
export function initSelectedAttribute(context, selectionContext) {
  return axiosRequests
    .$serverPost(restApi.uri.attributeUpdate, selectionContext)
    .then((res) => {
      let arg = res.data
      setAttributeState(context, arg.endpointTypeAttributeData)
    })
}

/**
 * Update the selected attribute in ZAP UI.
 * @param {*} context
 * @param {*} selectionContext
 */
export function updateSelectedAttribute(context, selectionContext) {
  axiosRequests
    .$serverPost(restApi.uri.attributeUpdate, selectionContext)
    .then((res) => {
      let arg = res.data
      setAttributeState(context, arg.endpointTypeAttributeData)
      if (arg.action === 'boolean') {
        context.commit('updateInclusionList', {
          id: Util.cantorPair(arg.id, arg.clusterRef),
          added: arg.added,
          listType: arg.listType,
          view: 'attributeView'
        })
      } else if (arg.action === 'text') {
        let isNull = false
        if (arg.added == null) {
          arg.added = 'NULL'
          isNull = true
        }
        context.commit('updateAttributeDefaults', {
          id: Util.cantorPair(arg.id, arg.clusterRef),
          newDefaultValue: arg.added,
          listType: arg.listType,
          defaultValueValidationIssues: arg.validationIssues.defaultValue,
          isNull
        })
      }
    })
}

/**
 * Update the selected commands in the ZAP UI.
 * @param {*} context
 * @param {*} selectionContext
 */
export async function updateSelectedCommands(context, selectionContext) {
  let res = await axiosRequests.$serverPost(
    restApi.uri.commandUpdate,
    selectionContext
  )
  let arg = res.data
  if (arg.action === 'boolean') {
    context.commit('updateInclusionList', {
      id: Util.cantorPair(arg.id, arg.clusterRef),
      added: arg.added,
      listType: arg.listType,
      view: 'commandView'
    })
  }
}

/**
 * Update the selected events in the ZAP UI.
 * @param {*} context
 * @param {*} selectionContext
 */
export function updateSelectedEvents(context, selectionContext) {
  axiosRequests
    .$serverPost(restApi.uri.eventUpdate, selectionContext)
    .then((res) => {
      let arg = res.data
      if (arg.action === 'boolean') {
        context.commit('updateInclusionList', {
          id: Util.cantorPair(arg.id, arg.clusterRef),
          added: arg.added,
          listType: arg.listType,
          view: 'eventView'
        })
      }
    })
}

/**
 * Update the selected UC component in Simplicity Studio.
 * @param {*} context
 * @param {*} payload
 * @returns
 */
export function updateSelectedComponent(context, payload) {
  let op = payload.added ? restApi.uc.componentAdd : restApi.uc.componentRemove
  return axiosRequests.$serverPost(op, payload)
}

/**
 * Update the selected server side clusters.
 * @param {*} context
 * @param {*} selectionContext
 * @returns
 */
export function updateSelectedServers(context, selectionContext) {
  return axiosRequests
    .$serverPost(restApi.uri.cluster, {
      endpointTypeId: selectionContext.endpointTypeId,
      id: selectionContext.id,
      side: 'server',
      flag: selectionContext.added
    })
    .then(() => {
      context.commit('updateInclusionList', selectionContext)
    })
}

/**
 * * Update the selected client side clusters.
 * @param {*} context
 * @param {*} selectionContext
 * @returns
 */
export function updateSelectedClients(context, selectionContext) {
  return axiosRequests
    .$serverPost(restApi.uri.cluster, {
      endpointTypeId: selectionContext.endpointTypeId,
      id: selectionContext.id,
      side: 'client',
      flag: selectionContext.added
    })
    .then(() => {
      context.commit('updateInclusionList', selectionContext)
    })
}

/**
 * Get the project packages.
 * @param {*} context
 * @returns packages for the project
 */
export function getProjectPackages(context) {
  return axiosRequests.$serverGet(restApi.uri.packages).then((res) => {
    let data = res.data
    context.commit('updateProjectPackages', data)
  })
}

/**
 * Initialize the default endpoints.
 * @param {*} context
 * @param {*} defaultEndpoints
 */
export function initializeDefaultEndpoints(context, defaultEndpoints) {
  context.commit('initializeDefaultEndpoints', defaultEndpoints)
}

/**
 * Initialize the default endpoint types.
 * @param {*} context
 * @param {*} defaultEndpointsTypes
 */
export function initializeDefaultEndpointsTypes(
  context,
  defaultEndpointsTypes
) {
  context.commit('initializeDefaultEndpointsTypes', defaultEndpointsTypes)
}

/**
 * Update the selected endpoint in ZAP UI.
 * @param {*} context
 * @param {*} endpoint
 */
export function updateSelectedEndpoint(context, endpoint) {
  context.commit('updateSelectedEndpoint', endpoint)
}

/**
 * * Update the selected endpoint type in ZAP UI.
 * @param {*} context
 * @param {*} endpointType
 */
export function updateEndpointType(context, endpointType) {
  axiosRequests
    .$serverPatch(restApi.uri.endpointType, endpointType)
    .then((res) => {
      let arg = res.data
      // Map the changes corresponding to device type ref, device type version
      // and device type identifier for the front and back end.
      let changes = arg.changes
      let deviceTypeRefTmp = changes[0].value
      let deviceVersionTmp = changes[1].value
      let deviceIdentifierTmp = changes[2].value

      setDeviceTypeReference(context, {
        endpointTypeId: arg.endpointTypeId,
        deviceTypeRef: deviceTypeRefTmp,
        deviceVersion: deviceVersionTmp,
        deviceIdentifier: deviceIdentifierTmp
      })
    })
}

/**
 * Link endpoint types and deviec types.
 * @param {*} context
 * @param {*} endpointTypeIdDeviceTypeRefPair
 */
export function setDeviceTypeReference(
  context,
  endpointTypeIdDeviceTypeRefPair
) {
  axiosRequests
    .$serverGet(
      `${restApi.uri.deviceTypeClusters}${endpointTypeIdDeviceTypeRefPair.deviceTypeRef}`
    )
    .then((res) => {
      setRecommendedClusterList(context, res.data)
    })
  axiosRequests
    .$serverGet(
      `${restApi.uri.deviceTypeAttributes}${endpointTypeIdDeviceTypeRefPair.deviceTypeRef}`
    )
    .then((res) => {
      setRequiredAttributes(context, res.data)
    })
  axiosRequests
    .$serverGet(
      `${restApi.uri.deviceTypeCommands}${endpointTypeIdDeviceTypeRefPair.deviceTypeRef}`
    )
    .then((res) => {
      setRequiredCommands(context, res.data)
    })

  axiosRequests
    .$serverGet(
      `${restApi.uri.endpointTypeClusters}${endpointTypeIdDeviceTypeRefPair.endpointTypeId}`
    )
    .then((res) => {
      setClusterList(context, res.data)
    })
  axiosRequests
    .$serverGet(
      `${restApi.uri.endpointTypeAttributes}${endpointTypeIdDeviceTypeRefPair.endpointTypeId}`
    )
    .then((res) => {
      setAttributeStateLists(context, res.data || [])
    })
  axiosRequests
    .$serverGet(
      `${restApi.uri.endpointTypeCommands}${endpointTypeIdDeviceTypeRefPair.endpointTypeId}`
    )
    .then((res) => {
      setCommandStateLists(context, res.data || [])
    })
  axiosRequests
    .$serverGet(
      `${restApi.uri.endpointTypeEvents}${endpointTypeIdDeviceTypeRefPair.endpointTypeId}`
    )
    .then((res) => {
      setEventStateLists(context, res.data || [])
    })

  context.commit('setDeviceTypeReference', endpointTypeIdDeviceTypeRefPair)
}

/**
 * Update Endpoint in ZAP UI.
 * @param {*} context
 * @param {*} endpoint
 */
export function updateEndpoint(context, endpoint) {
  // TODO this uri should handle deviceIdentifier as array
  axiosRequests.$serverPatch(restApi.uri.endpoint, endpoint).then((res) => {
    let arg = res.data
    context.commit('updateEndpoint', {
      id: arg.endpointId,
      parentEndpointIdentifier: arg.parentEndpointIdentifier,
      changes: arg.changes,
      endpointIdValidationIssues: arg.validationIssues.endpointId,
      networkIdValidationIssues: arg.validationIssues.networkId
    })
  })
}
/**
 * Loads the composition by fetching the root node data and adding endpoint types and endpoints.
 *
 * @param {Object} context - The Vuex context object.
 * @returns {Promise<void>} - A promise that resolves when the composition is loaded.
 */
export async function loadComposition(context) {
  let res = await axiosRequests.$serverGet(restApi.uri.loadComposition)

  // Check if the response data is empty or undefined
  if (!res.data) {
    return null // Return null or any appropriate value indicating no endpoints were added
  }

  let dataArray = {
    deviceTypeRef: [res.data.deviceTypeRef],
    deviceIdentifier: res.data.code,
    deviceVersion: dbEnum.rootNode.deviceVersion,
    name: res.data.name
  }

  let endpointTypeData = await addEndpointType(context, dataArray) // Call addEndpointType with the array containing deviceTypeRef

  let endpoint = await addEndpoint(context, {
    endpointId: dbEnum.rootNode.endpointId,
    parentEndpointIdentifier: dbEnum.rootNode.parentEndpointIdentifier,
    endpointType: endpointTypeData.id
  }) // Call addEndpoint with the data returned from addEndpointType

  return endpoint
}

/**
 * Add endpoint in ZAP UI.
 * @param {*} context
 * @param {*} newEndpointContext
 * @returns endpoint data
 */
export function addEndpoint(context, newEndpointContext) {
  return axiosRequests
    .$serverPost(restApi.uri.endpoint, newEndpointContext)
    .then((res) => {
      let arg = res.data
      context.commit('addEndpoint', {
        id: arg.id,
        endpointId: arg.endpointId,
        parentEndpointIdentifier: arg.parentEndpointIdentifier,
        endpointTypeRef: arg.endpointType,
        networkId: arg.networkId,
        profileId: arg.profileId,
        endpointIdValidationIssues: arg.validationIssues.endpointId,
        networkIdValidationIssues: arg.validationIssues.networkId
      })
      return arg
    })
}

/**
 * Get endpoint ids.
 * @returns endpoints ids
 */
export async function getEndpointIds() {
  return await axiosRequests.$serverGet(restApi.uri.endpointIds)
}

/**
 * Add endpoint type for ZAP UI.
 * @param {*} context
 * @param {*} endpointTypeData
 * @returns endpointType data
 */
export function addEndpointType(context, endpointTypeData) {
  return axiosRequests
    .$serverPost(restApi.uri.endpointType, endpointTypeData)
    .then((res) => {
      context.commit('addEndpointType', {
        id: res.data.id,
        name: res.data.name,
        deviceTypeRef: res.data.deviceTypeRef,
        deviceIdentifier: res.data.deviceTypeIdentifier,
        deviceVersion: res.data.deviceTypeVersion
      })
      return res.data
    })
    .catch((e) => console.log('Error in addEndpointType: ' + e.message))
}

/**
 * Duplicate endpoint type.
 * @param {*} context
 * @param {*} param1
 * @returns endpoint type data
 */
export function duplicateEndpointType(context, { endpointTypeId }) {
  return axiosRequests
    .$serverPost(restApi.uri.duplicateEndpointType, {
      endpointTypeId: endpointTypeId
    })
    .then((res) => {
      return res.data
    })
}

/**
 * Delete endpoint from ZAP UI.
 * @param {*} context
 * @param {*} endpointId
 */
export function deleteEndpoint(context, endpointId) {
  axiosRequests
    .$serverDelete(restApi.uri.endpoint, { params: { id: endpointId } })
    .then((response) => {
      context.commit('deleteEndpoint', { id: response.data.id })
    })
}

/**
 * Duplicate endpoint in ZAP UI.
 * @param {*} context
 * @param {*} param1
 * @returns endpoint details
 */
export function duplicateEndpoint(
  context,
  { endpointId, endpointIdentifier, endpointTypeId }
) {
  return axiosRequests
    .$serverPost(restApi.uri.duplicateEndpoint, {
      id: endpointId,
      endpointIdentifier: endpointIdentifier,
      endpointTypeId: endpointTypeId
    })
    .then((response) => {
      return response
    })
}

/**
 * Delete endpoint type from ZAP UI.
 * @param {*} context
 * @param {*} endpointTypeId
 */
export function deleteEndpointType(context, endpointTypeId) {
  axiosRequests
    .$serverDelete(restApi.uri.endpointType, { params: { id: endpointTypeId } })
    .then((response) => {
      if (response.data.successful) {
        context.commit('removeEndpointType', {
          id: response.data.id
        })
      }
    })
}

/**
 * Refresh the endpoint type cluster details based on endpoint type selected in ZAP UI.
 * @param {*} context
 * @param {*} endpointType
 */
export function refreshEndpointTypeCluster(context, endpointType) {
  axiosRequests
    .$serverGet(`${restApi.uri.endpointTypeAttributes}${endpointType}`)
    .then((res) => {
      setAttributeStateLists(context, res.data || [])
    })
  axiosRequests
    .$serverGet(`${restApi.uri.endpointTypeCommands}${endpointType}`)
    .then((res) => {
      setCommandStateLists(context, res.data || [])
    })
  axiosRequests
    .$serverGet(`${restApi.uri.endpointTypeEvents}${endpointType}`)
    .then((res) => {
      setEventStateLists(context, res.data || [])
    })
}

/**
 * Get endpoint type cluster information for endpoint type.
 * @param {*} context
 * @param {*} endpointTypeId
 * @returns endpoint type cluster information for endpoint type
 */
export async function endpointTypeClustersInfo(context, endpointTypeId) {
  return axiosRequests.$serverGet(
    `${restApi.uri.endpointTypeClusters}${endpointTypeId}`
  )
}

/**
 * Update selected endpoint type details in ZAP UI.
 * @param {*} context
 * @param {*} endpointTypeDeviceTypeRefPair
 * @returns Resolved promises
 */
export async function updateSelectedEndpointType(
  context,
  endpointTypeDeviceTypeRefPair
) {
  const p = []

  if (endpointTypeDeviceTypeRefPair != null) {
    p.push(
      axiosRequests
        .$serverGet(
          `${restApi.uri.endpointTypeClusters}${endpointTypeDeviceTypeRefPair.endpointType}`
        )
        .then((res) => {
          setClusterList(context, res.data)
        })
    )
    p.push(
      axiosRequests
        .$serverGet(
          `${restApi.uri.endpointTypeAttributes}${endpointTypeDeviceTypeRefPair.endpointType}`
        )
        .then((res) => {
          setAttributeStateLists(context, res.data || [])
        })
    )
    p.push(
      axiosRequests
        .$serverGet(
          `${restApi.uri.endpointTypeCommands}${endpointTypeDeviceTypeRefPair.endpointType}`
        )
        .then((res) => {
          setCommandStateLists(context, res.data || [])
        })
    )
    p.push(
      axiosRequests
        .$serverGet(
          `${restApi.uri.endpointTypeEvents}${endpointTypeDeviceTypeRefPair.endpointType}`
        )
        .then((res) => {
          setEventStateLists(context, res.data || [])
        })
    )

    p.push(
      axiosRequests
        .$serverGet(
          `${restApi.uri.deviceTypeClusters}${endpointTypeDeviceTypeRefPair.deviceTypeRef}`
        )
        .then((res) => {
          setRecommendedClusterList(context, res.data)
        })
    )
    p.push(
      axiosRequests
        .$serverGet(
          `${restApi.uri.deviceTypeAttributes}${endpointTypeDeviceTypeRefPair.deviceTypeRef}`
        )
        .then((res) => {
          setRequiredAttributes(context, res.data)
        })
    )
    p.push(
      axiosRequests
        .$serverGet(
          `${restApi.uri.deviceTypeCommands}${endpointTypeDeviceTypeRefPair.deviceTypeRef}`
        )
        .then((res) => {
          setRequiredCommands(context, res.data)
        })
    )

    context.commit(
      'updateSelectedEndpointType',
      endpointTypeDeviceTypeRefPair.endpointType
    )
  }
  return await Promise.all(p)
}

/**
 * set client and server cluster lists.
 * @param {*} context
 * @param {*} selectionContext
 */
export function setClusterList(context, selectionContext) {
  let enabledClients = []
  let enabledServers = []
  selectionContext.forEach((record) => {
    if (record.enabled) {
      if (record.side === 'client') {
        enabledClients.push(record.clusterRef)
      } else {
        enabledServers.push(record.clusterRef)
      }
    }
  })
  context.commit(`setClusterList`, {
    clients: enabledClients,
    servers: enabledServers
  })
}

/**
 * Set attribute state details for the endpoint type attribute.
 * @param {*} context
 * @param {*} selectionContext
 */
export function setAttributeState(context, selectionContext) {
  let resolvedReference = Util.cantorPair(
    selectionContext.attributeRef,
    selectionContext.clusterRef
  )
  context.commit('setEndpointTypeAttribute', {
    id: resolvedReference,
    included: selectionContext.included,
    singleton: selectionContext.singleton,
    bounded: selectionContext.bounded,
    includedReportable: selectionContext.includedReportable,
    defaultValue: selectionContext.defaultValue,
    storageOption: selectionContext.storageOption,
    minInterval: selectionContext.minInterval,
    maxInterval: selectionContext.maxInterval,
    reportableChange: selectionContext.reportableChange
  })
}

/**
 * set attribute list for the state.
 * @param {*} context
 * @param {*} selectionContext
 */
export function setAttributeStateLists(context, selectionContext) {
  let includedAttributes = []
  let singletonAttributes = []
  let boundedAttributes = []
  let defaultValue = {}
  let storageOption = {}

  let includedReportableAttributes = []
  let min = {}
  let max = {}
  let change = {}

  selectionContext.forEach((record) => {
    let resolvedReference = Util.cantorPair(
      record.attributeRef,
      record.clusterRef
    )
    if (record.included) includedAttributes.push(resolvedReference)
    if (record.singleton) singletonAttributes.push(resolvedReference)
    if (record.bounded) boundedAttributes.push(resolvedReference)
    if (record.includedReportable)
      includedReportableAttributes.push(resolvedReference)
    defaultValue[resolvedReference] = record.defaultValue
    storageOption[resolvedReference] = record.storageOption
    min[resolvedReference] = record.minInterval
    max[resolvedReference] = record.maxInterval
    change[resolvedReference] = record.reportableChange
  })
  context.commit(`setAttributeLists`, {
    included: includedAttributes,
    singleton: singletonAttributes,
    bounded: boundedAttributes,
    defaultValue: defaultValue,
    storageOption: storageOption,
    includedReportable: includedReportableAttributes,
    minInterval: min,
    maxInterval: max,
    reportableChange: change
  })
}

/**
 * set events list for the state.
 * @param {*} context
 * @param {*} selectionContext
 */
export function setEventStateLists(context, selectionContext) {
  let selected = []
  selectionContext.forEach((record) => {
    if (record.included == 1) {
      let ref = Util.cantorPair(record.eventRef, record.clusterRef)
      selected.push(ref)
    }
  })
  context.commit('setEventLists', selected)
}

/**
 * Set commands list for the state.
 * @param {*} context
 * @param {*} selectionContext
 */
export function setCommandStateLists(context, selectionContext) {
  let incoming = []
  let outgoing = []
  selectionContext.forEach((record) => {
    let resolvedReference = Util.cantorPair(
      record.commandRef,
      record.clusterRef
    )
    if (record.incoming) incoming.push(resolvedReference)
    if (record.outgoing) outgoing.push(resolvedReference)
  })
  context.commit(`setCommandLists`, {
    incoming: incoming,
    outgoing: outgoing
  })
}

/**
 * Set recommended cluster list for the endpoint.
 * @param {*} context
 * @param {*} data
 */
export function setRecommendedClusterList(context, data) {
  // TODO (?) This does not handle/highlight prohibited clusters. For now we just keep it in here
  let recommendedClients = []
  let recommendedServers = []

  data.forEach((record) => {
    if (record.includeClient) recommendedClients.push(record.clusterRef)
    if (record.includeServer) recommendedServers.push(record.clusterRef)
  })
  context.commit(`setRecommendedClusterList`, {
    recommendedClients: recommendedClients,
    recommendedServers: recommendedServers
  })
}

/**
 * Set required attributes for the cluster.
 * @param {*} context
 * @param {*} data
 */
export function setRequiredAttributes(context, data) {
  let requiredAttributes = []
  data.forEach((record) => {
    if (record.attributeRef) requiredAttributes.push(record.attributeRef)
  })
  context.commit(`setRequiredAttributesList`, {
    requiredAttributes: requiredAttributes
  })
}

/**
 * Set required commands for the cluster.
 * @param {*} context
 * @param {*} data
 */
export function setRequiredCommands(context, data) {
  let requiredCommands = []
  data.forEach((record) => {
    if (record.commandRef) requiredCommands.push(record.commandRef)
  })
  context.commit(`setRequiredCommandsList`, {
    requiredCommands: requiredCommands
  })
}

/**
 * Set left drawer in State.
 * @param {*} context
 * @param {*} data
 */
export function setLeftDrawerState(context, data) {
  context.commit('setLeftDrawerState', data)
}

/**
 * Set minimization state in State.
 * @param {*} context
 * @param {*} data
 */
export function setMiniState(context, data) {
  context.commit('setMiniState', data)
}

/**
 * This action updates the device type features after a new endpoint is selected.
 *
 * @param {*} context
 * @param {*} deviceTypeRefs
 */
export async function updateSelectedDeviceTypeFeatures(
  context,
  deviceTypeRefs
) {
  let config = { params: { deviceTypeRefs: deviceTypeRefs } }
  axiosRequests
    .$serverGet(restApi.uri.deviceTypeFeatures, config)
    .then((resp) => {
      context.commit('updateDeviceTypeFeatures', resp.data)
    })
}

/**
 * This action loads the initial data from the database.
 *
 * @export
 * @param {*} context
 * @param {*} data
 */
export function loadInitialData(context, data) {
  axiosRequests.$serverGet(restApi.uri.initialState).then((response) => {
    let initialState = response.data
    if ('endpoints' in initialState) {
      context.commit('initializeEndpoints', initialState.endpoints)
    }

    if ('endpointTypes' in initialState) {
      context.commit('initializeEndpointTypes', initialState.endpointTypes)
    }

    if ('sessionKeyValues' in initialState) {
      context.commit(
        'initializeSessionKeyValues',
        initialState.sessionKeyValues
      )
    }
  })
  axiosRequests.$serverGet(restApi.uri.getAllPackages).then((response) => {
    context.commit('setAllPackages', response.data.packages)
  })
}

/**
 * This action loads the option from the backend, including any defaults that may exist.
 * @param {*} context
 * @param {*} option
 */
export function loadOptions(context, option) {
  axiosRequests
    .$serverGet(`${restApi.uri.option}/${option.key}`)
    .then((response) => {
      let optionsData = {
        data: response.data,
        option: option.key,
        type: option.type
      }
      context.commit('setOptions', optionsData)
    })
}

/**
 * Posts a key/value pair
 *
 * @export
 * @param {*} context
 * @param {*} data Object containing 'key' and 'value'
 */
export async function setSelectedGenericKey(context, data) {
  let response = await axiosRequests.$serverPost(
    restApi.uri.saveSessionKeyValue,
    data
  )
  context.commit('setSelectedGenericOption', response.data)
}

/**
 * Load session key value pairs for ZAP.
 * @param {*} context
 */
export async function loadSessionKeyValues(context) {
  let response = await axiosRequests.$serverGet(
    restApi.uri.getAllSessionKeyValues
  )
  context.commit('loadSessionKeyValues', response)
}

/**
 * Adds a new custom package.
 *
 * @param {*} context
 * @param {*} filePath
 * @returns validity object
 */
export async function addNewPackage(context, filePath) {
  let response = await axiosRequests.$serverPost(restApi.uri.addNewPackage, {
    path: filePath
  })

  if (response.data.isValid) {
    let packages = await getProjectPackages(context)
    return { packages: packages, isValid: response.data.isValid }
  } else {
    return { isValid: false, err: response.data.err }
  }
}

/**
 * Delete's a session's package.
 * @param {*} context
 * @param {*} sessionPackage
 * @returns project packages
 */
export function deleteSessionPackage(context, sessionPackage) {
  return axiosRequests
    .$serverDelete(restApi.uri.sessionPackage, { params: sessionPackage })
    .then((response) => {
      return getProjectPackages(context)
    })
}

/**
 * Set the default UI mode for ZAP UI.
 * @param {*} context
 * @param {*} uiMode
 */
export function setDefaultUiMode(context, uiMode) {
  context.commit(`setDefaultUiMode`, uiMode)
}

/**
 * Show or hide the debug navigation bar in ZAP UI.
 * @param {*} context
 * @param {*} debugNavBar
 */
export function setDebugNavBar(context, debugNavBar) {
  context.commit('setDebugNavBar', debugNavBar)
}

/**
 * Show or hide the Save button in ZAP UI.
 * @param {*} context
 * @param {*} saveButtonVisible
 */
export function setSaveButtonVisible(context, saveButtonVisible) {
  context.commit('setSaveButtonVisible', saveButtonVisible)
}

/**
 * Set the mode of ZAP UI.
 * @param {*} context
 * @param {*} standalone
 */
export function setStandalone(context, standalone) {
  context.commit('setStandalone', standalone)
}

/**
 * Set attribute's editable mode in ZAP UI.
 * @param {*} context
 * @param {*} editContext
 */
export function setAttributeEditting(context, editContext) {
  context.commit('setAttributeEditting', editContext)
}

/**
 * Set attribute reporting's editable mode of ZAP UI.
 * @param {*} context
 * @param {*} editContext
 */
export function setAttributeReportingEditting(context, editContext) {
  context.commit('setAttributeReportingEditting', editContext)
}

/**
 * Set the domain drop down for clusters in ZAP UI.
 * @param {*} context
 * @param {*} state
 */
export function setOpenDomain(context, state) {
  context.commit('setOpenDomain', state)
}

/**
 * Set the domain's fliter for clusters in ZAP UI.
 * @param {*} context
 * @param {*} filterEnabledClusterPair
 */
export function setDomainFilter(context, filterEnabledClusterPair) {
  context.commit('setDomainFilter', filterEnabledClusterPair)
}

/**
 * Apply filter for clusters in ZAP UI.
 * @param {*} context
 * @param {*} filterEnabledClusterPair
 */
export function doActionFilter(context, filterEnabledClusterPair) {
  context.commit('doActionFilter', filterEnabledClusterPair)
}

/**
 * Set the filter string for filtering.
 * @param {*} context
 * @param {*} filterString
 */
export function setFilterString(context, filterString) {
  context.commit('setFilterString', filterString)
}

/**
 * Reset the filters in ZAP UI.
 * @param {*} context
 */
export function resetFilters(context) {
  context.commit('resetFilters')
}

/**
 * Set the filter string for each cluster.
 * @param {*} context
 * @param {*} filterString
 */
export function setIndividualClusterFilterString(context, filterString) {
  context.commit('setIndividualClusterFilterString', filterString)
}

/**
 * Set the last selected domain.
 * @param {*} context
 * @param {*} domainNameString
 */
export function setLastSelectedDomain(context, domainNameString) {
  context.commit('setLastSelectedDomain', domainNameString)
}

/**
 * Clear the last selected domain.
 * @param {*} context
 */
export function clearLastSelectedDomain(context) {
  context.commit('clearLastSelectedDomain')
}

/**
 * Load the UC component state for Simplicity Studio.
 * @param {*} context
 */
export async function loadUcComponentState(context) {
  let resp = await axiosRequests.$serverGet(restApi.uc.componentTree)
  updateUcComponentState(context, resp.data)
}

/**
 * Update the UC component state for Simplicity Studio.
 * @param {*} context
 * @param {*} projectInfo
 */
export function updateUcComponentState(context, projectInfo) {
  let ucComponents = Util.getUcComponents(projectInfo)
  let selectedUcComponents = Util.getSelectedUcComponents(ucComponents)
  context.commit('updateUcComponentState', {
    ucComponents,
    selectedUcComponents
  })
}

/**
 * Update the selected UC component state for Simplicity Studio.
 * @param {*} context
 * @param {*} projectInfo
 */
export function updateSelectedUcComponentState(context, projectInfo) {
  let ucComponents = Util.getUcComponents(projectInfo)
  let selectedUcComponents = Util.getSelectedUcComponents(ucComponents)
  context.commit('updateSelectedUcComponentState', {
    selectedUcComponents
  })
}

/**
 * Set the dirty state for ZAP config when there are unsaved changes.
 * @param {*} context
 * @param {*} isDirty
 */
export function setDirtyState(context, isDirty) {
  context.commit('setDirtyState', isDirty)
}

/**
 * Load ZCL's cluster to UC component mapping(Simplicity Studio)
 * @param {*} context
 */
export function loadZclClusterToUcComponentDependencyMap(context) {
  axiosRequests
    .$serverGet(`/zclExtension/cluster/component`)
    .then((response) => {
      context.commit(
        'loadZclClusterToUcComponentDependencyMap',
        response?.data?.defaults
      )
    })
}

/**
 * Share cluster states acorss endpoints.
 * @param {*} context
 * @param {*} data
 */
export function shareClusterStatesAcrossEndpoints(context, data) {
  let { endpointTypeIdList } = data
  axiosRequests
    .$serverPost(restApi.uri.shareClusterStatesAcrossEndpoints, {
      endpointTypeIdList
    })
    .then((response) => {
      console.log(`${restApi.uri.shareClusterStatesAcrossEndpoints} finished.`)
    })
}

/**
 * Generate all the endpoints data.
 * @param {*} context
 * @param {*} endpointData
 */
export function generateAllEndpointsData(context, endpointData) {
  let attr = []
  let report = []
  let server = []
  let promise1 = axiosRequests
    .$serverGet(endpointData.clusterRequestUrl)
    .then((res) => {
      let enabledClients = []
      let enabledServers = []
      res.data.forEach((record) => {
        if (record.enabled) {
          if (record.side === 'client') {
            enabledClients.push(record.clusterRef)
          } else {
            enabledServers.push(record.clusterRef)
          }
        }
      })
      server = [...enabledServers, ...enabledClients]
    })

  let promise2 = axiosRequests
    .$serverGet(endpointData.attributesRequestUrl)
    .then((res) => {
      res.data.forEach((record) => {
        let resolvedReference = Util.cantorPair(
          record.attributeRef,
          record.clusterRef
        )
        if (record.included) {
          attr.push(resolvedReference)
        }
        if (record.includedReportable) {
          report.push(resolvedReference)
        }
      })
    })

  Promise.all([promise1, promise2]).then(() => {
    context.commit('setAllEndpointsData', {
      endpointId: endpointData.endpointId,
      report: report,
      servers: server,
      attr: attr
    })
  })
}

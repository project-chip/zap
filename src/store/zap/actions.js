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
import Vue from 'vue'
import * as Util from '../../util/util.js'
import restApi from '../../../src-shared/rest-api.js'

export function updateInformationText(context, text) {
  Vue.prototype
    .$serverPost(restApi.uri.saveSessionKeyValue, {
      key: 'informationText',
      value: text,
    })
    .then((response) => {
      console.log('got response for information text')
      context.commit('updateInformationText', text)
    })
}

export function updateClusters(context, clusters) {
  context.commit('updateClusters', clusters)
}

export function updateSelectedCluster(context, cluster) {
  context.commit('updateSelectedCluster', cluster)
}

export function updateAttributes(context, attributes) {
  context.commit('updateAttributes', attributes)
}

export function updateCommands(context, commands) {
  context.commit('updateCommands', commands)
}

export function updateZclDeviceTypes(context, deviceTypes) {
  let deviceTypeObjects = {}
  deviceTypes.forEach((deviceType) => {
    deviceTypeObjects[deviceType.id] = {
      code: deviceType.code,
      profileId: deviceType.profileId,
      label: deviceType.label,
      description: deviceType.caption,
    }
  })

  context.commit('updateZclDeviceTypes', deviceTypeObjects)
}

export function updateEndpointConfigs(context, endpointConfigs) {
  context.commit('updateEndpointConfigs', endpointConfigs)
}

export function selectConfiguration(context, configurationName) {
  context.commit('selectConfiguration', configurationName)
}

export function updateSelectedAttributes(context, selectionContext) {
  context.commit('updateInclusionList', selectionContext)
}

export function updateReportingAttributeDefaults(context, selectionContext) {
  context.commit('updateReportingAttributeDefaults', selectionContext)
}

export function updateAttributeDefaults(context, selectionContext) {
  context.commit('updateAttributeDefaults', selectionContext)
}

export function updateSelectedCommands(context, selectionContext) {
  context.commit('updateInclusionList', selectionContext)
}

export function updateSelectedServers(context, selectionContext) {
  context.commit('updateInclusionList', selectionContext)
  Vue.prototype.$serverPost(`/cluster`, {
    endpointTypeId: selectionContext.endpointTypeId,
    id: selectionContext.id,
    side: 'server',
    flag: selectionContext.added,
  })
}

export function updateSelectedClients(context, selectionContext) {
  context.commit('updateInclusionList', selectionContext)
  Vue.prototype.$serverPost(`/cluster`, {
    endpointTypeId: selectionContext.endpointTypeId,
    id: selectionContext.id,
    side: 'client',
    flag: selectionContext.added,
  })
}

export function initializeDefaultEndpoints(context, defaultEndpoints) {
  context.commit('initializeDefaultEndpoints', defaultEndpoints)
}
export function initializeDefaultEndpointsTypes(
  context,
  defaultEndpointsTypes
) {
  context.commit('initializeDefaultEndpointsTypes', defaultEndpointsTypes)
}

export function updateSelectedEndpoint(context, endpoint) {
  context.commit('updateSelectedEndpoint', endpoint)
}

export function setDeviceTypeReference(context, endpointIdDeviceTypeRefPair) {
  Vue.prototype.$serverGet(
    `/zcl/endpointTypeDeviceTypeClusters/${endpointIdDeviceTypeRefPair.deviceTypeRef}`
  )
  Vue.prototype.$serverGet(
    `/zcl/endpointTypeDeviceTypeAttributes/${endpointIdDeviceTypeRefPair.deviceTypeRef}`
  )
  Vue.prototype.$serverGet(
    `/zcl/endpointTypeDeviceTypeCommands/${endpointIdDeviceTypeRefPair.deviceTypeRef}`
  )
  Vue.prototype.$serverGet(
    `/zcl/endpointTypeClusters/${endpointIdDeviceTypeRefPair.endpointId}`
  )
  Vue.prototype.$serverGet(
    `/zcl/endpointTypeAttributes/${endpointIdDeviceTypeRefPair.endpointId}`
  )
  Vue.prototype.$serverGet(
    `/zcl/endpointTypeCommands/${endpointIdDeviceTypeRefPair.endpointId}`
  )
  context.commit('setDeviceTypeReference', endpointIdDeviceTypeRefPair)
}

export function addEndpoint(context, endpoint) {
  context.commit('addEndpoint', endpoint)
}

export function addEndpointType(context, endpointType) {
  context.commit('addEndpointType', endpointType)
}

export function removeEndpointType(context, endpointType) {
  context.commit('removeEndpointType', endpointType)
}

export function updateEndpoint(context, endpoint) {
  context.commit('updateEndpoint', endpoint)
}

export function updateSelectedEndpointType(
  context,
  endpointTypeDeviceTypeRefPair
) {
  if (endpointTypeDeviceTypeRefPair != null) {
    Vue.prototype.$serverGet(
      `/zcl/endpointTypeClusters/${endpointTypeDeviceTypeRefPair.endpointType}`
    )
    Vue.prototype.$serverGet(
      `/zcl/endpointTypeAttributes/${endpointTypeDeviceTypeRefPair.endpointType}`
    )
    Vue.prototype.$serverGet(
      `/zcl/endpointTypeCommands/${endpointTypeDeviceTypeRefPair.endpointType}`
    )
    Vue.prototype.$serverGet(
      `/zcl/endpointTypeDeviceTypeClusters/${endpointTypeDeviceTypeRefPair.deviceTypeRef}`
    )
    Vue.prototype.$serverGet(
      `/zcl/endpointTypeDeviceTypeAttributes/${endpointTypeDeviceTypeRefPair.deviceTypeRef}`
    )
    Vue.prototype.$serverGet(
      `/zcl/endpointTypeDeviceTypeCommands/${endpointTypeDeviceTypeRefPair.deviceTypeRef}`
    )
  }
  context.commit(
    'updateSelectedEndpointType',
    endpointTypeDeviceTypeRefPair.endpointType
  )
}

export function deleteEndpoint(context, endpoint) {
  context.commit('deleteEndpoint', endpoint)
}

export function setClusterList(context, selectionContext) {
  var enabledClients = []
  var enabledServers = []
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
    servers: enabledServers,
  })
}

export function setAttributeStateLists(context, selectionContext) {
  var includedAttributes = []
  var externalAttributes = []
  var flashAttributes = []
  var singletonAttributes = []
  var boundedAttributes = []
  var defaultValue = {}

  var includedReportableAttributes = []
  var min = {}
  var max = {}
  var change = {}

  selectionContext.forEach((record) => {
    var resolvedReference = Util.cantorPair(
      record.attributeRef,
      record.clusterRef
    )
    if (record.included === 1) includedAttributes.push(resolvedReference)
    if (record.external === 1) externalAttributes.push(resolvedReference)
    if (record.flash === 1) flashAttributes.push(resolvedReference)
    if (record.singleton === 1) singletonAttributes.push(resolvedReference)
    if (record.bounded === 1) boundedAttributes.push(resolvedReference)
    if (record.includedReportable === 1)
      includedReportableAttributes.push(resolvedReference)
    defaultValue[resolvedReference] = record.defaultValue
    min[resolvedReference] = record.minInterval
    max[resolvedReference] = record.maxInterval
    change[resolvedReference] = record.reportableChange
  })
  context.commit(`setAttributeLists`, {
    included: includedAttributes,
    external: externalAttributes,
    flash: flashAttributes,
    singleton: singletonAttributes,
    bounded: boundedAttributes,
    defaultValue: defaultValue,
    includedReportable: includedReportableAttributes,
    minInterval: min,
    maxInterval: max,
    reportableChange: change,
  })
}

export function setCommandStateLists(context, selectionContext) {
  var incoming = []
  var outgoing = []
  selectionContext.forEach((record) => {
    var resolvedReference = Util.cantorPair(
      record.commandRef,
      record.clusterRef
    )
    if (record.incoming === 1) incoming.push(resolvedReference)
    if (record.outgoing === 1) outgoing.push(resolvedReference)
  })
  context.commit(`setCommandLists`, {
    incoming: incoming,
    outgoing: outgoing,
  })
}

// TODO (?) This does not handle/highlight prohibited clusters. For now we just keep it in here
export function setRecommendedClusterList(context, data) {
  var recommendedClients = []
  var recommendedServers = []
  var notRecommendedClients = []
  var notRecommendedServers = []

  data.forEach((record) => {
    if (record.includeClient) recommendedClients.push(record.clusterRef)
    else notRecommendedClients.push(record.clusterRef)
    if (record.includeServer) recommendedServers.push(record.clusterRef)
    else notRecommendedServers.push(record.clusterRef)
  })
  context.commit(`setRecommendedClusterList`, {
    recommendedClients: recommendedClients,
    recommendedServers: recommendedServers,
  })
}

export function setRequiredAttributes(context, data) {
  var requiredAttributes = []
  data.forEach((record) => {
    if (record.attributeRef) requiredAttributes.push(record.attributeRef)
  })
  context.commit(`setRequiredAttributesList`, {
    requiredAttributes: requiredAttributes,
  })
}

export function setRequiredCommands(context, data) {
  var requiredCommands = []
  data.forEach((record) => {
    if (record.commandRef) requiredCommands.push(record.commandRef)
  })
  context.commit(`setRequiredCommandsList`, {
    requiredCommands: requiredCommands,
  })
}

export function setLeftDrawerState(context, data) {
  context.commit('setLeftDrawerState', data)
}

export function setMiniState(context, data) {
  context.commit('setMiniState', data)
}

/**
 * This action loads the initial data from the database.
 *
 * @export
 * @param {*} context
 * @param {*} data
 */
export function loadInitialData(context, data) {
  Vue.prototype.$serverGet(restApi.uri.initialState).then((response) => {
    var initialState = response.data.state
    if ('endpoints' in initialState) {
      context.commit('initializeEndpoints', initialState.endpoints)
    }

    if ('endpointTypes' in initialState) {
      context.commit('initializeEndpointTypes', initialState.endpointTypes)
    }
  })
}

/**
 * This action loads the option from the backend
 */
export function loadOptions(context, option) {
  Vue.prototype
    .$serverGet(`${restApi.uri.option}/${option.key}`)
    .then((data) => {
      let optionsData = {
        data: data.data.data,
        option: data.data.option,
        type: option.type,
      }
      context.commit('setOptions', optionsData)
    })
}

export function setSelectedGenericOption(context, optionData) {
  Vue.prototype
    .$serverPost(restApi.uri.saveSessionKeyValue, {
      key: optionData.option,
      value: optionData.value.optionCode,
    })
    .then((response) => {
      context.commit('setSelectedGenericOption', response.data)
    })
}

export function setDefaultUiMode(context, uiMode) {
  context.commit(`setDefaultUiMode`, uiMode)
}

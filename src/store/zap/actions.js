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
  Vue.prototype.$serverGet(`/zcl/cluster/${cluster.id}`).then((res) => {
    context.commit('updateSelectedCluster', [cluster])
    updateAttributes(context, res.data.attributeData || [])
    updateCommands(context, res.data.commandData || [])
  })
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
      domain: deviceType.domain,
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

export function updateSelectedAttribute(context, selectionContext) {
  Vue.prototype
    .$serverPost(restApi.uri.attributeUpdate, selectionContext)
    .then((res) => {
      let arg = res.data
      if (arg.action === 'boolean') {
        context.commit('updateInclusionList', {
          id: Util.cantorPair(arg.id, arg.clusterRef),
          added: arg.added,
          listType: arg.listType,
          view: 'attributeView',
        })
      } else if (arg.action === 'text') {
        context.commit('updateAttributeDefaults', {
          id: Util.cantorPair(arg.id, arg.clusterRef),
          newDefaultValue: arg.added,
          listType: arg.listType,
          defaultValueValidationIssues: arg.validationIssues.defaultValue,
        })
      }
    })
}

export function updateSelectedCommands(context, selectionContext) {
  Vue.prototype
    .$serverPost(restApi.uri.commandUpdate, selectionContext)
    .then((res) => {
      let arg = res.data
      if (arg.action === 'boolean') {
        context.commit('updateInclusionList', {
          id: Util.cantorPair(arg.id, arg.clusterRef),
          added: arg.added,
          listType: arg.listType,
          view: 'commandView',
        })
      }
    })
}

export function updateSelectedServers(context, selectionContext) {
  Vue.prototype
    .$serverPost(restApi.uri.cluster, {
      endpointTypeId: selectionContext.endpointTypeId,
      id: selectionContext.id,
      side: 'server',
      flag: selectionContext.added,
    })
    .then(() => {
      context.commit('updateInclusionList', selectionContext)
    })
}

export function updateSelectedClients(context, selectionContext) {
  Vue.prototype
    .$serverPost(restApi.uri.cluster, {
      endpointTypeId: selectionContext.endpointTypeId,
      id: selectionContext.id,
      side: 'client',
      flag: selectionContext.added,
    })
    .then(() => {
      context.commit('updateInclusionList', selectionContext)
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

export function updateEndpointType(context, endpointType) {
  Vue.prototype
    .$serverPatch(restApi.uri.endpointType, endpointType)
    .then((res) => {
      let arg = res.data
      if (arg.updatedKey === 'deviceTypeRef') {
        setDeviceTypeReference(context, {
          endpointId: arg.endpointTypeId,
          deviceTypeRef: arg.updatedValue,
        })
      }
    })
}

export function setDeviceTypeReference(context, endpointIdDeviceTypeRefPair) {
  Vue.prototype
    .$serverGet(
      `/zcl/endpointTypeDeviceTypeClusters/${endpointIdDeviceTypeRefPair.deviceTypeRef}`
    )
    .then((res) => {
      setRecommendedClusterList(context, res.data.data)
    })
  Vue.prototype
    .$serverGet(
      `/zcl/endpointTypeDeviceTypeAttributes/${endpointIdDeviceTypeRefPair.deviceTypeRef}`
    )
    .then((res) => {
      setRequiredAttributes(context, res.data.data)
    })
  Vue.prototype
    .$serverGet(
      `/zcl/endpointTypeDeviceTypeCommands/${endpointIdDeviceTypeRefPair.deviceTypeRef}`
    )
    .then((res) => {
      setRequiredCommands(context, res.data.data)
    })

  Vue.prototype
    .$serverGet(
      `/zcl/endpointTypeClusters/${endpointIdDeviceTypeRefPair.endpointId}`
    )
    .then((res) => {
      setClusterList(context, res.data.data)
    })
  Vue.prototype
    .$serverGet(
      `/zcl/endpointTypeAttributes/${endpointIdDeviceTypeRefPair.endpointId}`
    )
    .then((res) => {
      setAttributeStateLists(context, res.data.data || [])
    })
  Vue.prototype
    .$serverGet(
      `/zcl/endpointTypeCommands/${endpointIdDeviceTypeRefPair.endpointId}`
    )
    .then((res) => {
      setCommandStateLists(context, res.data.data || [])
    })
  context.commit('setDeviceTypeReference', endpointIdDeviceTypeRefPair)
}

export function updateEndpoint(context, endpoint) {
  Vue.prototype.$serverPatch(restApi.uri.endpoint, endpoint).then((res) => {
    let arg = res.data
    context.commit('updateEndpoint', {
      id: arg.endpointId,
      changes: arg.changes,
      endpointIdValidationIssues: arg.validationIssues.endpointId,
      networkIdValidationIssues: arg.validationIssues.networkId,
    })
  })
}

export function addEndpoint(context, newEndpointContext) {
  return Vue.prototype
    .$serverPost(restApi.uri.endpoint, newEndpointContext)
    .then((res) => {
      let arg = res.data
      context.commit('addEndpoint', {
        id: arg.id,
        endpointId: arg.endpointId,
        endpointTypeRef: arg.endpointType,
        networkId: arg.networkId,
        endpointIdValidationIssues: arg.validationIssues.endpointId,
        networkIdValidationIssues: arg.validationIssues.networkId,
      })
      return arg
    })
}

export function addEndpointType(context, endpointTypeData) {
  return Vue.prototype
    .$serverPost(restApi.uri.endpointType, endpointTypeData)
    .then((res) => {
      context.commit('addEndpointType', {
        id: res.data.id,
        name: res.data.name,
        deviceTypeRef: res.data.deviceTypeRef,
      })
      return res.data
    })
}

export function deleteEndpoint(context, endpointId) {
  Vue.prototype
    .$serverDelete(restApi.uri.endpoint, { params: { id: endpointId } })
    .then((response) => {
      context.commit('deleteEndpoint', { id: response.data.id })
    })
}

export function deleteEndpointType(context, endpointTypeId) {
  Vue.prototype
    .$serverDelete(restApi.uri.endpointType, { params: { id: endpointTypeId } })
    .then((response) => {
      if (response.data.successful) {
        context.commit('removeEndpointType', {
          id: response.data.id,
        })
      }
    })
}

export function refreshEndpointTypeCluster(context, endpointType) {
  Vue.prototype
    .$serverGet(`/zcl/endpointTypeAttributes/${endpointType}`)
    .then((res) => {
      setAttributeStateLists(context, res.data.data || [])
    })
  Vue.prototype
    .$serverGet(`/zcl/endpointTypeCommands/${endpointType}`)
    .then((res) => {
      setCommandStateLists(context, res.data.data || [])
    })
}

export function updateSelectedEndpointType(
  context,
  endpointTypeDeviceTypeRefPair
) {
  if (endpointTypeDeviceTypeRefPair != null) {
    Vue.prototype
      .$serverGet(
        `/zcl/endpointTypeClusters/${endpointTypeDeviceTypeRefPair.endpointType}`
      )
      .then((res) => {
        setClusterList(context, res.data.data)
      })
    Vue.prototype
      .$serverGet(
        `/zcl/endpointTypeAttributes/${endpointTypeDeviceTypeRefPair.endpointType}`
      )
      .then((res) => {
        setAttributeStateLists(context, res.data.data || [])
      })
    Vue.prototype
      .$serverGet(
        `/zcl/endpointTypeCommands/${endpointTypeDeviceTypeRefPair.endpointType}`
      )
      .then((res) => {
        setCommandStateLists(context, res.data.data || [])
      })
    Vue.prototype
      .$serverGet(
        `/zcl/endpointTypeDeviceTypeClusters/${endpointTypeDeviceTypeRefPair.deviceTypeRef}`
      )
      .then((res) => {
        setRecommendedClusterList(context, res.data.data)
      })
    Vue.prototype
      .$serverGet(
        `/zcl/endpointTypeDeviceTypeAttributes/${endpointTypeDeviceTypeRefPair.deviceTypeRef}`
      )
      .then((res) => {
        setRequiredAttributes(context, res.data.data)
      })
    Vue.prototype
      .$serverGet(
        `/zcl/endpointTypeDeviceTypeCommands/${endpointTypeDeviceTypeRefPair.deviceTypeRef}`
      )
      .then((res) => {
        setRequiredCommands(context, res.data.data)
      })
    context.commit(
      'updateSelectedEndpointType',
      endpointTypeDeviceTypeRefPair.endpointType
    )
  }
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
  var singletonAttributes = []
  var boundedAttributes = []
  var defaultValue = {}
  var storageOption = {}

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
    if (record.singleton === 1) singletonAttributes.push(resolvedReference)
    if (record.bounded === 1) boundedAttributes.push(resolvedReference)
    if (record.includedReportable === 1)
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

  data.forEach((record) => {
    if (record.includeClient) recommendedClients.push(record.clusterRef)
    if (record.includeServer) recommendedServers.push(record.clusterRef)
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
    var initialState = response.data
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
}

/**
 * This action loads the option from the backend, including any defaults that may exist.
 */
export function loadOptions(context, option) {
  Vue.prototype
    .$serverGet(`${restApi.uri.option}/${option.key}`)
    .then((response) => {
      let optionsData = {
        data: response.data,
        option: option.key,
        type: option.type,
      }
      context.commit('setOptions', optionsData)
    })
}

export function setSelectedGenericKey(context, data) {
  Vue.prototype
    .$serverPost(restApi.uri.saveSessionKeyValue, {
      key: data.option,
      value: data.value,
    })
    .then((response) => {
      context.commit('setSelectedGenericOption', response.data)
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

export function loadSessionKeyValues(context) {
  Vue.prototype
    .$serverGet(restApi.uri.getAllSessionKeyValues)
    .then((response) => {
      context.commit('loadSessionKeyValues', response.data)
    })
}

export function setDefaultUiMode(context, uiMode) {
  context.commit(`setDefaultUiMode`, uiMode)
}

export function setEmbeddedMode(context, embeddedMode) {
  context.commit('setEmbeddedMode', embeddedMode)
}

export function setStudioConfigPath(context, filePath) {
  context.commit('setStudioConfigPath', filePath)
}

export function setAttributeEditting(context, editContext) {
  context.commit('setAttributeEditting', editContext)
}

export function setOpenDomain(context, state) {
  context.commit('setOpenDomain', state)
}

export function setDomainFilter(context, filterEnabledClusterPair) {
  context.commit('setDomainFilter', filterEnabledClusterPair)
}

export function setFilterString(context, filterString) {
  context.commit('setFilterString', filterString)
}

export function resetFilters(context) {
  context.commit('resetFilters')
}

import Vue from 'vue'

export function updateInformationText (context, text) {
  context.commit('updateInformationText', text)
  Vue.prototype.$serverPost('/save', { key: 'informationText', value: text })
}

export function updateClusters (context, clusters) {
  context.commit('updateClusters', clusters)
}

export function updateSelectedCluster (context, cluster) {
  context.commit('updateSelectedCluster', cluster)
}

export function updateAttributes (context, attributes) {
  context.commit('updateAttributes', attributes)
}

export function updateCommands (context, commands) {
  context.commit('updateCommands', commands)
}

export function updateZclDeviceTypes (context, deviceTypes) {
  let deviceTypeObjects = {}
  deviceTypes.forEach(deviceType => {
    deviceTypeObjects[deviceType.id] = {
      code: deviceType.code,
      profileId: deviceType.profileId,
      label: deviceType.label,
      description: deviceType.caption
    }
  })

  context.commit('updateZclDeviceTypes', deviceTypeObjects)
}

export function updateEndpointConfigs (context, endpointConfigs) {
  context.commit('updateEndpointConfigs', endpointConfigs)
}

export function selectConfiguration (context, configurationName) {
  context.commit('selectConfiguration', configurationName)
}

export function updateSelectedAttributes (context, selectionContext) {
  context.commit('updateInclusionList', selectionContext)
}

export function updateReportingAttributeDefaults (context, selectionContext) {
  context.commit('updateReportingAttributeDefaults', selectionContext)
}

export function updateAttributeDefaults (context, selectionContext) {
  context.commit('updateAttributeDefaults', selectionContext)
}

export function updateSelectedCommands (context, selectionContext) {
  context.commit('updateInclusionList', selectionContext)
}

export function updateSelectedServers (context, selectionContext) {
  context.commit('updateInclusionList', selectionContext)
  Vue.prototype.$serverPost(`/cluster`,
    {
      id: selectionContext.id,
      side: 'server',
      flag: selectionContext.added
    })
}

export function updateSelectedClients (context, selectionContext) {
  context.commit('updateInclusionList', selectionContext)
  Vue.prototype.$serverPost(`/cluster`,
    {
      id: selectionContext.id,
      side: 'client',
      flag: selectionContext.added
    })
}

export function initializeDefaultEndpoints (context, defaultEndpoints) {
  context.commit('initializeDefaultEndpoints', defaultEndpoints)
}
export function initializeDefaultEndpointsTypes (context, defaultEndpointsTypes) {
  context.commit('initializeDefaultEndpointsTypes', defaultEndpointsTypes)
}

export function updateSelectedEndpoint (context, endpoint) {
  context.commit('updateSelectedEndpoint', endpoint)
}

export function setDeviceTypeReference (context, endpointIdDeviceTypeRefPair) {
  context.commit('setDeviceTypeReference', endpointIdDeviceTypeRefPair)
}

export function addEndpoint (context, endpoint) {
  context.commit('addEndpoint', endpoint)
}

export function addEndpointType (context, endpointType) {
  context.commit('addEndpointType', endpointType)
}

export function removeEndpointType (context, endpointType) {
  context.commit('removeEndpointType', endpointType)
}

export function updateSelectedEndpointType (context, endpointType) {
  context.commit('updateSelectedEndpointType', endpointType)
}

export function deleteEndpoint (context, endpoint) {
  context.commit('deleteEndpoint', endpoint)
}

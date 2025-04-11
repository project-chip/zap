/**
 *
 *    Copyright (c) 2020 Silicon Labs
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
 * Sets a property on an object to a given value.
 *
 * @param {object} object - The object on which to set the property.
 * @param {string} property - The name of the property to set.
 * @param {*} value - The value to assign to the property.
 */
function vue3Set(object, property, value) {
  object[property] = value
}

/**
 * Deletes a property from an object.
 *
 * @param {object} object - The object from which to delete the property.
 * @param {string} property - The name of the property to delete.
 *
 */
function vue3Delete(object, property) {
  delete object[property]
}

const reportingMinDefault = 1

export const togglePreviewTab = (state) => {
  state.showPreviewTab = !state.showPreviewTab
}
export const toggleNotificationTab = (state) => {
  state.showNotificationTab = !state.showNotificationTab
}

export const updateShowDevTools = (state) => {
  state.showDevTools = !state.showDevTools
}

/**
 * Set the information text in the state
 * @param {*} state
 * @param {*} text
 */
export function updateInformationText(state, text) {
  state.informationText = text
}

/**
 * Set the packages in the state
 * @param {*} state
 * @param {*} packages
 */
export function setAllPackages(state, packages) {
  state.allPackages = packages
}

/**
 * Updates the state with the cluster data
 * @param {*} state
 * @param {*} responseData
 */
export function updateClusters(state, responseData) {
  let selectedEndpointTypeTemp = state.endpointTypeView.selectedEndpointType
  let selectedDeviceTypeRefs =
    state.endpointTypeView.deviceTypeRef[selectedEndpointTypeTemp]
  let packageRefs = []
  // Add custom xml packages to the list of packageRefs
  let sessionPackages = state.packages
  let customXmlPackagesCount = 0
  if (sessionPackages && sessionPackages.length > 0) {
    for (let i = 0; i < sessionPackages.length; i++) {
      if (
        sessionPackages[i].pkg &&
        sessionPackages[i].pkg.type == 'zcl-xml-standalone'
      ) {
        packageRefs.push(sessionPackages[i].pkg.id)
      }
    }
  }
  customXmlPackagesCount = packageRefs.length

  if (selectedDeviceTypeRefs) {
    for (let i = 0; i < selectedDeviceTypeRefs.length; i++) {
      for (let j = 0; j < responseData.deviceTypes.data.length; j++) {
        if (
          selectedDeviceTypeRefs[i] == responseData.deviceTypes.data[j].id &&
          !packageRefs.includes(responseData.deviceTypes.data[j].packageRef)
        ) {
          packageRefs.push(responseData.deviceTypes.data[j].packageRef)
        }
      }
    }
    // Check if all package refs are standalone(Handles the custom device type use case from xml)
    if (customXmlPackagesCount === packageRefs.length) {
      // if all packages are custom then add the first standard zcl package to the list of package refs.
      for (let i = 0; i < sessionPackages.length; i++) {
        if (sessionPackages[i].pkg.type == 'zcl-properties') {
          packageRefs.push(sessionPackages[i].pkg.id)
          break
        }
      }
    }
  } else {
    // When endpoint types do not have an associated device type(undefined)
    if (responseData.clusterData) {
      state.clusters = responseData.clusterData
    } else {
      state.clusters = responseData
    }
    state.domains = [...new Set(state.clusters.map((a) => a.domainName))]
  }

  if (responseData.clusterData) {
    state.clusters = responseData.clusterData.filter((c) =>
      packageRefs.includes(c.packageRef)
    )
    state.domains = [...new Set(state.clusters.map((a) => a.domainName))]
  }
}

/**
 * Update the state with atomics data.
 * @param {*} state
 * @param {*} atomics
 */
export function updateAtomics(state, atomics) {
  state.atomics = atomics
}

/**
 * update selected cluster view in the state.
 * @param {*} state
 * @param {*} cluster
 */
export function updateSelectedCluster(state, cluster) {
  state.clustersView.selected = cluster
}

/**
 * Update the selected endpoint of the endpoint view in the state.
 * @param {*} state
 * @param {*} endpoint
 */
export function updateSelectedEndpoint(state, endpoint) {
  state.endpointView.selectedEndpoint = endpoint
}

/**
 * Update the attribute details of the attribute view in the state.
 * @param {*} state
 * @param {*} attributes
 */
export function updateAttributes(state, attributes) {
  attributes.forEach((attribute) => {
    if (state.attributeView.defaultValue[attribute.id] === undefined) {
      vue3Set(
        state.attributeView.defaultValue,
        attribute.id,
        attribute.defaultValue
      )
    }
    if (state.attributeView.reportingMin[attribute.id] === undefined) {
      vue3Set(
        state.attributeView.reportingMin,
        attribute.id,
        reportingMinDefault
      )
    }
    if (state.attributeView.reportingMax[attribute.id] === undefined) {
      vue3Set(state.attributeView.reportingMax, attribute.id, 65534)
    }
    if (state.attributeView.reportableChange[attribute.id] === undefined) {
      vue3Set(state.attributeView.reportableChange, attribute.id, 0)
    }
  })
  state.attributes = attributes
}

/**
 * Update the default value of feature map attribute in the state.
 * @param {*} state
 * @param {*} attributes
 */
export function updateFeatureMapValue(state, value) {
  state.featureMapValue = value
}

/**
 * Set the endpointTypeAttribute details in the state.
 * @param {*} state
 * @param {*} endpointTypeAttribute
 */
export function setEndpointTypeAttribute(state, endpointTypeAttribute) {
  let attribute = endpointTypeAttribute

  updateInclusionList(state, {
    id: attribute.id,
    added: attribute.included,
    listType: 'selectedAttributes',
    view: 'attributeView'
  })
  updateInclusionList(state, {
    id: attribute.id,
    added: attribute.singleton,
    listType: 'selectedSingleton',
    view: 'attributeView'
  })
  updateInclusionList(state, {
    id: attribute.id,
    added: attribute.bounded,
    listType: 'selectedBounded',
    view: 'attributeView'
  })
  updateInclusionList(state, {
    id: attribute.id,
    added: attribute.includedReportable,
    listType: 'selectedReporting',
    view: 'attributeView'
  })

  vue3Set(
    state.attributeView.defaultValue,
    attribute.id,
    attribute.defaultValue
  )
  vue3Set(
    state.attributeView.storageOption,
    attribute.id,
    attribute.storageOption
  )
  vue3Set(state.attributeView.reportingMin, attribute.id, attribute.minInterval)
  vue3Set(state.attributeView.reportingMax, attribute.id, attribute.maxInterval)
  vue3Set(
    state.attributeView.reportableChange,
    attribute.id,
    attribute.reportableChange
  )
}

/**
 * Initialize the ednpoint details in the state.
 * @param {*} state
 * @param {*} defaultEndpoints
 */
export function initializeDefaultEndpoints(state, defaultEndpoints) {
  defaultEndpoints.forEach((endpoint) => {
    if (state.endpointView.endpointId[endpoint.id] === undefined) {
      vue3Set(state.endpointView.endpointId, endpoint.id, endpoint.endpointId)
    }
    if (state.endpointView.endpointType[endpoint.id] === undefined) {
      vue3Set(
        state.endpointView.endpointType,
        endpoint.id,
        endpoint.endpointTypeRef
      )
    }
    if (state.endpointView.networkId[endpoint.id] === undefined) {
      vue3Set(state.endpointView.networkId, endpoint.id, endpoint.networkId)
    }
    if (
      state.endpointView.parentEndpointIdentifier[endpoint.id] === undefined
    ) {
      vue3Set(
        state.endpointView.parentEndpointIdentifier,
        endpoint.id,
        endpoint.parentEndpointIdentifier
      )
    }

    if (state.endpointView.profileId[endpoint.id] === undefined) {
      vue3Set(state.endpointView.profileId, endpoint.id, endpoint.profileId)
    }
  })
}

/**
 * Add endpoint details the state.
 * @param {*} state
 * @param {*} endpoint
 */
export function addEndpoint(state, endpoint) {
  vue3Set(state.endpointView.endpointId, endpoint.id, endpoint.endpointId)
  vue3Set(
    state.endpointView.endpointType,
    endpoint.id,
    endpoint.endpointTypeRef
  )
  vue3Set(state.endpointView.networkId, endpoint.id, endpoint.networkId)
  vue3Set(
    state.endpointView.parentEndpointIdentifier,
    endpoint.id,
    endpoint.parentEndpointIdentifier
  )
  vue3Set(state.endpointView.profileId, endpoint.id, endpoint.profileId)
  vue3Set(
    state.endpointView.endpointIdValidationIssues,
    endpoint.id,
    endpoint.endpointIdValidationIssues
  )
  vue3Set(
    state.endpointView.networkIdValidationIssues,
    endpoint.id,
    endpoint.networkIdValidationIssues
  )
}

/**
 * Update endpoint details in the state.
 * @param {*} state
 * @param {*} context
 */
export function updateEndpoint(state, context) {
  vue3Set(
    state.endpointView.parentEndpointIdentifier,
    context.id,
    context.parentEndpointIdentifier
  )
  context.changes.forEach((data) => {
    vue3Set(state.endpointView[data.updatedKey], context.id, data.value)
  })
  vue3Set(
    state.endpointView.endpointIdValidationIssues,
    context.id,
    context.endpointIdValidationIssues
  )
  vue3Set(
    state.endpointView.networkIdValidationIssues,
    context.id,
    context.networkIdValidationIssues
  )
}

/**
 * Initialize state with default details of an endpoint type.
 * @param {*} state
 * @param {*} defaultEndpointsTypes
 */
export function initializeDefaultEndpointsTypes(state, defaultEndpointsTypes) {
  defaultEndpointsTypes.forEach((endpointType) => {
    if (state.endpointTypeView.name[endpointType.id] === undefined) {
      vue3Set(state.endpointTypeView.name, endpointType.id, endpointType.name)
    }
    if (state.endpointTypeView.deviceTypeRef[endpointType.id] === undefined) {
      vue3Set(
        state.endpointTypeView.deviceTypeRef,
        endpointType.id,
        endpointType.deviceTypeRef
      )
    }
    if (state.endpointTypeView.deviceVersion[endpointType.id] === undefined) {
      vue3Set(
        state.endpointTypeView.deviceVersion,
        endpointType.id,
        endpointType.deviceVersion
      )
    }
  })
}

/**
 * Add endpoint type to the state.
 * @param {*} state
 * @param {*} endpointType
 */
export function addEndpointType(state, endpointType) {
  vue3Set(state.endpointTypeView.name, endpointType.id, endpointType.name)
  vue3Set(
    state.endpointTypeView.deviceTypeRef,
    endpointType.id,
    endpointType.deviceTypeRef
  )
  vue3Set(
    state.endpointTypeView.deviceIdentifier,
    endpointType.id,
    endpointType.deviceIdentifier
  )
  vue3Set(
    state.endpointTypeView.deviceVersion,
    endpointType.id,
    endpointType.deviceVersion
  )
}
/**
 * Update attribute details of the attribute view in the state.
 * @param {*} state
 * @param {*} selectionContext
 */
export function updateAttributeDefaults(state, selectionContext) {
  vue3Set(
    state.attributeView[selectionContext.listType],
    selectionContext.id,
    selectionContext.newDefaultValue
  )
  vue3Set(
    state.attributeView.defaultValueValidationIssues,
    selectionContext.id,
    selectionContext.defaultValueValidationIssues
  )
  vue3Set(
    state.attributeView.nullValues,
    selectionContext.id,
    selectionContext.isNull
  )
}

/**
 * Update commands in the state.
 * @param {*} state
 * @param {*} commands
 */
export function updateCommands(state, commands) {
  state.commands = commands
}

/**
 * Update events in the state.
 * @param {*} state
 * @param {*} events
 */
export function updateEvents(state, events) {
  state.events = events
}

/**
 * Update features in the state
 * @param {*} state
 * @param {*} features
 */
export function updateFeatures(state, features) {
  state.features = features
}

/**
 * update ZCL device types in the state.
 * @param {*} state
 * @param {*} zclDeviceTypes
 */
export function updateZclDeviceTypes(state, zclDeviceTypes) {
  state.zclDeviceTypes = zclDeviceTypes
}

/**
 * update Endpoint details in the state.
 * @param {*} state
 * @param {*} endpoints
 */
export function updateEndpointConfigs(state, endpoints) {
  state.endpoints = endpoints
}

/**
 * Set the selected of configuration view in the state.
 * @param {*} state
 * @param {*} configurationName
 */
export function selectConfiguration(state, configurationName) {
  state.configurationView.selected = configurationName
}

/**
 * Update inclusion list in the state.
 * @param {*} state
 * @param {*} selectionContext
 */
export function updateInclusionList(state, selectionContext) {
  let inclusionList = state[selectionContext.view][selectionContext.listType]
  if (selectionContext.added && !inclusionList.includes(selectionContext.id)) {
    inclusionList.push(selectionContext.id)
  } else if (
    !selectionContext.added &&
    inclusionList.includes(selectionContext.id)
  ) {
    let elementIndex = inclusionList.indexOf(selectionContext.id)
    inclusionList.splice(elementIndex, 1)
  }
  state[selectionContext.view][selectionContext.listType] = inclusionList
}

/**
 * Set device type details for the endpoint type view in the state.
 * @param {*} state
 * @param {*} endpointTypeIdDeviceTypeRefPair
 */
export function setDeviceTypeReference(state, endpointTypeIdDeviceTypeRefPair) {
  vue3Set(
    state.endpointTypeView.deviceTypeRef,
    endpointTypeIdDeviceTypeRefPair.endpointTypeId,
    endpointTypeIdDeviceTypeRefPair.deviceTypeRef
  )

  vue3Set(
    state.endpointTypeView.deviceVersion,
    endpointTypeIdDeviceTypeRefPair.endpointTypeId,
    endpointTypeIdDeviceTypeRefPair.deviceVersion
  )

  vue3Set(
    state.endpointTypeView.deviceIdentifier,
    endpointTypeIdDeviceTypeRefPair.endpointTypeId,
    endpointTypeIdDeviceTypeRefPair.deviceIdentifier
  )
}

/**
 * Update the selectedEndpointType of endpoint type view in the state.
 * @param {*} state
 * @param {*} endpointType
 */
export function updateSelectedEndpointType(state, endpointType) {
  state.endpointTypeView.selectedEndpointType = endpointType
}

/**
 * Update the device Type Clusters For Selected Endpoint in endpoint type view state.
 * @param {*} state
 * @param {*} deviceTypeClustersForSelectedEndpoint
 */
export function updateDeviceTypeClustersForSelectedEndpoint(
  state,
  deviceTypeClustersForSelectedEndpoint
) {
  state.endpointTypeView.deviceTypeClustersForSelectedEndpoint =
    deviceTypeClustersForSelectedEndpoint
}

/**
 * Remove endpoint type details from the endpoint type view of the state.
 * @param {*} state
 * @param {*} endpointType
 */
export function removeEndpointType(state, endpointType) {
  state.endpointTypeView.selectedEndpointType = []
  vue3Delete(state.endpointTypeView.name, endpointType.id)
  vue3Delete(state.endpointTypeView.deviceTypeRef, endpointType.id)
  vue3Delete(state.endpointTypeView.deviceVersion, endpointType.id)
}

/**
 * Delete endpoint from the endpoint view of the state.
 * @param {*} state
 * @param {*} endpoint
 */
export function deleteEndpoint(state, endpoint) {
  state.endpointView.selectedEndpoint = null
  vue3Delete(state.endpointView.endpointId, endpoint.id)
  vue3Delete(state.endpointView.endpointType, endpoint.id)
  vue3Delete(state.endpointView.networkId, endpoint.id)
  vue3Delete(state.endpointView.parentEndpointIdentifier, endpoint.id)
}

/**
 * Set selected clusters of the cluster view in the state.
 * @param {*} state
 * @param {*} data
 */
export function setClusterList(state, data) {
  state.clustersView.selectedClients = data.clients
  state.clustersView.selectedServers = data.servers
}

/**
 * Reset attribute details of the attribute view in the state.
 * @param {*} state
 */
export function resetAttributeDefaults(state) {
  state.attributeView.defaultValue = {}
  state.attributeView.reportingMin = {}
  state.attributeView.reportingMin = {}
  state.attributeView.reportableChange = {}
  state.attributeView.storageOption = {}

  state.attributes.forEach((attribute) => {
    vue3Set(
      state.attributeView.defaultValue,
      attribute.id,
      attribute.defaultValue
    )
    vue3Set(state.attributeView.storageOption, attribute.id, 'ram')
    vue3Set(state.attributeView.reportingMin, attribute.id, reportingMinDefault)
    vue3Set(state.attributeView.reportingMax, attribute.id, 65534)
    vue3Set(state.attributeView.reportableChange, attribute.id, 0)
  })
}

/**
 * Set attribute details of the attribute view in the state.
 * @param {*} state
 * @param {*} data
 */
export function setAttributeLists(state, data) {
  state.attributeView.selectedAttributes = data.included
  state.attributeView.selectedSingleton = data.singleton
  state.attributeView.selectedBounded = data.bounded
  state.attributeView.selectedReporting = data.includedReportable

  resetAttributeDefaults(state)
  Object.entries(data.defaultValue).forEach(([attributeRef, defaultVal]) => {
    vue3Set(state.attributeView.defaultValue, attributeRef, defaultVal)
  })
  Object.entries(data.storageOption).forEach(
    ([attributeRef, storageOption]) => {
      vue3Set(state.attributeView.storageOption, attributeRef, storageOption)
    }
  )

  Object.entries(data.minInterval).forEach(([attributeRef, defaultVal]) => {
    vue3Set(state.attributeView.reportingMin, attributeRef, defaultVal)
  })

  Object.entries(data.maxInterval).forEach(([attributeRef, defaultVal]) => {
    vue3Set(state.attributeView.reportingMax, attributeRef, defaultVal)
  })
  Object.entries(data.reportableChange).forEach(
    ([attributeRef, defaultVal]) => {
      vue3Set(state.attributeView.reportableChange, attributeRef, defaultVal)
    }
  )
}

/**
 * Set command details of the command view in the state.
 * @param {*} state
 * @param {*} data
 */
export function setCommandLists(state, data) {
  vue3Set(state.commandView, 'selectedIn', data.incoming)
  vue3Set(state.commandView, 'selectedOut', data.outgoing)
}

/**
 * Set event details of the event view in the state.
 * @param {*} state
 * @param {*} data
 */
export function setEventLists(state, data) {
  vue3Set(state.eventView, 'selectedEvents', data)
}

/**
 * Set recommended cluster lists of the cluster view in the state.
 * @param {*} state
 * @param {*} data
 */
export function setRecommendedClusterList(state, data) {
  vue3Set(state.clustersView, 'recommendedClients', data.recommendedClients)
  vue3Set(state.clustersView, 'recommendedServers', data.recommendedServers)
  vue3Set(state.clustersView, 'optionalClients', data.optionalClients)
  vue3Set(state.clustersView, 'optionalServers', data.optionalServers)
}

/**
 * Set required attributes of the attribute view in the state.
 * @param {*} state
 * @param {*} data
 */
export function setRequiredAttributesList(state, data) {
  vue3Set(state.attributeView, 'requiredAttributes', data.requiredAttributes)
}

/**
 * Set required commands of the command view in the state.
 * @param {*} state
 * @param {*} data
 */
export function setRequiredCommandsList(state, data) {
  vue3Set(state.commandView, 'requiredCommands', data.requiredCommands)
}

/**
 * Set left drawer's state
 * @param {*} state
 * @param {*} data
 */
export function setLeftDrawerState(state, data) {
  state.leftDrawerOpenState = data
}

/**
 * Set minimization state.
 * @param {*} state
 * @param {*} data
 */
export function setMiniState(state, data) {
  state.miniState = data
}

/**
 * Initialize endpoints for the state.
 * @param {*} state
 * @param {*} endpoints
 */
export function initializeEndpoints(state, endpoints) {
  endpoints.forEach((e) => {
    addEndpoint(state, e)
  })
}

/**
 * Initialize endpoint types for the state.
 * @param {*} state
 * @param {*} endpointTypes
 */
export function initializeEndpointTypes(state, endpointTypes) {
  endpointTypes.forEach((et) => {
    addEndpointType(state, et)
  })
}

/**
 * Initialize session key values for the state.
 * @param {*} state
 * @param {*} sessionKeyValues
 */
export function initializeSessionKeyValues(state, sessionKeyValues) {
  sessionKeyValues.forEach((skv) => {
    setSelectedGenericOption(state, skv)
  })
}

/**
 * Set configuration options in the state.
 * @param {*} state
 * @param {*} data
 */
export function setOptions(state, data) {
  vue3Set(state.genericOptions, data.option, [
    ...new Set(
      data.data
        .filter((d) => d.optionCategory === data.option)
        .map((d) => {
          return { optionCode: d.optionCode, optionLabel: d.optionLabel }
        })
    )
  ])
}

/**
 * Set specific options for the state.
 * @param {*} state
 * @param {*} keyValue
 */
export function setSelectedGenericOption(state, keyValue) {
  vue3Set(state.selectedGenericOptions, keyValue.key, keyValue.value)
}

/**
 * Load session key values pairs in the state.
 * @param {*} state
 * @param {*} sessionKeyValues
 */
export function loadSessionKeyValues(state, sessionKeyValues) {
  sessionKeyValues?.data.map((keyValue) => {
    vue3Set(state.selectedGenericOptions, keyValue.key, keyValue.value)
  })
}

/**
 * Set default UI mode in the state.
 * @param {*} state
 * @param {*} uiMode
 */
export function setDefaultUiMode(state, uiMode) {
  vue3Set(state.calledArgs, `defaultUiMode`, uiMode)
}

/**
 * Set debug navigation view for the state.
 * @param {*} state
 * @param {*} debugNavBar
 */
export function setDebugNavBar(state, debugNavBar) {
  state.debugNavBar = debugNavBar
}

/**
 * Show save button in the UI using the state.
 * @param {*} state
 * @param {*} saveButtonVisible
 */
export function setSaveButtonVisible(state, saveButtonVisible) {
  state.saveButtonVisible = saveButtonVisible
}

/**
 * Set standalone mode for ZAP using the state.
 * @param {*} state
 * @param {*} standalone
 */
export function setStandalone(state, standalone) {
  state.standalone = standalone
}

/**
 * Set open domain of cluster manager in the state.
 * @param {*} state
 * @param {*} context
 */
export function setOpenDomain(state, context) {
  vue3Set(state.clusterManager.openDomains, context.domainName, context.value)
}

/**
 * Set the filter for the domain of cluster manager in the state.
 * @param {*} state
 * @param {*} filterEnabledClusterPair
 */
export function setDomainFilter(state, filterEnabledClusterPair) {
  let filter = filterEnabledClusterPair.filter
  state.clusterManager.filter = filter
  state.domains.map((domainName) => {
    const openDomainValue =
      state.clusterManager.filterString === ''
        ? filter.domainFilterFn(domainName, state.clusterManager.openDomains, {
            enabledClusters: filterEnabledClusterPair.enabledClusters,
            relevantClusters: filterEnabledClusterPair.relevantClusters,
            deviceTypeRefsForSelectedEndpoint:
              filterEnabledClusterPair.deviceTypeRefsForSelectedEndpoint,
            deviceTypeClustersForSelectedEndpoint:
              filterEnabledClusterPair.deviceTypeClustersForSelectedEndpoint
          })
        : true
    setOpenDomain(state, {
      domainName: domainName,
      value: openDomainValue
    })
  })
}

/**
 * Filter each domain of the cluster manager in the state.
 * @param {*} state
 * @param {*} filterEnabledClusterPair
 */
export function doActionFilter(state, filterEnabledClusterPair) {
  let filter = filterEnabledClusterPair.filter
  // When we close all, we also clear all filters.
  state.domains.map((domainName) => {
    setOpenDomain(state, {
      domainName: domainName,
      value: filter.domainFilterFn(
        domainName,
        state.clusterManager.openDomains,
        {
          enabledClusters: filterEnabledClusterPair.enabledClusters
        }
      )
    })
  })
}

/**
 * Set filter string of the cluster manager in state.
 * @param {*} state
 * @param {*} filterString
 */
export function setFilterString(state, filterString) {
  state.clusterManager.filterString = filterString
}

/**
 * Set individual cluster filter string of the cluster manager in state.
 * @param {*} state
 * @param {*} filterString
 */
export function setIndividualClusterFilterString(state, filterString) {
  state.clusterManager.individualClusterFilterString = filterString
}

/**
 * set the last selected domain of the cluster manager in the state.
 * @param {*} state
 * @param {*} domainNameString
 */
export function setLastSelectedDomain(state, domainNameString) {
  state.clusterManager.lastSelectedDomain = domainNameString
}

/**
 * Clear last selected domain of the cluster manager in the state.
 * @param {*} state
 */
export function clearLastSelectedDomain(state) {
  state.clusterManager.lastSelectedDomain = null
}

/**
 * Reset the filter of cluster manager in the state.
 * @param {*} state
 */
export function resetFilters(state) {
  state.clusterManager.filter = {
    label: 'No Filter',
    domainFilterFn: (domain, currentOpenDomains, context) =>
      currentOpenDomains[domain]
  }
  state.clusterManager.openDomains = {}
}

/**
 * Set isExceptionsExpanded of the state.
 * @param {*} state
 */
export function expandedExceptionsToggle(state) {
  state.isExceptionsExpanded = !state.isExceptionsExpanded
}

/**
 * Update state's exceptions.
 * @param {*} state
 * @param {*} value
 */
export function updateExceptions(state, value) {
  state.exceptions.push(value)
}

/**
 * Toggle state's showExceptionIcon
 * @param {*} state
 * @param {*} value
 */
export function toggleShowExceptionIcon(state, value) {
  state.showExceptionIcon = value
}

/**
 * Update the project packages of the state.
 * @param {*} state
 * @param {*} packages
 */
export function updateProjectPackages(state, packages) {
  vue3Set(state, 'packages', packages)
}

/**
 * Update Simplicity Studio's UC component details in the state.
 * @param {*} state
 * @param {*} data
 */
export function updateUcComponentState(state, data) {
  if (data != null) {
    vue3Set(state.studio, 'ucComponents', data.ucComponents)
    vue3Set(state.studio, 'selectedUcComponents', data.selectedUcComponents)
  }
}

/**
 * Update Simplicity Studio's selected UC components in the state.
 * @param {*} state
 * @param {*} data
 */
export function updateSelectedUcComponentState(state, data) {
  if (data != null) {
    vue3Set(state.studio, 'selectedUcComponents', data.selectedUcComponents)
  }
}

/**
 * Load Simplicity Studio's cluster to UC component mapping.
 * @param {*} state
 * @param {*} map
 */
export function loadZclClusterToUcComponentDependencyMap(state, map) {
  if (map != null)
    vue3Set(state.studio, 'zclSdkExtClusterToUcComponentMap', map)
}

/**
 * Sets the selected zap config in the state.
 * @param {*} state
 * @param {*} val
 * @returns boolean
 */
export function selectZapConfig(state, val) {
  state.selectedZapConfig = val
  return true
}

/**
 * Set all endpoint data in the state.
 * @param {*} state
 * @param {*} value
 */
export function setAllEndpointsData(state, value) {
  vue3Set(state.allEndpointsData, value.endpointId, {
    selectedservers: value.servers,
    selectedReporting: value.report,
    selectedAttributes: value.attr,
    id: value.endpointId
  })
}

/**
 * Set the multiconfig in state when more than one protocol configuration or stack is selected in ZAP.
 * @param {*} state
 * @param {*} value
 */
export function setMultiConfig(state, value) {
  state.isMultiConfig = value
}

/**
 * This function changes state of showCreateModifyEndpoint and will show or hide create endpoint modal
 * @param {*} state
 * @param {*} value
 */
export function toggleEndpointModal(state, value) {
  state.showCreateModifyEndpoint = value
}

/**
 * Helps show or hide the multi-protocol tutorial.
 * @param {*} state
 * @param {*} value
 */
export function toggleCmpTutorial(state, value) {
  state.isCmpTutorialSelected = value
  state.isEndpointTutorialSelected = !value
}

/**
 * Helps show or hide the endpoint tutorial.
 * @param {*} state
 * @param {*} value
 */
export function toggleEndpointTutorial(state, value) {
  state.isEndpointTutorialSelected = value
  state.isCmpTutorialSelected = !value
}

/**
 * This function will show or hide the tutorial.
 * @param {*} state
 * @param {*} value
 */
export function toggleTutorial(state, value) {
  state.isTutorialRunning = value
  if (!value) {
    state.isEndpointTutorialSelected = false
    state.isCmpTutorialSelected = false
  }
}

/**
 * This function will expand the cluster so you can see data in it ( this function used for vue tour )
 * @param {*} state
 * @param {*} value
 */
export function triggerExpanded(state, value) {
  state.expanded = value
}

/**
 * This function will change the tab of the cluster configuration page
 * @param {*} state
 * @param {*} value
 */
export function openReportTabInCluster(state, value) {
  state.showReportTabInCluster = value
}

/**
 * This function will set data of the endpoint that you created for showing clusters
 * @param {*} state
 * @param {*} value
 */
export function setClusterDataForTutorial(state, value) {
  state.clusterDataForTutorial = value
}

/**
 * This function will check whether to show the profile id to the users or not.
 * @param {*} state
 * @param {*} value
 */
export function updateIsProfileIdShown(state, value) {
  value == 0
    ? (state.isProfileIdShown = false)
    : (state.isProfileIdShown = true)
}

/**
 * This function will set the deviceTypeRef and deviceIdentifier so users
 * can see which device is chosen in the tutorial.
 * @param {*} state
 * @param {*} value
 */
export function setDeviceTypeRefAndDeviceIdPair(state, value) {
  state.deviceTypeRefAndDeviceIdPair = {
    deviceTypeRef: value.deviceTypeRef,
    deviceIdentifier: value.deviceIdentifier
  }
}

/**
 * This function will toggle showEndpointData state and save that state
 * @param {*} state
 * @param {*} item
 */
export function toggleShowEndpoint(state, item) {
  vue3Set(state.showEndpointData, item.id, item.value)
}

/**
 * This function will update the cluster stage if cluster changed it will
 * update the endpoint data.
 * @param {*} state
 * @param {*} value
 */
export function updateIsClusterOptionChanged(state, value) {
  state.isClusterOptionChanged = value
}

/**
 * This function will update the notification count after backend updates from websocket
 * @param {*} state
 * @param {*} value
 */
export function updateNotificationCount(state, value) {
  state.notificationCount = value
}

/**
 * This function will update the device type features after a new endpoint is selected
 * @param {*} state
 * @param {*} value
 */
export function updateDeviceTypeFeatures(state, value) {
  state.deviceTypeFeatures = value
}

/**
 * Set the enabled clusters of the state.
 * @param {*} state
 * @param {*} clusters
 */
export function setEnabledClusters(state, clusters) {
  state.enabledClusters = clusters
}

/**
 * Set the relevant clusters of the state.
 * @param {*} state
 * @param {*} relevantClusters
 */
export function setRelevantClusters(state, relevantClusters) {
  state.relevantClusters = relevantClusters
}

/**
 * Updates the entire list of device type features.
 * @param {*} state
 * @param {*} data
 */
export function setDeviceTypeFeatures(state, data) {
  vue3Set(state.featureView, 'deviceTypeFeatures', data)
}

/**
 * Update the list of hash of enabled device type features.
 * @param {*} state
 * @param {*} data
 */
export function updateEnabledDeviceTypeFeatures(state, data) {
  vue3Set(state.featureView, 'enabledDeviceTypeFeatures', data)
}

/**
 * Updates the feature map attribute for all features related to a feature map attribute id.
 * @param {*} state
 * @param {*} featureMapAttributeId
 * @param {*} featureMapValue
 */
export function updateFeatureMapAttributeOfFeature(
  state,
  { featureMapAttributeId, featureMapValue }
) {
  state.featureView.deviceTypeFeatures.map((feature) => {
    if (featureMapAttributeId == feature.featureMapAttributeId) {
      feature.featureMapValue = featureMapValue
    }
  })
}

/**
 * Updates the conformDataExists state to show or hide the device type features button.
 * @param {*} state
 * @param {*} value
 */
export function updateConformDataExists(state, value) {
  vue3Set(state.featureView, 'conformDataExists', value)
}

/**
 * Set states for attributes, commands, and events within a cluster
 * that are required or not supported based on their feature conformance.
 * @param {*} state
 * @param {*} data
 */
export function setRequiredElements(state, data) {
  let { attributesToUpdate, commandsToUpdate, eventsToUpdate } = data
  vue3Set(state.attributeView, 'mandatory', attributesToUpdate.required)
  vue3Set(state.attributeView, 'notSupported', attributesToUpdate.notSupported)
  vue3Set(state.commandView, 'mandatory', commandsToUpdate.required)
  vue3Set(state.commandView, 'notSupported', commandsToUpdate.notSupported)
  vue3Set(state.eventView, 'mandatory', eventsToUpdate.required)
  vue3Set(state.eventView, 'notSupported', eventsToUpdate.notSupported)
}

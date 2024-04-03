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

function vue3Set(object, property, value) {
  object[property] = value
}

function vue3Delete(object, property) {
  delete object[property]
}

const reportingMinDefault = 1

export const togglePreviewTab = (state) => {
  state.showPreviewTab = !state.showPreviewTab
}

export const updateShowDevTools = (state) => {
  state.showDevTools = !state.showDevTools
}

export function updateInformationText(state, text) {
  state.informationText = text
}

export function setAllPackages(state, packages) {
  state.allPackages = packages
}

export function updateClusters(state, responseData) {
  let selectedEndpointTypeTemp = state.endpointTypeView.selectedEndpointType
  let selectedDeviceTypeRefs =
    state.endpointTypeView.deviceTypeRef[selectedEndpointTypeTemp]
  let packageRefs = []
  // Add custom xml packages to the list of packageRefs
  let sessionPackages = state.packages
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

  if (selectedDeviceTypeRefs) {
    for (let i = 0; i < selectedDeviceTypeRefs.length; i++) {
      for (let j = 0; j < responseData.deviceTypes.data.length; j++) {
        if (selectedDeviceTypeRefs[i] == responseData.deviceTypes.data[j].id) {
          packageRefs.push(responseData.deviceTypes.data[j].packageRef)
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

export function updateAtomics(state, atomics) {
  state.atomics = atomics
}

export function updateSelectedCluster(state, cluster) {
  state.clustersView.selected = cluster
}

export function updateSelectedEndpoint(state, endpoint) {
  state.endpointView.selectedEndpoint = endpoint
}

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

export function setEndpointTypeAttribute(state, endpointTypeAttribute) {
  let attribute = endpointTypeAttribute

  updateInclusionList(state, {
    id: attribute.id,
    added: attribute.included,
    listType: 'selectedAttributes',
    view: 'attributeView',
  })
  updateInclusionList(state, {
    id: attribute.id,
    added: attribute.singleton,
    listType: 'selectedSingleton',
    view: 'attributeView',
  })
  updateInclusionList(state, {
    id: attribute.id,
    added: attribute.bounded,
    listType: 'selectedBounded',
    view: 'attributeView',
  })
  updateInclusionList(state, {
    id: attribute.id,
    added: attribute.includedReportable,
    listType: 'selectedReporting',
    view: 'attributeView',
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

export function updateCommands(state, commands) {
  state.commands = commands
}

export function updateEvents(state, events) {
  state.events = events
}

export function updateZclDeviceTypes(state, zclDeviceTypes) {
  state.zclDeviceTypes = zclDeviceTypes
}

export function updateEndpointConfigs(state, endpoints) {
  state.endpoints = endpoints
}

export function selectConfiguration(state, configurationName) {
  state.configurationView.selected = configurationName
}

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

export function updateSelectedEndpointType(state, endpointType) {
  state.endpointTypeView.selectedEndpointType = endpointType
}

export function removeEndpointType(state, endpointType) {
  state.endpointTypeView.selectedEndpointType = []
  vue3Delete(state.endpointTypeView.name, endpointType.id)
  vue3Delete(state.endpointTypeView.deviceTypeRef, endpointType.id)
  vue3Delete(state.endpointTypeView.deviceVersion, endpointType.id)
}

export function deleteEndpoint(state, endpoint) {
  state.endpointView.selectedEndpoint = null
  vue3Delete(state.endpointView.endpointId, endpoint.id)
  vue3Delete(state.endpointView.endpointType, endpoint.id)
  vue3Delete(state.endpointView.networkId, endpoint.id)
  vue3Delete(state.endpointView.parentEndpointIdentifier, endpoint.id)
}

export function setClusterList(state, data) {
  state.clustersView.selectedClients = data.clients
  state.clustersView.selectedServers = data.servers
}

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

export function setCommandLists(state, data) {
  vue3Set(state.commandView, 'selectedIn', data.incoming)
  vue3Set(state.commandView, 'selectedOut', data.outgoing)
}
export function setEventLists(state, data) {
  vue3Set(state.eventView, 'selectedEvents', data)
}

export function setRecommendedClusterList(state, data) {
  vue3Set(state.clustersView, 'recommendedClients', data.recommendedClients)
  vue3Set(state.clustersView, 'recommendedServers', data.recommendedServers)
}

export function setRequiredAttributesList(state, data) {
  vue3Set(state.attributeView, 'requiredAttributes', data.requiredAttributes)
}

export function setRequiredCommandsList(state, data) {
  vue3Set(state.commandView, 'requiredCommands', data.requiredCommands)
}

export function setLeftDrawerState(state, data) {
  state.leftDrawerOpenState = data
}

export function setMiniState(state, data) {
  state.miniState = data
}

export function initializeEndpoints(state, endpoints) {
  endpoints.forEach((e) => {
    addEndpoint(state, e)
  })
}

export function initializeEndpointTypes(state, endpointTypes) {
  endpointTypes.forEach((et) => {
    addEndpointType(state, et)
  })
}

export function initializeSessionKeyValues(state, sessionKeyValues) {
  sessionKeyValues.forEach((skv) => {
    setSelectedGenericOption(state, skv)
  })
}

export function setOptions(state, data) {
  vue3Set(state.genericOptions, data.option, [
    ...new Set(
      data.data
        .filter((d) => d.optionCategory === data.option)
        .map((d) => {
          return { optionCode: d.optionCode, optionLabel: d.optionLabel }
        })
    ),
  ])
}

export function setSelectedGenericOption(state, keyValue) {
  vue3Set(state.selectedGenericOptions, keyValue.key, keyValue.value)
}

export function loadSessionKeyValues(state, sessionKeyValues) {
  sessionKeyValues?.data.map((keyValue) => {
    vue3Set(state.selectedGenericOptions, keyValue.key, keyValue.value)
  })
}

export function setDefaultUiMode(state, uiMode) {
  vue3Set(state.calledArgs, `defaultUiMode`, uiMode)
}

export function setDebugNavBar(state, debugNavBar) {
  state.debugNavBar = debugNavBar
}

export function setSaveButtonVisible(state, saveButtonVisible) {
  state.saveButtonVisible = saveButtonVisible
}

export function setStandalone(state, standalone) {
  state.standalone = standalone
}

export function setOpenDomain(state, context) {
  vue3Set(state.clusterManager.openDomains, context.domainName, context.value)
}

export function setDomainFilter(state, filterEnabledClusterPair) {
  let filter = filterEnabledClusterPair.filter
  state.clusterManager.filter = filter
  state.domains.map((domainName) => {
    const openDomainValue =
      state.clusterManager.filterString === ''
        ? filter.domainFilterFn(domainName, state.clusterManager.openDomains, {
            enabledClusters: filterEnabledClusterPair.enabledClusters,
          })
        : true
    setOpenDomain(state, {
      domainName: domainName,
      value: openDomainValue,
    })
  })
}

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
          enabledClusters: filterEnabledClusterPair.enabledClusters,
        }
      ),
    })
  })
}

export function setFilterString(state, filterString) {
  state.clusterManager.filterString = filterString
}

export function setIndividualClusterFilterString(state, filterString) {
  state.clusterManager.individualClusterFilterString = filterString
}

export function setLastSelectedDomain(state, domainNameString) {
  state.clusterManager.lastSelectedDomain = domainNameString
}

export function clearLastSelectedDomain(state) {
  state.clusterManager.lastSelectedDomain = null
}

export function resetFilters(state) {
  state.clusterManager.filter = {
    label: 'No Filter',
    domainFilterFn: (domain, currentOpenDomains, context) =>
      currentOpenDomains[domain],
  }
  state.clusterManager.openDomains = {}
}

export function expandedExceptionsToggle(state) {
  state.isExceptionsExpanded = !state.isExceptionsExpanded
}

export function updateExceptions(state, value) {
  state.exceptions.push(value)
}

export function toggleShowExceptionIcon(state, value) {
  state.showExceptionIcon = value
}

export function updateProjectPackages(state, packages) {
  vue3Set(state, 'packages', packages)
}

export function updateUcComponentState(state, data) {
  if (data != null) {
    vue3Set(state.studio, 'ucComponents', data.ucComponents)
    vue3Set(state.studio, 'selectedUcComponents', data.selectedUcComponents)
  }
}

export function updateSelectedUcComponentState(state, data) {
  if (data != null) {
    vue3Set(state.studio, 'selectedUcComponents', data.selectedUcComponents)
  }
}

export function loadZclClusterToUcComponentDependencyMap(state, map) {
  if (map != null)
    vue3Set(state.studio, 'zclSdkExtClusterToUcComponentMap', map)
}

export function selectZapConfig(state, val) {
  state.selectedZapConfig = val
  return true
}

export function setAllEndpointsData(state, value) {
  vue3Set(state.allEndpointsData, value.endpointId, {
    selectedservers: value.servers,
    selectedReporting: value.report,
    selectedAttributes: value.attr,
    id: value.endpointId,
  })
}

// This function change state of showCreateModifyEndpoint and will show or hide create endpoint modal
export function toggleEndpointModal(state, value) {
  state.showCreateModifyEndpoint = value
}

// This function will show you is tutorial step running or not
export function toggleTutorial(state, value) {
  state.isTutorialRunning = value
}

// This function will expand the cluster so you can see data in it ( this function used for vue tour )
export function triggerExpanded(state, value) {
  state.expanded = value
}

// This function will change the tab of the cluster configuration page
export function openReportTabInCluster(state, value) {
  state.showReportTabInCluster = value
}

// This function will open the extension modal ( this function used for vue tour )
export function openZclExtensionsDialogForTutorial(state, value) {
  state.openZclExtensionsDialog = value
}

// This function will set data of the endpoint that you created for showing clusters
export function setClusterDataForTutorial(state, value) {
  state.clusterDataForTutorial = value
}

// This function will check whether should we show the profile id to the users or no
export function updateIsProfileIdShown(state, value) {
  value == 0
    ? (state.isProfileIdShown = false)
    : (state.isProfileIdShown = true)
}

// This function will sets the deviceTypeRef and deviceIdentifier so users can see which device chosen in the tutorial
export function setDeviceTypeRefAndDeviceIdPair(state, value) {
  state.deviceTypeRefAndDeviceIdPair = {
    deviceTypeRef: value.deviceTypeRef,
    deviceIdentifier: value.deviceIdentifier,
  }
}

// This function will toggle showEndpointData state and save that state
export function toggleShowEndpoint(state, item) {
  vue3Set(state.showEndpointData, item.id, item.value)
}

// This function will update the cluster stage if cluster changed it will update the endpoint data
export function updateIsClusterOptionChanged(state, value) {
  state.isClusterOptionChanged = value
}

// Thie function will update the notification count after backend updates from websocket
export function updateNotificationCount(state, value) {
  state.notificationCount = value
}

export function setDirtyState(state, isDirty) {
  if (state.isDirty != isDirty) {
    state.isDirty = isDirty
    window.parent?.postMessage(
      { eventId: 'dirty', eventData: { isDirty: isDirty } },
      '*'
    )
  }
}

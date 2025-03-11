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
 * This module provides utilities for checking if elements meet conformance requirements
 * and generate warnings for non-conformance.
 *
 * @module Validation API: check element conformance
 */

const conformEvaluator = require('./conformance-expression-evaluator')
const queryFeature = require('../db/query-feature')
const querySessionNotice = require('../db/query-session-notification')
const queryEndpointType = require('../db/query-endpoint-type')

/**
 *
 * @export
 * @param {*} elements
 * @param {*} featureCode
 * @returns elements with conformance containing 'desc' and the feature code
 */
function filterRelatedDescElements(elements, featureCode) {
  return elements.filter((element) => {
    let terms = element.conformance.match(/[A-Za-z][A-Za-z0-9_]*/g)
    return terms && terms.includes('desc') && terms.includes(featureCode)
  })
}

/**
 * Generate a warning message after processing conformance of the updated device type feature.
 * Set flags to decide whether to show warnings or disable changes in the frontend.
 *
 * @param {*} featureData
 * @param {*} endpointId
 * @param {*} elementMap
 * @param {*} featureMap
 * @param {*} descElements
 * @returns warning message array, disableChange flag, and displayWarning flag
 */
function generateWarningMessage(
  featureData,
  endpointId,
  featureMap,
  elementMap = {},
  descElements = {}
) {
  let featureName = featureData.name
  let added = featureMap[featureData.code] ? true : false
  let deviceTypeNames = featureData.deviceTypes.join(', ')
  let result = {
    warningMessage: '',
    disableChange: true,
    displayWarning: true
  }
  result.warningMessage = []

  let warningPrefix =
    `⚠ Check Feature Compliance on endpoint: ${endpointId}, cluster: ${featureData.cluster}, ` +
    `feature: ${featureName} (bit ${featureData.bit} in featureMap attribute)`

  let missingTerms = []
  if (Object.keys(elementMap).length > 0) {
    missingTerms = conformEvaluator.checkMissingTerms(
      featureData.conformance,
      elementMap
    )
    if (missingTerms.length > 0) {
      let missingTermsString = missingTerms.join(', ')
      result.warningMessage.push(
        warningPrefix +
          ' cannot be enabled as its conformance depends on non device type features ' +
          missingTermsString +
          ' with unknown values'
      )
    }
  }

  if (
    (descElements.attributes && descElements.attributes.length > 0) ||
    (descElements.commands && descElements.commands.length > 0) ||
    (descElements.events && descElements.events.length > 0)
  ) {
    let attributeNames = descElements.attributes
      .map((attr) => attr.name)
      .join(', ')
    let commandNames = descElements.commands
      .map((command) => command.name)
      .join(', ')
    let eventNames = descElements.events.map((event) => event.name).join(', ')
    result.warningMessage.push(
      warningPrefix +
        ' cannot be enabled as ' +
        (attributeNames ? 'attribute ' + attributeNames : '') +
        (attributeNames && commandNames ? ', ' : '') +
        (commandNames ? 'command ' + commandNames : '') +
        ((attributeNames || commandNames) && eventNames ? ', ' : '') +
        (eventNames ? 'event ' + eventNames : '') +
        ' depend on the feature and their conformance are too complex to parse.'
    )
  }

  if (
    missingTerms.length == 0 &&
    (Object.keys(descElements).length == 0 ||
      (descElements.attributes.length == 0 &&
        descElements.commands.length == 0 &&
        descElements.events.length == 0))
  ) {
    let conformance = conformEvaluator.evaluateConformanceExpression(
      featureData.conformance,
      featureMap
    )
    // if no missing terms and no desc elements, enable the feature change
    result.disableChange = false
    result.displayWarning = false
    // in this case only 1 warning message is needed
    result.warningMessage = ''
    if (conformance == 'notSupported') {
      result.warningMessage =
        warningPrefix +
        ' should be disabled, as it is not supported for device type: ' +
        deviceTypeNames
      result.displayWarning = added
    }
    if (conformance == 'provisional') {
      result.warningMessage =
        warningPrefix +
        ' is enabled, but it is still provisional for device type: ' +
        deviceTypeNames
      result.displayWarning = added
    }
    if (conformance == 'mandatory') {
      result.warningMessage =
        warningPrefix +
        ' should be enabled, as it is mandatory for device type: ' +
        deviceTypeNames
      result.displayWarning = !added
    }
  }

  return result
}

/**
 * Check if elements need to be updated for correct conformance if featureData provided.
 * Otherwise, check if elements are required or unsupported by their conformance.
 *
 * @export
 * @param {*} elements
 * @param {*} featureMap
 * @param {*} featureData
 * @param {*} endpointId
 * @returns attributes, commands, and events to update, with warnings if featureData provided;
 * required and unsupported attributes, commands, and events, with warnings if not.
 */
function checkElementConformance(
  elements,
  featureMap,
  featureData = null,
  endpointId = null
) {
  let { attributes, commands, events } = elements
  let featureCode = featureData ? featureData.code : ''

  // create a map of element names/codes to their enabled status
  let elementMap = { ...featureMap }
  attributes.forEach((attribute) => {
    elementMap[attribute.name] = attribute.included
  })
  commands.forEach((command) => {
    elementMap[command.name] = command.isEnabled
  })
  events.forEach((event) => {
    elementMap[event.name] = event.included
  })
  elementMap['Matter'] = 1
  elementMap['Zigbee'] = 0

  let warningInfo = {}
  if (featureData != null) {
    let descElements = {}
    descElements.attributes = filterRelatedDescElements(attributes, featureCode)
    descElements.commands = filterRelatedDescElements(commands, featureCode)
    descElements.events = filterRelatedDescElements(events, featureCode)

    warningInfo = generateWarningMessage(
      featureData,
      endpointId,
      featureMap,
      elementMap,
      descElements
    )

    if (warningInfo.disableChange) {
      return {
        ...warningInfo,
        attributesToUpdate: [],
        commandsToUpdate: [],
        eventsToUpdate: []
      }
    }
  }

  // check element conformance for if they need update or are required
  let attributesToUpdate = featureData
    ? filterElementsToUpdate(attributes, elementMap, featureCode)
    : filterRequiredElements(attributes, elementMap, featureMap)
  let commandsToUpdate = featureData
    ? filterElementsToUpdate(commands, elementMap, featureCode)
    : filterRequiredElements(commands, elementMap, featureMap)
  let eventsToUpdate = featureData
    ? filterElementsToUpdate(events, elementMap, featureCode)
    : filterRequiredElements(events, elementMap, featureMap)

  let result = {
    attributesToUpdate: attributesToUpdate,
    commandsToUpdate: commandsToUpdate,
    eventsToUpdate: eventsToUpdate,
    elementMap: elementMap
  }
  return featureData ? { ...warningInfo, ...result } : result
}

/**
 * Return attributes, commands, or events to be updated satisfying:
 * (1) its conformance includes feature code of the updated feature
 * (2) it has mandatory conformance but it is not enabled, OR,
 * 		 it is has notSupported conformance but it is enabled
 *
 * @param {*} elements
 * @param {*} elementMap
 * @param {*} featureCode
 * @returns elements that should be updated
 */
function filterElementsToUpdate(elements, elementMap, featureCode) {
  let elementsToUpdate = []
  elements
    .filter((element) => element.conformance.includes(featureCode))
    .forEach((element) => {
      let conformance = conformEvaluator.evaluateConformanceExpression(
        element.conformance,
        elementMap
      )
      if (
        conformance == 'mandatory' &&
        (!elementMap[element.name] || elementMap[element.name] == 0)
      ) {
        element.value = true
        elementsToUpdate.push(element)
      }
      if (conformance == 'notSupported' && elementMap[element.name]) {
        element.value = false
        elementsToUpdate.push(element)
      }
    })
  return elementsToUpdate
}

/**
 * Get warnings for element requirements that are outdated after a feature update.
 *
 * @param {*} featureData
 * @param {*} elements
 * @param {*} elementMap
 * @returns array of outdated element warnings
 */
function getOutdatedElementWarning(featureData, elements, elementMap) {
  let outdatedWarnings = []

  /**
   * Build substrings of outdated warnings and add to returned array if:
   * (1) the element conformance includes the feature code
   * (2) the element conformance has changed after the feature update
   *
   * @param {*} elementType
   */
  function processElements(elementType) {
    elements[elementType].forEach((element) => {
      if (element.conformance.includes(featureData.code)) {
        let newConform = conformEvaluator.evaluateConformanceExpression(
          element.conformance,
          elementMap
        )
        let oldMap = { ...elementMap }
        oldMap[featureData.code] = !oldMap[featureData.code]
        let oldConform = conformEvaluator.evaluateConformanceExpression(
          element.conformance,
          oldMap
        )
        if (newConform != oldConform) {
          let pattern = `${element.name} has mandatory conformance to ${element.conformance} and should be`
          outdatedWarnings.push(pattern)
        }
      }
    })
  }

  processElements('attributes')
  processElements('commands')
  processElements('events')

  return outdatedWarnings
}

/**
 * Filter required and unsupported elements based on their conformance and generate warnings.
 * An element is required if it conforms to element(s) in elementMap and has 'mandatory' conform.
 * An element is unsupported if it conforms to element(s) in elementMap and has 'notSupported' conform.
 *
 * @param {*} elements
 * @param {*} elementMap
 * @param {*} featureMap
 * @returns required and not supported elements with warnings
 */
function filterRequiredElements(elements, elementMap, featureMap) {
  let requiredElements = {
    required: {},
    notSupported: {}
  }
  elements.forEach((element) => {
    let conformance = conformEvaluator.evaluateConformanceExpression(
      element.conformance,
      elementMap
    )
    let expression = element.conformance
    let terms = expression ? expression.match(/[A-Za-z][A-Za-z0-9_]*/g) : []
    let featureTerms = terms
      .filter((term) => term in featureMap)
      .map(
        (term) =>
          `feature: ${term} is ${featureMap[term] ? 'enabled' : 'disabled'}`
      )
      .join(', ')
    let elementTerms = terms
      .filter((term) => !(term in featureMap))
      .map(
        (term) =>
          `element: ${term} is ${elementMap[term] ? 'enabled' : 'disabled'}`
      )
      .join(', ')
    let combinedTerms = [featureTerms, elementTerms].filter(Boolean).join(', ')
    let conformToElement = terms.some((term) =>
      Object.keys(elementMap).includes(term)
    )

    if (conformToElement) {
      let suggestedState = ''
      if (conformance == 'mandatory') {
        suggestedState = 'enabled'
      }
      if (conformance == 'notSupported') {
        suggestedState = 'disabled'
      }

      // generate warning message for required and unsupported elements
      element.warningMessage =
        `${element.name} has mandatory conformance to ${element.conformance} ` +
        `and should be ${suggestedState} when ` +
        combinedTerms +
        '.'
      if (conformance == 'mandatory') {
        requiredElements.required[element.id] = element.warningMessage
      }
      if (conformance == 'notSupported') {
        requiredElements.notSupported[element.id] = element.warningMessage
      }
    }
  })
  return requiredElements
}

/**
 * Adds warnings to the session notification table during ZAP file imports
 * for features, attributes, commands, and events that do not correctly conform
 * within a cluster.
 * @param {*} db
 * @param {*} endpointId
 * @param {*} endpointTypeId
 * @param {*} endpointClusterId
 * @param {*} deviceTypeRefs
 * @param {*} cluster
 * @param {*} sessionId
 * @returns list of warning messages if any, otherwise false
 */
async function setConformanceWarnings(
  db,
  endpointId,
  endpointTypeId,
  endpointClusterId,
  deviceTypeRefs,
  cluster,
  sessionId
) {
  let deviceTypeFeatures = await queryFeature.getFeaturesByDeviceTypeRefs(
    db,
    deviceTypeRefs,
    endpointTypeId
  )
  let clusterFeatures = deviceTypeFeatures.filter(
    (feature) => feature.endpointTypeClusterId == endpointClusterId
  )

  if (clusterFeatures.length > 0) {
    let deviceTypeClusterId = clusterFeatures[0].deviceTypeClusterId
    let endpointTypeElements = await queryEndpointType.getEndpointTypeElements(
      db,
      endpointClusterId,
      deviceTypeClusterId
    )

    let featureMapVal = clusterFeatures[0].featureMapValue
    let featureMap = {}
    for (let feature of clusterFeatures) {
      let bit = feature.bit
      let bitVal = (featureMapVal & (1 << bit)) >> bit
      featureMap[feature.code] = bitVal
    }

    // get elements that should be mandatory or unsupported based on conformance
    let requiredElements = checkElementConformance(
      endpointTypeElements,
      featureMap
    )

    let warnings = []
    // set warnings for each feature in the cluster
    for (const featureData of clusterFeatures) {
      let warningInfo = generateWarningMessage(
        featureData,
        endpointId,
        featureMap
      )
      if (warningInfo.displayWarning && warningInfo.warningMessage) {
        warnings.push(warningInfo.warningMessage)
      }
    }

    let contextMessage = `⚠ Check Feature Compliance on endpoint: ${endpointId}, cluster: ${cluster.name}, `

    /* If unsupported elements are enabled or required elements are disabled, 
      they are considered non-conforming. A corresponding warning message will be 
      generated and added to the warnings array. */
    const filterNonConformElements = (
      elementType,
      requiredMap,
      notSupportedMap,
      elements
    ) => {
      let elementMap = {}
      elements.forEach((element) => {
        elementType == 'command'
          ? (elementMap[element.id] = element.isEnabled)
          : (elementMap[element.id] = element.included)
      })
      Object.entries(requiredMap).forEach(([id, message]) => {
        if (!(id in elementMap) || !elementMap[id]) {
          warnings.push(contextMessage + elementType + ': ' + message)
        }
      })
      Object.entries(notSupportedMap).forEach(([id, message]) => {
        if (id in elementMap && elementMap[id]) {
          warnings.push(contextMessage + elementType + ': ' + message)
        }
      })
    }

    filterNonConformElements(
      'attribute',
      requiredElements.attributesToUpdate.required,
      requiredElements.attributesToUpdate.notSupported,
      endpointTypeElements.attributes
    )
    filterNonConformElements(
      'command',
      requiredElements.commandsToUpdate.required,
      requiredElements.commandsToUpdate.notSupported,
      endpointTypeElements.commands
    )
    filterNonConformElements(
      'event',
      requiredElements.eventsToUpdate.required,
      requiredElements.eventsToUpdate.notSupported,
      endpointTypeElements.events
    )

    // set warnings in the session notification table
    if (warnings.length > 0) {
      for (const warning of warnings) {
        await querySessionNotice.setNotification(
          db,
          'WARNING',
          warning,
          sessionId,
          1,
          0
        )
      }
      return warnings
    }
  }
  return false
}

exports.checkElementConformance = checkElementConformance
exports.filterRelatedDescElements = filterRelatedDescElements
exports.getOutdatedElementWarning = getOutdatedElementWarning
exports.setConformanceWarnings = setConformanceWarnings

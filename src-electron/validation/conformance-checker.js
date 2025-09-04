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
const queryZcl = require('../db/query-zcl')
const dbEnum = require('../../src-shared/db-enum')

/**
 * Generate warning messages based on conformance checks of the updated feature and related elements.
 * Set flags to decide whether to show warnings or disable changes in the frontend.
 *
 * @param {*} featureData
 * @param {*} endpointId
 * @param {*} elementMap
 * @param {*} featureMap
 * @param {*} descElements
 * @param {*} featuresToUpdate
 * @param {*} clusterFeatures
 * @returns warning message array, disableChange flag, and displayWarning flag
 */
function generateWarningMessage(
  featureData,
  endpointId,
  featureMap,
  elementMap = {},
  descElements = {},
  featuresToUpdate = {},
  changedConformFeatures = []
) {
  // feature change is disabled by default before the checks
  let result = {
    warningMessage: [],
    disableChange: true,
    displayWarning: true
  }

  let added = featureMap[featureData.code] ? true : false

  // build warning prefix string for the given feature
  let buildWarningPrefix = (featureData) =>
    `⚠ Check Feature Compliance on endpoint: ${endpointId}, cluster: ${featureData.cluster}, ` +
    `feature: ${featureData.name} (${featureData.code}) (bit ${featureData.bit} in featureMap attribute)`
  let warningPrefix = buildWarningPrefix(featureData)

  let updateDisabledString = `cannot be ${added ? 'enabled' : 'disabled'} as`

  // Check 1: if any operands in the feature conformance are missing from elementMap
  let missingOperands = []
  if (Object.keys(elementMap).length > 0 && featureData.conformance) {
    missingOperands = conformEvaluator.checkMissingOperands(
      featureData.conformance,
      elementMap
    )
    if (missingOperands.length > 0) {
      let missingOperandsString = missingOperands.join(', ')
      result.warningMessage.push(
        warningPrefix +
          ` ${updateDisabledString} its conformance depends on the following operands with unknown values: ` +
          missingOperandsString +
          '.'
      )
    }
  }

  // Check 2: if the feature conformance contains the operand 'desc'
  let featureContainsDesc = conformEvaluator.checkIfExpressionHasOperand(
    featureData.conformance,
    dbEnum.conformanceTag.described
  )
  if (featureContainsDesc) {
    result.warningMessage.push(
      warningPrefix +
        ` ${updateDisabledString} its conformance is too complex for ZAP to process, or it includes 'desc'.`
    )
  }

  // Check 3: if the feature update will change the conformance of other dependent features
  if (featuresToUpdate && Object.keys(featuresToUpdate).length > 0) {
    let featuresToUpdateString = Object.entries(featuresToUpdate)
      .map(([feature, isEnabled]) =>
        isEnabled ? `enable ${feature}` : `disable ${feature}`
      )
      .join(' and ')
    result.warningMessage.push(
      warningPrefix +
        ` ${updateDisabledString} the following features need to be updated: ${featuresToUpdateString}.`
    )
  }

  // Check 4: if any elements that conform to the updated feature contain 'desc' in their conformance
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
        ` ${updateDisabledString} ` +
        (attributeNames ? 'attribute ' + attributeNames : '') +
        (attributeNames && commandNames ? ', ' : '') +
        (commandNames ? 'command ' + commandNames : '') +
        ((attributeNames || commandNames) && eventNames ? ', ' : '') +
        (eventNames ? 'event ' + eventNames : '') +
        ` depend on the feature and their conformance are too complex for ZAP to process, or they include 'desc'.`
    )
  }

  if (
    missingOperands.length == 0 &&
    !featureContainsDesc &&
    (Object.keys(descElements).length == 0 ||
      (descElements.attributes.length == 0 &&
        descElements.commands.length == 0 &&
        descElements.events.length == 0)) &&
    Object.keys(featuresToUpdate).length == 0
  ) {
    // if all checks above passed, enable the feature change
    result.disableChange = false
    result.displayWarning = false

    if (Object.keys(elementMap).length == 0) {
      elementMap = featureMap
    }
    let conformance = conformEvaluator.evaluateConformanceExpression(
      featureData.conformance,
      elementMap
    )

    let combinedOperands = getStateOfOperands(
      featureData.conformance,
      elementMap,
      featureMap
    )
    // if a device type is associated with the feature, add it to the warning message
    let deviceTypeString = featureData.deviceTypes
      ? `for device type: ${featureData.deviceTypes.join(', ')}`
      : ''

    // generate warning message for features that conform to elements
    let buildElementConformMessage = (state) =>
      ` has mandatory conformance to ${featureData.conformance} 
        and should be ${state} ${deviceTypeString}, when ${combinedOperands}.`
    // generate warning message for features with non-element conformance,
    // like 'M' for 'mandatory', 'P' for 'provisional', .etc.
    let buildNonElementConformMessage = (state, conformance) =>
      ` should be ${state}, as it is ${conformance} ${deviceTypeString}.`

    // in this case only 1 warning message is needed
    result.warningMessage = ''
    if (conformance == 'notSupported') {
      result.warningMessage =
        warningPrefix +
        (combinedOperands
          ? buildElementConformMessage('disabled')
          : buildNonElementConformMessage('disabled', 'not supported'))
      result.displayWarning = added
    }
    if (conformance == 'provisional') {
      result.warningMessage =
        warningPrefix + ' is enabled, but it is still provisional.'
      result.displayWarning = added
    }
    if (conformance == 'mandatory') {
      result.warningMessage =
        warningPrefix +
        (combinedOperands
          ? buildElementConformMessage('enabled')
          : buildNonElementConformMessage('enabled', 'mandatory'))
      result.displayWarning = !added
    }

    // generate patterns for outdated feature warnings to be deleted
    let updatedFeatures = [featureData, ...(changedConformFeatures || [])]
    result.outdatedWarningPatterns = updatedFeatures.flatMap((feature) => {
      let prefix = buildWarningPrefix(feature)
      return getOutdatedWarningPatterns(prefix)
    })
  }

  return result
}

/**
 * Get outdated warning patterns from a prefix
 * @param {*} prefix
 * @returns array of outdated warning patterns
 */
function getOutdatedWarningPatterns(prefix) {
  return [
    `${prefix} cannot be enabled`,
    `${prefix} cannot be disabled`,
    `${prefix} has mandatory conformance to`
  ]
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
 * @param {*} clusterFeatures
 * @returns attributes, commands, and events to update, with warnings if featureData provided;
 * required and unsupported attributes, commands, and events, with warnings if not.
 */
function checkElementConformance(
  elements,
  featureMap,
  featureData = null,
  endpointId = null,
  clusterFeatures = null
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
  elementMap['Matter'] = true
  elementMap['Zigbee'] = false

  // prepare features with updated conformance for generating warnings
  let featuresToUpdate = {}
  let changedConformFeatures = []
  if (clusterFeatures && featureData) {
    let result = conformEvaluator.checkFeaturesToUpdate(
      featureCode,
      clusterFeatures,
      elementMap
    )
    featuresToUpdate = result.updatedFeatures
    changedConformFeatures = result.changedConformFeatures
  }

  let warningInfo = {}
  if (featureData != null) {
    let descElements = {}
    descElements.attributes = conformEvaluator.filterRelatedDescElements(
      attributes,
      featureCode
    )
    descElements.commands = conformEvaluator.filterRelatedDescElements(
      commands,
      featureCode
    )
    descElements.events = conformEvaluator.filterRelatedDescElements(
      events,
      featureCode
    )

    warningInfo = generateWarningMessage(
      featureData,
      endpointId,
      featureMap,
      elementMap,
      descElements,
      featuresToUpdate,
      changedConformFeatures
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
 * @param {*} featureCode
 * @param {*} elements
 * @param {*} elementMap
 * @returns array of outdated element warnings
 */
function getOutdatedElementWarning(featureCode, elements, elementMap) {
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
      if (element.conformance.includes(featureCode)) {
        let newConform = conformEvaluator.evaluateConformanceExpression(
          element.conformance,
          elementMap
        )
        let oldMap = { ...elementMap }
        oldMap[featureCode] = !oldMap[featureCode]
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
    let combinedOperands = getStateOfOperands(
      element.conformance,
      elementMap,
      featureMap
    )

    if (combinedOperands) {
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
        `and should be ${suggestedState}, when ` +
        combinedOperands +
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
 * Generates a summary of enabled/disabled state for element operands in a conformance expression.
 *
 * @param {*} expression
 * @param {*} elementMap
 * @param {*} featureMap
 * @returns a string describing the state of conformance operands,
 * empty string if no operands conform to any element
 */
function getStateOfOperands(expression, elementMap, featureMap) {
  let operands = conformEvaluator.getOperandsFromExpression(expression)
  let nonElementOperands = Object.values(dbEnum.conformanceTag)

  let featureOperands = operands
    .filter((operand) => operand in featureMap)
    .map(
      (operand) =>
        `feature: ${operand} is ${featureMap[operand] ? 'enabled' : 'disabled'}`
    )
    .join(', ')
  let elementOperands = operands
    .filter(
      (operand) =>
        !(operand in featureMap) && !nonElementOperands.includes(operand)
    )
    .map(
      (operand) =>
        `element: ${operand} is ${elementMap[operand] ? 'enabled' : 'disabled'}`
    )
    .join(', ')
  let combinedOperands = [featureOperands, elementOperands]
    .filter(Boolean)
    .join(', ')

  let conformToElement = operands.some((operand) =>
    Object.keys(elementMap).includes(operand)
  )

  // if no operands conform to any element, return empty string
  return conformToElement ? combinedOperands : ''
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
    let endpointTypeElements = await queryEndpointType.getEndpointTypeElements(
      db,
      endpointClusterId
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

/**
 * Get the endpoint type cluster ID from feature data or by querying the database.
 *
 * @param {*} db
 * @param {*} featureData
 * @param {*} endpointTypeId
 * @param {*} clusterRef
 * @returns endpoint type cluster ID
 */
async function getEndpointTypeClusterIdFromFeatureData(
  db,
  featureData,
  endpointTypeId,
  clusterRef
) {
  if (featureData) {
    clusterRef = featureData.clusterRef
  }
  let endpointTypeClusterId =
    await queryZcl.selectEndpointTypeClusterIdByEndpointTypeIdAndClusterRefAndSide(
      db,
      endpointTypeId,
      clusterRef,
      dbEnum.clusterSide.server
    )
  return endpointTypeClusterId
}

exports.checkElementConformance = checkElementConformance
exports.getOutdatedElementWarning = getOutdatedElementWarning
exports.setConformanceWarnings = setConformanceWarnings
exports.getEndpointTypeClusterIdFromFeatureData =
  getEndpointTypeClusterIdFromFeatureData
exports.getStateOfOperands = getStateOfOperands
exports.getOutdatedWarningPatterns = getOutdatedWarningPatterns

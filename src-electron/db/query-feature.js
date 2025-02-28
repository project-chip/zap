/**
 *
 *    Copyright (c) 2021 Silicon Labs
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
 * This module provides queries for features.
 *
 * @module DB API: feature related queries
 */
const dbApi = require('./db-api')
const dbMapping = require('./db-mapping')
const queryAttribute = require('./query-attribute')
const queryCommand = require('./query-command')
const queryEvent = require('./query-event')

/**
 * Get all device type features associated with a list of device type refs and an endpoint.
 * Join ENDPOINT_TYPE_ATTRIBUTE and ATTRIBUTE table to get featureMap attribute associated with the feature,
 * so the frontend could get and set featureMap bit easier.
 * Only return features with cluster on the side specified in the device type.
 *
 * @export
 * @param {*} db
 * @param {*} deviceTypeRefs
 * @param {*} endpointTypeRef
 * @returns All feature information and device type conformance
 * with associated device type, cluster, and featureMap attribute details
 */
async function getFeaturesByDeviceTypeRefs(
  db,
  deviceTypeRefs,
  endpointTypeRef
) {
  let arg = []
  let deviceTypeRefsSql = deviceTypeRefs.map(() => '?').join(', ')
  arg.push(...deviceTypeRefs)
  arg.push(endpointTypeRef)
  let features = await dbApi.dbAll(
    db,
    `
    SELECT
			D.DESCRIPTION AS DEVICE_TYPE_NAME,
			DC.DEVICE_TYPE_CLUSTER_ID,
      DC.CLUSTER_REF,
			DC.CLUSTER_NAME,
			DC.INCLUDE_SERVER,
			DC.INCLUDE_CLIENT,
			DF.DEVICE_TYPE_CLUSTER_CONFORMANCE,
			F.FEATURE_ID,
			F.NAME AS FEATURE_NAME,
			F.CODE,
			F.BIT,
			F.DESCRIPTION,
			ETC.ENDPOINT_TYPE_CLUSTER_ID,
			ETA.ENDPOINT_TYPE_ATTRIBUTE_ID AS FEATURE_MAP_ATTRIBUTE_ID,
			ETA.DEFAULT_VALUE AS FEATURE_MAP_VALUE
    FROM
			DEVICE_TYPE D
    JOIN
			DEVICE_TYPE_CLUSTER DC
    ON 
			D.DEVICE_TYPE_ID = DC.DEVICE_TYPE_REF
    JOIN
			DEVICE_TYPE_FEATURE DF
    ON 
			DC.DEVICE_TYPE_CLUSTER_ID = DF.DEVICE_TYPE_CLUSTER_REF
    JOIN
			FEATURE F
    ON
			DF.FEATURE_REF = F.FEATURE_ID
    JOIN
			ENDPOINT_TYPE_CLUSTER ETC
    ON
			DC.CLUSTER_REF = ETC.CLUSTER_REF
    JOIN
			ENDPOINT_TYPE_ATTRIBUTE ETA
    ON
			ETC.ENDPOINT_TYPE_CLUSTER_ID = ETA.ENDPOINT_TYPE_CLUSTER_REF
    JOIN
			ATTRIBUTE A
    ON
			ETA.ATTRIBUTE_REF = A.ATTRIBUTE_ID
    WHERE
			D.DEVICE_TYPE_ID IN (${deviceTypeRefsSql})
    AND
			ETC.ENDPOINT_TYPE_REF = ?
    AND
			A.NAME = 'FeatureMap'
    AND
			A.CODE = 65532
    AND
			(
				(DC.INCLUDE_SERVER = 1 AND ETC.SIDE = 'server')
					OR
				(DC.INCLUDE_CLIENT = 1 AND ETC.SIDE = 'client')
			)
    ORDER BY
			D.DEVICE_TYPE_ID,
			DC.CLUSTER_REF,
			F.FEATURE_ID
    `,
    arg
  )
  let deviceTypeFeatures = features.map(dbMapping.map.deviceTypeFeature)

  /* For a device type feature under the same endpoint and cluster, but different device types,  
    merge their rows into one and combine their device type names into a list. */
  let result = []
  deviceTypeFeatures.forEach((row) => {
    const key = `${row.endpointTypeClusterId}-${row.featureId}`
    if (key in result) {
      let existingRow = result[key]
      if (!existingRow.deviceTypes.includes(row.deviceType)) {
        existingRow.deviceTypes.push(row.deviceType)
      }
    } else {
      result[key] = {
        ...row,
        deviceTypes: [row.deviceType]
      }
      delete result[key].deviceType
    }
  })

  return Object.values(result)
}

/**
 * Evaluate the value of a boolean conformance expression that includes terms and operators.
 * A term can be an attribute, command, event, feature, or conformance abbreviation.
 * Operators include AND (&), OR (|), and NOT (!).
 * The '[]' indicates optional conformance if the expression inside true.
 * Expression containing comma means otherwise conformance. See spec for details.
 * Examples of conformance expression: 'A & (!B | C)', 'A & B, [!C]'
 *
 * @export
 * @param {*} expression
 * @param {*} elementMap
 * @returns 'mandatory', 'optional', 'provisional', or 'notSupported'
 */
function evaluateConformanceExpression(expression, elementMap) {
  /**
   * helper function to evaluate a single boolean expression
   * @param {*} expr
   */
  function evaluateBooleanExpression(expr) {
    // Replace terms with their actual values from elementMap
    expr = expr.replace(/[A-Za-z][A-Za-z0-9_]*/g, (term) => {
      if (elementMap[term]) {
        return 'true'
      } else {
        return 'false'
      }
    })

    // Evaluate NOT (!) operators
    expr = expr.replace(/!true/g, 'false').replace(/!false/g, 'true')

    // Evaluate AND (&) and OR (|) operators by eval() function
    return eval(expr)
  }

  /**
   * helper function to process parentheses and evaluate inner expressions first
   * @param {*} expr
   */
  function evaluateWithParentheses(expr) {
    while (expr.includes('(')) {
      expr = expr.replace(/\([^()]+\)/g, (terms) =>
        evaluateBooleanExpression(terms.slice(1, -1))
      )
    }
    return evaluateBooleanExpression(expr)
  }

  // Check ',' for otherwise conformance first.
  // Split the expression by ',' and evaluate each part in sequence
  let parts = expression.split(',')
  // if any term is desc, the conformance is too complex to parse
  for (let part of parts) {
    let terms = part.match(/[A-Za-z][A-Za-z0-9_]*/g)
    if (terms && terms.includes('desc')) {
      return 'desc'
    }
  }
  for (let part of parts) {
    if (part.includes('[') && part.includes(']')) {
      // Extract and evaluate the content inside '[]'
      let optionalExpr = part.match(/\[(.*?)\]/)[1]
      let optionalResult = evaluateWithParentheses(optionalExpr)
      if (optionalResult) {
        return 'optional'
      } else {
        return 'notSupported'
      }
    } else {
      part = part.trim()
      if (part == 'M') {
        return 'mandatory'
      } else if (part == 'O') {
        return 'optional'
      } else if (part == 'D' || part == 'X') {
        return 'notSupported'
      } else if (part == 'P') {
        return 'provisional'
      } else {
        // Evaluate the part with parentheses if needed
        let result = evaluateWithParentheses(part)
        if (result) return 'mandatory'
        // if the mandatory part is false, go to the next part
      }
    }
  }

  // If none of the parts are true and no optional part was valid, return 'notSupported'
  return 'notSupported'
}

/**
 * Check if any terms in the expression are neither a key in the elementMap nor an abbreviation.
 * If so, it means the conformance depends on terms with unknown values and changes are not allowed.
 *
 * @param {*} expression
 * @param {*} elementMap
 * @returns all missing terms in an array
 */
function checkMissingTerms(expression, elementMap) {
  let terms = expression.match(/[A-Za-z][A-Za-z0-9_]*/g)
  let missingTerms = []
  let abbreviations = ['M', 'O', 'P', 'D', 'X']
  for (let term of terms) {
    if (!(term in elementMap) && !abbreviations.includes(term)) {
      missingTerms.push(term)
    }
  }
  return missingTerms
}

/**
 * Filter an array of elements by if any element has conformance containing the term 'desc'.
 *
 * @export
 * @param {*} elements
 * @returns elements with conformance containing 'desc'
 */
function filterElementsContainingDesc(elements) {
  return elements.filter((element) => {
    let terms = element.conformance.match(/[A-Za-z][A-Za-z0-9_]*/g)
    return terms && terms.includes('desc')
  })
}

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
    missingTerms = checkMissingTerms(featureData.conformance, elementMap)
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
    let conformance = evaluateConformanceExpression(
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
      let conformance = evaluateConformanceExpression(
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
        let newConform = evaluateConformanceExpression(
          element.conformance,
          elementMap
        )
        let oldMap = { ...elementMap }
        oldMap[featureData.code] = !oldMap[featureData.code]
        let oldConform = evaluateConformanceExpression(
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
    let conformance = evaluateConformanceExpression(
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
 * Check if any non-empty conformance data exist in ATTRIBUTE, COMMAND,
 * and DEVICE_TYPE_FEATURE table.
 *
 * @export
 * @param {*} db
 * @returns boolean value indicating if conformance data exists
 */
async function checkIfConformanceDataExist(db) {
  try {
    let deviceTypeFeatureRows = await dbApi.dbAll(
      db,
      'SELECT DEVICE_TYPE_CLUSTER_CONFORMANCE FROM DEVICE_TYPE_FEATURE'
    )
    let hasFeatureConformanceData = deviceTypeFeatureRows.some((row) => {
      return (
        row.DEVICE_TYPE_CLUSTER_CONFORMANCE &&
        row.DEVICE_TYPE_CLUSTER_CONFORMANCE.trim() != ''
      )
    })
    let attributeRows = await dbApi.dbAll(
      db,
      'SELECT CONFORMANCE FROM ATTRIBUTE'
    )
    let commandRows = await dbApi.dbAll(db, 'SELECT CONFORMANCE FROM COMMAND')
    let hasConformanceData = (rows) =>
      rows.some((row) => row.CONFORMANCE && row.CONFORMANCE.trim() != '')
    return (
      hasConformanceData(attributeRows) &&
      hasConformanceData(commandRows) &&
      hasFeatureConformanceData
    )
  } catch (err) {
    return false
  }
}

/**
 * Get all attributes, commands and events in an endpoint type cluster.
 * @param {*} db
 * @param {*} endpointTypeClusterId
 * @param {*} deviceTypeClusterId
 * @returns elements object containing all attributes, commands and events
 * in an endpoint type cluster
 */
async function getEndpointTypeElements(
  db,
  endpointTypeClusterId,
  deviceTypeClusterId
) {
  let [attributes, commands, events] = await Promise.all([
    queryAttribute.selectAttributesByEndpointTypeClusterIdAndDeviceTypeClusterId(
      db,
      endpointTypeClusterId,
      deviceTypeClusterId
    ),
    queryCommand.selectCommandsByEndpointTypeClusterIdAndDeviceTypeClusterId(
      db,
      endpointTypeClusterId,
      deviceTypeClusterId
    ),
    queryEvent.selectEventsByEndpointTypeClusterIdAndDeviceTypeClusterId(
      db,
      endpointTypeClusterId,
      deviceTypeClusterId
    )
  ])
  return { attributes, commands, events }
}

exports.getFeaturesByDeviceTypeRefs = getFeaturesByDeviceTypeRefs
exports.checkElementConformance = checkElementConformance
exports.generateWarningMessage = generateWarningMessage
exports.evaluateConformanceExpression = evaluateConformanceExpression
exports.filterElementsContainingDesc = filterElementsContainingDesc
exports.filterRelatedDescElements = filterRelatedDescElements
exports.checkIfConformanceDataExist = checkIfConformanceDataExist
exports.getOutdatedElementWarning = getOutdatedElementWarning
exports.getEndpointTypeElements = getEndpointTypeElements

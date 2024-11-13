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
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')

/**
 * Get all device type features associated with a list of device type refs and an endpoint.
 * Join ENDPOINT_TYPE_ATTRIBUTE and ATTRIBUTE table to get featureMap attribute associated with the feature,
 * so the frontend could get and set featureMap bit easier.
 * Only return features with cluster on the side specified in the deivce type.
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
			d.DESCRIPTION AS DEVICE_TYPE_NAME,
			dc.DEVICE_TYPE_CLUSTER_ID,
      dc.CLUSTER_REF,
			dc.CLUSTER_NAME,
			dc.INCLUDE_SERVER,
			dc.INCLUDE_CLIENT,
			df.DEVICE_TYPE_CLUSTER_CONFORMANCE,
			f.FEATURE_ID,
			f.NAME AS FEATURE_NAME,
			f.CODE,
			f.BIT,
			f.DESCRIPTION,
			etc.ENDPOINT_TYPE_CLUSTER_ID,
			eta.ENDPOINT_TYPE_ATTRIBUTE_ID AS FEATUREMAP_ATTRIBUTE_ID,
			eta.DEFAULT_VALUE AS FEATUREMAP_VALUE
    FROM
			DEVICE_TYPE d
    JOIN
			DEVICE_TYPE_CLUSTER dc
    ON 
			d.DEVICE_TYPE_ID = dc.DEVICE_TYPE_REF
    JOIN
			DEVICE_TYPE_FEATURE df
    ON 
			dc.DEVICE_TYPE_CLUSTER_ID = df.DEVICE_TYPE_CLUSTER_REF
    JOIN
			FEATURE f
    ON
			df.FEATURE_REF = f.FEATURE_ID
    JOIN
			ENDPOINT_TYPE_CLUSTER etc
    ON
			dc.CLUSTER_REF = etc.CLUSTER_REF
    JOIN
			ENDPOINT_TYPE_ATTRIBUTE eta
    ON
			etc.ENDPOINT_TYPE_CLUSTER_ID = eta.ENDPOINT_TYPE_CLUSTER_REF
    JOIN
			ATTRIBUTE a
    ON
			eta.ATTRIBUTE_REF = a.ATTRIBUTE_ID
    WHERE
			d.DEVICE_TYPE_ID IN (${deviceTypeRefsSql})
    AND
			etc.ENDPOINT_TYPE_REF = ?
    AND
			a.NAME = 'FeatureMap'
    AND
			a.CODE = 65532
    AND
			(
				(dc.INCLUDE_SERVER = 1 AND etc.SIDE = 'server')
					OR
				(dc.INCLUDE_CLIENT = 1 AND etc.SIDE = 'client')
			)
    ORDER BY
			d.DEVICE_TYPE_ID,
			dc.CLUSTER_REF,
			f.FEATURE_ID
    `,
    arg
  )
  return features.map(dbMapping.map.deviceTypeFeature)
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
    expr = expr.replace(/[A-Za-z][A-Za-z0-9]*/g, (term) => {
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
    let terms = part.match(/[A-Za-z][A-Za-z0-9]*/g)
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
  let terms = expression.match(/[A-Za-z][A-Za-z0-9]*/g)
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
    let terms = element.conformance.match(/[A-Za-z][A-Za-z0-9]*/g)
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
    let terms = element.conformance.match(/[A-Za-z][A-Za-z0-9]*/g)
    return terms && terms.includes('desc') && terms.includes(featureCode)
  })
}

/**
 * Generate a warning message after processing conformance of the updated device type feature.
 * Set flags to decide whether to show a popup warning or disable changes in the frontend.
 *
 * @param {*} featureData
 * @param {*} endpointId
 * @param {*} missingTerms
 * @param {*} featureMap
 * @param {*} descElements
 * @returns warning message array, disableChange flag, and displayWarning flag
 */
function generateWarningMessage(
  featureData,
  endpointId,
  missingTerms,
  featureMap,
  descElements
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

  if (missingTerms.length > 0) {
    let missingTermsString = missingTerms.join(', ')
    result.warningMessage.push(
      'On Endpoint ' +
        endpointId +
        ', feature ' +
        featureName +
        ' cannot be enabled as its conformance depends on non device type features ' +
        missingTermsString +
        ' with unknown values'
    )
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
      'On endpoint ' +
        endpointId +
        ', feature ' +
        featureName +
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
    descElements.attributes.length == 0 &&
    descElements.commands.length == 0 &&
    descElements.events.length == 0
  ) {
    let conformance = evaluateConformanceExpression(
      featureData.conformance,
      featureMap
    )
    // change is not disabled, by default does not display warning
    result.disableChange = false
    result.displayWarning = false
    // in this case only 1 warning message is needed
    result.warningMessage = ''
    if (conformance == 'notSupported') {
      result.warningMessage =
        'On endpoint ' +
        endpointId +
        ', feature ' +
        featureName +
        ' is enabled, but it is not supported for device type ' +
        deviceTypeNames
      result.displayWarning = added
    }
    if (conformance == 'provisional') {
      result.warningMessage =
        'On endpoint ' +
        endpointId +
        ', feature ' +
        featureName +
        ' is enabled, but it is still provisional for device type ' +
        deviceTypeNames
      result.displayWarning = added
    }
    if (conformance == 'mandatory') {
      result.warningMessage =
        'On endpoint ' +
        endpointId +
        ', feature ' +
        featureName +
        ' is disabled, but it is mandatory for device type ' +
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
  let elementMap = featureMap
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

    let missingTerms = checkMissingTerms(featureData.conformance, elementMap)
    warningInfo = generateWarningMessage(
      featureData,
      endpointId,
      missingTerms,
      featureMap,
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
          let pattern = `${element.name} conforms to ${element.conformance} and is`
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
    let terms = expression ? expression.match(/[A-Za-z][A-Za-z0-9]*/g) : []
    let featureTerms = terms.filter((term) => term in featureMap).join(', ')
    let elementTerms = terms.filter((term) => !(term in featureMap)).join(', ')
    let conformToElement = terms.some((term) =>
      Object.keys(elementMap).includes(term)
    )

    if (conformToElement) {
      let conformState = ''
      if (conformance == 'mandatory') {
        conformState = 'mandatory'
      }
      if (conformance == 'notSupported') {
        conformState = 'not supported'
      }

      // generate warning message for required and unsupported elements
      element.warningMessage =
        `${element.name} conforms to ${element.conformance} and is ` +
        `${conformState}` +
        (featureTerms ? ` based on state of feature: ${featureTerms}` : '') +
        (featureTerms && elementTerms ? ', ' : '') +
        (elementTerms ? `element: ${elementTerms}` : '') +
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
 * Check if DEVICE_TYPE_FEATURE table exists and is not empty.
 *
 * @export
 * @param {*} db
 * @returns true if DEVICE_TYPE_FEATURE table is not empty, false if not
 */
async function checkIfDeviceTypeFeatureDataExist(db) {
  try {
    let rows = await dbApi.dbAll(db, 'SELECT * FROM DEVICE_TYPE_FEATURE')
    return rows.length > 0
  } catch (err) {
    return false
  }
}

exports.getFeaturesByDeviceTypeRefs = getFeaturesByDeviceTypeRefs
exports.checkElementConformance = checkElementConformance
exports.evaluateConformanceExpression = evaluateConformanceExpression
exports.filterElementsContainingDesc = filterElementsContainingDesc
exports.filterRelatedDescElements = filterRelatedDescElements
exports.checkIfDeviceTypeFeatureDataExist = checkIfDeviceTypeFeatureDataExist
exports.getOutdatedElementWarning = getOutdatedElementWarning

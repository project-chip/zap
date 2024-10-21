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
const querySessionNotification = require('./query-session-notification.js')

/**
 * Get all device type features associated with a list of device type refs and an endpoint.
 * Join ENDPOINT_TYPE_ATTRIBUTE and ATTRIBUTE table to get featureMap attribute associated with the feature,
 * so the frontend could get and set featureMap bit easier.
 * Only return features with cluster on the side specified in the deivce type.
 *
 * @export
 * @param {*} db
 * @param {*} deviceTypeRefs
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
 * A term can be an attribute, command, feature, or conformance abbreviation.
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
 * Generate a warning message after processing conformance of the updated device type feature.
 * Set flags to decide whether to show a popup warning or disable changes in the frontend.
 *
 * @param {*} featureData
 * @param {*} endpointId
 * @param {*} missingTerms
 * @param {*} added
 * @returns warning message, disableChange flag, and displayWarning flag
 */
function generateWarningMessage(featureData, endpointId, missingTerms, added) {
  let featureConformanceExpression = featureData.conformance
  let featureName = featureData.name
  let deviceTypeNames = featureData.deviceTypes.join(', ')
  let result = {
    warningMessage: '',
    disableChange: false,
    displayWarning: false
  }

  if (missingTerms.length > 0) {
    let missingTermsString = missingTerms.join(', ')
    result.warningMessage =
      'On Endpoint ' +
      endpointId +
      ', feature ' +
      featureName +
      ' cannot be enabled as its conformance depends on non device type features ' +
      missingTermsString +
      ' with unknown values'
    result.displayWarning = true
    result.disableChange = true
    return result
  }

  let conformance = evaluateConformanceExpression(featureConformanceExpression)

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

  return result
}

/**
 * Check if attributes and commands need to be updated for correct conformance.
 *
 * @export
 * @param {*} elements
 * @param {*} featureMap
 * @param {*} featureData
 * @param {*} endpointId
 * @returns attributes and commands to be updated, warning related information
 */
function checkElementsToUpdate(elements, featureMap, featureData, endpointId) {
  let { attributes, commands } = elements
  let featureCode = featureData.code

  // create a map of element names/codes to their enabled status
  let elementMap = featureMap
  attributes.forEach((attribute) => {
    elementMap[attribute.name] = attribute.included
  })
  commands.forEach((command) => {
    elementMap[command.name] = command.isEnabled
  })
  elementMap['Matter'] = 1
  elementMap['Zigbee'] = 0

  let added = featureMap[featureCode] ? true : false
  let missingTerms = checkMissingTerms(featureData.conformance, elementMap)
  let warningInfo = generateWarningMessage(
    featureData,
    endpointId,
    missingTerms,
    added
  )

  if (warningInfo.disableChange) {
    return {
      ...warningInfo,
      attributesToUpdate: [],
      commandsToUpdate: []
    }
  }

  let attributesToUpdate = filterElementsToUpdate(
    attributes,
    elementMap,
    featureCode
  )
  let commandsToUpdate = filterElementsToUpdate(
    commands,
    elementMap,
    featureCode
  )

  return {
    ...warningInfo,
    attributesToUpdate: attributesToUpdate,
    commandsToUpdate: commandsToUpdate
  }
}

/**
 * Return attributes and commands to be updated satisfying:
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

exports.getFeaturesByDeviceTypeRefs = getFeaturesByDeviceTypeRefs
exports.checkElementsToUpdate = checkElementsToUpdate
exports.evaluateConformanceExpression = evaluateConformanceExpression

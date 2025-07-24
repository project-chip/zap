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
 * This module provides utilities for evaluating conformance expressions.
 *
 * @module Validation API: Evaluate conformance expressions
 */

const dbEnum = require('../../src-shared/db-enum')

const OPERAND_REGEX = /[A-Za-z][A-Za-z0-9_]*/g

/**
 * Evaluate the value of a boolean conformance expression that includes operands and operators.
 * An operand can be an attribute, command, event, feature, or conformance abbreviation.
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
    // Replace operands with their actual values from elementMap
    expr = expr.replace(OPERAND_REGEX, (operand) => {
      return elementMap[operand] ? 'true' : 'false'
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
      expr = expr.replace(/\([^()]+\)/g, (operands) =>
        evaluateBooleanExpression(operands.slice(1, -1))
      )
    }
    return evaluateBooleanExpression(expr)
  }

  // Check ',' for otherwise conformance first.
  // Split the expression by ',' and evaluate each part in sequence
  let parts = expression.split(',').map((part) => part.trim())
  // if any operand is desc, the conformance is too complex to parse
  for (let part of parts) {
    let operands = getOperandsFromExpression(part)
    if (operands && operands.includes(dbEnum.conformanceTag.desc)) {
      return dbEnum.conformanceTag.desc
    }
  }
  for (let part of parts) {
    if (part.includes('[') && part.includes(']')) {
      // Extract and evaluate the content inside '[]'
      let optionalExpr = part.match(/\[(.*?)\]/)[1]
      let optionalResult = evaluateWithParentheses(optionalExpr)
      if (optionalResult) {
        return dbEnum.conformanceVal.optional
      } else {
        return dbEnum.conformanceVal.notSupported
      }
    } else if (part == dbEnum.conformanceTag.mandatory) {
      return dbEnum.conformanceVal.mandatory
    } else if (part == dbEnum.conformanceTag.optional) {
      return dbEnum.conformanceVal.optional
    } else if (
      part == dbEnum.conformanceTag.deprecated ||
      part == dbEnum.conformanceTag.disallowed
    ) {
      return dbEnum.conformanceVal.notSupported
    } else if (part == dbEnum.conformanceTag.provisional) {
      return dbEnum.conformanceVal.provisional
    } else {
      // Evaluate the part with parentheses if needed
      let result = evaluateWithParentheses(part)
      if (result) return dbEnum.conformanceVal.mandatory
      // if the mandatory part is false, go to the next part
    }
  }

  // If none of the parts are true and no optional part was valid, return 'notSupported'
  return dbEnum.conformanceVal.notSupported
}

/**
 * Check if any operands in the expression are neither a key in the elementMap nor an abbreviation.
 * If so, it means the conformance depends on operands with unknown values and changes are not allowed.
 *
 * @param {*} expression
 * @param {*} elementMap
 * @returns all missing operands in an array
 */
function checkMissingOperands(expression, elementMap) {
  let operands = getOperandsFromExpression(expression)
  let missingOperands = []
  let abbreviations = Object.values(dbEnum.conformanceTag)
  for (let operand of operands) {
    if (!(operand in elementMap) && !abbreviations.includes(operand)) {
      missingOperands.push(operand)
    }
  }
  return missingOperands
}

/**
 * Check if the expression contains a given operand.
 *
 * @param expression
 * @param operand
 * @returns true if the expression contains the operand, false otherwise
 */
function checkIfExpressionHasOperand(expression, operand) {
  let operands = getOperandsFromExpression(expression)
  return operands && operands.includes(operand)
}

/**
 * Extract operands from a conformance expression.
 *
 * @param {*} expression
 * @returns {string[]} Array of operands extracted from the expression
 */
function getOperandsFromExpression(expression) {
  if (!expression) return []
  let operands = expression.match(OPERAND_REGEX)
  return operands ? operands : []
}

/**
 * Filter elements that have conformance containing 'desc' and given feature code.
 *
 * @export
 * @param {*} elements
 * @param {*} featureCode
 * @returns elements with conformance containing 'desc' and given feature code
 */
function filterRelatedDescElements(elements, featureCode) {
  return elements.filter((element) => {
    let operands = getOperandsFromExpression(element.conformance)
    return (
      operands &&
      operands.includes(dbEnum.conformanceTag.desc) &&
      operands.includes(featureCode)
    )
  })
}

/**
 * Check which features need to be updated or have conformance changes due to the updated feature.
 *
 * @param {*} updatedFeatureCode
 * @param {*} clusterFeatures
 * @param {*} elementMap
 * @returns {Object} Contains:
 *   - updatedFeatures: Map of features with incorrect conformance that need to be updated.
 *   - changedConformFeatures: Array of feature objects with conformance value changed after the feature update.
 */
function checkFeaturesToUpdate(
  updatedFeatureCode,
  clusterFeatures,
  elementMap
) {
  // build a map of feature codes to their conformance expressions
  let featureConformance = clusterFeatures.reduce((map, feature) => {
    map[feature.code] = feature.conformance
    return map
  }, {})

  let updatedFeatures = {}
  let changedConformFeatures = []
  for (let [featureCode, expression] of Object.entries(featureConformance)) {
    if (featureCode == updatedFeatureCode) {
      continue
    }

    // skip if conformance is not related to the updated feature
    let operands = getOperandsFromExpression(expression)
    if (!operands.includes(updatedFeatureCode)) {
      continue
    }

    let conformance = evaluateConformanceExpression(expression, elementMap)

    if (conformance == 'mandatory' && !elementMap[featureCode]) {
      updatedFeatures[featureCode] = true
    }
    if (conformance == 'notSupported' && elementMap[featureCode]) {
      updatedFeatures[featureCode] = false
    }

    let oldElementMap = { ...elementMap }
    oldElementMap[updatedFeatureCode] = !oldElementMap[updatedFeatureCode]
    let oldConformance = evaluateConformanceExpression(
      expression,
      oldElementMap
    )

    // compare conformance before and after the feature update
    if (conformance !== oldConformance) {
      changedConformFeatures.push(featureCode)
    }
  }

  changedConformFeatures = changedConformFeatures.map((code) => {
    return clusterFeatures.find((feature) => feature.code == code)
  })

  return { updatedFeatures, changedConformFeatures }
}

exports.evaluateConformanceExpression = evaluateConformanceExpression
exports.checkMissingOperands = checkMissingOperands
exports.checkIfExpressionHasOperand = checkIfExpressionHasOperand
exports.checkFeaturesToUpdate = checkFeaturesToUpdate
exports.filterRelatedDescElements = filterRelatedDescElements
exports.getOperandsFromExpression = getOperandsFromExpression

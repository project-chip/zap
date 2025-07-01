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
    if (terms && terms.includes(dbEnum.conformance.desc)) {
      return dbEnum.conformance.desc
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
      if (part == dbEnum.conformance.mandatory) {
        return 'mandatory'
      } else if (part == dbEnum.conformance.optional) {
        return 'optional'
      } else if (
        part == dbEnum.conformance.deprecated ||
        part == dbEnum.conformance.disallowed
      ) {
        return 'notSupported'
      } else if (part == dbEnum.conformance.provisional) {
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
  let abbreviations = Object.values(dbEnum.conformance)
  for (let term of terms) {
    if (!(term in elementMap) && !abbreviations.includes(term)) {
      missingTerms.push(term)
    }
  }
  return missingTerms
}

/**
 * Check if the expression contains a given term.
 *
 * @param expression
 * @param term
 * @returns true if the expression contains the term, false otherwise
 */
function checkIfExpressionHasTerm(expression, term) {
  let terms = expression.match(/[A-Za-z][A-Za-z0-9_]*/g)
  return terms && terms.includes(term)
}

exports.evaluateConformanceExpression = evaluateConformanceExpression
exports.checkMissingTerms = checkMissingTerms
exports.checkIfExpressionHasTerm = checkIfExpressionHasTerm

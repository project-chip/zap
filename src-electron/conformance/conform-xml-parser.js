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
 * This module provides utilities for parsing conformance data from XML into expressions.
 *
 * @module Conformance API: Parse conformance data from XML
 */

/**
 * Parses conformance from XML data.
 * The conformance could come from features, attributes, commands, or events
 *
 * Call recursive helper function to parse conformance only if the conformance exists.
 * Otherwise, return empty string directly
 *
 * An example of parsing the conformance of 'User' device type feature:
 *
 * Input operand from xml data:
 * {
 *   "$": {"code": "USR", "name": "User"},
 *   "mandatoryConform": [
 *      { "andTerm": [
 *           {
 *             "condition": [{"$": {"name": "Matter"}}],
 *             "orTerm": [
 *                 { "feature": [
 *                      { "$": {"name": "PIN"}},
 *                      { "$": {"name": "RID"}},
 *                      { "$": {"name": "FGP"}},
 *                      { "$": {"name": "FACE"}}
 *                   ]
 *                 }
 *               ]
 *            }
 *          ]
 *        }
 *    ]
 * }
 *
 * Output conformance string:
 *  "Matter & (PIN | RID | FGP | FACE)"
 *
 * @param {*} operand
 * @returns The conformance string
 */
function parseConformanceFromXML(operand) {
  let hasConformance = Object.keys(operand).some((key) =>
    key.includes('Conform')
  )
  return hasConformance ? parseConformanceRecursively(operand) : ''
}

/**
 * helper function to parse conformance or an operand in conformance recursively
 *
 * The baseLevelTerms variable include terms that can not have nested terms.
 * When they appear, stop recursing and return the name inside directly
 *
 * @param {*} operand
 * @param {*} depth
 * @param {*} parentJoinChar
 * @returns The conformance string.
 */
function parseConformanceRecursively(operand, depth = 0, parentJoinChar = '') {
  if (depth > 200) {
    throw new Error(`Maximum recursion depth exceeded 
      when parsing conformance: ${JSON.stringify(operand)}`)
  }
  const baseLevelTerms = ['feature', 'condition', 'attribute', 'command']
  if (operand.mandatoryConform) {
    let insideTerm = operand.mandatoryConform[0]
    // Recurse further if insideTerm is not empty
    if (insideTerm && Object.keys(insideTerm).toString() != '$') {
      return parseConformanceRecursively(operand.mandatoryConform[0], depth + 1)
    } else {
      return 'M'
    }
  } else if (operand.optionalConform) {
    let insideTerm = operand.optionalConform[0]
    // check '$' key is not the only key in the object to handle special cases
    // e.g. '<optionalConform choice="a" more="true"/>'
    if (insideTerm && Object.keys(insideTerm).toString() != '$') {
      return `[${parseConformanceRecursively(operand.optionalConform[0], depth + 1)}]`
    } else {
      return 'O'
    }
  } else if (operand.otherwiseConform) {
    return Object.entries(operand.otherwiseConform[0])
      .map(([key, value]) =>
        parseConformanceRecursively({ [key]: value }, depth + 1)
      )
      .join(', ')
  } else if (operand.notTerm) {
    // need to surround terms inside a notTerm with '()' if it contains multiple terms
    // e.g. !(A | B) or !(A & B)
    // able to process multiple parallel notTerms, e.g. !A & !B
    return operand.notTerm
      .map((term) => {
        let nt = parseConformanceRecursively(term, depth + 1)
        return nt.includes('&') || nt.includes('|') ? `!(${nt})` : `!${nt}`
      })
      .join(` ${parentJoinChar} `)
  } else if (operand.andTerm || operand.orTerm) {
    // process andTerm and orTerm in the same logic
    // when joining multiple orTerms inside andTerms, we need to
    // surround them with '()', vice versa for andTerms inside orTerms
    // e.g. A & (B | C) or A | (B & C)
    let joinChar = operand.andTerm ? '&' : '|'
    let termKey = operand.andTerm ? 'andTerm' : 'orTerm'
    let oppositeChar = joinChar == '&' ? '|' : '&'
    return Object.entries(operand[termKey][0])
      .map(([key, value]) => {
        if (baseLevelTerms.includes(key)) {
          return value.map((operand) => operand.$.name).join(` ${joinChar} `)
        } else {
          let terms = parseConformanceRecursively(
            { [key]: value },
            depth + 1,
            joinChar
          )
          return terms.includes(oppositeChar) ? `(${terms})` : terms
        }
      })
      .join(` ${joinChar} `)
  } else if (operand.provisionalConform) {
    return 'P'
  } else if (operand.disallowConform) {
    return 'X'
  } else if (operand.deprecateConform) {
    return 'D'
  } else {
    // reach base level terms, return the name directly
    for (const term of baseLevelTerms) {
      if (operand[term]) {
        return operand[term][0].$.name
      }
    }
    // reaching here means the term is too complex to parse
    return 'desc'
  }
}

exports.parseConformanceFromXML = parseConformanceFromXML

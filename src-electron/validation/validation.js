/**
 *
 *    Copyright (c) 2020 Silicon Labs
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
 * This module provides the APIs for validating inputs to the database, and returning flags indicating if
 * things were successful or not.
 *
 */

const queryZcl = require('../db/query-zcl.js')
const queryConfig = require('../db/query-config.js')
const dbApi = require('../db/db-api.js')

function validateAttribute(db, endpointTypeId, attributeRef, clusterRef) {
  return queryZcl
    .selectEndpointTypeAttribute(db, endpointTypeId, attributeRef, clusterRef)
    .then((endpointAttribute) =>
      queryZcl.selectAttributeById(db, attributeRef).then(
        (attribute) =>
          new Promise((resolve, reject) => {
            resolve(validateSpecificAttribute(endpointAttribute, attribute))
          })
      )
    )
}

function validateEndpoint(db, endpointId) {
  return queryConfig.selectEndpoint(db, endpointId).then((endpoint) => {
    return new Promise((resolve, reject) => {
      resolve(validateSpecificEndpoint(endpoint))
    }).then((currentIssues) => {
      return validateNoDuplicateEndpoints(
        db,
        endpoint.endpointId,
        endpoint.sessionRef
      ).then((noDuplicates) => {
        if (!noDuplicates) {
          currentIssues.endpointId.push('Duplicate EndpointIds Exist')
        }
        return currentIssues
      })
    })
  })
}

function validateNoDuplicateEndpoints(db, endpointIdentifier, sessionRef) {
  return queryConfig
    .getCountOfEndpointsWithGivenEndpointIdentifier(
      db,
      endpointIdentifier,
      sessionRef
    )
    .then((count) => count.length <= 1)
}

function validateSpecificAttribute(endpointAttribute, attribute) {
  var defaultAttributeIssues = []
  if (!isStringType(attribute.type)) {
    if (isFloatType(attribute.type)) {
      if (!isValidFloat(endpointAttribute.defaultValue))
        defaultAttributeIssues.push('Invalid Float')
      //Interpreting float values
      if (!checkAttributeBoundsFloat(attribute, endpointAttribute))
        defaultAttributeIssues.push('Out of range')
    } else {
      if (!isValidNumberString(endpointAttribute.defaultValue))
        defaultAttributeIssues.push('Invalid Integer')
      if (!checkAttributeBoundsInteger(attribute, endpointAttribute))
        defaultAttributeIssues.push('Out of range')
    }
  }
  return { defaultValue: defaultAttributeIssues }
}

function validateSpecificEndpoint(endpoint) {
  var zclEndpointIdIssues = []
  var zclNetworkIdIssues = []
  if (!isValidNumberString(endpoint.endpointId))
    zclEndpointIdIssues.push('EndpointId is invalid number string')
  if (
    extractIntegerValue(endpoint.endpointId) > 0xffff ||
    extractIntegerValue(endpoint.endpointId) < 0
  )
    zclEndpointIdIssues.push('EndpointId is out of valid range')
  if (!isValidNumberString(endpoint.networkId))
    zclNetworkIdIssues.push('NetworkId is invalid number string')
  if (extractIntegerValue(endpoint.endpointId) == 0)
    zclEndpointIdIssues.push('0 is not a valid endpointId')
  return {
    endpointId: zclEndpointIdIssues,
    networkId: zclNetworkIdIssues,
  }
}

//This applies to both actual numbers as well as octet strings.
function isValidNumberString(value) {
  //We test to see if the number is valid in hex. Decimals numbers also pass this test
  return /^(0x|0X)?[0-9a-fA-F]+$/.test(value)
}

function isValidFloat(value) {
  return /^[0-9]*(\.)?[0-9]*$/.test(value)
}

function extractFloatValue(value) {
  return parseFloat(value)
}

function extractIntegerValue(value) {
  if (/^[0-9]+$/.test(value)) {
    return parseInt(value)
  } else if (/^[0-9ABCDEF]+$/.test(value)) {
    return parseInt(value, 16)
  } else {
    return parseInt(value, 16)
  }
}

function getBoundsInteger(attribute) {
  return {
    min: extractIntegerValue(attribute.min),
    max: extractIntegerValue(attribute.max),
  }
}

function checkAttributeBoundsInteger(attribute, endpointAttribute) {
  var { min, max } = getBoundsInteger(attribute)
  var defaultValue = extractIntegerValue(endpointAttribute.defaultValue)
  return checkBoundsInteger(defaultValue, min, max)
}

function checkBoundsInteger(defaultValue, min, max) {
  if (Number.isNaN(min)) min = Number.MIN_SAFE_INTEGER
  if (Number.isNaN(max)) max = Number.MAX_SAFE_INTEGER
  return defaultValue >= min && defaultValue <= max
}

function checkAttributeBoundsFloat(attribute, endpointAttribute) {
  var { min, max } = getBoundsFloat(attribute)
  var defaultValue = extractFloatValue(endpointAttribute.defaultValue)
  return checkBoundsFloat(defaultValue, min, max)
}

function getBoundsFloat(attribute) {
  return {
    min: extractFloatValue(attribute.min),
    max: extractFloatValue(attribute.max),
  }
}

function checkBoundsFloat(defaultValue, min, max) {
  if (Number.isNaN(min)) min = Number.MIN_VALUE
  if (Number.isNaN(max)) max = Number.MAX_VALUE
  return defaultValue >= min && defaultValue <= max
}

// This function checks to see if
function isStringType(type) {
  switch (type.toUpperCase()) {
    case 'CHAR_STRING':
    case 'OCTET_STRING':
    case 'LONG_CHAR_STRING':
    case 'LONG_OCTET_STRING':
      return true
    default:
      return false
  }
}

function isFloatType(type) {
  switch (type) {
    case 'FLOAT_SEMI':
    case 'FLOAT_SINGLE':
    case 'FLOAT_DOUBLE':
      return true
    default:
      return false
  }
}

// exports
exports.validateAttribute = validateAttribute
exports.validateEndpoint = validateEndpoint
exports.validateNoDuplicateEndpoints = validateNoDuplicateEndpoints
exports.validateSpecificAttribute = validateSpecificAttribute
exports.validateSpecificEndpoint = validateSpecificEndpoint
exports.isValidNumberString = isValidNumberString
exports.isValidFloat = isValidFloat
exports.extractFloatValue = extractFloatValue
exports.extractIntegerValue = extractIntegerValue
exports.getBoundsInteger = getBoundsInteger
exports.checkBoundsInteger = checkBoundsInteger
exports.getBoundsFloat = getBoundsFloat
exports.checkBoundsFloat = checkBoundsFloat
exports.isStringType = isStringType
exports.isFloatType = isFloatType

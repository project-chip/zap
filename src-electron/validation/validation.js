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
const queryEndpoint = require('../db/query-endpoint.js')
const types = require('../util/types.js')
const queryPackage = require('../db/query-package.js')

/**
 * Main attribute validation function.
 * Returns a promise of an object which stores a list of validational issues.
 * Such issues as "Invalid type" or "Out of Range".
 * @param {*} db db reference
 * @param {*} endpointTypeId endpoint reference
 * @param {*} attributeRef attribute reference
 * @param {*} clusterRef cluster reference
 * @param {*} zapSessionId session reference
 * @returns Promise of the list of issues
 */
async function validateAttribute(
  db,
  endpointTypeId,
  attributeRef,
  clusterRef,
  zapSessionId
) {
  let endpointAttribute = await queryZcl.selectEndpointTypeAttribute(
    db,
    endpointTypeId,
    attributeRef,
    clusterRef
  )
  let attribute = await queryZcl.selectAttributeById(db, attributeRef)
  return validateSpecificAttribute(
    endpointAttribute,
    attribute,
    db,
    zapSessionId,
    clusterRef
  )
}

async function validateEndpoint(db, endpointId) {
  let endpoint = await queryEndpoint.selectEndpoint(db, endpointId)
  let currentIssues = validateSpecificEndpoint(endpoint)
  let noDuplicates = await validateNoDuplicateEndpoints(
    db,
    endpoint.endpointId,
    endpoint.sessionRef
  )
  if (!noDuplicates) {
    currentIssues.endpointId.push('Duplicate EndpointIds Exist')
  }
  return currentIssues
}

async function validateNoDuplicateEndpoints(
  db,
  endpointIdentifier,
  sessionRef
) {
  let count =
    await queryConfig.selectCountOfEndpointsWithGivenEndpointIdentifier(
      db,
      endpointIdentifier,
      sessionRef
    )
  return count.length <= 1
}

/**
 * Checks the attributes type then validates the incoming input string.
 * @param {*} endpointAttribute
 * @param {*} attribute
 * @param {*} db
 * @param {*} zapSessionId
 * @param {*} clusterRef
 * @returns List of issues wrapped in an object
 */
async function validateSpecificAttribute(
  endpointAttribute,
  attribute,
  db,
  zapSessionId,
  clusterRef
) {
  let defaultAttributeIssues = []
  if (attribute.isNullable && endpointAttribute.defaultValue == null) {
    return { defaultValue: defaultAttributeIssues }
  } else if (!types.isString(attribute.type)) {
    if (types.isFloat(attribute.type)) {
      if (!isValidFloat(endpointAttribute.defaultValue))
        defaultAttributeIssues.push('Invalid Float')
      //Interpreting float values
      if (!checkAttributeBoundsFloat(attribute, endpointAttribute))
        defaultAttributeIssues.push('Out of range')
    } else if (await types.isSignedInteger(db, zapSessionId, attribute.type)) {
      if (!isValidSignedNumberString(endpointAttribute.defaultValue)) {
        defaultAttributeIssues.push('Invalid Integer')
      } else if (
        //we shouldn't check boundaries for an invalid number string
        !(await checkAttributeBoundsInteger(
          attribute,
          endpointAttribute,
          db,
          zapSessionId,
          clusterRef
        ))
      ) {
        defaultAttributeIssues.push('Out of range')
      }
    } else {
      if (!isValidNumberString(endpointAttribute.defaultValue)) {
        defaultAttributeIssues.push('Invalid Integer')
      } else if (
        // we shouldn't check boundaries for an invalid number string
        !(await checkAttributeBoundsInteger(
          attribute,
          endpointAttribute,
          db,
          zapSessionId,
          clusterRef
        ))
      ) {
        defaultAttributeIssues.push('Out of range')
      }
    }
  } else if (types.isString(attribute.type)) {
    let maxLengthForString =
      attribute.type == 'char_string' || attribute.type == 'octet_string'
        ? 254
        : 65534
    let maxAllowedLength = attribute.maxLength
      ? attribute.maxLength
      : maxLengthForString
    if (endpointAttribute.defaultValue.length > maxAllowedLength) {
      defaultAttributeIssues.push('String length out of range')
    }
  }
  return { defaultValue: defaultAttributeIssues }
}

function validateSpecificEndpoint(endpoint) {
  let zclEndpointIdIssues = []
  let zclNetworkIdIssues = []
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
  return /^(0x)?[\dA-F]+$/i.test(value) || Number.isInteger(Number(value))
}
function isValidSignedNumberString(value) {
  return /^(0x)?[\dA-F]+$/i.test(value) || Number.isInteger(Number(value))
}

function isValidHexString(value) {
  return /^(0x)?[\dA-F]+$/i.test(value)
}

function isValidDecimalString(value) {
  return /^\d+$/.test(value)
}

function isValidFloat(value) {
  return !/^0x/i.test(value) && !isNaN(Number(value))
}

function extractFloatValue(value) {
  return parseFloat(value)
}

/**
 * Expects a number string , parse it back on a default base 10 if its a decimal.
 * If its a hexadecimal or anything else , parse it back on base 16.
 * Loses precision after javascripts Number.MAX_SAFE_INTEGER range.
 * @param {*} value
 * @returns A decimal number
 */
function extractIntegerValue(value) {
  if (/^-?\d+$/.test(value)) {
    return parseInt(value)
  } else if (/^[0-9A-F]+$/i.test(value)) {
    return parseInt(value, 16)
  } else {
    return parseInt(value, 16)
  }
}

function extractBigIntegerValue(value) {
  if (/^-?\d+$/.test(value)) {
    return BigInt(value)
  } else if (/^[0-9A-F]+$/i.test(value)) {
    return BigInt('0x' + value)
  } else {
    return BigInt(value)
  }
}

function isBigInteger(bits) {
  return bits >= 32
}

async function getBoundsInteger(attribute, typeSize, isSigned) {
  return {
    min: attribute.min
      ? await getIntegerFromAttribute(attribute.min, typeSize, isSigned)
      : null,
    max: attribute.max
      ? await getIntegerFromAttribute(attribute.max, typeSize, isSigned)
      : null,
  }
}

/**
 * Converts an unsigned integer to its signed value. Returns the same integer if its not a signed type.
 * Works for both BigInts and regular numbers.
 * @param {*} value - integer to convert
 * @param {*} typeSize - bit representation
 * @returns A decimal number
 */
function unsignedToSignedInteger(value, typeSize) {
  const isSigned = value.toString(2).padStart(typeSize, '0').charAt(0) === '1'
  if (isSigned) {
    value = ~value
    value += isBigInteger(typeSize) ? 1n : 1
  }
  return value
}

/**
 * Converts an attribute (number string) into a decimal number without losing precision.
 * Accepts both decimal and hexadecimal strings (former has priority) in any bit representation.
 * Shifts signed hexadecimals to their correct value.
 * @param {*} attribute - attribute to convert
 * @param {*} typeSize - bit representation size
 * @param {*} isSigned - is type is signed
 * @returns A decimal number
 */
async function getIntegerFromAttribute(attribute, typeSize, isSigned) {
  let value = isBigInteger(typeSize)
    ? extractBigIntegerValue(attribute)
    : extractIntegerValue(attribute)
  if (
    !isValidDecimalString(attribute) &&
    isValidHexString(attribute) &&
    isSigned
  ) {
    value = unsignedToSignedInteger(value, typeSize)
  }
  return value
}

/**
 * Returns information about an integer type.
 * @param {*} db
 * @param {*} zapSessionId
 * @param {*} clusterRef
 * @param {*} attribType
 * @returns {*} { size: bit representation , isSigned: is signed type }
 */
async function getIntegerAttributeSize(
  db,
  zapSessionId,
  clusterRef,
  attribType
) {
  let packageIds = await queryPackage.getSessionZclPackageIds(db, zapSessionId)
  let attribData = await queryZcl.selectNumberByNameAndClusterId(
    db,
    attribType,
    clusterRef,
    packageIds
  )
  return attribData
    ? { size: attribData.size * 8, isSigned: attribData.isSigned }
    : { size: undefined, isSigned: undefined }
}

/**
 * Checks if the incoming integer is within it's attributes bound while handling signed and unsigned cases.
 * @param {*} attribute
 * @param {*} endpointAttribute
 * @param {*} db
 * @param {*} zapSessionId
 * @param {*} clusterRef
 * @returns boolean
 */
async function checkAttributeBoundsInteger(
  attribute,
  endpointAttribute,
  db,
  zapSessionId,
  clusterRef
) {
  const { size, isSigned } = await getIntegerAttributeSize(
    db,
    zapSessionId,
    clusterRef,
    attribute.type
  )
  if (size === undefined || isSigned === undefined) {
    return false
  }
  let { min, max } = await getBoundsInteger(attribute, size, isSigned)
  let defaultValue = await getIntegerFromAttribute(
    endpointAttribute.defaultValue,
    size,
    isSigned
  )
  return checkBoundsInteger(defaultValue, min, max)
}

function checkBoundsInteger(defaultValue, min, max) {
  if (Number.isNaN(min)) min = Number.MIN_SAFE_INTEGER
  if (Number.isNaN(max)) max = Number.MAX_SAFE_INTEGER
  return defaultValue >= min && defaultValue <= max
}

function checkAttributeBoundsFloat(attribute, endpointAttribute) {
  let { min, max } = getBoundsFloat(attribute)
  let defaultValue = extractFloatValue(endpointAttribute.defaultValue)
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
exports.unsignedToSignedInteger = unsignedToSignedInteger
exports.extractBigIntegerValue = extractBigIntegerValue
exports.getIntegerAttributeSize = getIntegerAttributeSize

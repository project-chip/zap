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
 * @module Validation API: Validation APIs
 */

const queryZcl = require('../db/query-zcl.js')
const queryConfig = require('../db/query-config.js')
const queryEndpoint = require('../db/query-endpoint.js')
const types = require('../util/types.js')
const queryPackage = require('../db/query-package.js')
const env = require('../util/env')
const queryNotification = require('../db/query-package-notification.js')
const dbEnum = require('../../src-shared/db-enum.js')

/**
 * Main attribute validation function.
 * Returns a promise of an object which stores a list of validation issues.
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
  // Null check for endpointAttribute
  if (!endpointAttribute) {
    env.logWarning(
      `validateAttribute called with invalid parameters for endpointAttribute:\n
      - endpointTypeId: ${endpointTypeId}\n
      - attributeRef: ${attributeRef}\n
      - clusterRef: ${clusterRef}`
    )
    return { defaultValue: ['Attribute not found in endpoint configuration'] }
  }

  if (endpointAttribute.storageOption === dbEnum.storageOption.external) {
    return { defaultValue: [] }
  }

  let attribute = await queryZcl.selectAttributeById(db, attributeRef)
  // Null check for attribute
  if (!attribute) {
    env.logWarning(
      `validateAttribute called with invalid parameters for attribute:\n
      - attributeRef: ${attributeRef}`
    )
    return { defaultValue: ['Attribute definition not found'] }
  }
  return validateSpecificAttribute(
    endpointAttribute,
    attribute,
    db,
    zapSessionId
  )
}

/**
 * Get issues in an endpoint.
 *
 * @param {*} db
 * @param {*} endpointId
 * @returns object
 */
async function validateEndpoint(db, endpointId) {
  let endpoint = await queryEndpoint.selectEndpoint(db, endpointId)
  const isMatter = await isMatterSession(db, endpoint.sessionRef)
  let currentIssues = validateSpecificEndpoint(endpoint, { isMatter })
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

/**
 * Returns true when this endpoint identifier is unique within the session.
 *
 * The schema enforces UNIQUE(ENDPOINT_TYPE_REF, ENDPOINT_IDENTIFIER), but for the
 * user-visible "duplicate endpoint" check we want session-wide uniqueness: two
 * endpoints with the same identifier are wrong on a real device regardless of
 * which endpoint type they belong to.
 *
 * @param {*} db
 * @param {*} endpointIdentifier
 * @param {*} sessionRef
 * @returns boolean
 */
async function validateNoDuplicateEndpoints(
  db,
  endpointIdentifier,
  sessionRef
) {
  const count =
    await queryConfig.selectCountOfEndpointsWithGivenEndpointIdentifier(
      db,
      endpointIdentifier,
      sessionRef
    )
  // helper returns the integer count (0/1/...). Anything other than 0 or 1 means duplicate.
  const n = Number(count)
  return Number.isFinite(n) ? n <= 1 : true
}

/**
 * True when the session uses Matter ZCL packages (CATEGORY = 'matter').
 * Used to relax Zigbee-only rules (e.g. endpoint 0 is reserved in Zigbee but is
 * the root node in Matter).
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise<boolean>
 */
async function isMatterSession(db, sessionId) {
  if (sessionId == null) return false
  try {
    const pkgs = await queryPackage.getSessionZclPackages(db, sessionId)
    return pkgs.some((p) => p.category === dbEnum.helperCategory.matter)
  } catch (e) {
    return false
  }
}

/**
 * Validates attribute default value from XML metadata (without endpoint context).
 * Only validates type constraints, ranges, and string lengths available in the XML.
 *
 * @param {*} db - Database connection
 * @param {*} attribute - Attribute object with defaultValue, type, min, max, minLength, maxLength
 * @param {*} packageId - Package ID for logging
 * @returns {Promise<void>}
 */
async function validateXmlAttributeDefault(db, attribute, packageId) {
  if (!attribute || attribute.defaultValue == null) {
    return
  }

  let issues = []

  // Validate boolean type
  if (attribute.type && attribute.type.toLowerCase() === 'boolean') {
    const boolValue = String(attribute.defaultValue).toLowerCase()
    if (
      boolValue !== 'true' &&
      boolValue !== 'false' &&
      boolValue !== '0' &&
      boolValue !== '1'
    ) {
      issues.push(`Invalid boolean value. Must be true, false, 0, or 1`)
    }
  }
  // Validate numeric types
  else if (!types.isString(attribute.type)) {
    if (types.isFloat(attribute.type)) {
      // Resolve the float bit width so hex IEEE 754 bit-pattern bounds
      // and defaults (the ZCL XML convention, e.g. min="0x0000"
      // max="0x3F800000" for float_single) are decoded correctly. We
      // have a packageId rather than a session here, so use the
      // package-scoped type lookup directly.
      let size
      try {
        const lookup = await types.getSignAndSizeOfZclType(db, attribute.type, [
          packageId
        ])
        size =
          lookup && lookup.dataTypesize ? lookup.dataTypesize * 8 : undefined
      } catch (e) {
        size = undefined
      }
      if (!isValidFloat(attribute.defaultValue, size)) {
        issues.push('Invalid Float')
      } else if (attribute.min != null || attribute.max != null) {
        let bounds = getBoundsFloat(attribute, size)
        let value = getFloatFromAttribute(attribute.defaultValue, size)
        if (!checkBoundsFloat(value, bounds.min, bounds.max)) {
          issues.push(`Out of range (min: ${bounds.min}, max: ${bounds.max})`)
        }
      }
    } else {
      // Validate integer
      if (!isValidNumberString(attribute.defaultValue)) {
        issues.push('Invalid Integer')
      } else if (attribute.min != null || attribute.max != null) {
        // For XML validation, we can check basic range without session context
        // by using the min/max values directly from the attribute
        try {
          let min =
            attribute.min != null ? extractBigIntegerValue(attribute.min) : null
          let max =
            attribute.max != null ? extractBigIntegerValue(attribute.max) : null
          let value = extractBigIntegerValue(attribute.defaultValue)

          if ((min != null && value < min) || (max != null && value > max)) {
            issues.push(`Out of range (min: ${min}, max: ${max})`)
          }
        } catch (e) {
          // If BigInt conversion fails, skip range validation
          env.logWarning(
            `Could not validate range for attribute ${attribute.name}: ${e.message}`
          )
        }
      }
    }
  }
  // Validate string types
  else if (types.isString(attribute.type)) {
    let maxLengthForString =
      attribute.type === 'char_string' || attribute.type === 'octet_string'
        ? 254
        : 65534
    let maxAllowedLength =
      attribute.maxLength != null ? attribute.maxLength : maxLengthForString

    if (
      typeof attribute.defaultValue === 'string' &&
      attribute.defaultValue.length > maxAllowedLength
    ) {
      issues.push(
        `String length ${attribute.defaultValue.length} exceeds maximum ${maxAllowedLength}`
      )
    }
  }

  // Log warnings if there are validation issues
  if (issues.length > 0) {
    let message = `XML validation issues for attribute "${attribute.name}" (type: ${attribute.type}, defaultvalue: ${attribute.defaultValue}): ${issues.join(', ')}`
    env.logWarning(message)
    queryNotification.setNotification(db, 'WARNING', message, packageId, 2)
  }
}

/**
 * Checks the attributes type then validates the incoming input string.
 * @param {*} endpointAttribute
 * @param {*} attribute
 * @param {*} db
 * @param {*} zapSessionId
 * @returns List of issues wrapped in an object
 */
async function validateSpecificAttribute(
  endpointAttribute,
  attribute,
  db,
  zapSessionId
) {
  if (!endpointAttribute || !attribute) {
    env.logWarning(
      `validateSpecificAttribute called with invalid parameters:\n
      - endpointAttribute: ${JSON.stringify(endpointAttribute)}\n
      - attribute: ${JSON.stringify(attribute)}`
    )
    return { defaultValue: ['Missing attribute or endpoint configuration'] }
  }
  let defaultAttributeIssues = []
  if (attribute.isNullable && endpointAttribute.defaultValue == null) {
    return { defaultValue: defaultAttributeIssues }
  } else if (!types.isString(attribute.type)) {
    if (types.isFloat(attribute.type)) {
      // Resolve the float type's bit width so hex IEEE 754 bit patterns
      // (e.g. "0x3F800000" => 1.0 for float_single) are recognized as
      // valid float defaults. This matches the ZCL/Matter XML convention
      // for float min/max bounds.
      const { size } = await getFloatAttributeSize(
        db,
        zapSessionId,
        attribute.type,
        attribute.clusterRef
      )
      if (!isValidFloat(endpointAttribute.defaultValue, size)) {
        defaultAttributeIssues.push('Invalid Float')
      } else if (
        !(await checkAttributeBoundsFloat(
          attribute,
          endpointAttribute,
          db,
          zapSessionId
        ))
      ) {
        defaultAttributeIssues.push('Out of range')
      }
    } else {
      // we shouldn't check boundaries for an invalid number string
      if (!isValidNumberString(endpointAttribute.defaultValue)) {
        defaultAttributeIssues.push('Invalid Integer')
      } else if (
        !(await checkAttributeBoundsInteger(
          attribute,
          endpointAttribute,
          db,
          zapSessionId
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
    if (
      typeof endpointAttribute.defaultValue === 'string' &&
      endpointAttribute.defaultValue.length > maxAllowedLength
    ) {
      defaultAttributeIssues.push('String length out of range')
    }
  }
  return { defaultValue: defaultAttributeIssues }
}

/**
 * Get endpoint and newtork issue on an endpoint.
 *
 * @param {*} endpoint
 * @returns object
 */
function validateSpecificEndpoint(endpoint, options = {}) {
  const isMatter = options.isMatter === true
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
  // Matter reserves endpoint 0 as the Root Node. Zigbee reserves it for ZDO.
  if (!isMatter && extractIntegerValue(endpoint.endpointId) == 0)
    zclEndpointIdIssues.push('0 is not a valid endpointId')
  return {
    endpointId: zclEndpointIdIssues,
    networkId: zclNetworkIdIssues
  }
}

/**
 * Check if value is a valid number in string form.
 * This applies to both actual numbers as well as octet strings.
 *
 * @param {*} value
 * @returns boolean
 */
function isValidNumberString(value) {
  //We test to see if the number is valid in hex. Decimals numbers also pass this test
  return /^(0x)?[\dA-F]+$/i.test(value) || Number.isInteger(Number(value))
}

/**
 * Check if value is a valid hex string.
 *
 * @param {*} value
 * @returns boolean
 */
function isValidHexString(value) {
  return /^(0x)?[\dA-F]+$/i.test(value)
}

/**
 * Check if value is a valid decimal string.
 *
 * @param {*} value
 * @returns boolean
 */
function isValidDecimalString(value) {
  return /^\d+$/.test(value)
}

/**
 * Check if value is a valid float value.
 *
 * Decimal literals (e.g. "1.5", "-0.25", "1e40") are always accepted.
 * When a typeSize is supplied, hex IEEE 754 bit-pattern literals are
 * also accepted as long as they fit within the type's nibble width
 * (e.g. "0x3F800000" for `float_single` decodes to 1.0). This mirrors
 * the ZCL/Matter XML convention used for float min/max bounds.
 *
 * @param {*} value
 * @param {*} typeSize Optional bit width of the float type (16, 32, or 64).
 * When omitted, hex strings are rejected (legacy decimal-only behavior).
 * @returns boolean
 */
function isValidFloat(value, typeSize) {
  if (value == null) return false
  const s = String(value)
  if (/^0x/i.test(s)) {
    if (typeSize == null) return false
    return /^0x[0-9A-F]+$/i.test(s) && s.length - 2 <= typeSize / 4
  }
  return !isNaN(Number(s))
}

/**
 * Get float value from the given value.
 * Hex strings (e.g. "0x42C80000") cannot be reliably decoded without knowing
 * the bit-width, so they are returned as NaN and treated as unconstrained.
 * Use {@link getFloatFromAttribute} when the float type's bit width is known
 * and IEEE 754 hex bit patterns should be decoded.
 *
 * @param {*} value
 * @returns float value, or NaN if value is null/undefined/hex
 */
function extractFloatValue(value) {
  if (value == null || /^0x/i.test(String(value))) return NaN
  return parseFloat(value)
}

/**
 * Decodes a 16-bit IEEE 754 half-precision bit pattern into a Number.
 * Implemented manually because Float16Array is not yet available across
 * all supported Node versions. Counterpart of `convertFloatToBigEndian`
 * for sizes the 32/64-bit DataView path cannot handle.
 *
 * @param {*} bits Unsigned 16-bit integer (0..0xFFFF)
 * @returns Number
 */
function decodeFloat16(bits) {
  const sign = (bits >> 15) & 0x1
  const exp = (bits >> 10) & 0x1f
  const frac = bits & 0x3ff
  let value
  if (exp === 0) {
    // Subnormal (or signed zero when frac === 0).
    value = frac === 0 ? 0 : Math.pow(2, -14) * (frac / 1024)
  } else if (exp === 0x1f) {
    value = frac === 0 ? Infinity : NaN
  } else {
    value = Math.pow(2, exp - 15) * (1 + frac / 1024)
  }
  return sign ? -value : value
}

/**
 * Converts a float attribute string into a Number, honoring the IEEE 754
 * bit-pattern hex convention used by ZCL/Matter XML for float min/max
 * bounds and defaults (e.g. "0x3F800000" => 1.0 for `float_single`).
 *
 * Mirrors `getIntegerFromAttribute` on the integer side: the type's bit
 * width drives how the string is decoded. Decimal literals fall through
 * to `parseFloat`. Hex literals wider than the type can encode (more
 * than `typeSize / 4` nibbles) return NaN so the caller can flag them.
 *
 * @param {*} attribute string representation of a float
 * @param {*} typeSize bit width of the float type (16, 32, or 64)
 * @returns Number, or NaN if the value cannot be decoded for typeSize
 */
function getFloatFromAttribute(attribute, typeSize) {
  if (attribute == null) return NaN
  const s = String(attribute)
  if (/^0x/i.test(s)) {
    // Anything that looks hex-prefixed must round-trip through a strict
    // hex-digit check; otherwise parseFloat would silently consume just
    // the leading "0" and return 0 for inputs like "0x12GH".
    if (typeSize == null || !/^0x[0-9A-F]+$/i.test(s)) return NaN
    const hex = s.slice(2)
    if (hex.length > typeSize / 4) return NaN
    if (typeSize === 16) {
      return decodeFloat16(parseInt(hex, 16) & 0xffff)
    } else if (typeSize === 32) {
      const view = new DataView(new ArrayBuffer(4))
      view.setUint32(0, parseInt(hex, 16) >>> 0, false)
      return view.getFloat32(0, false)
    } else if (typeSize === 64) {
      const view = new DataView(new ArrayBuffer(8))
      view.setBigUint64(0, BigInt(s), false)
      return view.getFloat64(0, false)
    }
    return NaN
  }
  return parseFloat(s)
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

/**
 * Get value of bit integer.
 *
 * @param {*} value
 * @returns BigInt
 */
function extractBigIntegerValue(value) {
  if (/^-?\d+$/.test(value)) {
    return BigInt(value)
  } else if (/^[0-9A-F]+$/i.test(value)) {
    return BigInt('0x' + value)
  } else {
    return BigInt(value)
  }
}

/**
 * Check if integer is greater than 4 bytes.
 *
 * @param {*} bits
 * @returns boolean
 */
function isBigInteger(bits) {
  return bits >= 32
}

/**
 * Get the integer attribute's bounds.
 *
 * @param {*} attribute
 * @param {*} typeSize
 * @param {*} isSigned
 * @returns object
 */
async function getBoundsInteger(attribute, typeSize, isSigned) {
  return {
    min: attribute.min
      ? await getIntegerFromAttribute(attribute.min, typeSize, isSigned)
      : getTypeRange(typeSize, isSigned, true),
    max: attribute.max
      ? await getIntegerFromAttribute(attribute.max, typeSize, isSigned)
      : getTypeRange(typeSize, isSigned, false)
  }
}

/**
 * Gets the range of an integer type.
 *
 * @param {*} typeSize
 * @param {*} isSigned
 * @param {*} isMin
 * @returns integer
 */
function getTypeRange(typeSize, isSigned, isMin) {
  if (isMin) {
    return isSigned ? -Math.pow(2, typeSize - 1) : 0
  }
  return isSigned ? Math.pow(2, typeSize - 1) - 1 : Math.pow(2, typeSize) - 1
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
 * @param {*} attribType
 * @param {*} clusterRef
 * @returns {*} { size: bit representation , isSigned: is signed type }
 */
async function getIntegerAttributeSize(
  db,
  zapSessionId,
  attribType,
  clusterRef
) {
  let packageIds = await queryPackage.getSessionZclPackageIds(db, zapSessionId)
  const attribData = await types.getSignAndSizeOfZclTypeAndClusterId(
    db,
    attribType,
    clusterRef,
    packageIds
  )
  if (attribData) {
    return {
      size: attribData.dataTypesize * 8,
      isSigned: attribData.isTypeSigned
    }
  } else {
    return { size: undefined, isSigned: undefined }
  }
}

/**
 * Checks if the incoming integer is within it's attributes bound while handling signed and unsigned cases.
 * @param {*} attribute
 * @param {*} endpointAttribute
 * @param {*} db
 * @param {*} zapSessionId
 * @returns boolean
 */
async function checkAttributeBoundsInteger(
  attribute,
  endpointAttribute,
  db,
  zapSessionId
) {
  const { size, isSigned } = await getIntegerAttributeSize(
    db,
    zapSessionId,
    attribute.type,
    attribute.clusterRef
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

/**
 * Check if an integer value is within the bounds.
 *
 * @param {*} defaultValue
 * @param {*} min
 * @param {*} max
 * @returns boolean
 */
function checkBoundsInteger(defaultValue, min, max) {
  if (min == null || Number.isNaN(min)) min = Number.MIN_SAFE_INTEGER
  if (max == null || Number.isNaN(max)) max = Number.MAX_SAFE_INTEGER
  return defaultValue >= min && defaultValue <= max
}

/**
 * Returns information about a float type by querying the data type
 * metadata stored in the database. Mirrors getIntegerAttributeSize so
 * the size lookup uses the same source of truth for both integer and
 * float types and works for any float type defined in the loaded ZCL
 * (e.g. silabs `float_semi`/`float_single`/`float_double` and Matter
 * `single`/`double`).
 *
 * @param {*} db
 * @param {*} zapSessionId
 * @param {*} attribType
 * @param {*} clusterRef
 * @returns {*} { size: bit representation }
 */
async function getFloatAttributeSize(db, zapSessionId, attribType, clusterRef) {
  let packageIds = await queryPackage.getSessionZclPackageIds(db, zapSessionId)
  const attribData = await types.getSignAndSizeOfZclTypeAndClusterId(
    db,
    attribType,
    clusterRef,
    packageIds
  )
  if (attribData && attribData.dataTypesize) {
    return { size: attribData.dataTypesize * 8 }
  } else {
    return { size: undefined }
  }
}

/**
 * Gets the representable range of a float type. Mirrors getTypeRange for
 * integer types and is used as the fallback when an attribute does not
 * explicitly declare min/max.
 *
 * @param {*} typeSize bit width of the float type
 * @param {*} isMin true to return the minimum, false for the maximum
 * @returns float
 */
function getFloatTypeRange(typeSize, isMin) {
  let mag
  switch (typeSize) {
    case 16:
      // IEEE 754 half precision: max representable finite magnitude
      mag = 65504
      break
    case 32:
      // IEEE 754 single precision: FLT_MAX
      mag = 3.4028234663852886e38
      break
    case 64:
    default:
      mag = Number.MAX_VALUE
      break
  }
  return isMin ? -mag : mag
}

/**
 * Checks if the incoming float is within its attribute's bounds while
 * honoring the representable range of the float type. Mirrors
 * checkAttributeBoundsInteger: it first resolves the type metadata
 * from the database, bails out if the type is unknown, and then
 * compares against the (possibly type-defaulted) min/max bounds.
 *
 * @param {*} attribute
 * @param {*} endpointAttribute
 * @param {*} db
 * @param {*} zapSessionId
 * @returns boolean
 */
async function checkAttributeBoundsFloat(
  attribute,
  endpointAttribute,
  db,
  zapSessionId
) {
  const { size } = await getFloatAttributeSize(
    db,
    zapSessionId,
    attribute.type,
    attribute.clusterRef
  )
  if (size === undefined) {
    return false
  }
  let { min, max } = getBoundsFloat(attribute, size)
  let defaultValue = getFloatFromAttribute(endpointAttribute.defaultValue, size)
  return checkBoundsFloat(defaultValue, min, max)
}

/**
 * Get the bounds on a float attribute's value. When the attribute does
 * not declare an explicit min/max, the type's representable range is
 * used as the fallback (mirroring getBoundsInteger).
 *
 * @param {*} attribute
 * @param {*} typeSize bit width of the float type. When omitted the
 * 64-bit IEEE 754 range is assumed, which keeps legacy single-argument
 * callers (e.g. XML pre-validation, which has no session) working.
 * @returns object
 */
function getBoundsFloat(attribute, typeSize) {
  return {
    min:
      attribute.min != null
        ? getFloatFromAttribute(attribute.min, typeSize)
        : getFloatTypeRange(typeSize, true),
    max:
      attribute.max != null
        ? getFloatFromAttribute(attribute.max, typeSize)
        : getFloatTypeRange(typeSize, false)
  }
}

/**
 * Check if float value is within the min/max bounds.
 *
 * @param {*} defaultValue
 * @param {*} min
 * @param {*} max
 * @returns boolean
 */
function checkBoundsFloat(defaultValue, min, max) {
  if (min == null || Number.isNaN(min)) min = -Number.MAX_VALUE
  if (max == null || Number.isNaN(max)) max = Number.MAX_VALUE
  return defaultValue >= min && defaultValue <= max
}

// exports
exports.validateAttribute = validateAttribute
exports.validateEndpoint = validateEndpoint
exports.validateNoDuplicateEndpoints = validateNoDuplicateEndpoints
exports.validateSpecificAttribute = validateSpecificAttribute
exports.validateSpecificEndpoint = validateSpecificEndpoint
exports.isMatterSession = isMatterSession
exports.isValidNumberString = isValidNumberString
exports.isValidFloat = isValidFloat
exports.extractFloatValue = extractFloatValue
exports.extractIntegerValue = extractIntegerValue
exports.getBoundsInteger = getBoundsInteger
exports.checkBoundsInteger = checkBoundsInteger
exports.getBoundsFloat = getBoundsFloat
exports.checkBoundsFloat = checkBoundsFloat
exports.getFloatAttributeSize = getFloatAttributeSize
exports.getFloatTypeRange = getFloatTypeRange
exports.getFloatFromAttribute = getFloatFromAttribute
exports.unsignedToSignedInteger = unsignedToSignedInteger
exports.extractBigIntegerValue = extractBigIntegerValue
exports.getIntegerAttributeSize = getIntegerAttributeSize
exports.validateXmlAttributeDefault = validateXmlAttributeDefault

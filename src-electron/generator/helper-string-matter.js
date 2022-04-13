/*
 *
 *    Copyright (c) 2020 Project CHIP Authors
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
const characterStringTypes = ['CHAR_STRING', 'LONG_CHAR_STRING']
const octetStringTypes = ['OCTET_STRING', 'LONG_OCTET_STRING']
const stringShortTypes = ['CHAR_STRING', 'OCTET_STRING']
const stringLongTypes = ['LONG_CHAR_STRING', 'LONG_OCTET_STRING']
const templateUtil = require('./template-util.js')

async function isString(type) {
  return isCharString(type) || isOctetString(type)
}

function isCharString(type) {
  return characterStringTypes.includes(type.toUpperCase())
}

function isOctetString(type) {
  return octetStringTypes.includes(type.toUpperCase())
}

function isShortString(type) {
  return stringShortTypes.includes(type.toUpperCase())
}

function isLongString(type) {
  return stringLongTypes.includes(type.toUpperCase())
}

//
// Module exports
//
const dep = templateUtil.deprecatedHelper
exports.isString = dep(isString, {
  to: 'is_string',
})
exports.isCharString = dep(isCharString, {
  to: 'is_char_string',
})
exports.isOctetString = dep(isOctetString, {
  to: 'is_octet_string',
})
exports.isShortString = dep(isShortString, {
  to: 'is_short_string',
})
exports.isLongString = dep(isLongString, {
  to: 'is_long_string',
})
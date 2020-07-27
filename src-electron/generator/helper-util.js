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
Given: String
Return: String
Description: return the given string in uppercase and convert spaces into
underscores.
*/
function getUppercase(str) {
  str = findAndReplace(str, [' '], '_')
  return str.toUpperCase()
}

/**
 *
 *
 * @export
 * @param {*} value
 * @param {*} options
 * @returns String
 * Description: getSwitch helper receives a options hash which contains
 * options.fn that behaves like a compiled handlebars template.
 */
function getSwitch(value, options) {
  this.switch_value = value.toLowerCase()
  this.switch_break = false
  return options.fn(this)
}

/**
 *
 *
 * @export
 * @param {*} value
 * @param {*} options
 * @returns String
 * Description: getCase helper receives a options hash which contains
 * options.fn that behaves like a compiled handlebars template.
 */
function getCase(value, options) {
  if (value == this.switch_value) {
    this.switch_break = true
    return options.fn(this)
  }
}

/**
 *
 *
 * @export
 * @param {*} value
 * @param {*} options
 * @returns String
 * Description: getDefault helper receives a options hash which contains
 * options.fn that behaves like a compiled handlebars template.
 */
function getDefault(value, options) {
  if (this.switch_break == false) {
    return options.fn(this)
  }
}

/**
Given: String
Return: String
Description: return the given string such that camel case is changed into a
string with underscores and is also uppercase.
*/
function getStrong(str) {
  str = str
    .replace(/\.?([A-Z][a-z])/g, function (x, y) {
      return '_' + y
    })
    .replace(/^_/, '')
  return str.toUpperCase()
}

/**
Given: String
Return: String
Description: return the given string such that camel case is changed into a
string with spaces.
*/
function convertCamelCaseToSpace(str) {
  str = str.replace(/\.?([A-Z][a-z])/g, function (x, y) {
    return ' ' + y
  })
  return str
}

/**
Given: String
Return: String
Description: return the given string but convert it into a number and then
into a hex string to keep consistency in the hex strings values.
*/
function getHexValue(str) {
  var hexString = parseInt(str, 16).toString(16).toUpperCase()
  var prefix
  if (hexString.length % 2 == 0) {
    prefix = '0x'
  } else {
    prefix = '0x0'
  }
  var result = prefix + hexString
  return result
}

/**
Given: String
Return: String
Description: Change the target values using the replacement mentioned and
return the given string.
*/
function findAndReplace(string, target, replacement) {
  var i = 0,
    j = 0,
    length = string.length,
    targetLength = target.length
  for (j = 0; j < targetLength; j++) {
    for (i = 0; i < length; i++) {
      string = string.replace(target[j], replacement)
    }
  }
  return string
}

/**
 *
 *
 * Given: String Array
 * @returns the length of largest String in the array
 */
function getLargestStringInArray() {
  var stringArray = arguments[0]
  var lengthOfLargestString = 0,
    i = 0,
    stringLength = 0
  for (i = 0; i < stringArray.length; i++) {
    stringLength = stringArray[i].label.length
    if (stringLength > lengthOfLargestString) {
      lengthOfLargestString = stringLength
    }
  }
  return lengthOfLargestString
}

/**
 *
 *
 * @export
 * @param {*} str
 * Descrtiption: Given a String, remove underscores from it and return it.
 */
function getCamelCaseWithoutUnderscore(str) {
  let res = ''
  if (str) {
    var tempArray = str.split('_')
    var i = 0
    for (i = 0; i < tempArray.length; i++) {
      tempArray[i] =
        tempArray[i].substr(0, 1).toUpperCase() +
        tempArray[i].substr(1).toLowerCase()
      res += tempArray[i]
    }
  }
  return res
}

function isEitherCommandSource(str) {
  if (str && str.toLowerCase() === 'either') {
    return true
  }
  return false
}

function isCommandManufactureSpecific(str) {
  if (str) {
    return true
  }
  return false
}

function getDirection(str) {
  if (str && str.toLowerCase() === 'client') {
    return 'ClientToServer'
  } else {
    return 'ServerToCLient'
  }
}

function trimNewLinesTabs(str) {
  let res = str
  if (res) {
    res = str.replace(/  |\r\n|\n|\r/gm, '')
  }
  return res
}

function getFormatCharactersForCommandArguments(commandArgs) {
  let commandArg = {}
  let res = ''
  var i = 0
  if (commandArgs) {
    for (i = 0; i < commandArgs.length; i++) {
      commandArg = commandArgs[i]
      if (commandArg.isArray) {
        res += 'b'
        continue
      }
      switch (commandArg.type.toLowerCase()) {
        case 'data8':
        case 'boolean':
        case 'bitmap8':
        case 'int8u':
        case 'int8s':
        case 'enum8':
          res += 'u'
          break
        case 'data16':
        case 'bitmap16':
        case 'int16u':
        case 'int16s':
        case 'enum16':
        case 'float_semi':
        case 'cluster_id':
        case 'attribute_id':
          res += 'v'
          break
        case 'data24':
        case 'bitmap24':
        case 'int24u':
        case 'int24s':
        case 'data32':
        case 'bitmap32':
        case 'int32u':
        case 'int32s':
        case 'float_single':
        case 'time_of_day':
        case 'date':
        case 'utc_time':
        case 'bacnet_oid':
          res += 'w'
          break
        case 'char_string':
        case 'octet_string':
          res += 's'
          break
        case 'long_string':
        case 'long_octet_string':
          res += 'l'
          break
        default:
          res += 'b'
          break
      }
    }
  }
  return res
}
// exports
exports.getUppercase = getUppercase
exports.getSwitch = getSwitch
exports.getCase = getCase
exports.getDefault = getDefault
exports.getStrong = getStrong
exports.getHexValue = getHexValue
exports.getLargestStringInArray = getLargestStringInArray
exports.getCamelCaseWithoutUnderscore = getCamelCaseWithoutUnderscore
exports.isEitherCommandSource = isEitherCommandSource
exports.isCommandManufactureSpecific = isCommandManufactureSpecific
exports.getDirection = getDirection
exports.trimNewLinesTabs = trimNewLinesTabs
exports.getFormatCharactersForCommandArguments = getFormatCharactersForCommandArguments
exports.convertCamelCaseToSpace = convertCamelCaseToSpace

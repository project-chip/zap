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
export function getUppercase(str) {
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
export function getSwitch(value, options) {
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
export function getCase(value, options) {
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
export function getDefault(value, options) {
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
export function getStrong(str) {
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
Description: return the given string but convert it into a number and then
into a hex string to keep consistency in the hex strings values.
*/
export function getHexValue(str) {
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
export function getLargestStringInArray() {
  var stringArray = arguments[0]
  var lengthOfLargestString = 0,
    i = 0,
    stringLength = 0
  for (i = 0; i < stringArray.length; i++) {
    stringLength = stringArray[i].NAME.length
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
export function getCamelCaseWithoutUnderscore(str) {
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

export function isEitherCommandSource(str) {
  if (str && str.toLowerCase() === 'either') {
    return true
  }
  return false
}

export function isCommandManufactureSpecific(str) {
  if (str) {
    return true
  }
  return false
}

export function getDirection(str) {
  if (str && str.toLowerCase() === 'client') {
    return 'ClientToServer'
  } else {
    return 'ServerToCLient'
  }
}

export function trimNewLinesTabs(str) {
  let res = str
  if (res) {
    res = str.replace(/  |\r\n|\n|\r/gm, '')
  }
  return res
}

export function getFormatCharactersForCommandArguments(commandArgs) {
  let commandArg = {}
  let res = ''
  var i = 0
  if (commandArgs) {
    for (i = 0; i < commandArgs.length; i++) {
      commandArg = commandArgs[i]
      if (commandArg.IS_ARRAY) {
        res += 'b'
        continue
      }
      switch (commandArg.TYPE.toLowerCase()) {
        case 'data8':
          res += 'u'
          break
        case 'boolean':
          res += 'u'
          break
        case 'bitmap8':
          res += 'u'
          break
        case 'int8u':
          res += 'u'
          break
        case 'int8s':
          res += 'u'
          break
        case 'enum8':
          res += 'u'
          break
        case 'data16':
          res += 'v'
          break
        case 'bitmap16':
          res += 'v'
          break
        case 'int16u':
          res += 'v'
          break
        case 'int16s':
          res += 'v'
          break
        case 'enum16':
          res += 'v'
          break
        case 'float_semi':
          res += 'v'
          break
        case 'cluster_id':
          res += 'v'
          break
        case 'attribute_id':
          res += 'v'
          break
        case 'data24':
          res += 'x'
          break
        case 'bitmap24':
          res += 'x'
          break
        case 'int24u':
          res += 'x'
          break
        case 'int24s':
          res += 'x'
          break
        case 'data32':
          res += 'w'
          break
        case 'bitmap32':
          res += 'w'
          break
        case 'int32u':
          res += 'w'
          break
        case 'int32s':
          res += 'w'
          break
        case 'float_single':
          res += 'w'
          break
        case 'time_of_day':
          res += 'w'
          break
        case 'date':
          res += 'w'
          break
        case 'utc_time':
          res += 'w'
          break
        case 'bacnet_oid':
          res += 'w'
          break
        case 'char_string':
          res += 's'
          break
        case 'octet_string':
          res += 's'
          break
        case 'long_string':
          res += 'l'
          break
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

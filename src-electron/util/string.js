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
 * @module JS API: string utilities
 */

/**
 * Given a string convert it into a camelCased string
 *
 * @param {*} str
 * @parem {*} firstLower if True the it starts with lowecase.
 * @returns a spaced out string in lowercase
 */
function toCamelCase(label, firstLower = true) {
  let str = label.replace(/[+()&]/g, '').split(/ |_|-|\//)
  let res = ''
  for (let i = 0; i < str.length; i++) {
    if (i == 0 && firstLower) {
      res += str[i].charAt(0).toLowerCase()
    } else {
      res += str[i].charAt(0).toUpperCase()
    }
    // Acronyms, such as ZLL become lower-case.
    if (str[i].length > 1 && str[i].toUpperCase() == str[i]) {
      res += str[i].substring(1).toLowerCase()
    } else {
      res += str[i].substring(1)
    }
  }
  return res
}

/**
 * Get spaced out lower case string from the given string.
 *
 * @param {*} str
 * @returns spaced out lower case string
 */
function toSpacedLowercase(str) {
  let res = str
    .replace(/[+()&]/g, '')
    .replace(/\.?([A-Z][a-z])/g, function (x, y) {
      return ' ' + y
    })
  return res.toLowerCase()
}

/**
 * Converts a string into `camelCase` or `CamelCase` by splitting
 * the string into tokens.
 *
 * Differs from `toCamelCase` by different handling of "." inside names,
 * so that results are always usable as a code-compatibe name (e.g.
 * "Foo 2.5" becomes "Foo25" rather than "Foo2.5").
 *
 */
function asCamelCase(label, firstLower, preserveAcronyms) {
  const wordSplitRegexp = / |_|-|\//
  let tokens = label.replace(/[+()&]/g, '').split(wordSplitRegexp)

  let str = tokens
    .map((token, index) => {
      let isAllUpperCase = token == token.toUpperCase()
      // PERSONAL is not actually an acronym.
      let isAcronym = isAllUpperCase && token != 'PERSONAL'

      if (isAcronym && preserveAcronyms) {
        return token
      }

      if (token.length === 0) return token

      let newToken =
        index == 0 && firstLower
          ? token[0].toLowerCase()
          : token[0].toUpperCase()

      if (!isAllUpperCase) {
        if (token.length > 1) {
          newToken += token.substring(1)
        }
        return newToken
      }

      // If this is an all-upper-case thing not being preserved as an acronym,
      // then anything beyond the first letter becomes lower-case.
      if (token.length > 1) {
        newToken += token.substring(1).toLowerCase()
      }
      return newToken
    })
    .join('')

  if (firstLower) {
    // Check for the case when we're:
    // 1. A single word (i.e. not matching our word-split regexp).
    // 2. Starting with multiple capital letters in a row.
    // 3. But not _all_ capital letters (which we purposefully
    //    convert to all-lowercase in the don't-preserve-acronyms case).
    //
    // and if all those conditions hold, preserve the leading capital letters by
    // uppercasing the first one, which got lowercased.
    if (
      !wordSplitRegexp.test(label) &&
      label.length > 1 &&
      label.substring(0, 2).toUpperCase() == label.substring(0, 2) &&
      label.toUpperCase() != label
    ) {
      str = str[0].toUpperCase() + str.substring(1)
    }
  }

  return str.replace(/[^A-Za-z0-9_]/g, '')
}

/**
 * Takes a label, and delimits is on camelcasing.
 * For example:
 *    VerySimpleLabel will turn into VERY_SIMPLE_LABEL
 * @param {*} label
 */
function toSnakeCaseAllCaps(label) {
  let ret = ''
  if (label == null) return ret
  label = label
    .replace(/[+()&]/g, '')
    .replace(/\.?([A-Z][a-z])/g, function (x, y) {
      return '_' + y
    })
  let wasUp = false
  for (let i = 0; i < label.length; i++) {
    let ch = label.charAt(i)
    let upch = ch.toUpperCase()
    if (ch == '_') {
      ret = ret.concat('_')
      wasUp = true
    } else if (isDigit(ch)) {
      ret = ret.concat(ch)
      wasUp = false
    } else if (ch == upch) {
      // uppercase
      if (i != 0 && !wasUp) ret = ret.concat('_')
      ret = ret.concat(upch)
      wasUp = true
    } else {
      // lowercase
      ret = ret.concat(upch)
      wasUp = false
    }
  }
  return toCleanMacro(ret)
}

/**
 * Get snake case string from the given string.
 *
 * @param {*} str
 * @returns snake case string
 */
function toSnakeCase(str) {
  return toSnakeCaseAllCaps(str).toLowerCase()
}

/**
 * returns a string after converting ':' and '-' into '_'
 * @param {*} label
 */
function toCleanSymbol(label) {
  let l = label.trim()
  l = l.replace(/ /g, '_')
  l = l.replace(/[:/-]/g, '_')
  l = l.replace(/__+/g, '_').toLowerCase()
  return l
}

/**
 * returns a string after converting ':' and '_' into '-'
 * @param {*} label
 */
function toCleanSymbolAsKebabCase(label) {
  let l = label.trim()
  l = l.replace(/ /g, '-')
  l = l.replace(/[:/_]/g, '-')
  l = l.replace(/--+/g, '-').toLowerCase()
  return l
}

/**
 * Formats label as a C macro. This method performs a very simply substition
 * of illegal characters, such as ' ', ':' and such into a '_' character.
 *
 * @param {*} label
 * @returns Label formatted as C macro.
 */
function toCleanMacro(label) {
  let l = label.toUpperCase().replace(/ /g, '_')
  l = l.replace(/[:/-]/g, '_')
  while (l.includes('__')) {
    l = l.replace('__', '_')
  }
  l = l.replace('._', '_')
  l = l.replace('.', '_')
  l = l.replace('-', '_')
  l = l.startsWith('_') ? l.substring(1) : l
  l = l.endsWith('_') ? l.substring(0, l.length - 1) : l
  return l
}

// @ts-ignore TypeScript doesn't have character type
/**
 * Returns true if given character is a digit.
 * @param {*} ch
 */
function isDigit(ch) {
  return ch >= '0' && ch <= '9'
}

exports.asCamelCase = asCamelCase
exports.toCamelCase = toCamelCase
exports.toCleanSymbol = toCleanSymbol
exports.toCleanMacro = toCleanMacro
exports.toSnakeCase = toSnakeCase
exports.toSpacedLowercase = toSpacedLowercase
exports.toSnakeCaseAllCaps = toSnakeCaseAllCaps
exports.isDigit = isDigit
exports.toCleanSymbolAsKebabCase = toCleanSymbolAsKebabCase

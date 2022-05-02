/**
 *
 *    Copyright (c) 2021 Silicon Labs
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
 * This module provides the API to access various zcl utilities.
 *
 * @module REST API: various zcl utilities
 */
const toposort = require('toposort')
const queryZcl = require('../db/query-zcl')
const dbEnum = require('../../src-shared/db-enum')
const env = require('./env')
const types = require('./types')

/**
 * Comparator for sorting clusters.
 *
 * @param {*} a
 * @param {*} b
 * @returns -1, 0 or 1
 */
function clusterComparator(a, b) {
  if (a.code < b.code) return -1
  if (a.code > b.code) return 1

  if (a.side < b.side) return -1
  if (a.side > b.side) return 1

  return 0
}

/**
 * Comparator for sorting attribute.
 *
 * @param {*} a
 * @param {*} b
 * @returns -1, 0 or 1
 */
function attributeComparator(a, b) {
  if (a.hexCode < b.hexCode) return -1
  if (a.hexCode > b.hexCode) return 1

  return 0
}

/**
 * Comparator for sorting commands.
 *
 * @param {*} a
 * @param {*} b
 * @returns -1, 0 or 1
 */
function commandComparator(a, b) {
  if (a.manufacturerCode < b.manufacturerCode) return -1
  if (a.manufacturerCode > b.manufacturerCode) return 1

  if (a.hexCode < b.hexCode) return -1
  if (a.hexCode > b.hexCode) return 1

  return 0
}

function findStructByName(structs, name) {
  for (const s of structs) {
    if (s.name == name) {
      return s
    }
  }
  return null
}

/**
 * This method retrieves a bunch of structs sorted
 * alphabetically. It's expected to resort the structs into a list
 * where they are sorted in a way where dependency is observed.
 *
 * It uses the DFS-based topological sort algorithm.
 *
 * @param {*} structs
 * @returns sorted structs according to topological search.
 */
async function sortStructsByDependency(structs) {
  let allStructNames = structs.map((s) => s.name)
  let edges = []

  // Add edges
  structs.forEach((s) => {
    s.items.forEach((i) => {
      const type = i.type
      if (allStructNames.includes(type)) {
        edges.push([s.name, type])
      }
    })
  })

  let sortedEdges = toposort(edges).reverse()

  let finalSort = []
  sortedEdges.forEach((s) => {
    finalSort.push(findStructByName(structs, s))
  })
  allStructNames.forEach((s) => {
    if (!sortedEdges.includes(s)) finalSort.push(findStructByName(structs, s))
  })

  return finalSort
}

/**
 * This function calculates the number of bytes in the data type and based on
 * that returns the option specified in the template.
 * for eg: Given that options are as follows:
 * options.hash.array="b"
 * options.hash.one_byte="u"
 * options.hash.two_byte="v"
 * options.hash.three_byte="x"
 * options.hash.four_byte="w"
 * options.hash.short_string="s"
 * options.hash.long_string="l"
 * options.hash.default="b"
 *
 * calculateBytes("char_string", options)
 * will return 's'
 *
 * @param {*} res
 * @param {*} options
 */
function calculateBytes(res, options, db, packageId, isStructType) {
  if (!isStructType) {
    return calculateBytesForTypes(res, options, db, packageId)
  } else {
    return calculateBytesForStructs(res, options, db, packageId)
  }
}

/**
 *
 * @param options
 * @param optionsKey
 * @param defaultValue
 * Given the values determine to give the user defined value or the calculated value
 */
function optionsHashOrDefault(options, optionsKey, defaultValue) {
  if (optionsKey in options.hash) {
    return options.hash[optionsKey]
  } else {
    return defaultValue
  }
}

function calculateBytesForTypes(res, options, db, packageId) {
  return queryZcl
    .selectSizeFromType(db, packageId, res.toLowerCase())
    .then((x) => {
      return new Promise((resolve, reject) => {
        let result = 0
        switch (x) {
          case 1:
            result = optionsHashOrDefault(options, 'one_byte', x)
            break
          case 2:
            result = optionsHashOrDefault(options, 'two_byte', x)
            break
          case 3:
            result = optionsHashOrDefault(options, 'three_byte', x)
            break
          case 4:
            result = optionsHashOrDefault(options, 'four_byte', x)
            break
          case 5:
            result = optionsHashOrDefault(options, 'five_byte', x)
            break
          case 6:
            result = optionsHashOrDefault(options, 'six_byte', x)
            break
          case 7:
            result = optionsHashOrDefault(options, 'seven_byte', x)
            break
          case 8:
            result = optionsHashOrDefault(options, 'eight_byte', x)
            break
          case 9:
            result = optionsHashOrDefault(options, 'nine_byte', x)
            break
          case 10:
            result = optionsHashOrDefault(options, 'ten_byte', x)
            break
          case 11:
            result = optionsHashOrDefault(options, 'eleven_byte', x)
            break
          case 12:
            result = optionsHashOrDefault(options, 'twelve_byte', x)
            break
          case 13:
            result = optionsHashOrDefault(options, 'thirteen_byte', x)
            break
          case 14:
            result = optionsHashOrDefault(options, 'fourteen_byte', x)
            break
          case 15:
            result = optionsHashOrDefault(options, 'fifteen_byte', x)
            break
          case 16:
            result = optionsHashOrDefault(options, 'sixteen_byte', x)
            break
          default:
            if (
              res != null &&
              res.includes('long') &&
              res.includes(dbEnum.zclType.string)
            ) {
              result = optionsHashOrDefault(options, 'long_string', 'l')
            } else if (
              res != null &&
              !res.includes('long') &&
              res.includes(dbEnum.zclType.string)
            ) {
              result = optionsHashOrDefault(options, 'short_string', 's')
            } else if ('default' in options.hash) {
              result = options.hash.default
            }
            break
        }
        resolve(result)
      })
    })
    .catch((err) => {
      env.logError(
        'Could not find size of the given type in' +
          ' calculateBytesForTypes: ' +
          err
      )
    })
}

async function calculateBytesForStructs(res, options, db, packageId) {
  if ('struct' in options.hash) {
    return options.hash.struct
  } else {
    return queryZcl
      .selectAllStructItemsByStructName(db, res, [packageId])
      .then((items) => {
        let promises = []
        items.forEach((item) =>
          promises.push(
            dataTypeCharacterFormatter(
              db,
              packageId,
              item,
              options,
              item.discriminatorName.toLowerCase()
            )
          )
        )
        return Promise.all(promises)
      })
      .then((resolvedPromises) =>
        resolvedPromises.reduce((acc, cur) => acc + cur, 0)
      )
      .catch((err) => {
        env.logError(
          'Could not find size of struct ' +
            res +
            ' in' +
            ' calculate_size_for_structs: ' +
            err
        )
        return 0
      })
  }
}

function returnOptionsForTypes(size, res, options) {
  return new Promise((resolve, reject) => {
    let result = 0
    switch (size) {
      case 1:
        result = optionsHashOrDefault(options, 'one_byte', size)
        break
      case 2:
        result = optionsHashOrDefault(options, 'two_byte', size)
        break
      case 3:
        result = optionsHashOrDefault(options, 'three_byte', size)
        break
      case 4:
        result = optionsHashOrDefault(options, 'four_byte', size)
        break
      case 5:
        result = optionsHashOrDefault(options, 'five_byte', size)
        break
      case 6:
        result = optionsHashOrDefault(options, 'six_byte', size)
        break
      case 7:
        result = optionsHashOrDefault(options, 'seven_byte', size)
        break
      case 8:
        result = optionsHashOrDefault(options, 'eight_byte', size)
        break
      case 9:
        result = optionsHashOrDefault(options, 'nine_byte', size)
        break
      case 10:
        result = optionsHashOrDefault(options, 'ten_byte', size)
        break
      case 11:
        result = optionsHashOrDefault(options, 'eleven_byte', size)
        break
      case 12:
        result = optionsHashOrDefault(options, 'twelve_byte', size)
        break
      case 13:
        result = optionsHashOrDefault(options, 'thirteen_byte', size)
        break
      case 14:
        result = optionsHashOrDefault(options, 'fourteen_byte', size)
        break
      case 15:
        result = optionsHashOrDefault(options, 'fifteen_byte', size)
        break
      case 16:
        result = optionsHashOrDefault(options, 'sixteen_byte', size)
        break
      default:
        if (
          res != null &&
          res.includes('long') &&
          res.includes(dbEnum.zclType.string)
        ) {
          result = optionsHashOrDefault(options, 'long_string', 'l')
        } else if (
          res != null &&
          !res.includes('long') &&
          res.includes(dbEnum.zclType.string)
        ) {
          result = optionsHashOrDefault(options, 'short_string', 's')
        } else if ('default' in options.hash) {
          result = options.hash.default
        }
        break
    }
    resolve(result)
  }).catch((err) => {
    env.logError(
      'Could not find size of the given type in' +
        ' returnOptionsForTypes: ' +
        err
    )
  })
}

/**
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} type
 * @param {*} options
 * @param {*} resType
 * Character associated to a zcl/c data type.
 */
async function dataTypeCharacterFormatter(
  db,
  packageId,
  type,
  options,
  resType
) {
  switch (resType) {
    case dbEnum.zclType.array:
      if (dbEnum.zclType.array in options.hash) {
        return options.hash.array
      } else {
        return 'b'
      }
    case dbEnum.zclType.bitmap:
      return queryZcl
        .selectBitmapByName(db, packageId, type)
        .then((bitmapRec) => bitmapRec.size)
        .then((size) => {
          return returnOptionsForTypes(size, null, options)
        })
    case dbEnum.zclType.enum:
      return queryZcl
        .selectEnumByName(db, type, packageId)
        .then((enumRec) => enumRec.size)
        .then((size) => {
          return returnOptionsForTypes(size, null, options)
        })
    case dbEnum.zclType.struct:
      if (dbEnum.zclType.struct in options.hash) {
        return options.hash.struct
      } else {
        return calculateBytes(type, options, db, packageId, true)
      }
    case dbEnum.zclType.atomic:
    case dbEnum.zclType.unknown:
    default:
      return queryZcl
        .selectAtomicType(db, packageId, type)
        .then((atomic) => {
          if (
            atomic &&
            (atomic.name == 'char_string' ||
              atomic.name == 'octet_string' ||
              atomic.name == 'long_octet_string' ||
              atomic.name == 'long_char_string')
          ) {
            return atomic.name
          } else {
            return type
          }
        })
        .then((res) => calculateBytes(res, options, db, packageId, false))
  }
}

/**
 * Local function that checks if an enum by the name exists
 *
 * @param {*} db
 * @param {*} enum_name
 * @param {*} packageId
 * @returns Promise of content.
 */
function isEnum(db, enum_name, packageId) {
  return queryZcl
    .selectEnumByName(db, enum_name, packageId)
    .then((enums) => (enums ? dbEnum.zclType.enum : dbEnum.zclType.unknown))
}

/**
 * Local function that checks if a struct by the name exists
 *
 * @param {*} db
 * @param {*} struct_name
 * @param {*} packageId
 * @returns Promise of content.
 */
function isStruct(db, struct_name, packageId) {
  return queryZcl
    .selectStructByName(db, struct_name, packageId)
    .then((st) => (st ? dbEnum.zclType.struct : dbEnum.zclType.unknown))
}

/**
 * Local function that checks if a bitmap by the name exists
 *
 * @param {*} db
 * @param {*} bitmap_name
 * @param {*} packageId
 * @returns Promise of content.
 */
function isBitmap(db, bitmap_name, packageId) {
  return queryZcl
    .selectBitmapByName(db, packageId, bitmap_name)
    .then((st) => (st ? dbEnum.zclType.bitmap : dbEnum.zclType.unknown))
}

/**
 *
 * @param {*} fromType
 * @param {*} toType
 * @param {*} noWarning
 *
 * Type warning message. If noWarning is set to true then the warning message
 * will not be shown.
 */
function defaultMessageForTypeConversion(fromType, toType, noWarning) {
  if (!noWarning) {
    return `/* TYPE WARNING: ${fromType} defaults to */ ` + toType
  } else {
    return toType
  }
}

/**
 *
 *
 * @param {*} type
 * @param {*} options
 * @param {*} packageId
 * @param {*} db
 * @param {*} resolvedType
 * @param {*} overridable
 * @returns the data type associated with the resolvedType
 */
function dataTypeHelper(
  type,
  options,
  packageId,
  db,
  resolvedType,
  overridable
) {
  switch (resolvedType) {
    case dbEnum.zclType.array:
      if ('array' in options.hash) {
        return defaultMessageForTypeConversion(
          `${type} array`,
          options.hash.array,
          options.hash.no_warning
        )
      } else {
        return queryZcl
          .selectAtomicType(db, packageId, dbEnum.zclType.array)
          .then((atomic) => overridable.atomicType(atomic))
      }
    case dbEnum.zclType.bitmap:
      if ('bitmap' in options.hash) {
        return defaultMessageForTypeConversion(
          `${type}`,
          options.hash.bitmap,
          options.hash.no_warning
        )
      } else {
        return queryZcl
          .selectBitmapByName(db, packageId, type)
          .then((bitmapRec) => overridable.bitmapType(bitmapRec.size))
      }
    case dbEnum.zclType.enum:
      if ('enum' in options.hash) {
        return defaultMessageForTypeConversion(
          `${type}`,
          options.hash.enum,
          options.hash.no_warning
        )
      } else {
        return queryZcl
          .selectEnumByName(db, type, packageId)
          .then((enumRec) => overridable.enumType(enumRec.size))
      }
    case dbEnum.zclType.struct:
      if ('struct' in options.hash) {
        return defaultMessageForTypeConversion(
          `${type}`,
          options.hash.struct,
          options.hash.no_warning
        )
      } else {
        return type
      }
    case dbEnum.zclType.atomic:
    case dbEnum.zclType.unknown:
    default:
      return queryZcl
        .selectAtomicType(db, packageId, type)
        .then((atomic) => overridable.atomicType(atomic))
  }
}

/**
 *
 * @param type
 * @param options
 * @param packageId
 * @param currentInstance
 *
 * Note: If the options has zclCharFormatter set to true then the function will
 * return the user defined data associated with the zcl data type and not the
 * actual data type. It can also be used to calculate the size of the data types
 *
 * This is a utility function which is called from other helper functions using ut current
 * instance. See comments in asUnderlyingZclType for usage instructions.
 */
async function asUnderlyingZclTypeWithPackageId(
  type,
  options,
  packageId,
  currentInstance
) {
  let numberType = await queryZcl.selectDataTypeById(
    currentInstance.global.db,
    type
  )
  let actualType = typeof type === 'number' ? numberType.name : type
  return Promise.all([
    new Promise((resolve, reject) => {
      if ('isArray' in currentInstance && currentInstance.isArray)
        resolve(dbEnum.zclType.array)
      else resolve(dbEnum.zclType.unknown)
    }),
    isEnum(currentInstance.global.db, actualType, packageId),
    isStruct(currentInstance.global.db, actualType, packageId),
    isBitmap(currentInstance.global.db, actualType, packageId),
  ])
    .then(
      (res) =>
        new Promise((resolve, reject) => {
          for (let i = 0; i < res.length; i++) {
            if (res[i] != 'unknown') {
              resolve(res[i])
              return
            }
          }
          resolve(dbEnum.zclType.unknown)
        })
    )
    .then((resType) => {
      if (dbEnum.zclType.zclCharFormatter in options.hash) {
        return dataTypeCharacterFormatter(
          currentInstance.global.db,
          packageId,
          actualType,
          options,
          resType
        )
      } else {
        return dataTypeHelper(
          actualType,
          options,
          packageId,
          currentInstance.global.db,
          resType,
          currentInstance.global.overridable
        )
      }
    })
    .catch((err) => {
      env.logError(err)
      throw err
    })
}

/**
 * Returns a promise that resolves into an object containing:
 *   type:
 *   atomicType:
 * Base type for struct is a null.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} type
 */
async function determineType(db, type, packageId) {
  let atomic = await queryZcl.selectAtomicType(db, packageId, type)
  if (atomic != null)
    return {
      type: dbEnum.zclType.atomic,
      atomicType: atomic.name,
    }

  let theEnum = await queryZcl.selectEnumByName(db, type, packageId)
  if (theEnum != null) {
    let size = theEnum.size
    if (size == 3) {
      size = 4
    } else if (size == 6) {
      size = 8
    }
    return {
      type: dbEnum.zclType.enum,
      atomicType: 'enum' + size * 8,
      size: theEnum.size,
    }
  }

  let struct = await queryZcl.selectStructByName(db, type, packageId)
  if (struct != null)
    return {
      type: dbEnum.zclType.struct,
      atomicType: null,
    }

  let theBitmap = await queryZcl.selectBitmapByName(db, packageId, type)
  if (theBitmap != null) {
    let size = theBitmap.size
    if (size == 3) {
      size = 4
    } else if (size == 6) {
      size = 8
    }
    return {
      type: dbEnum.zclType.bitmap,
      atomicType: 'bitmap' + size * 8,
      size: theBitmap.size,
    }
  }

  return {
    type: dbEnum.zclType.unknown,
    atomicType: null,
  }
}

async function createCommandSignature(db, packageId, cmd) {
  let sig = []
  let isSimple = true
  let index = 0
  for (const arg of cmd.commandArgs) {
    let single = ''
    let t = await determineType(db, arg.type, packageId)
    let recordedType
    if (t.type === dbEnum.zclType.enum) {
      recordedType = dbEnum.zclType.enum + (t.size * 8).toString()
    } else if (t.type === dbEnum.zclType.bitmap) {
      recordedType = dbEnum.zclType.bitmap + (t.size * 8).toString()
    } else {
      if (t.atomicType == null) {
        // if it's not a last arg, we call it not simple.
        if (index < cmd.commandArgs.length - 1) {
          isSimple = false
          recordedType = 'NULL'
        } else {
          recordedType = 'POINTER'
        }
      } else {
        recordedType = t.atomicType.toLowerCase()
      }
    }
    arg.baseType = recordedType
    single += `${recordedType}`

    // Deal with arrays
    if (arg.isArray) {
      single += '[]'
      arg.baseType = 'ARRAY'
      if (index < cmd.commandArgs.length - 1) isSimple = false
    }

    // Deal with optionality
    arg.isOptional = false
    if (
      arg.removedIn != null ||
      arg.introducedIn != null ||
      arg.presentIf != null
    ) {
      single += '?'
      arg.isOptional = true
      if (arg.presentIf != null) isSimple = false
    }

    sig.push(single)
    index++
  }

  return {
    signature: sig.toString(),
    isSimple: isSimple,
  }
}

exports.clusterComparator = clusterComparator
exports.attributeComparator = attributeComparator
exports.commandComparator = commandComparator
exports.sortStructsByDependency = sortStructsByDependency
exports.isEnum = isEnum
exports.isBitmap = isBitmap
exports.isStruct = isStruct
exports.asUnderlyingZclTypeWithPackageId = asUnderlyingZclTypeWithPackageId
exports.determineType = determineType
exports.dataTypeCharacterFormatter = dataTypeCharacterFormatter
exports.calculateBytes = calculateBytes
exports.createCommandSignature = createCommandSignature

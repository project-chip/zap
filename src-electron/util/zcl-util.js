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
 * Local function that checks if an enum by the name exists
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

exports.clusterComparator = clusterComparator
exports.attributeComparator = attributeComparator
exports.commandComparator = commandComparator
exports.sortStructsByDependency = sortStructsByDependency
exports.isEnum = isEnum
exports.isBitmap = isBitmap
exports.isStruct = isStruct

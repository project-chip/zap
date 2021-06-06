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

exports.clusterComparator = clusterComparator
exports.attributeComparator = attributeComparator
exports.commandComparator = commandComparator

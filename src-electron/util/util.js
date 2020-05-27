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

import { logInfo } from './env'
import { crc32 } from 'crc'

/**
 * Promises to calculate the CRC of the file, and resolve with an object { filePath, data, actualCrc }
 *
 * @param {*} filePath
 * @param {*} data
 * @returns Promise of a resolved CRC file.
 */
export function calculateCrc(filePath, data) {
  return new Promise((resolve, reject) => {
    var actualCrc = crc32(data)
    logInfo(`For file: ${filePath}, got CRC: ${actualCrc}`)
    resolve({
      filePath: filePath,
      data: data,
      actualCrc: actualCrc,
    })
  })
}

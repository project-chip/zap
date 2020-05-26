// Copyright (c) 2020 Silicon Labs. All rights reserved.

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

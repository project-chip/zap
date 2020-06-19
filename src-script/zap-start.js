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

const { exec } = require('child_process')
const { hashElement } = require('folder-hash')
const cmd1 = 'quasar build'
const cmd2 = 'electron src-electron/main-process/electron-main.js'
const hashOptions = {}
const spaDir = 'dist/spa'
const fs = require('fs')
const path = require('path')

function executeCmd(cmd, ctx) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${cmd}`)
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(err)
      else resolve(ctx)
    })
  })
}

var fileName = path.join(spaDir, 'hash.json')

hashElement('src', hashOptions)
  .then((currentHash) => {
    console.log(`Calculated hash: ${currentHash.hash}`)
    return {
      currentHash: currentHash,
    }
  })
  .then(
    (ctx) =>
      new Promise((resolve, reject) => {
        fs.readFile(fileName, (err, data) => {
          var oldHash = null
          if (err) {
            console.log(`Error reading old hash file: ${fileName}`)
            ctx.needsRebuild = true
          } else {
            oldHash = JSON.parse(data)
            console.log(`Previous hash: ${oldHash.hash}`)
            ctx.needsRebuild = oldHash.hash != ctx.currentHash.hash
          }

          console.log(`SPA rebuild required: ${ctx.needsRebuild}.`)
          resolve(ctx)
        })
      })
  )
  .then((ctx) => {
    if (ctx.needsRebuild) return executeCmd(cmd1, ctx)
    else return Promise.resolve(ctx)
  })
  .then(
    (ctx) =>
      new Promise((resolve, reject) => {
        if (ctx.needsRebuild) {
          console.log('Writing out new hash file.')
          fs.writeFile(fileName, JSON.stringify(ctx.currentHash), (err) => {
            if (err) reject(err)
            else resolve(ctx)
          })
        } else {
          resolve(ctx)
        }
      })
  )
  .then((ctx) => executeCmd(cmd2, ctx))
  .catch((err) => {
    console.log(err)
  })

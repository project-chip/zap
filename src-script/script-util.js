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
const { spawn } = require('cross-spawn')
const folderHash = require('folder-hash')
const hashOptions = {}
const spaDir = 'spa'
const fs = require('fs')
const path = require('path')
const scriptUtil = require('./script-util.js')
const spaHashFileName = path.join(spaDir, 'hash.json')

// Utilities shared by scripts.

function executeCmd(ctx, cmd, args) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Executing: ${cmd} ${args.join(' ')}`)
    var c = spawn(cmd, args)
    c.on('exit', (code) => {
      if (code == 0) resolve(ctx)
      else {
        console.log(`👎 Program ${cmd} exited with error code: ${code}`)
        reject(code)
      }
    })
    c.stdout.on('data', (data) => {
      process.stdout.write(data)
    })
    c.stderr.on('data', (data) => {
      process.stderr.write('⇝ ' + data)
    })
  })
}
/**
 * Resolves into a context object.
 * Check for context.needsRebuild
 *
 * @returns
 */
function rebuildSpaIfNeeded() {
  return folderHash
    .hashElement('src', hashOptions)
    .then((currentHash) => {
      console.log(`🔍 Current  hash: ${currentHash.hash}`)
      return {
        currentHash: currentHash,
      }
    })
    .then(
      (ctx) =>
        new Promise((resolve, reject) => {
          fs.readFile(spaHashFileName, (err, data) => {
            var oldHash = null
            if (err) {
              console.log(`👎 Error reading old hash file: ${spaHashFileName}`)
              ctx.needsRebuild = true
            } else {
              oldHash = JSON.parse(data)
              console.log(`🔍 Previous hash: ${oldHash.hash}`)
              ctx.needsRebuild = oldHash.hash != ctx.currentHash.hash
            }
            if (ctx.needsRebuild) {
              console.log(
                `🐝 Front-end code changed, so we need to rebuild SPA.`
              )
            } else {
              console.log(
                `👍 There were no changes to front-end code, so we don't have to rebuild the SPA.`
              )
            }
            resolve(ctx)
          })
        })
    )
    .then((ctx) => {
      if (ctx.needsRebuild)
        return scriptUtil.executeCmd(ctx, 'quasar', ['build'])
      else return Promise.resolve(ctx)
    })
    .then(
      (ctx) =>
        new Promise((resolve, reject) => {
          if (ctx.needsRebuild) {
            console.log('✍ Writing out new hash file.')
            fs.writeFile(
              spaHashFileName,
              JSON.stringify(ctx.currentHash),
              (err) => {
                if (err) reject(err)
                else resolve(ctx)
              }
            )
          } else {
            resolve(ctx)
          }
        })
    )
}

exports.executeCmd = executeCmd
exports.rebuildSpaIfNeeded = rebuildSpaIfNeeded

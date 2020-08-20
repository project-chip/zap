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
const { hashElement } = require('folder-hash')
const hashOptions = {}
const spaDir = 'spa'
const fs = require('fs')
const path = require('path')
const scriptUtil = require('./script-util.js')

console.log(`node version: ${process.version}`)

var fileName = path.join(spaDir, 'hash.json')

//workaround: executeCmd()/spawn() fails silently without complaining about missing path to electron
process.env.PATH = process.env.PATH + ':/usr/local/bin/'

hashElement('src', hashOptions)
  .then((currentHash) => {
    console.log(`🔍 Current  hash: ${currentHash.hash}`)
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
            console.log(`👎 Error reading old hash file: ${fileName}`)
            ctx.needsRebuild = true
          } else {
            oldHash = JSON.parse(data)
            console.log(`🔍 Previous hash: ${oldHash.hash}`)
            ctx.needsRebuild = oldHash.hash != ctx.currentHash.hash
          }
          if (ctx.needsRebuild) {
            console.log(`🐝 Front-end code changed, so we need to rebuild SPA.`)
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
    if (ctx.needsRebuild) return scriptUtil.executeCmd(ctx, 'quasar', ['build'])
    else return Promise.resolve(ctx)
  })
  .then(
    (ctx) =>
      new Promise((resolve, reject) => {
        if (ctx.needsRebuild) {
          console.log('✍ Writing out new hash file.')
          fs.writeFile(fileName, JSON.stringify(ctx.currentHash), (err) => {
            if (err) reject(err)
            else resolve(ctx)
          })
        } else {
          resolve(ctx)
        }
      })
  )
  .then((ctx) => {
    var cmdArgs = ['src-electron/main-process/electron-main.dev.js']
    cmdArgs.push(...process.argv.slice(2))
    return scriptUtil.executeCmd(ctx, 'electron', cmdArgs)
  })
  .then(() => {
    console.log('😎 All done.')
  })
  .catch((err) => {
    console.log(err)
  })

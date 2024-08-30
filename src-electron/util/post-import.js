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
 * This module contains the API functions for the post-load
 * scripting functionality.
 *
 *  @module JS API: post-import.
 */

const path = require('path')
const scriptApi = require('./post-import-api.js')
const nativeRequire = require('./native-require.js')

/**
 * Executes a named function from a given script.
 * Arguments passed to the function are:
 *   api: which is the result of require('script-api.js')
 *   context: which contains 'db', 'sessionId', etc.
 *
 * @param {*} functionName
 * @param {*} db
 * @param {*} sessionId
 * @param {*} script
 */
async function executeScriptFunction(functionName, context, script) {
  let resolvedPath = path.resolve(script)
  let loadedScript = nativeRequire(resolvedPath)
  if (loadedScript[functionName]) {
    return loadedScript[functionName](scriptApi, context)
  }
}

exports.executeScriptFunction = executeScriptFunction

exports.functions = {
  postLoad: 'postLoad'
}

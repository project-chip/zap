/**
 *
 *    Copyright (c) 2024 Silicon Labs
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
const path = require('path')
const helperRegister = require('./external-helper-register.js')
const nativeRequire = require('./native-require.js')

/**
 * Executes a helper function from a script file.
 * @param {string} functionName - The name of the helper function to execute.
 * @param {Object} context - The context object to pass to the helper function.
 * @param {string} helper - The path to the helper file containing the helper functions.
 * @returns {Promise} - A Promise that resolves with the result of the helper function.
 */
async function executeHelperFunction(functionName, context, helper) {
  // Resolve the full path to the script file
  let resolvedPath = path.resolve(helper)

  // Load the script file
  let loadedScript = nativeRequire(resolvedPath)

  // If the helper function exists in the script file, execute it
  if (loadedScript[functionName]) {
    return loadedScript[functionName](helperRegister, context)
  }
}

exports.executeHelperFunction = executeHelperFunction

exports.functions = {
  initialize_helpers: 'initialize_helpers',
}

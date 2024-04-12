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
// Import the helper API
const api = require('./helper-api.js')

/**
 * Wraps a helper function to add usage tracking and error handling.
 * @param {Function} wrappedHelper - The helper function to wrap.
 * @returns {Function} - The wrapped helper function.
 */
function helperWrapper(wrappedHelper) {
  return function w(...args) {
    // Get the name of the helper function
    let helperName = wrappedHelper.name
    if (wrappedHelper.originalHelper != null) {
      // If the helper function was previously wrapped, use the original name
      helperName = wrappedHelper.originalHelper
    }

    // Check if the helper function is deprecated
    let isDeprecated = false
    if (wrappedHelper.isDeprecated) {
      isDeprecated = true
    }

    // Update usage stats for the helper function
    if (helperName in this.global.stats) {
      this.global.stats[helperName].useCount++
    } else {
      this.global.stats[helperName] = {
        useCount: 1,
        isDeprecated: isDeprecated,
      }
    }

    // Call the helper function and handle any errors
    try {
      return wrappedHelper.call(this, api, ...args)
    } catch (err) {
      let thrownObject
      let opts = args[args.length - 1]
      if ('loc' in opts) {
        // Add location info to the error message
        let locMsg = ` [line: ${opts.loc.start.line}, column: ${opts.loc.start.column}, file: ${this.global.templatePath} ]`
        if (_.isString(err)) {
          thrownObject = new Error(err + locMsg)
        } else {
          thrownObject = err
          thrownObject.message = err.message + locMsg
        }
      }
      throw thrownObject
    }
  }
}

/**
 * Registers a helper function.
 * @param {string} singleHelper - The name of the helper function.
 * @param {Function} registerHelper - The helper function to register.
 * @param {Object} context - The context object.
 */
function registerHelpers(singleHelper, registerHelper, context) {
  // Register the helper function with Handlebars
  context.hb.registerHelper(singleHelper, helperWrapper(registerHelper))
}

// Export the registerHelpers function
exports.registerHelpers = registerHelpers

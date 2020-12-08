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

/**
 * @module JS API: generator logic
 */

const fsPromise = require('fs').promises
const promisedHandlebars = require('promised-handlebars')
const handlebars = promisedHandlebars(require('handlebars'))

const includedHelpers = [
  './helper-zcl.js',
  './helper-zap.js',
  './helper-c.js',
  './helper-session.js',
  './helper-endpointconfig.js',
  './helper-sdkextension.js',
]

var globalHelpersInitialized = false

const templateCompileOptions = {
  noEscape: true,
}

const precompiledTemplates = {}

function produceCompiledTemplate(singleTemplatePkg) {
  if (singleTemplatePkg.id in precompiledTemplates)
    return Promise.resolve(precompiledTemplates[singleTemplatePkg.id])
  else
    return fsPromise.readFile(singleTemplatePkg.path, 'utf8').then((data) => {
      var template = handlebars.compile(data, templateCompileOptions)
      precompiledTemplates[singleTemplatePkg.id] = template
      return template
    })
}

/**
 * Given db connection, session and a single template package, produce the output.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} singlePkg
 * @param {*} overridePath: if passed, it provides a path to the override file that can override the overridable.js
 * @returns Promise that resolves with the 'utf8' string that contains the generated content.
 */
function produceContent(
  db,
  sessionId,
  singleTemplatePkg,
  genTemplateJsonPackageId,
  overridePath = null
) {
  return produceCompiledTemplate(singleTemplatePkg).then((template) =>
    template({
      global: {
        db: db,
        sessionId: sessionId,
        promises: [],
        genTemplatePackageId: genTemplateJsonPackageId,
        overridable: loadOverridable(overridePath),
      },
    })
  )
}

/**
 * This function attemps to call override function, but if override function
 * throws an exception, it calls the original function.
 *
 * @param {*} originalFn
 * @param {*} overrideFn
 * @returns result from override function, unless it throws an exception, in which case return result from original function.
 */
function wrapOverridable(originalFn, overrideFn) {
  return function () {
    try {
      return overrideFn.apply(this, arguments)
    } catch {
      return originalFn.apply(this, arguments)
    }
  }
}

/**
 * This function is responsible to load the overridable function container.
 *
 * @param {*} genTemplatePackageId
 */
function loadOverridable(overridePath) {
  var originals = require('./overridable.js')
  var shallowCopy = Object.assign({}, originals)
  if (overridePath == null) {
    return shallowCopy
  } else {
    var overrides = require(overridePath)
    for (name in overrides) {
      if (name in shallowCopy) {
        shallowCopy[name] = wrapOverridable(shallowCopy[name], overrides[name])
      } else {
        shallowCopy[name] = overrides[name]
      }
    }
    return shallowCopy
  }
}

/**
 * Function that loads the partials.
 *
 * @param {*} path
 */
function loadPartial(name, path) {
  return fsPromise
    .readFile(path, 'utf8')
    .then((data) => handlebars.registerPartial(name, data))
}

/**
 * Function that loads the helpers.
 *
 * @param {*} path
 */
function loadHelper(path) {
  var helpers = require(path)
  for (const singleHelper in helpers) {
    handlebars.registerHelper(singleHelper, helpers[singleHelper])
  }
}

/**
 * Returns an object that contains all the helper functions, keyed
 * by their name
 *
 * @returns Object containing all the helper functions.
 */
function allGlobalHelpers() {
  var allHelpers = {
    api: {}, // keyed functions
    duplicates: [], // array of duplicates
  }
  includedHelpers.forEach((path) => {
    var h = require(path)
    for (const singleHelper in h) {
      allHelpers.api[singleHelper] = h[singleHelper]
    }
  })
  return allHelpers
}

/**
 * Global helper initialization
 */
function initializeGlobalHelpers() {
  if (globalHelpersInitialized) return

  includedHelpers.forEach((element) => {
    loadHelper(element)
  })

  globalHelpersInitialized = true
}

exports.produceContent = produceContent
exports.loadHelper = loadHelper
exports.loadPartial = loadPartial
exports.initializeGlobalHelpers = initializeGlobalHelpers
exports.allGlobalHelpers = allGlobalHelpers

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

const _ = require('lodash')
const nativeRequire = require('../util/native-require')
const fsPromise = require('fs').promises
const promisedHandlebars = require('promised-handlebars')
const defaultHandlebars = require('handlebars')

const includedHelpers = [
  require('./helper-zcl'),
  require('./helper-zap'),
  require('./helper-c'),
  require('./helper-session'),
  require('./helper-endpointconfig'),
  require('./helper-sdkextension'),
  require('./helper-tokens'),
  require('./helper-attribute'),
  require('./helper-command'),
  require('./helper-future'),
  require('./helper-access'),
  require('./helper-zigbee-zcl'),
]

let helpersInitializationList = null

const templateCompileOptions = {
  noEscape: true,
}

const precompiledTemplates = {}

const handlebarsInstance = {}

/**
 * Resolves into a precompiled template, either from previous precompile or freshly compiled.
 * @param {*} singleTemplatePkg
 * @returns templates
 */
async function produceCompiledTemplate(hb, singleTemplatePkg) {
  if (singleTemplatePkg.id in precompiledTemplates) {
    return precompiledTemplates[singleTemplatePkg.id]
  } else {
    let data = await fsPromise.readFile(singleTemplatePkg.path, 'utf8')
    let template = hb.compile(data, templateCompileOptions)
    precompiledTemplates[singleTemplatePkg.id] = template
    return template
  }
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
async function produceContent(
  hb,
  db,
  sessionId,
  singleTemplatePkg,
  genTemplateJsonPackageId,
  options = {
    overridePath: null,
    disableDeprecationWarnings: false,
  }
) {
  let template = await produceCompiledTemplate(hb, singleTemplatePkg)
  let context = {
    global: {
      disableDeprecationWarnings: options.disableDeprecationWarnings,
      deprecationWarnings: {},
      db: db,
      sessionId: sessionId,
      templatePath: singleTemplatePkg.path,
      promises: [],
      genTemplatePackageId: genTemplateJsonPackageId,
      overridable: loadOverridable(options.overridePath),
      stats: {},
    },
  }
  let content = await template(context)
  return {
    content: content,
    stats: context.global.stats,
  }
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
  let originals = require('./overridable.js')
  let shallowCopy = Object.assign({}, originals)
  if (overridePath == null) {
    return shallowCopy
  } else {
    let overrides = nativeRequire(overridePath)
    Object.keys(overrides).forEach((name) => {
      if (name in shallowCopy) {
        shallowCopy[name] = wrapOverridable(shallowCopy[name], overrides[name])
      } else {
        shallowCopy[name] = overrides[name]
      }
    })
    return shallowCopy
  }
}

/**
 * Function that loads the partials.
 *
 * @param {*} path
 */
async function loadPartial(hb, name, path) {
  try {
    let data = await fsPromise.readFile(path, 'utf8')
    hb.registerPartial(name, data)
  } catch (err) {
    console.log('Could not load partial ' + name + ': ' + err)
  }
}

function helperWrapper(wrappedHelper) {
  return function w(...args) {
    let helperName = wrappedHelper.name
    if (wrappedHelper.originalHelper != null) {
      helperName = wrappedHelper.originalHelper
    }
    let isDeprecated = false
    if (wrappedHelper.isDeprecated) {
      isDeprecated = true
    }
    if (helperName in this.global.stats) {
      this.global.stats[helperName].useCount++
    } else {
      this.global.stats[helperName] = {
        useCount: 1,
        isDeprecated: isDeprecated,
      }
    }
    try {
      return wrappedHelper.call(this, ...args)
    } catch (err) {
      let thrownObject
      let opts = args[args.length - 1]
      if ('loc' in opts) {
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
 * Function that loads the helpers.
 *
 * @param {*} helpers - a string path if value is passed through CLI,
 *                      the nativeRequire() is leverage the native js function instead
 *                      of webpack's special sauce.
 *                      a required() module if invoked by backend js code.
 *                      this is required to force webpack to resolve the included files
 *                      as path will be difference after being packed for production.
 */
function loadHelper(hb, helpers, collectionList = null) {
  // helper
  // when template path are passed via CLI
  // Other paths are 'required()' to workaround webpack path issue.
  if (_.isString(helpers)) {
    helpers = nativeRequire(helpers)
  }

  for (const singleHelper of Object.keys(helpers)) {
    try {
      hb.registerHelper(singleHelper, helperWrapper(helpers[singleHelper]))
      if (collectionList != null) {
        collectionList.push(singleHelper)
      }
    } catch (err) {
      console.log('Could not load helper: ' + err)
    }
  }
}

/**
 * Returns an object that contains all the helper functions, keyed
 * by their name
 *
 * @returns Object containing all the helper functions.
 */
function allBuiltInHelpers() {
  let allHelpers = {
    api: {}, // keyed functions
    category: {}, // categories, keyed the same.
    duplicates: [], // array of duplicates
  }
  includedHelpers.forEach((helperPkg) => {
    for (const singleHelper of Object.keys(helperPkg)) {
      // 'meta' inside a helper class signals category and is not a helper.
      if (singleHelper === 'meta') continue
      if (allHelpers.api[singleHelper] != null) {
        allHelpers.duplicates.push(singleHelper)
      }
      allHelpers.api[singleHelper] = helperPkg[singleHelper]
      if (helperPkg.meta != null && helperPkg.meta.category != null) {
        allHelpers.category[singleHelper] = helperPkg.meta.category
      }
    }
  })
  return allHelpers
}

/**
 * Global helper initialization
 */
function initializeGlobalHelpers(hb) {
  if (helpersInitializationList != null) return

  helpersInitializationList = []
  includedHelpers.forEach((element) => {
    loadHelper(hb, element, helpersInitializationList)
  })
}

function globalHelpersList() {
  return helpersInitializationList
}

/**
 * This method returns the correct instance for a given generation flow.
 *
 * TBD: At this point it doesn't do anything yet, it's just
 * a central point to get the correct instance.
 *
 * @returns Instance of handlebars to be used.
 */
function hbInstance() {
  if (handlebarsInstance.default == null) {
    handlebarsInstance.default = promisedHandlebars(defaultHandlebars)
  }
  return handlebarsInstance.default
}

exports.produceContent = produceContent
exports.loadHelper = loadHelper
exports.loadPartial = loadPartial
exports.initializeGlobalHelpers = initializeGlobalHelpers
exports.allBuiltInHelpers = allBuiltInHelpers
exports.globalHelpersList = globalHelpersList
exports.hbInstance = hbInstance

/**
 *
 *    Copyright (c) 2026 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use it except in compliance with the License.
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
 * Worker for workerpool: init from workerData once, then expose render(singleTemplatePkg, genTemplateJsonPackage, iterOptions, index).
 * Loaded in a separate thread; registers with workerpool a worker that returns { index, result } per render call.
 *
 * @example
 *   Pool loads this script; main process uses pool.exec('render', [singleTemplatePkg, genTemplateJsonPackage, iterOptions, index]).
 * @module template-iteration-worker
 */

const { workerData } = require('worker_threads')
const path = require('path')
const workerpool = require('workerpool')

const workerDir = __dirname
const srcElectronDir = path.join(workerDir, '..')

// Init once from workerData (set by pool at creation).
let db = null
let templateEngine = null
let cachedMetaInfo = null
let cachedSessionId = null

/**
 * Initializes the worker once: opens DB, loads template engine, registers partials and helpers from workerData. Idempotent.
 *
 * @returns Promise that resolves when db, templateEngine, cachedMetaInfo, and cachedSessionId are set.
 * @example
 *   await initAsync(); const hb = templateEngine.hbInstance();
 */
async function initAsync() {
  if (db != null) return
  const data = workerData || {}
  const dbApi = require(path.join(srcElectronDir, 'db', 'db-api.js'))
  db = await dbApi.initDatabase(data.dbFilePath)
  templateEngine = require(path.join(workerDir, 'template-engine.js'))
  const hb = templateEngine.hbInstance()
  const partials = data.partials || {}
  for (const [name, content] of Object.entries(partials)) {
    hb.registerPartial(name, content)
  }
  cachedMetaInfo = data.metaInfo || {
    aliases: [],
    categories: [],
    resources: {}
  }
  templateEngine.initializeBuiltInHelpersForPackage(hb, cachedMetaInfo)
  cachedSessionId = data.sessionId
  const helperPaths = data.helperPaths || []
  const context = { db, sessionId: cachedSessionId, hb }
  for (const helperPath of helperPaths) {
    templateEngine.loadHelper(hb, helperPath, context)
  }
}

/**
 * Runs a single template package through the template engine and returns produced content plus index.
 *
 * @param {*} singleTemplatePkg
 * @param {*} genTemplateJsonPackage
 * @param {*} iterOptions - Iteration options (overridePath, overrideKey, initialContext, etc.).
 * @param {number} index - Job index for ordering results.
 * @returns {Promise<index, result>} result is the array from produceContent() for that package.
 * @example
 *   pool.exec('render', [pkg, genJson, opts, 0]) => Promise<{ index: 0, result: [...] }>
 */
workerpool.worker({
  async render(singleTemplatePkg, genTemplateJsonPackage, iterOptions, index) {
    await initAsync()
    const hb = templateEngine.hbInstance()
    const resultArray = await templateEngine.produceContent(
      hb,
      cachedMetaInfo,
      db,
      cachedSessionId,
      singleTemplatePkg,
      genTemplateJsonPackage,
      iterOptions
    )
    return { index, result: resultArray }
  }
})

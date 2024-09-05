#!/usr/bin/env node
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
 *  This test runner profiles the ZAP backend generation speed by loading / calling generate through its RESTful APIs.
 *
 *  Usage:
 *    $ ./gen-test-runner.js --port $ZAP_SERVER_PORT --apps $ZAP_SAMPLE_APP --out $GENERATED_DIR [--noWarmup] [--run $NUMBER]
 */

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const axios = require('axios').default
const { CookieJar } = require('tough-cookie')
const { wrapper } = require('axios-cookiejar-support')
const restApi = require('../src-shared/rest-api')
const fs = require('fs')
const path = require('path')
const find = require('find')
let port = argv.port
const baseURL = `http://localhost:${port}`
const OUTPUT_DIR = argv.out

let sessionId = ''
let TEST_RUN_COUNT = argv.run
let sampleApps = []

if (argv.run == undefined) {
  TEST_RUN_COUNT = 20
}

/**
 * Sample app name from path.
 * @param {*} sampleAppPath
 * @returns path
 */
function getSampleAppNamefromPath(sampleAppPath) {
  const layers = path.dirname(sampleAppPath).split('/')
  return layers[layers.length - 3]
}

/**
 * Logs Generation statistics
 */
async function main() {
  // grab sample apps from CLI
  if (fs.existsSync(argv.apps) && fs.lstatSync(argv.apps).isDirectory()) {
    let sampleAppsPaths = find.fileSync(/\.zap$/, argv.apps)
    let sampleAppsNames = sampleAppsPaths.map((x) =>
      getSampleAppNamefromPath(x)
    )
    sampleAppsNames.forEach((name, index) => {
      sampleApps.push({ name, path: sampleAppsPaths[index] })
    })
  } else {
    sampleApps.push({
      name: getSampleAppNamefromPath(argv.apps),
      path: argv.apps
    })
  }
  console.log(`ZAP port: ${baseURL}`)
  console.log(`Output: ${OUTPUT_DIR}`)

  // warm up cache / db / etc
  if (argv.noWarmup == undefined) {
    await runTest('Cache warmup: ', sampleApps[0].path)
  }

  let totalGenerationTimeSec = 0

  for (let index = 0; index < sampleApps.length; index++) {
    let { name, path } = sampleApps[index]
    console.log(`App: ${name}`)

    for (let i = 1; i <= TEST_RUN_COUNT; i++) {
      const LOG_PREFIX = `Run [${i}/${TEST_RUN_COUNT}]: `
      let res = await runTest(LOG_PREFIX, path)
      totalGenerationTimeSec += res.elapsedSec
    }
  }

  if (TEST_RUN_COUNT)
    console.log(
      `Average generation time: ${totalGenerationTimeSec / TEST_RUN_COUNT}s`
    )
}

/**
 * Log elapsed generation time.
 * @param {*} LOG_PREFIX
 * @param {*} zapFilePath
 * @returns elapsed generation time.
 */
async function runTest(LOG_PREFIX, zapFilePath) {
  console.log(LOG_PREFIX + `Generation started.`)
  let start = Date.now()
  await generate(LOG_PREFIX, zapFilePath)
  let finish = Date.now()
  let elapsedSec = (finish - start) / 1000
  console.log(LOG_PREFIX + `Generation time: ${elapsedSec}s`)
  return { elapsedSec }
}

/**
 * Log generation details.
 * @param {*} LOG_PREFIX
 * @param {*} zapFilePath
 */
async function generate(LOG_PREFIX, zapFilePath) {
  // share cookie / session across HTTP requests
  const jar = new CookieJar()
  axios.defaults.withCredentials = true
  const client = wrapper(axios.create({ baseURL, jar }))
  wrapper(axios)

  // load page
  await client.get('')

  await client
    .post(restApi.ide.open, {
      zapFilePath
    })
    .then(function (response) {
      console.log(LOG_PREFIX + `SessionId: ${response.data?.sessionId}`)
      sessionId = response.data?.sessionId
    })
    .catch(function (error) {
      console.log(error)
    })

  // await client
  //   .put(restApi.uri.generate, {
  //     generationDirectory: '/Users/jiteng/Downloads/zap_generation',
  //     params: {
  //       'sessionId': sessionId
  //     }
  //   })
  //   .then(function (response) {
  //     console.log(`File generated to /Users/jiteng/Downloads/zap_generation`)
  //   })
  //   .catch(function (error) {
  //     console.log(error)
  //   })

  await axios({
    method: 'put',
    baseURL,
    url: restApi.uri.generate,
    jar,
    params: {
      sessionId: sessionId
    },
    data: {
      generationDirectory: OUTPUT_DIR
    }
  })
    .then(function (response) {
      console.log(LOG_PREFIX + `Generation finished.`)
    })
    .catch(function (error) {
      console.log(LOG_PREFIX + `Generation failed!`)
    })
}

main()

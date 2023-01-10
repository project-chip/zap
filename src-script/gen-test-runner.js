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

const axios = require('axios').default
const { CookieJar } = require('tough-cookie')
const { wrapper } = require('axios-cookiejar-support')
let port = process.argv[2]
const baseURL = `http://localhost:${port}`
const restApi = require('../src-shared/rest-api')
const { rest } = require('lodash')
let sessionId = ''
const TEST_RUN_COUNT = 6
const INPUT_FILE =
  '/Users/jiteng/repo/gsdk_boston/protocol/zigbee/app/framework/sample-apps/full-th/config/zcl/zcl_config.zap'
const OUTPUT_DIR = '/Users/jiteng/Downloads/zap_generation'

async function main() {
  console.log(`ZAP port: ${baseURL}`)
  console.log(`Input: ${INPUT_FILE}`)
  console.log(`Output: ${OUTPUT_DIR}`)

  // warm up cache / db / etc
  await runTest('Cache warmup: ')

  let totalGenerationTimeSec = 0
  for (let i = 1; i <= TEST_RUN_COUNT; i++) {
    const LOG_PREFIX = `Run [${i}/${TEST_RUN_COUNT}]: `
    let res = await runTest(LOG_PREFIX)
    totalGenerationTimeSec += res.elapsedSec
  }

  console.log(
    `Average generation time: ${totalGenerationTimeSec / TEST_RUN_COUNT}s`
  )
}

async function runTest(LOG_PREFIX) {
  console.log(LOG_PREFIX + `Generation started.`)
  let start = Date.now()
  await generate(LOG_PREFIX)
  let finish = Date.now()
  let elapsedSec = (finish - start) / 1000
  console.log(LOG_PREFIX + `Generation time: ${elapsedSec}s`)
  return { elapsedSec }
}

async function generate(LOG_PREFIX) {
  // share cookie / session across HTTP requests
  const jar = new CookieJar()
  axios.defaults.withCredentials = true
  const client = wrapper(axios.create({ baseURL, jar }))
  wrapper(axios)

  // load page
  await client.get('')

  await client
    .post(restApi.ide.open, {
      zapFilePath: INPUT_FILE,
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
      sessionId: sessionId,
    },
    data: {
      generationDirectory: OUTPUT_DIR,
    },
  })
    .then(function (response) {
      console.log(LOG_PREFIX + `Generation finished.`)
    })
    .catch(function (error) {
      console.log(LOG_PREFIX + `Generation failed!`)
    })
}

main()

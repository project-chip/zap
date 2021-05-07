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

function testServer(fileName) {
  let testPort
  if (fileName.includes('server-bare.test')) {
    testPort = 9073
  } else if (fileName.includes('server-with-zcl.test')) {
    testPort = 9074
  } else if (fileName.includes('generation.test')) {
    testPort = 9075
  } else if (fileName.includes('server-session.test')) {
    testPort = 9076
  } else {
    let msg = new Error(
      `You must manually assign a port for the given test file: ${fileName}`
    )
    console.log(msg)
    throw msg
  }
  let ret = {
    port: testPort,
    baseUrl: `http://localhost:${testPort++}`,
  }
  return ret
}

exports.testZigbeeGenerationTemplates =
  './test/gen-template/zigbee/gen-templates.json'
exports.testChipGenerationTemplates =
  './test/gen-template/chip/gen-templates.json'
exports.dotdotGenerationTemplates =
  './test/gen-template/dotdot/dotdot-templates.json'

exports.testServer = testServer

exports.testCustomXml = './test/resource/test-custom.xml'
exports.badTestCustomXml = './test/resource/bad-test-custom.xml'

exports.totalClusterCount = 109
exports.totalDomainCount = 23
exports.totalCommandArgsCount = 1784
exports.totalCommandCount = 625
exports.totalAttributeCount = 3430
exports.totalClusterCommandCount = 602
exports.totalServerAttributeCount = 2954
exports.totalSpecCount = 39
exports.totalEnumCount = 209
exports.totalEnumItemCount = 1595
exports.testTemplateCount = 17

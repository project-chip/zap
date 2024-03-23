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

const path = require('path')

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

const zto = 'ZAP_TEST_TIMEOUT'
const ztoShort = 'ZAP_TEST_TIMEOUT_SHORT'
const ztoMedium = 'ZAP_TEST_TIMEOUT_MEDIUM'
const ztoLong = 'ZAP_TEST_TIMEOUT_LONG'

exports.timeout = {
  short: () => {
    if (ztoShort in process.env) {
      return parseInt(process.env[ztoShort])
    } else if (zto in process.env) {
      return parseInt(process.env[zto])
    } else {
      return 1500
    }
  },
  medium: () => {
    if (ztoMedium in process.env) {
      return parseInt(process.env[ztoMedium])
    } else if (zto in process.env) {
      return parseInt(process.env[zto])
    } else {
      return 10000
    }
  },
  long: () => {
    if (ztoLong in process.env) {
      return parseInt(process.env[ztoLong])
    } else if (zto in process.env) {
      return parseInt(process.env[zto])
    } else {
      return 90000
    }
  },
}

exports.testTemplate = {
  zigbee: './test/gen-template/zigbee/gen-templates.json',
  zigbeeCount: 29,
  zigbee2: './test/gen-template/zigbee2/gen-templates.json',
  zigbee2Count: 13,
  matter: './test/gen-template/matter/gen-test.json',
  matterCount: 8,
  matter2: './test/gen-template/matter2/templates.json',
  matter2Count: 1,
  matter3: './test/gen-template/matter3/t.json',
  matter3Count: 18,
  matterApiMaturity: './test/gen-template/matter-api-maturity/templates.json',
  matterApiMaturityCount: 1,
  dotdot: './test/gen-template/dotdot/dotdot-templates.json',
  dotdotCount: 5,
  unittest: './test/gen-template/test/gen-test.json',
  testCount: 3,
  meta: './test/resource/meta/gen-test.json',
}

exports.otherTestFile = {
  fileFormat0: path.join(__dirname, 'resource/file-format/file-format-0.zap'),
  fileFormat1: path.join(__dirname, 'resource/file-format/file-format-1.zap'),
  fileFormatFuture: path.join(
    __dirname,
    'resource/file-format/file-format-future.zap'
  ),
}

exports.zigbeeTestFile = {
  file1: path.join(__dirname, 'resource/generation-test-file-1.zap'),
  gpCombo: path.join(__dirname, 'resource/gp-combo-basic-test.zap'),
  mfgSpecific: path.join(__dirname, 'resource/mfgSpecificConfig.zap'),
  threeEp: path.join(__dirname, 'resource/three-endpoint-device.zap'),
  onOff: path.join(__dirname, 'resource/zll-on-off-switch-test.zap'),
  mfgClusters: path.join(
    __dirname,
    'resource/mfg-specific-clusters-commands.zap'
  ),
  customXml: path.join(__dirname, 'resource/zap-file-with-custom-xml.zap'),
  fullTh: path.join(__dirname, 'resource/full-th.zap'),
}

exports.matterTestFile = {
  matterTest: path.join(__dirname, 'resource/matter-test.zap'),
  switch: path.join(__dirname, 'resource/matter-switch.zap'),
  allClusters: path.join(__dirname, 'resource/matter-all-clusters.zap'),
  allClustersFileFormat2: path.join(
    __dirname,
    'resource/matter-all-clusters-file-format-2.zap'
  ),
  multipleDeviceTypesPerEndpoint: path.join(
    __dirname,
    'resource/multiple-device-types-per-endpoint.zap'
  ),
  apiMaturityTest: path.join(
    __dirname,
    'resource/matter-api-maturity-test.zap'
  ),
}

exports.testZclMetafile = path.join(__dirname, './resource/meta/zcl.json')
exports.testServer = testServer

exports.testCustomXml = './test/resource/custom-cluster/test-custom.xml'
exports.testCustomXml2 = './test/resource/custom-cluster/custom-dut.xml'
exports.customClusterXml =
  './test/resource/custom-cluster/custom-bead-cluster.xml'
exports.badTestCustomXml = './test/resource/custom-cluster/bad-test-custom.xml'

exports.totalClusterCount = 111
exports.totalDomainCount = 20
exports.totalCommandArgsCount = 1786
exports.totalCommandCount = 632
exports.totalEventFieldCount = 3
exports.totalEventCount = 1
exports.totalAttributeCount = 3438
exports.totalClusterCommandCount = 609
exports.totalServerAttributeCount = 2962
exports.totalSpecCount = 24
exports.totalEnumCount = 211
exports.totalNonAtomicEnumCount = 209
exports.totalDiscriminatorCount = 6
exports.totalEnumItemCount = 1595
exports.totalDotDotEnums = 106
exports.totalDotDotEnumItems = 637

exports.totalMatterClusters = 72
exports.totalMatterDeviceTypes = 117
exports.totalMatterCommandArgs = 595
exports.totalMatterCommands = 248
exports.totalMatterAttributes = 784
exports.totalMatterTags = 17
exports.totalMatterEvents = 60
exports.totalMatterEventFields = 94
exports.totalMatterGlobalAttributeBits = 12

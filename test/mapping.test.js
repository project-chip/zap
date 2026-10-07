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
 *
 *
 * @jest-environment node
 */
const dbMapping = require('../src-electron/db/db-mapping.js')
const { timeout } = require('./test-util.js')

test(
  'Test DB mappings',
  () => {
    Object.keys(dbMapping.map).forEach((k) => {
      dbMapping.map[k](null)
      dbMapping.map[k]({ a: 1 })
    })
  },
  timeout.short()
)

test(
  'Cluster foreign key is exposed as clusterRef',
  () => {
    const row = {
      CLUSTER_REF: 42,
      ATTRIBUTE_ID: 1,
      COMMAND_ID: 2,
      EVENT_ID: 3,
      ENDPOINT_TYPE_DEVICE_ID: 4
    }
    for (const mapper of [
      dbMapping.map.attribute,
      dbMapping.map.command,
      dbMapping.map.event
    ]) {
      const mapped = mapper(row)
      expect(mapped.clusterRef).toBe(42)
      expect(mapped.clusterId).toBeUndefined()
    }

    const device = dbMapping.map.endpointTypeDeviceExtended(row)
    expect(device.clusterId).toBe(42)
    expect(device.clusterRef).toBe(42)

    const dataType = dbMapping.map.dataType({
      DATA_TYPE_ID: 7,
      PACKAGE_REF: 42,
      DISCRIMINATOR_REF: 3
    })
    expect(dataType.packageId).toBe(42)
    expect(dataType.packageRef).toBe(42)
  },
  timeout.short()
)

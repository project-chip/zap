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
 */

import ZapState from '../src/store/zap/state.js'
const mutations = require('../src/store/zap/mutations.js')

test('updateInformationText', () => {
  let text = 'foobar'
  let state = ZapState()
  mutations.updateInformationText(state, text)
  expect(state.informationText).toEqual(text)
})

test('updateClusters', () => {
  let clusters = ['foo', 'bar']
  let state = ZapState()
  mutations.updateClusters(state, clusters)
  expect(state.clusters).toEqual(clusters)
})

test('updateSelectedCluster', () => {
  let cluster = 'foobar'
  let state = ZapState()
  mutations.updateSelectedCluster(state, cluster)
  expect(state.clustersView.selected).toEqual(cluster)
})

test('updateSelectedEndpoint', () => {
  let endpoint = 'foobar'
  let state = ZapState()
  mutations.updateSelectedEndpoint(state, endpoint)
  expect(state.endpointView.selectedEndpoint).toEqual(endpoint)
})

test('updateAttributes', () => {
  let attributes = ['foo', 'bar']
  let state = ZapState()
  mutations.updateAttributes(state, attributes)
  expect(state.attributes).toEqual(attributes)
})

test('initializeDefaultEndpoints', () => {
  let endpoints = [{ id: 0, endpointId: 1 }]
  let state = ZapState()
  mutations.initializeDefaultEndpoints(state, endpoints)
  expect(state.endpointView.endpointId[0]).toEqual(1)
})

test('addEndpoint', () => {
  let endpoints = { id: 0, endpointId: 1, endpointTypeRef: 'foo' }
  let state = ZapState()
  mutations.addEndpoint(state, endpoints)
  expect(state.endpointView.endpointType[0]).toEqual('foo')
})

test('updateEndpoint', () => {
  let endpoints = { id: 0, endpointId: 1, endpointTypeRef: 'foo' }
  let state = ZapState()
  mutations.addEndpoint(state, endpoints)
  let context = {
    id: 0,
    changes: [{ updatedKey: 'endpointType', value: 'bar' }],
  }
  mutations.updateEndpoint(state, context)
  expect(state.endpointView['endpointType'][0]).toEqual('bar')
})

test('initializeDefaultEndpointTypes', () => {
  let endpointTypes = [
    { id: 0, endpointId: 1, name: 'foo', deviceTypeRef: 'bar' },
  ]
  let state = ZapState()
  mutations.initializeDefaultEndpointsTypes(state, endpointTypes)
  expect(state.endpointTypeView.name[0]).toEqual(endpointTypes[0].name)
})

test('addEndpointType', () => {
  let endpointType = { id: 0, endpointId: 1, name: 'foo' }
  let state = ZapState()
  mutations.addEndpointType(state, endpointType)
  expect(state.endpointTypeView.name[0]).toEqual('foo')
})

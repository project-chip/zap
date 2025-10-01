/**
 *
 *    Copyright (c) 2025 Silicon Labs
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
 */

import * as actions from '../src/store/zap/actions.js'
const actionsModule = require('../src/store/zap/actions.js')

const mockDeviceTypes = [
  {
    id: 1,
    code: 1,
    profileId: 1,
    label: 'Test',
    caption: 'Test Device',
    domain: 'test',
    packageRef: 1
  }
]

jest.mock('../src/boot/axios', () => ({
  axiosRequests: {
    $serverGet: jest.fn((url) => {
      if (url.endsWith('zclDeviceType/all')) {
        // Return an array of device types as expected by updateZclDeviceTypes
        return Promise.resolve({
          data: [
            {
              id: 1,
              code: 100,
              profileId: 260,
              label: 'Test Device',
              caption: 'Test Device Caption',
              domain: 'Test Domain',
              packageRef: 1
            }
          ]
        })
      }
      // Default mock for other endpoints
      return Promise.resolve({ data: {} })
    }),
    $serverPost: jest.fn((url, data) => {
      if (url === '/attributeUpdate') {
        return Promise.resolve({
          data: {
            endpointTypeAttributeData: {
              attributeRef: 1,
              clusterRef: 1,
              included: true,
              singleton: false,
              bounded: false,
              includedReportable: false,
              defaultValue: 0,
              storageOption: 'ram',
              minInterval: 0,
              maxInterval: 1,
              reportableChange: 0
            }
          }
        })
      } else if (url === '/endpoint') {
        return Promise.resolve({
          data: {
            id: 1,
            endpointId: 1,
            parentEndpointIdentifier: null,
            endpointType: 1,
            networkId: 1,
            profileId: 1,
            validationIssues: {
              endpointId: [],
              networkId: []
            }
          }
        })
      }
      return Promise.resolve({ data: {} })
    }),
    $serverPatch: jest.fn(() =>
      Promise.resolve({
        data: {
          endpointId: 1,
          parentEndpointIdentifier: null,
          changes: [{ updatedKey: 'endpointType', value: 'foo' }],
          validationIssues: {
            endpointId: [],
            networkId: []
          }
        }
      })
    ),
    $serverDelete: jest.fn(() =>
      Promise.resolve({ data: { successful: true, id: 1 } })
    )
  }
}))
jest.mock('../src-electron/util/util.js', () => ({
  cantorPair: jest.fn(() => 42)
}))
jest.mock('../src-shared/rest-api.js', () => ({
  uri: {
    featureMapAttribute: '/featureMapAttribute',
    attributeUpdate: '/attributeUpdate',
    endpointType: '/endpointType',
    endpoint: '/endpoint',
    duplicateEndpoint: '/duplicateEndpoint',
    duplicateEndpointType: '/duplicateEndpointType',
    packages: '/packages',
    initialState: '/initialState',
    getAllPackages: '/getAllPackages',
    sessionPackage: '/sessionPackage',
    addNewPackage: '/addNewPackage',
    getAllSessionKeyValues: '/getAllSessionKeyValues'
  },
  uc: {
    componentAdd: '/componentAdd',
    componentRemove: '/componentRemove'
  }
}))

describe('zap actions', () => {
  let context

  beforeEach(() => {
    context = {
      commit: jest.fn(),
      dispatch: jest.fn(),
      state: {},
      rootState: {},
      getters: {},
      rootGetters: {}
    }
  })

  it('updateExceptions should commit updateExceptions', () => {
    actions.updateExceptions(context, { foo: 'bar' })
    expect(context.commit).toHaveBeenCalledWith('updateExceptions', {
      foo: 'bar'
    })
  })

  it('updateInformationText should commit updateInformationText', async () => {
    await actions.updateInformationText(context, 'info')
    expect(context.commit).toHaveBeenCalledWith('updateInformationText', 'info')
  })

  it('updateClusters should call $serverGet and commit updateClusters', async () => {
    await actions.updateClusters(context)
    expect(context.commit).toHaveBeenCalledWith(
      'updateClusters',
      expect.anything()
    )
  })

  it('updateAtomics should commit updateAtomics', async () => {
    require('../src/boot/axios').axiosRequests.$serverGet.mockResolvedValueOnce(
      { data: [1, 2, 3] }
    )
    await actions.updateAtomics(context, [1, 2, 3])
    expect(context.commit).toHaveBeenCalledWith('updateAtomics', [1, 2, 3])
  })

  it('updateSelectedCluster should call $serverGet and commit updateSelectedCluster', async () => {
    await actions.updateSelectedCluster(context, { id: 1 })
    expect(context.commit).toHaveBeenCalledWith(
      'updateSelectedCluster',
      expect.anything()
    )
  })

  it('updateAttributes should commit updateAttributes', () => {
    actions.updateAttributes(context, [1, 2])
    expect(context.commit).toHaveBeenCalledWith('updateAttributes', [1, 2])
  })

  it('updateCommands should commit updateCommands', () => {
    actions.updateCommands(context, [1, 2])
    expect(context.commit).toHaveBeenCalledWith('updateCommands', [1, 2])
  })

  it('updateEvents should commit updateEvents', () => {
    actions.updateEvents(context, [1, 2])
    expect(context.commit).toHaveBeenCalledWith('updateEvents', [1, 2])
  })

  it('updateFeatures should commit updateFeatures', () => {
    actions.updateFeatures(context, [1, 2])
    expect(context.commit).toHaveBeenCalledWith('updateFeatures', [1, 2])
  })

  it('updateFeatureMapAttribute should call $serverGet and commit updateFeatureMapAttribute', async () => {
    await actions.updateFeatureMapAttribute(context, { id: 1 })
    expect(context.commit).toHaveBeenCalledWith(
      'updateFeatureMapAttribute',
      expect.anything()
    )
  })

  it('updateEndpointConfigs should commit updateEndpointConfigs', () => {
    actions.updateEndpointConfigs(context, [1, 2])
    expect(context.commit).toHaveBeenCalledWith('updateEndpointConfigs', [1, 2])
  })

  it('selectConfiguration should commit selectConfiguration', () => {
    actions.selectConfiguration(context, 'config')
    expect(context.commit).toHaveBeenCalledWith('selectConfiguration', 'config')
  })

  it('initSelectedAttribute should call $serverPost and setAttributeState', async () => {
    const selectionContext = { id: 1, attributeRef: 1, clusterRef: 1 }
    await actions.initSelectedAttribute(context, selectionContext)
    expect(context.commit).toHaveBeenCalledWith(
      'setEndpointTypeAttribute',
      expect.anything()
    )
  })

  it('updateSelectedAttribute should call setAttributeState and commit setEndpointTypeAttribute', async () => {
    // Mock the axios response to return the expected structure
    require('../src/boot/axios').axiosRequests.$serverPost.mockResolvedValueOnce(
      {
        data: {
          endpointTypeAttributeData: {
            attributeRef: 1,
            clusterRef: 2,
            included: true,
            singleton: false,
            bounded: false,
            includedReportable: false,
            defaultValue: 0,
            storageOption: 'ram',
            minInterval: 0,
            maxInterval: 1,
            reportableChange: 0
          }
        }
      }
    )
    await actions.updateSelectedAttribute(context, { id: 1 })
    expect(context.commit).toHaveBeenCalledWith(
      'setEndpointTypeAttribute',
      expect.anything()
    )
  })

  it('updateSelectedCommands should call $serverPost and commit updateInclusionList', async () => {
    require('../src/boot/axios').axiosRequests.$serverPost.mockResolvedValueOnce(
      {
        data: {
          action: 'boolean',
          id: 1,
          clusterRef: 2,
          added: true,
          listType: 'selectedIn'
        }
      }
    )
    await actions.updateSelectedCommands(context, { id: 1 })
    expect(context.commit).toHaveBeenCalledWith(
      'updateInclusionList',
      expect.anything()
    )
  })

  it('updateSelectedEvents should call $serverPost and commit updateInclusionList', async () => {
    require('../src/boot/axios').axiosRequests.$serverPost.mockResolvedValueOnce(
      {
        data: {
          action: 'boolean',
          id: 1,
          clusterRef: 2,
          added: true,
          listType: 'selectedEvents'
        }
      }
    )
    await actions.updateSelectedEvents(context, { id: 1 })
    expect(context.commit).toHaveBeenCalledWith(
      'updateInclusionList',
      expect.anything()
    )
  })

  it('updateSelectedComponent should call $serverPost with correct arguments', async () => {
    const payload = { id: 1, added: true }
    await actions.updateSelectedComponent(context, payload)
    expect(
      require('../src/boot/axios').axiosRequests.$serverPost
    ).toHaveBeenCalledWith('/componentAdd', payload)
  })

  it('getProjectPackages should call $serverGet and commit updateProjectPackages', async () => {
    await actions.getProjectPackages(context)
    expect(context.commit).toHaveBeenCalledWith(
      'updateProjectPackages',
      expect.anything()
    )
  })

  it('initializeDefaultEndpoints should commit initializeDefaultEndpoints', () => {
    actions.initializeDefaultEndpoints(context, [1, 2])
    expect(context.commit).toHaveBeenCalledWith(
      'initializeDefaultEndpoints',
      [1, 2]
    )
  })

  it('initializeDefaultEndpointsTypes should commit initializeDefaultEndpointsTypes', () => {
    actions.initializeDefaultEndpointsTypes(context, [1, 2])
    expect(context.commit).toHaveBeenCalledWith(
      'initializeDefaultEndpointsTypes',
      [1, 2]
    )
  })

  it('updateSelectedEndpoint should commit updateSelectedEndpoint', () => {
    actions.updateSelectedEndpoint(context, { id: 1 })
    expect(context.commit).toHaveBeenCalledWith('updateSelectedEndpoint', {
      id: 1
    })
  })

  it('updateEndpoint should call $serverPatch and commit updateEndpoint', async () => {
    await actions.updateEndpoint(context, { id: 1 })
    expect(context.commit).toHaveBeenCalledWith(
      'updateEndpoint',
      expect.anything()
    )
  })

  it('addEndpoint should call $serverPost and commit addEndpoint', async () => {
    await actions.addEndpoint(context, { id: 1 })
    expect(context.commit).toHaveBeenCalledWith(
      'addEndpoint',
      expect.anything()
    )
  })

  it('addEndpointType should call $serverPost and commit addEndpointType', async () => {
    await actions.addEndpointType(context, { id: 1 })
    expect(context.commit).toHaveBeenCalledWith(
      'addEndpointType',
      expect.anything()
    )
  })

  it('duplicateEndpointType should call $serverPost', async () => {
    const res = await actions.duplicateEndpointType(context, {
      endpointTypeId: 1
    })
    expect(res).toBeDefined()
  })

  it('deleteEndpoint should call $serverDelete and commit deleteEndpoint', async () => {
    await actions.deleteEndpoint(context, 1)
    expect(context.commit).toHaveBeenCalledWith('deleteEndpoint', { id: 1 })
  })

  it('duplicateEndpoint should call $serverPost', async () => {
    const res = await actions.duplicateEndpoint(context, {
      endpointId: 1,
      endpointIdentifier: 2,
      endpointTypeId: 3
    })
    expect(res).toBeDefined()
  })

  it('deleteEndpointType should call $serverDelete and commit removeEndpointType', async () => {
    await actions.deleteEndpointType(context, 1)
    expect(context.commit).toHaveBeenCalledWith('removeEndpointType', { id: 1 })
  })

  it('setAttributeState should commit setEndpointTypeAttribute', () => {
    actions.setAttributeState(context, {
      attributeRef: 1,
      clusterRef: 2,
      included: true,
      singleton: false,
      bounded: false,
      includedReportable: false,
      defaultValue: 0,
      storageOption: 'ram',
      minInterval: 0,
      maxInterval: 1,
      reportableChange: 0
    })
    expect(context.commit).toHaveBeenCalledWith(
      'setEndpointTypeAttribute',
      expect.anything()
    )
  })

  it('setMiniState should commit setMiniState', () => {
    actions.setMiniState(context, { foo: 'bar' })
    expect(context.commit).toHaveBeenCalledWith('setMiniState', { foo: 'bar' })
  })

  it('loadInitialData should call $serverGet and commit initializeEndpoints, initializeEndpointTypes, initializeSessionKeyValues, setAllPackages', async () => {
    await actions.loadInitialData(context)
    expect(context.commit).toHaveBeenCalled()
  })

  it('updateShowDevTools should commit updateShowDevTools', () => {
    actions.updateShowDevTools(context)
    expect(context.commit).toHaveBeenCalledWith('updateShowDevTools')
  })

  it('updateExceptions should commit updateExceptions and toggleShowExceptionIcon', () => {
    actions.updateExceptions(context, { foo: 'bar' })
    expect(context.commit).toHaveBeenCalledWith('updateExceptions', {
      foo: 'bar'
    })
    expect(context.commit).toHaveBeenCalledWith('toggleShowExceptionIcon', true)
  })

  it('updateInformationText should commit updateInformationText after axios resolves', async () => {
    require('../src/boot/axios').axiosRequests.$serverPost.mockResolvedValueOnce(
      { data: {} }
    )
    await actions.updateInformationText(context, 'info')
    expect(context.commit).toHaveBeenCalledWith('updateInformationText', 'info')
  })

  it('updateZclDeviceTypes should commit updateZclDeviceTypes with deviceTypeObjects', async () => {
    require('../src/boot/axios').axiosRequests.$serverGet.mockResolvedValueOnce(
      {
        data: [
          {
            id: 1,
            code: 100,
            profileId: 260,
            label: 'Test',
            caption: 'Desc',
            domain: 'dom',
            packageRef: 2
          }
        ]
      }
    )
    await actions.updateZclDeviceTypes(context)
    expect(context.commit).toHaveBeenCalledWith('updateZclDeviceTypes', {
      1: {
        code: 100,
        profileId: 260,
        label: 'Test',
        description: 'Desc',
        domain: 'dom',
        packageRef: 2
      }
    })
  })

  it('updateAttributes should commit updateAttributes', () => {
    actions.updateAttributes(context, [1, 2])
    expect(context.commit).toHaveBeenCalledWith('updateAttributes', [1, 2])
  })

  it('updateCommands should commit updateCommands', () => {
    actions.updateCommands(context, [1, 2])
    expect(context.commit).toHaveBeenCalledWith('updateCommands', [1, 2])
  })

  it('updateEvents should commit updateEvents', () => {
    actions.updateEvents(context, [1, 2])
    expect(context.commit).toHaveBeenCalledWith('updateEvents', [1, 2])
  })

  it('updateFeatures should commit updateFeatures', () => {
    actions.updateFeatures(context, [1, 2])
    expect(context.commit).toHaveBeenCalledWith('updateFeatures', [1, 2])
  })

  it('updateEndpointConfigs should commit updateEndpointConfigs', () => {
    actions.updateEndpointConfigs(context, [1, 2])
    expect(context.commit).toHaveBeenCalledWith('updateEndpointConfigs', [1, 2])
  })

  it('selectConfiguration should commit selectConfiguration', () => {
    actions.selectConfiguration(context, 'config')
    expect(context.commit).toHaveBeenCalledWith('selectConfiguration', 'config')
  })
})

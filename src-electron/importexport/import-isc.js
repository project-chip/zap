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
const queryConfig = require('../db/query-config.js')
const queryZcl = require('../db/query-zcl.js')
const queryPackage = require('../db/query-package.js')
const querySession = require('../db/query-session.js')
const util = require('../util/util.js')
const dbEnum = require('../../src-shared/db-enum.js')
const restApi = require('../../src-shared/rest-api.js')

/**
 * Locates or adds an attribute, and returns it.
 * at contains clusterId, attributeId, isClient, mfgCode and possibly value
 * @param {*} state
 */
function locateAttribute(state, at) {
  let match = null
  state.attributeType.forEach((a) => {
    if (
      at.clusterCode == a.clusterCode &&
      at.attributeCode == a.attributeCode &&
      at.isClient == a.isClient
    ) {
      match = a
    }
  })
  if (match == null) {
    state.attributeType.push(at)
    return at
  } else {
    return match
  }
}

/**
 * Parrses attribute string in a form:
 *    cl:0xABCD, at:0xABCD, di: [client|server], mf:0xABCD
 *
 * @param {*} attributeString
 * @param {*} [value=null]
 */
function parseAttribute(attributeString, value = null) {
  let at = {}
  attributeString
    .split(',')
    .map((x) => x.trim())
    .forEach((el) => {
      if (el.startsWith('cl:')) {
        at.clusterCode = parseInt(el.substring(3))
      } else if (el.startsWith('at:')) {
        at.attributeCode = parseInt(el.substring(3))
      } else if (el.startsWith('di:')) {
        at.side =
          el.substring(3).trim() == 'client'
            ? dbEnum.side.client
            : dbEnum.side.server
      } else if (el.startsWith('mf:')) {
        at.mfgCode = parseInt(el.substring(3))
      }
    })
  at.storageOption = dbEnum.storageOption.ram
  if (value != null) {
    at.value = value
  }
  return at
}

/**
 * Logic that parses data out of an ISC file into a java object
 *
 * @param {*} state
 * @param {*} line
 */
function parseZclAfv2Line(state, line) {
  if (line.startsWith('configuredEndpoint:')) {
    if (!('endpoint' in state)) {
      state.endpoint = []
    }
    // configuredEndpoint:*ep:1,pi: -1,di:-1,dv:1,ept:Centralized,nwk:Primary
    let tokens = line.substring('configuredEndpoint:'.length).split(',')
    let endpoint = {}
    tokens.forEach((tok) => {
      if (tok.startsWith('ep:')) {
        endpoint.endpoint = parseInt(tok.substring('ep:'.length))
      } else if (tok.startsWith('*ep:')) {
        endpoint.endpoint = parseInt(tok.substring('*ep:'.length))
      } else if (tok.startsWith('pi:')) {
        endpoint.profileId = parseInt(tok.substring('pi:'.length))
      } else if (tok.startsWith('di:')) {
        endpoint.deviceId = parseInt(tok.substring('di:'.length))
      } else if (tok.startsWith('dv:')) {
        endpoint.deviceVersion = parseInt(tok.substring('dv:'.length))
      } else if (tok.startsWith('ept:')) {
        endpoint.endpointType = tok.substring('ept:'.length)
      } else if (tok.startsWith('nwk:')) {
        endpoint.network = tok.substring('nwk:'.length)
      }
    })
    state.endpoint.push(endpoint)
  } else if (line.startsWith('beginEndpointType:')) {
    // Create a temporary state.endpointType
    state.endpointType = {
      typeName: line.substring('beginEndpointType:'.length),
    }
  } else if (line.startsWith('endEndpointType')) {
    // Stick the endpoint into `state.endpointTypes[endpointType.typeName]'
    if (!('endpointTypes' in state)) {
      state.endpointTypes = {}
    }
    state.endpointTypes[state.endpointType.typeName] = state.endpointType
    delete state.endpointType
  } else if (line.startsWith('device:')) {
    state.endpointType.device = line.substring('device:'.length)
  } else if (line.startsWith('deviceId:')) {
    state.endpointType.deviceId = parseInt(line.substring('deviceId:'.length))
  } else if (line.startsWith('profileId:')) {
    state.endpointType.profileId = parseInt(line.substring('profileId:'.length))
  } else if (line.startsWith('overrideClientCluster:')) {
    let idOnOff = line.substring('overrideClientCluster:'.length).split(',')
    let override = {
      clusterId: parseInt(idOnOff[0]),
      isIncluded: idOnOff[1] == 'yes',
      side: dbEnum.side.client,
    }
    state.clusterOverride.push(override)
  } else if (line.startsWith('overrideServerCluster:')) {
    let idOnOff = line.substring('overrideServerCluster:'.length).split(',')
    let override = {
      clusterId: parseInt(idOnOff[0]),
      isIncluded: idOnOff[1] == 'yes',
      side: dbEnum.side.server,
    }
    state.clusterOverride.push(override)
  } else if (line == 'beginAttributeDefaults') {
    state.parseState = line
  } else if (line == 'endAttributeDefaults') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttributeDefaultReportingConfig') {
    state.parseState = line
  } else if (line == 'endAttributeDefaultReportingConfig') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttrList:EXTERNALLY_SAVED') {
    state.parseState = line.substring('beginAttrList:'.length)
  } else if (line == 'endAttrList:EXTERNALLY_SAVED') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttrList:OPTIONAL') {
    state.parseState = line.substring('beginAttrList:'.length)
  } else if (line == 'endAttrList:OPTIONAL') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttrList:SINGLETON') {
    state.parseState = line.substring('beginAttrList:'.length)
  } else if (line == 'endAttrList:SINGLETON') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttrList:BOUNDED') {
    state.parseState = line.substring('beginAttrList:'.length)
  } else if (line == 'endAttrList:BOUNDED') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttrList:SAVED_TO_FLASH') {
    state.parseState = line.substring('beginAttrList:'.length)
  } else if (line == 'endAttrList:SAVED_TO_FLASH') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttrList:REPORTABLE') {
    state.parseState = line.substring('beginAttrList:'.length)
  } else if (line == 'endAttrList:REPORTABLE') {
    state.parseState = 'zclAfv2'
  } else if (state.parseState == 'beginAttributeDefaults') {
    let arr = line.split('=>').map((x) => x.trim())
    let at = parseAttribute(arr[0], arr[1])
    locateAttribute(state, at).defaultValue = at.value
  } else if (state.parseState == 'beginAttributeDefaultReportingConfig') {
    let arr = line.split('=>').map((x) => x.trim())
    // Now parse arr[1], which is min,max:change
    let rpt = {}
    let splits = arr[1].split(':')
    let splits2 = splits[0].split(',')
    rpt.reportableChange = splits[1]
    rpt.minInterval = splits2[0]
    rpt.maxInterval = splits2[1]
    let at = parseAttribute(arr[0], rpt)
    at = locateAttribute(state, at)
    at.minInterval = parseInt(rpt.minInterval)
    at.maxInterval = parseInt(rpt.maxInterval)
    at.reportableChange = parseInt(rpt.reportableChange)
  } else if (state.parseState == 'EXTERNALLY_SAVED') {
    let at = parseAttribute(line.trim())
    locateAttribute(state, at).storageOption = dbEnum.storageOption.external
  } else if (state.parseState == 'OPTIONAL') {
    let at = parseAttribute(line.trim())
    locateAttribute(state, at).isOptional = true
  } else if (state.parseState == 'SINGLETON') {
    let at = parseAttribute(line.trim())
    locateAttribute(state, at).isSingleton = true
  } else if (state.parseState == 'BOUNDED') {
    let at = parseAttribute(line.trim())
    locateAttribute(state, at).bounded = true
  } else if (state.parseState == 'SAVED_TO_FLASH') {
    let at = parseAttribute(line.trim())
    locateAttribute(state, at).storageOption = dbEnum.storageOption.nvm
  } else if (state.parseState == 'REPORTABLE') {
    let at = parseAttribute(line.trim())
    locateAttribute(state, at).reportable = true
  }
}

/**
 * Function that deals with the zcl customizer data inside the ISC file
 *
 * @param {*} state
 * @param {*} line
 */
function parseZclCustomizer(state, line) {
  //console.log(`zclCustomizer:${line}`)
}

/**
 * Toplevel parser that ignore anything except the two setups that are
 * ZCL relevant.
 *
 * @param {*} filePath
 * @param {*} data
 * @returns promise of read ISC data
 */
async function readIscData(filePath, data) {
  const lines = data.toString().split(/\r?\n/)
  const errorLines = []

  let parser = null
  let state = {
    log: [],
    filePath: filePath,
    featureLevel: 0,
    keyValuePairs: [],
    loader: iscDataLoader,
    parseState: 'init',
    // These are not the same as with zap files
    attributeType: [],
    clusterOverride: [],
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    log: `Imported from ${path.basename(filePath)}`,
  })
  lines.forEach((line) => {
    if (line == '{setupId:zclAfv2') {
      parser = parseZclAfv2Line
      state.parseState = 'zclAfv2'
      return
    }
    if (line == '{setupId:zclCustomizer') {
      parser = parseZclCustomizer
      state.parseState = 'zclCustomizer'
      return
    }

    if (state.parseState != 'init' && line == '}') {
      parser = null
      state.parseState = 'nonSetup'
      return
    }

    if (parser != null) {
      try {
        parser(state, line)
      } catch (msg) {
        errorLines.push(msg)
      }
    }
  })

  if (state.parseState == 'init') {
    const S =
      'Error importing the file: there is no usable ZCL content in this file.'
    state.log.push(S)
    throw new Error(S)
  }
  delete state.parseState
  if (errorLines.length > 0) {
    throw new Error(
      'Error while importing the file:\n  - ' + errorLines.join('\n  - ')
    )
  } else {
    return state
  }
}

/**
 * Load individual endpoint types.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} zclPackages Array of package IDs for zcl queries.
 * @param {*} endpointType
 */
async function loadEndpointType(db, sessionId, packageId, endpointType) {
  let deviceName = endpointType.device
  let deviceCode = endpointType.deviceId

  let dev
  if (isCustomDevice(deviceName, deviceCode)) {
    dev = await queryZcl.selectDeviceTypeByCodeAndName(
      db,
      packageId,
      dbEnum.customDevice.code,
      dbEnum.customDevice.name
    )
  } else {
    dev = await queryZcl.selectDeviceTypeByCodeAndName(
      db,
      packageId,
      deviceCode,
      deviceName
    )
  }

  if (dev == null)
    throw new Error(`Unknown device type: ${deviceName} / ${deviceCode}`)
  return queryConfig.insertEndpointType(
    db,
    sessionId,
    endpointType.typeName,
    dev.id,
    false
  )
}

function isCustomDevice(deviceName, deviceCode) {
  return deviceName == 'zcustom'
}

/**
 * This method returns an array of promises that contain all the
 * queries that are needed to load the attribute state
 *
 * @param {*} db
 * @param {*} state
 * @param {*} sessionId
 */
function collectAttributeLoadingPromises(
  db,
  state,
  sessionId,
  endpointTypeIdArray
) {
  let promises = []
  if (state.attributeType.length > 0 && endpointTypeIdArray.length > 0) {
    endpointTypeIdArray.forEach((endpointTypeId) => {
      state.attributeType.forEach((at) => {
        promises.push(
          queryConfig
            .getEndpointTypeAttributeId(
              db,
              endpointTypeId,
              at.clusterCode,
              at.attributeCode,
              at.side,
              at.mfgCode
            )
            .then((id) => {
              if (id == null) {
                // This is ok: we are iterating over all endpoint type ids,
                // since ISC file doesn't really specifically override attribute
                // for every given endpoint type. So if we are looking at
                // the endpoint type which simply doesn't have this
                // attribute, so be it. Move on.
                return
              }
              let ps = []
              if ('storageOption' in at) {
                ps.push(
                  queryConfig.updateEndpointTypeAttribute(
                    db,
                    id,
                    restApi.updateKey.attributeStorage,
                    at.storageOption
                  )
                )
              }
              if ('defaultValue' in at) {
                ps.push(
                  queryConfig.updateEndpointTypeAttribute(
                    db,
                    id,
                    restApi.updateKey.attributeDefault,
                    at.defaultValue
                  )
                )
              }
              let reportable = false
              if ('minInterval' in at) {
                reportable = true
                ps.push(
                  queryConfig.updateEndpointTypeAttribute(
                    db,
                    id,
                    restApi.updateKey.attributeReportMin,
                    at.minInterval
                  )
                )
              }
              if ('maxInterval' in at) {
                reportable = true
                ps.push(
                  queryConfig.updateEndpointTypeAttribute(
                    db,
                    id,
                    restApi.updateKey.attributeReportMax,
                    at.maxInterval
                  )
                )
              }
              if ('reportableChange' in at) {
                reportable = true
                ps.push(
                  queryConfig.updateEndpointTypeAttribute(
                    db,
                    id,
                    restApi.updateKey.attributeReportChange,
                    at.reportableChange
                  )
                )
              }
              ps.push(
                queryConfig.updateEndpointTypeAttribute(
                  db,
                  id,
                  restApi.updateKey.attributeReporting,
                  reportable ? 1 : 0
                )
              )
              if (ps.length == 0) {
                return
              } else {
                return Promise.all(ps)
              }
            })
        )
      })
    })
  }
  promises.push(Promise.resolve(1))
  return promises
}

/**
 * Function that actually loads the data out of a state object.
 * Session at this point is blank, and has no packages.
 *
 * @param {*} db
 * @param {*} state
 * @param {*} sessionId
 */
async function iscDataLoader(db, state, sessionId) {
  let endpointTypes = state.endpointTypes
  let promises = []

  await util.initializeSessionPackage(db, sessionId)
  let zclPackages = await queryPackage.getSessionPackagesByType(
    db,
    sessionId,
    dbEnum.packageType.zclProperties
  )

  if (zclPackages.length == 0) {
    throw new Error('No zcl packages found for ISC import.')
  }

  let packageId = zclPackages[0].id

  for (let key in endpointTypes) {
    promises.push(
      loadEndpointType(db, sessionId, packageId, endpointTypes[key]).then(
        (newEndpointTypeId) => {
          return {
            endpointTypeId: newEndpointTypeId,
            endpointType: endpointTypes[key],
          }
        }
      )
    )
  }

  let results = await Promise.all(promises)

  // results is an array of "endpointTypeId"/"endpointType" objects.

  let endpointInsertionPromises = []
  if (state.endpoint != null)
    state.endpoint.forEach((ep) => {
      // insert individual endpoint
      let endpointTypeId = undefined
      results.forEach((res) => {
        if (res.endpointType.typeName == ep.endpointType) {
          endpointTypeId = res.endpointTypeId
        }
      })
      if (endpointTypeId != undefined) {
        endpointInsertionPromises.push(
          queryConfig.insertEndpoint(
            db,
            sessionId,
            ep.endpoint,
            endpointTypeId,
            ep.network
          )
        )
      }
    })

  let attributeUpdatePromises = collectAttributeLoadingPromises(
    db,
    state,
    sessionId,
    results.map((r) => r.endpointTypeId)
  )

  let individualOverridePromises = []
  if (state.clusterOverride.length > 0) {
    state.clusterOverride.forEach((cl) => {
      let clusterCode = cl.clusterId
      let isIncluded = cl.isIncluded
      let side = cl.side
      individualOverridePromises.push(
        queryConfig.setClusterIncluded(
          db,
          packageId,
          clusterCode,
          isIncluded,
          side
        )
      )
    })
  }

  if (state.log != null) {
    querySession.writeLog(db, sessionId, state.log)
  }

  return Promise.all(endpointInsertionPromises)
    .then(() => Promise.all(individualOverridePromises))
    .then(() => Promise.all(attributeUpdatePromises))
    .then(() => querySession.setSessionClean(db, sessionId))
    .then(() => {
      return {
        sessionId: sessionId,
        errors: [],
        warnings: [],
      }
    })
}

exports.readIscData = readIscData

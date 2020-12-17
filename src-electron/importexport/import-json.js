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
const util = require('../util/util.js')
const dbEnum = require('../../src-shared/db-enum.js')
const querySession = require('../db/query-session.js')
const dbApi = require('../db/db-api.js')
const env = require('../util/env.js')
const queryConfig = require('../db/query-config.js')
const queryPackage = require('../db/query-package.js')
const queryImpexp = require('../db/query-impexp.js')

/**
 * Resolves with a promise that imports session key values.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} keyValuePairs
 */
function importSessionKeyValues(db, sessionId, keyValuePairs) {
  var allQueries = []
  if (keyValuePairs != null) {
    env.logInfo(`Loading ${keyValuePairs.length} key value pairs.`)
    // Write key value pairs
    keyValuePairs.forEach((element) => {
      allQueries.push(
        queryConfig.updateKeyValue(db, sessionId, element.key, element.value)
      )
    })
  }
  return Promise.all(allQueries).then(() => sessionId)
}

// Resolves into a { packageId:, packageType:}
// object, pkg has`path`, `version`, `type`. It can ALSO have pathRelativity. If pathRelativity is missing
// path is considered absolute.
function importSinglePackage(db, sessionId, pkg, zapFilePath) {
  var absPath = pkg.path
  if ('pathRelativity' in pkg) {
    absPath = util.createAbsolutePath(pkg.path, pkg.pathRelativity, zapFilePath)
  }
  return queryPackage
    .getPackageIdByPathAndTypeAndVersion(db, absPath, pkg.type, pkg.version)
    .then((pkgId) => {
      if (pkgId != null) {
        return {
          packageId: pkgId,
          packageType: pkg.type,
        }
      } else {
        env.logInfo(
          'Packages from the file did not match loaded packages making best bet.'
        )
        return queryPackage.getPackagesByType(db, pkg.type).then((packages) => {
          packages.forEach((singleTypePackage) => {
            if (singleTypePackage.version == pkg.version) {
              return {
                packageId: singleTypePackage.id,
                packageType: pkg.type,
              }
            }
          })

          if (packages.length > 0) {
            var p = packages[0]
            env.logWarning(
              `Required package did not match the version. Using first found:${p.id}.`
            )
            return {
              packageId: p.id,
              packageType: pkg.type,
            }
          }
          if (pkg.type != dbEnum.packageType.genTemplatesJson)
            throw `None of the packages found match the required package: ${pkg.path}`
          else return null
        })
      }
    })
}

// Resolves an array of { packageId:, packageType:} objects into { packageId: id, otherIds: [] }
function convertPackageResult(sessionId, data) {
  var ret = {
    sessionId: sessionId,
    packageId: null,
    otherIds: [],
  }
  data.forEach((obj) => {
    if (obj == null) return null
    if (obj.packageType == dbEnum.packageType.zclProperties) {
      ret.packageId = obj.packageId
    } else {
      ret.otherIds.push(obj.packageId)
    }
  })
  return ret
}

// Returns a promise that resolves into an object containing: packageId and otherIds
function importPackages(db, sessionId, packages, zapFilePath) {
  var allQueries = []
  if (packages != null) {
    env.logInfo(`Loading ${packages.length} packages`)
    packages.forEach((p) => {
      allQueries.push(importSinglePackage(db, sessionId, p, zapFilePath))
    })
  }
  return Promise.all(allQueries).then((data) => {
    return convertPackageResult(sessionId, data)
  })
}

function importEndpoints(db, sessionId, endpoints) {
  var allQueries = []
  if (endpoints != null) {
    env.logInfo(`Loading ${endpoints.length} endpoints`)
    endpoints.forEach((endpoint) => {
      allQueries.push(queryImpexp.importEndpoint(db, sessionId, endpoint))
    })
  }
  return Promise.all(allQueries)
}

function importEndpointTypes(
  db,
  sessionId,
  packageId,
  endpointTypes,
  endpoints
) {
  var allQueries = []
  var sortedEndpoints = {}
  if (endpoints != null) {
    endpoints.forEach((ep) => {
      let eptIndex = ep.endpointTypeIndex
      if (sortedEndpoints[eptIndex] == null) sortedEndpoints[eptIndex] = []
      sortedEndpoints[eptIndex].push(ep)
    })
  }

  if (endpointTypes != null) {
    env.logInfo(`Loading ${endpointTypes.length} endpoint types`)
    endpointTypes.forEach((et, index) => {
      allQueries.push(
        queryImpexp
          .importEndpointType(db, sessionId, packageId, et)
          .then((endpointId) => {
            // Now we need to import commands, attributes and clusters.
            var promises = []
            if (sortedEndpoints[index]) {
              sortedEndpoints[index].forEach((endpoint) => {
                promises.push(
                  queryImpexp.importEndpoint(
                    db,
                    sessionId,
                    endpoint,
                    endpointId
                  )
                )
              })
            }
            // et.clusters
            et.clusters.forEach((cluster) => {
              // code, mfgCode, side
              promises.push(
                queryImpexp
                  .importClusterForEndpointType(
                    db,
                    packageId,
                    endpointId,
                    cluster
                  )
                  .then((endpointClusterId) => {
                    var ps = []

                    if ('commands' in cluster)
                      cluster.commands.forEach((command) => {
                        ps.push(
                          queryImpexp.importCommandForEndpointType(
                            db,
                            packageId,
                            endpointId,
                            endpointClusterId,
                            command
                          )
                        )
                      })

                    if ('attributes' in cluster)
                      cluster.attributes.forEach((attribute) => {
                        ps.push(
                          queryImpexp.importAttributeForEndpointType(
                            db,
                            packageId,
                            endpointId,
                            endpointClusterId,
                            attribute
                          )
                        )
                      })
                    return Promise.all(ps)
                  })
              )
            })
            return Promise.all(promises)
          })
      )
    })
  }
  return Promise.all(allQueries)
}

/**
 * Given a state object, this method returns a promise that resolves
 * with the succesfull writing into the database.
 *
 * @export
 * @param {*} db
 * @param {*} state
 * @param {*} existingSessionId If null, then new session will get
 *              created, otherwise it loads the data into an
 *              existing session. Previous session data is not deleted.
 * @returns a promise that resolves into a sessionId that was created.
 */
function writeStateToDatabase(db, state, existingSessionId = null) {
  return dbApi
    .dbBeginTransaction(db)
    .then(() => {
      if (existingSessionId == null) {
        return querySession.createBlankSession(db)
      } else {
        return existingSessionId
      }
    })
    .then((sessionId) =>
      importPackages(db, sessionId, state.package, state.filePath)
    )
    .then((data) => {
      // data: { sessionId, packageId, otherIds}
      var promisesStage1 = [] // Stage 1 is endpoint types
      var promisesStage2 = [] // Stage 2 is endpoints, which require endpoint types to be loaded prior.
      if ('keyValuePairs' in state) {
        promisesStage1.push(
          importSessionKeyValues(db, data.sessionId, state.keyValuePairs)
        )
      }

      if ('endpointTypes' in state) {
        promisesStage1.push(
          importEndpointTypes(
            db,
            data.sessionId,
            data.packageId,
            state.endpointTypes,
            state.endpoints
          )
        )
      }

      // TODO: Why is there an empty block here?
      //if ('endpoints' in state) {
      //}

      return Promise.all(promisesStage1)
        .then(() => Promise.all(promisesStage2))
        .then(() => data.sessionId)
    })
    .finally(() => dbApi.dbCommit(db))
}

/**
 * Parses JSON file and creates a state object out of it, which is passed further down the chain.
 *
 * @param {*} filePath
 * @param {*} data
 * @returns Promise of parsed JSON object
 */
async function readJsonData(filePath, data) {
  let state = JSON.parse(data)
  if (!('featureLevel' in state)) {
    state.featureLevel = 0
  }
  var status = util.matchFeatureLevel(state.featureLevel)

  if (status.match) {
    if (!('keyValuePairs' in state)) {
      state.keyValuePairs = []
    }
    state.filePath = filePath
    state.keyValuePairs.push({
      key: dbEnum.sessionKey.filePath,
      value: filePath,
    })
    state.loader = writeStateToDatabase
    return state
  } else {
    throw status.message
  }
}

exports.readJsonData = readJsonData

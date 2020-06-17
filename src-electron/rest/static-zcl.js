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
 * This module provides the REST API to the static zcl queries.
 *
 * @module REST API: static zcl functions
 */

const httpServer = require('../server/http-server.js')

const queryZcl = require('../db/query-zcl.js')
const dbMapping = require('../db/db-mapping.js')

const itemList = 'zcl-item-list'
const singleItem = 'zcl-item'

function zclClusters(db, id) {
  if (id == 'all') {
    return queryZcl.selectAllClusters(db)
  } else {
    return queryZcl.selectClusterById(db, id)
  }
}

function zclAttributes(db, clusterId) {
  if (clusterId == 'all') {
    return queryZcl.selectAllAttributes(db)
  } else {
    return queryZcl.selectAttributesByClusterId(db, clusterId)
  }
}

function zclCommands(db, clusterId) {
  if (clusterId == 'all') {
    return queryZcl
      .selectAllCommands(db)
      .then((rows) => rows.map(dbMapping.map.command))
  } else {
    return queryZcl.selectCommandsByClusterId(db, clusterId)
  }
}

function zclDomains(db, id) {
  if (id == 'all') {
    return queryZcl
      .selectAllDomains(db)
      .then((rows) => rows.map(dbMapping.map.domain))
  } else {
    return queryZcl.selectDomainById(db, id)
  }
}

function zclEnums(db, id) {
  if (id == 'all') {
    return queryZcl
      .selectAllEnums(db)
      .then((rows) => rows.map(dbMapping.map.enum))
  } else {
    return queryZcl.selectEnumById(db, id)
  }
}

function zclStructs(db, id) {
  if (id == 'all') {
    return queryZcl
      .selectAllStructs(db)
      .then((rows) => rows.map(dbMapping.map.struct))
  } else {
    return queryZcl.selectStructById(db, id)
  }
}

function zclBitmaps(db, id) {
  if (id == 'all') {
    return queryZcl
      .selectAllBitmaps(db)
      .then((rows) => rows.map(dbMapping.map.bitmap))
  } else {
    return queryZcl.selectBitmapById(db, id)
  }
}

function zclDeviceTypes(db, id) {
  if (id == 'all') {
    return queryZcl.selectAllDeviceTypes(db)
  } else {
    return queryZcl.selectDeviceTypeById(db, id)
  }
}

function processGetEntityRequest(db, path, id, replyId, callback) {
  switch (path) {
    case 'cluster':
      zclClusters(db, id).then((x) =>
        zclAttributes(db, id).then((y) =>
          zclCommands(db, id).then((z) =>
            callback(replyId, {
              data: x,
              attributeData: y,
              commandData: z,
              title: `Cluster: ${id}`,
              type: 'cluster',
            })
          )
        )
      )
      break
    case 'domain':
      zclDomains(db, id).then((x) =>
        callback(replyId, { data: x, title: `Domain: ${id}`, type: 'domain' })
      )
      break
    case 'bitmap':
      zclBitmaps(db, id).then((x) =>
        callback(replyId, { data: x, title: `Bitmap: ${id}`, type: 'bitmap' })
      )
      break
    case 'enum':
      zclEnums(db, id).then((x) =>
        callback(replyId, { data: x, title: `Enum: ${id}`, type: 'enum' })
      )
      break
    case 'struct':
      zclStructs(db, id).then((x) =>
        callback(replyId, { data: x, title: `Struct: ${id}`, type: 'struct' })
      )
      break
    case 'deviceType':
      zclDeviceTypes(db, id).then((x) =>
        callback(replyId, {
          data: x,
          title: `Device type: ${id}`,
          type: 'device_type',
        })
      )
      break
    case 'endpointTypeClusters':
      queryZcl
        .selectEndpointTypeClustersByEndpointTypeId(db, id)
        .then((x) =>
          callback(replyId, { data: x, type: `endpointTypeClusters` })
        )
      break
    case 'endpointTypeAttributes':
      queryZcl
        .selectEndpointTypeAttributesByEndpointId(db, id)
        .then((x) =>
          callback(replyId, { data: x, type: `endpointTypeAttributes` })
        )
      break
    case 'endpointTypeCommands':
      queryZcl
        .selectEndpointTypeCommandsByEndpointId(db, id)
        .then((x) =>
          callback(replyId, { data: x, type: `endpointTypeCommands` })
        )
      break
    case 'endpointTypeReportableAttributes':
      queryZcl
        .selectEndpointTypeReportableAttributeByEndpointId(db, id)
        .then((x) =>
          callback(replyId, {
            data: x,
            type: `endpointTypeReportableAttributes`,
          })
        )
      break
    case `endpointTypeDeviceTypeClusters`:
      queryZcl
        .selectDeviceTypeClustersByDeviceTypeRef(db, id)
        .then((x) => callback(replyId, { data: x, type: `deviceTypeClusters` }))
      break
    case `endpointTypeDeviceTypeAttributes`:
      queryZcl
        .selectDeviceTypeAttributesByDeviceTypeRef(db, id)
        .then((x) =>
          callback(replyId, { data: x, type: `deviceTypeAttributes` })
        )
      break
    case `endpointTypeDeviceTypeCommands`:
      queryZcl
        .selectDeviceTypeCommandsByDeviceTypeRef(db, id)
        .then((x) => callback(replyId, { data: x, type: `deviceTypeCommands` }))
      break
  }
}

/**
 * API: /get/:entity/:id
 *
 * @export
 * @param {*} app Express instance.
 */
function registerStaticZclApi(db, app) {
  app.get('/get/:entity/:id', (request, response) => {
    const { id, entity } = request.params
    var processReply = (replyId, object) => {
      object.replyId = replyId
      response.status(httpServer.httpCode.ok).json(object)
    }
    var replyId = id === 'all' ? itemList : singleItem
    processGetEntityRequest(db, entity, id, replyId, processReply)
  })
}

exports.registerStaticZclApi = registerStaticZclApi
exports.zclBitmaps = zclBitmaps
exports.zclDeviceTypes = zclDeviceTypes

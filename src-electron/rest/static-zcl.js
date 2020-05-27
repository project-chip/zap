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

import * as HttpServer from '../server/http-server.js'
import * as QueryZcl from '../db/query-zcl.js'
import * as DbMapping from '../db/db-mapping.js'

const itemList = 'zcl-item-list'
const singleItem = 'zcl-item'

function zclClusters(db, id) {
  if (id == 'all') {
    return QueryZcl.selectAllClusters(db).then((rows) =>
      rows.map(DbMapping.dbMap.cluster)
    )
  } else {
    return QueryZcl.selectClusterById(db, id)
  }
}

function zclAttributes(db, clusterId) {
  if (clusterId == 'all') {
    return QueryZcl.selectAllAttributes(db)
  } else {
    return QueryZcl.selectAttributesByClusterId(db, clusterId)
  }
}

function zclCommands(db, clusterId) {
  if (clusterId == 'all') {
    return QueryZcl.selectAllCommands(db).then((rows) =>
      rows.map(DbMapping.dbMap.command)
    )
  } else {
    return QueryZcl.selectCommandsByClusterId(db, clusterId)
  }
}

function zclDomains(db, id) {
  if (id == 'all') {
    return QueryZcl.selectAllDomains(db).then((rows) =>
      rows.map(DbMapping.dbMap.domain)
    )
  } else {
    return QueryZcl.selectDomainById(db, id)
  }
}

function zclEnums(db, id) {
  if (id == 'all') {
    return QueryZcl.selectAllEnums(db).then((rows) =>
      rows.map(DbMapping.dbMap.enum)
    )
  } else {
    return QueryZcl.selectEnumById(db, id)
  }
}

function zclStructs(db, id) {
  if (id == 'all') {
    return QueryZcl.selectAllStructs(db).then((rows) =>
      rows.map(DbMapping.dbMap.struct)
    )
  } else {
    return QueryZcl.selectStructById(db, id)
  }
}

export function zclBitmaps(db, id) {
  if (id == 'all') {
    return QueryZcl.selectAllBitmaps(db).then((rows) =>
      rows.map(DbMapping.dbMap.bitmap)
    )
  } else {
    return QueryZcl.selectBitmapById(db, id)
  }
}

export function zclDeviceTypes(db, id) {
  if (id == 'all') {
    return QueryZcl.selectAllDeviceTypes(db)
  } else {
    return QueryZcl.selectDeviceTypeById(db, id)
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
      QueryZcl.selectEndpointTypeClustersByEndpointTypeId(db, id).then((x) =>
        callback(replyId, { data: x, type: `endpointTypeClusters` })
      )
      break
    case 'endpointTypeAttributes':
      QueryZcl.selectEndpointTypeAttributesByEndpointId(db, id).then((x) =>
        callback(replyId, { data: x, type: `endpointTypeAttributes` })
      )
      break
    case 'endpointTypeCommands':
      QueryZcl.selectEndpointTypeCommandsByEndpointId(db, id).then((x) =>
        callback(replyId, { data: x, type: `endpointTypeCommands` })
      )
      break
    case 'endpointTypeReportableAttributes':
      QueryZcl.selectEndpointTypeReportableAttributeByEndpointId(
        db,
        id
      ).then((x) =>
        callback(replyId, { data: x, type: `endpointTypeReportableAttributes` })
      )
      break
    case `endpointTypeDeviceTypeClusters`:
      QueryZcl.selectDeviceTypeClustersByDeviceTypeRef(db, id).then((x) =>
        callback(replyId, { data: x, type: `deviceTypeClusters` })
      )
      break
    case `endpointTypeDeviceTypeAttributes`:
      QueryZcl.selectDeviceTypeAttributesByDeviceTypeClusterRef(
        db,
        id
      ).then((x) =>
        callback(replyId, { data: x, type: `deviceTypeAttributes` })
      )
      break
    case `endpointTypeDeviceTypeCommands`:
      QueryZcl.selectDeviceTypeCommandsByDeviceTypeRef(db, id).then((x) =>
        callback(replyId, { data: x, type: `deviceTypeCommands` })
      )
      break
  }
}

/**
 * API: /get/:entity/:id
 *
 * @export
 * @param {*} app Express instance.
 */
export function registerStaticZclApi(db, app) {
  app.get('/get/:entity/:id', (request, response) => {
    const { id, entity } = request.params
    var processReply = (replyId, object) => {
      object.replyId = replyId
      response.status(HttpServer.httpCode.ok).json(object)
    }
    var replyId = id === 'all' ? itemList : singleItem
    processGetEntityRequest(db, entity, id, replyId, processReply)
  })
}

// Copyright (c) 2020 Silicon Labs. All rights reserved.

/** 
 * This module provides the REST API to the static zcl queries.
 * 
 * @module REST API: static zcl functions
 */

import { httpCode } from '../server/http-server.js'
import * as Zcl from '../zcl/zcl-model.js'

const itemList = 'zcl-item-list'
const singleItem = 'zcl-item'

function processGetEntityRequest(db, path, id, replyId, callback) {
    switch (path) {
        case 'cluster':
            Zcl.zclClusters(db, id).then(x =>
                Zcl.zclAttributes(db, id).then(y =>
                    Zcl.zclCommands(db, id).then(z =>
                        callback(replyId,
                            {
                                data: x,
                                attributeData: y,
                                commandData: z,
                                title: `Cluster: ${id}`,
                                type: 'cluster'
                            })
                    )
                )
            )
            break
        case 'domain':
            Zcl.zclDomains(db, id).then(x => callback(replyId, { data: x, title: `Domain: ${id}`, type: 'domain' }))
            break
        case 'bitmap':
            Zcl.zclBitmaps(db, id).then(x => callback(replyId, { data: x, title: `Bitmap: ${id}`, type: 'bitmap' }))
            break
        case 'enum':
            Zcl.zclEnums(db, id).then(x => callback(replyId, { data: x, title: `Enum: ${id}`, type: 'enum' }))
            break
        case 'struct':
            Zcl.zclStructs(db, id).then(x => callback(replyId, { data: x, title: `Struct: ${id}`, type: 'struct' }))
            break
        case 'deviceType':
            Zcl.zclDeviceTypes(db, id).then(x => callback(replyId, { data: x, title: `Device type: ${id}`, type: 'device_type' }))
            break
        case 'endpointTypeClusters': 
            Zcl.zclEndpointTypeClusters(db, id).then( x => callback(replyId, {data: x, type: `endpointTypeClusters`}))
            break
        case 'endpointTypeAttributes':
            Zcl.zclEndpointTypeAttributes(db, id).then( x => callback(replyId, {data: x, type: `endpointTypeAttributes`}))
            break
        case 'endpointTypeCommands':
            Zcl.zclEndpointTypeCommands(db, id).then( x => callback(replyId, {data: x, type: `endpointTypeCommands`}))
            break
        case 'endpointTypeReportableAttributes': 
            Zcl.zclEndpointTypeReportableAttributes(db, id).then( x => callback(replyId, {data: x, type: `endpointTypeReportableAttributes`}))
            break
        case `endpointTypeDeviceTypeClusters`:
            Zcl.zclDeviceTypeClusters(db, id).then ( x => callback(replyId, {data: x, type: `deviceTypeClusters`}))
            break
        case `endpointTypeDeviceTypeAttributes`:
            Zcl.zclDeviceTypeAttributes(db, id).then ( x => callback(replyId, {data: x, type: `deviceTypeAttributes`}))
            break
        case `endpointTypeDeviceTypeCommands`:
            Zcl.zclDeviceTypeCommands(db, id).then ( x => callback(replyId, {data: x, type: `deviceTypeCommands`}))
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
            object.replyId = replyId;
            response.status(httpCode.ok).json(object)
        }
        var replyId = (id === 'all' ? itemList : singleItem)
        processGetEntityRequest(db, entity, id, replyId, processReply)
    })
}
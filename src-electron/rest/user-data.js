// Copyright (c) 2020 Silicon Labs. All rights reserved.

/** 
 * This module provides the REST API to the user specific data.
 * 
 * @module REST API: user data
 */

import { logInfo } from '../main-process/env'
import { insertOrReplaceClusterState, updateKeyValue, insertEndpoint, insertEndpointType, deleteEndpointType, deleteEndpoint } from '../db/query'
import { httpCode } from '../server/http-server'

export function registerSessionApi(db, app) {
    app.post('/post/cluster', (request, response) => {
        var { id, side, flag, endpointTypeId } = request.body
        insertOrReplaceClusterState(db, endpointTypeId, id, side, flag)
            .then(() => response.status(httpCode.ok).send())
            .catch((err) => response.status(httpCode.badRequest).send())
    })

    app.post('/post/save', (request, response) => {
        var { key, value } = request.body
        var sessionId = request.session.zapSessionId
        logInfo(`[${sessionId}]: Saving: ${key} => ${value}`)
        updateKeyValue(db, sessionId, key, value)
            .then(() => {
                response.status(httpCode.ok)
            }).catch((err) => {
                throw err
            })
    })

    app.post('/post/endpoint', (request, response) => {
        var { action, context } = request.body
        var sessionId = request.session.zapSessionId
        switch (action) {
            case 'c':
                insertEndpoint(db, sessionId, context.eptId, context.endpointType, context.nwkId).then(newId => {
                    response.json({
                        action: 'c',
                        id: newId,
                        eptId: context.eptId, 
                        endpointType: context.endpointType, 
                        nwkId: context.nwkId,
                        replyId: "zcl-endpoint-response"
                    })
                    return response.status(httpCode.ok).send()
                }).catch(err => {
                    return response.status(httpCode.badRequest).send()
                })
                break
            case 'd':
                deleteEndpoint(db, context.id).then(removed => {
                    response.json({
                        action: 'd',
                        successful: removed > 0,
                        id: context.id,
                        replyId: "zcl-endpoint-response"
                    })
                    return response.status(httpCode.ok).send()
                })
            default:
                break
        }
    })

    app.post('/post/endpointType', (request, response) => {
        var {action, context} = request.body
        var sessionId = request.session.zapSessionId
        switch (action) {
            case 'c':
                insertEndpointType(db, sessionId, context.name, context.deviceTypeRef).then(newId => {
                    response.json({
                        action: 'c',
                        id: newId,
                        name: context.name, 
                        deviceTypeRef: context.deviceTypeRef, 
                        replyId: "zcl-endpointType-response"
                    })
                    return response.status(httpCode.ok).send()
                }).catch(err => {
                    return response.status(httpCode.badRequest).send()
                })
                break
            case 'd': 
                deleteEndpointType(db, context.id).then (removed => {
                    response.json({
                        action: 'd',
                        successful: removed > 0,
                        id: context.id,
                        replyId: "zcl-endpointType-response"

                    })
                    return response.status(httpCode.ok).send()
                })
                break
            default:
                break
        }
    })
}
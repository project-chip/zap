import fs from "fs"
import { version } from '../package.json'
import { closeDatabase, initDatabase, loadSchema, dbInsert, dbGet } from "../src-electron/db/db-api"
import { zclPropertiesFile } from "../src-electron/main-process/args"
import { logInfo, schemaFile, sqliteTestFile, logError } from "../src-electron/main-process/env"
import { loadZcl } from "../src-electron/zcl/zcl-loader"
import { getPathCrc, insertPathCrc } from "../src-electron/db/query-package"
import { insertClusters, selectAllClusters, selectClusterById, selectAttributesByClusterId, selectCommandsByClusterId } from "../src-electron/db/query-zcl"
import { ensureZapSessionId, setSessionClean, getSessionIdFromWindowdId, getSessionDirtyFlag } from "../src-electron/db/query-session"
import { insertEndpointType, deleteEndpoint, deleteEndpointType, updateKeyValue, getSessionKeyValue } from "../src-electron/db/query-config"
import { insertFileLocation, selectFileLocation } from "../src-electron/db/query-generic"
import { createStateFromDatabase } from "../src-electron/importexport/export"

/*
 * Created Date: Friday, March 13th 2020, 7:44:12 pm
 * Author: Timotej Ecimovic
 * 
 * Copyright (c) 2020 Silicon Labs
 */

var db
var sid

beforeAll(() => {
    var file = sqliteTestFile(1)
    return initDatabase(file)
        .then(d => loadSchema(d, schemaFile(), version))
        .then(d => { db = d; logInfo('DB initialized.') })
})

afterAll(() => {
    var file = sqliteTestFile(1)
    return closeDatabase(db)
        .then(() => {
            if (fs.existsSync(file))
                fs.unlinkSync(file)
        })
})

test('Path CRC queries.', () => {
    var path = '/some/random/path'
    var crc = 42
    return insertPathCrc(db, path, crc)
        .then((rowid) => getPathCrc(db, path))
        .then((c) => expect(c).toBe(crc))
})

test('File location queries.', () => {
    return insertFileLocation(db, '/random/file/path', 'cat')
        .then(() => selectFileLocation(db, 'cat'))
        .then(filePath => expect(filePath).toBe('/random/file/path'))
        .then(() => insertFileLocation(db, '/random/file/second/path', 'cat'))
        .then(() => selectFileLocation(db, 'cat'))
        .then(filePath => expect(filePath).toBe('/random/file/second/path'))
})

test('Replace query', () => {
    return dbInsert(db, "REPLACE INTO PACKAGE (PATH, CRC) VALUES (?,?)", ['thePath', 12])
        .then(rowId => expect(rowId).toBeGreaterThan(0))
        .then(() => dbGet(db, "SELECT CRC FROM PACKAGE WHERE PATH = ?", ['thePath']))
        .then(result => expect(result.CRC).toBe(12))
        .then(() => dbInsert(db, "REPLACE INTO PACKAGE (PATH, CRC) VALUES (?,?)", ['thePath', 13]))
        .then(rowId => expect(rowId).toBeGreaterThan(0))
        .then(() => dbGet(db, "SELECT CRC FROM PACKAGE WHERE PATH = ?", ['thePath']))
        .then(result => expect(result.CRC).toBe(13))
})

test('Simple cluster addition.', () => {
    return insertPathCrc(db, 'test', 1)
        .then((rowid) => insertClusters(db, rowid, [{
            code: '0x1234',
            name: 'Test',
            description: 'Test cluster',
            define: 'TEST'
        }]))
        .then((rowids) => selectAllClusters(db))
        .then((rows) => new Promise((resolve, reject) => {
            expect(rows.length).toBe(1)
            let rowid = rows[0].CLUSTER_ID
            expect(rows[0].CODE).toBe('0x1234')
            expect(rows[0].NAME).toBe('Test')
            resolve(rowid)
        }))
        .then((rowid) => selectClusterById(db, rowid))
        .then((row) => new Promise((resolve, reject) => {
            expect(row.CODE).toBe('0x1234')
            expect(row.NAME).toBe('Test')
            resolve(row.CLUSTER_ID)
        }))
        .then((rowid) => {
            selectAttributesByClusterId(db, rowid)
                .then(rows => {
                    expect(rows.length).toBe(0)
                })
                .then(() => selectCommandsByClusterId(db, rowid))
                .then(rows => {
                    expect(rows.length).toBe(0)
                })
        })
})

test('Now actually load the static data.', () => {
    return loadZcl(db, zclPropertiesFile)
}, 5000)

describe('Session specific queries', () => {
    beforeAll(() => {
        return ensureZapSessionId(db, 'SESSION', 666)
            .then(id => { sid = id })
    })

    test('Test some attribute queries.', () => {
        return getSessionIdFromWindowdId(db, 666).then(data => {
            expect(data.sessionId).toBe(sid)
        })
    })

    test('Random key value queries', () => {
        return updateKeyValue(db, sid, 'key1', 'value1')
            .then(() => getSessionKeyValue(db, sid, 'key1'))
            .then(value => { expect(value).toBe('value1') })
            .then(() => updateKeyValue(db, sid, 'key1', 'value2'))
            .then(() => getSessionKeyValue(db, sid, 'key1'))
            .then(value => { expect(value).toBe('value2') })
    })

    test('Make sure session is dirty', () => {
        var sid;
        return getSessionIdFromWindowdId(db, 666)
            .then(data => {
                sid = data.sessionId
                return getSessionDirtyFlag(db, sid)
            })
            .then(result => {
                expect(result).toBeTruthy()
            })
            .then(() => setSessionClean(db, sid))
            .then(() => getSessionDirtyFlag(db, sid))
            .then(result => {
                expect(result).toBeFalsy()
            })
    })

    test('Make sure triggers work', () => {
        var sid;
        var endpointTypeId;
        return getSessionIdFromWindowdId(db, 666)
            .then(data => {
                sid = data.sessionId
                return getSessionDirtyFlag(db, sid)
            })
            .then(result => {
                expect(result).toBeFalsy()
            })
            .then(() => insertEndpointType(db, sid, 'Test endpoint'))
            .then((id) => {
                endpointTypeId = id
                return getSessionDirtyFlag(db, sid)
            })
            .then(result => {
                expect(result).toBeTruthy()
            })
            .then(() => setSessionClean(db, sid))
            .then(() => getSessionDirtyFlag(db, sid))
            .then(result => {
                expect(result).toBeFalsy()
            })
            .then(() => deleteEndpointType(db, endpointTypeId))
            .then(() => getSessionDirtyFlag(db, sid))
            .then(result => {
                expect(result).toBeTruthy()
            })
    }, 2000)

    test('Test state creation', () => {
        return createStateFromDatabase(db, sid)
            .then(state => {
                expect(state.creator).toBe('zap')
                expect(state.writeTime).toBeTruthy()
            })
            .catch(err => {
                logError("Error", err)
            })
    })

    test('Empty delete', () => {
        return deleteEndpoint(db, 123).then(data => {
            expect(data).toBe(0)
        })
    })

})

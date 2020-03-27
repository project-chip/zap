import fs from "fs"
import { version } from '../package.json'
import { closeDatabase, initDatabase, loadSchema } from "../src-electron/db/db-api"
import { ensureZapSessionId, getPathCrc, getSessionIdFromWindowdId, insertClusters, insertPathCrc, selectAllClusters, selectAttributesByClusterId, selectClusterById, selectCommandsByClusterId, deleteEndpoint, getSessionDirtyFlag, setSessionClean } from "../src-electron/db/query"
import { zclPropertiesFile } from "../src-electron/main-process/args"
import { logInfo, schemaFile, sqliteTestFile } from "../src-electron/main-process/env"
import { loadZcl } from "../src-electron/zcl/zcl-loader"

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

test('Simple cluster addition.', () => {
    return insertPathCrc(db, 'test', 1)
        .then((rowid) => insertClusters(db, rowid, [{
            code: '0x1234',
            name: 'Test',
            description: 'Test cluster',
            define: 'TEST'
        }]))
        .then((rowids) => selectAllClusters(db))
        .then((rows) => new Promise((resolve,reject) => {
            expect(rows.length).toBe(1)
            let rowid = rows[0].CLUSTER_ID
            expect(rows[0].CODE).toBe('0x1234')
            expect(rows[0].NAME).toBe('Test')
            resolve(rowid)
        }))
        .then((rowid) => selectClusterById(db, rowid))
        .then((row) => new Promise((resolve,reject) => {
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

    test('Empty delete', () => {
        return deleteEndpoint(db, 123).then(data => {
            expect(data).toBe(0)
        })
    })

})

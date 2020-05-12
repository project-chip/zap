/**
 * @jest-environment node
 */

/*
* Created Date: Saturday, March 14th 2020, 1:23:01 am
* Author: Timotej Ecimovic
* 
* Copyright (c) 2020 Silicon Labs
*/

import { initHttpServer, shutdownHttpServer } from "../src-electron/server/http-server"
import { initDatabase, closeDatabase, loadSchema } from "../src-electron/db/db-api"
import { logError, setDevelopmentEnv, sqliteTestFile, logInfo, setMainDatabase, appDirectory, schemaFile } from "../src-electron/main-process/env"
import fs from "fs"
import path from 'path'
import axios from 'axios'
import { exportDataIntoFile, importDataFromFile } from "../src-electron/main-process/importexport"
import { version } from '../package.json'
import { selectCountFrom } from "../src-electron/db/query-generic"
import { getAllSessions, deleteSession } from "../src-electron/db/query-session"
import { insertPathCrc } from "../src-electron/db/query-package"
import { insertClusters, insertDomains } from "../src-electron/db/query-zcl"

var db
const port = 9073
const baseUrl = `http://localhost:${port}`
var packageId
var sessionId
var axiosConfig = {
    withCredentials: true
}
var sessionCookie = null

beforeAll(() => {
    setDevelopmentEnv()
    var file = sqliteTestFile(2)
    return initDatabase(file)
        .then(d => loadSchema(d, schemaFile(), version))
        .then(d => { db = d; logInfo(`Test database initialized: ${file}.`) })
        .catch(err => logError(`Error: ${err}`))
})

afterAll(() => {
    return shutdownHttpServer()
        .then(() => closeDatabase(db))
        .then(() => {
            var file = sqliteTestFile(2)
            logInfo(`Removing test database: ${file}`)
            if (fs.existsSync(file)) fs.unlinkSync(file)
        })
})

describe('Session specific tests', () => {

    test('make sure there is no session at the beginning', () => {
        return selectCountFrom(db, "SESSION")
            .then(cnt => {
                expect(cnt).toBe(0)
            })
    })

    test('http server initialization', () => {
        return initHttpServer(db, port)
    })

    test('get index.html', () => {
        return axios.get(`${baseUrl}/index.html`, axiosConfig)
            .then((response) => {
                sessionCookie = response.headers['set-cookie']
                expect(response.data.includes('Configuration tool for the Zigbee Cluster Library')).toBeTruthy()
            })
    })

    test('make sure there is one session after index.html', () => {
        return selectCountFrom(db, "SESSION")
            .then(cnt => {
                expect(cnt).toBe(1)
            })
    })

    test('save session', () => {
        return getAllSessions(db).then((results) => {
            sessionId = results[0].sessionId
        })
    })

    test('test that there is 0 clusters initially', () => {
        return axios.get(`${baseUrl}/get/cluster/all`, axiosConfig)
          .then((response) => {
            expect(response.data.data.length).toBe(0)
            expect(response.data.type).toBe('cluster')
          })
    })

    test('add a package', () => {
        return insertPathCrc(db, 'PATH', 32).then((pkg) => {
            packageId = pkg
        })
    })

    test('load 2 clusters' ,() => {
        return insertClusters(db, packageId, [{
            code: 0x1111,
            name: 'One',
            description: 'Cluster one',
            define: 'ONE'
        },{
            code: 0x2222,
            name: 'Two',
            description: 'Cluster two',
            define: 'TWO'            
        }])
    })

    test('test that there are 2 clusters now', () => {
        return axios.get(`${baseUrl}/get/cluster/all`, axiosConfig)
          .then((response) => {
            expect(response.data.data.length).toBe(2)
            expect(response.data.type).toBe('cluster')
          })
    })

    test('load domains', () => {
        return insertDomains(db, packageId, [ {name: "one" }, {name: "two" }, {name: "three" }, {name: "four" }] )
    })

    test('test that there are domains', () => {
        return axios.get(`${baseUrl}/get/domain/all`, axiosConfig)
          .then((response) => {
            expect(response.data.data.length).toBe(4)
            expect(response.data.type).toBe('domain')
          })
    })

    test('save into a file and load from file', () => {
        var f = path.join(appDirectory(), 'test-output.json')
        if ( fs.existsSync(f))
            fs.unlinkSync(f)
        expect(fs.existsSync(f)).toBeFalsy()
        return exportDataIntoFile(db, sessionId, f)
          .then(() => {
              expect(fs.existsSync(f)).toBeTruthy()
          })
          .then(() => importDataFromFile(sessionId, f))
          .then(() => {
            fs.unlinkSync(f)
            return Promise.resolve(1)
          })
    })

    test('make sure there is just one session', () => {
        return getAllSessions(db)
        .then((rows) => {
            expect(rows.length).toBe(4)
        })

    })

    test('delete a session', () => {
        return deleteSession(db, sessionId)
    })

    test('check that there is no sessions', () => {
        return getAllSessions(db)
        .then((rows) => {
            expect(rows.length).toBe(3)
        })
    })

})

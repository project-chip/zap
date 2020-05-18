var sq = require('sqlite3')

import { loadSchema, closeDatabase, dbMultiSelect } from '../src-electron/db/db-api'
import { loadZcl } from '../src-electron/zcl/zcl-loader'
import { zclDomains, zclClusters, zclEnums, zclStructs, zclDeviceTypes, zclBitmaps } from '../src-electron/zcl/zcl-model'
import { version } from '../package.json'
import { schemaFile } from '../src-electron/main-process/env'
import { zclPropertiesFile } from '../src-electron/main-process/args'
import { selectCountFrom } from '../src-electron/db/query-generic'

test('test opening and closing the database', () => {
    var db = new sq.Database(':memory:')
    return closeDatabase(db)
})

test('test database schema loading in memory', () => {
    var db = new sq.Database(':memory:')
    return loadSchema(db, schemaFile(), version).then((db) => closeDatabase(db))
})

test('test zcl data loading in memory', () => {
    var db = new sq.Database(':memory:')
    return loadSchema(db, schemaFile(), version)
        .then((db) => loadZcl(db, zclPropertiesFile)) // Maybe: ../../../zcl/zcl-studio.properties
        .then(() => zclClusters(db, 'all'))
        .then((x) => expect(x.length).toEqual(106))
        .then(() => zclDomains(db, 'all'))
        .then((x) => expect(x.length).toEqual(20))
        .then(() => zclEnums(db, 'all'))
        .then((x) => expect(x.length).toEqual(206))
        .then(() => zclStructs(db, 'all'))
        .then((x) => expect(x.length).toEqual(50))
        .then(() => zclBitmaps(db, 'all'))
        .then((x) => expect(x.length).toEqual(121))
        .then(() => zclDeviceTypes(db, 'all'))
        .then((x) => expect(x.length).toEqual(152))
        .then(() => selectCountFrom(db, 'COMMAND_ARG'))
        .then((x) => expect(x).toEqual(1668))
        .then(() => selectCountFrom(db, 'COMMAND'))
        .then((x) => expect(x).toEqual(560))
        .then(() => selectCountFrom(db, 'ENUM_ITEM'))
        .then((x) => expect(x).toEqual(1552))
        .then(() => selectCountFrom(db, 'ATTRIBUTE'))
        .then((x) => expect(x).toEqual(3416))
        .then(() => selectCountFrom(db, 'BITMAP_FIELD'))
        .then((x) => expect(x).toEqual(724))
        .then(() => selectCountFrom(db, 'STRUCT_ITEM'))
        .then((x) => expect(x).toEqual(154))
        .then(() => dbMultiSelect(db, 'SELECT CLUSTER_ID FROM CLUSTER WHERE CODE = ?', [['0x0000'], ['0x0006']]))
        .then(rows => {
            expect(rows.length).toBe(2)
            expect(rows[0]).not.toBeUndefined()
            expect(rows[1]).not.toBeUndefined()
            expect(rows[0].CLUSTER_ID).not.toBeUndefined()
            expect(rows[1].CLUSTER_ID).not.toBeUndefined()
        })
        .finally(() => {
            closeDatabase(db)
        })
}, 5000) // Give this test 5 secs to resolve
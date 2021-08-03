const sqlite3 = require('sqlite3')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')

const db = new sqlite3.Database(':memory:')
const schema = path.resolve('../db/zap-schema.sql')
const outputFile = path.resolve('../../src-shared/types/db-types.ts')

// Utility function for generating TypeScript interface types from ZAP table schema

// sqlite3.verbose()

let sqlToTypescriptTypes = { integer: 'number', text: 'string' }

// load schema
db.serialize(async function () {
  let schemaFileContent = fs.readFileSync(schema, 'utf8')

  db.exec(schemaFileContent, (err) => {
    if (err) {
      console.log('Failed to populate schema')
      console.log(err)
    }
  })
})

async function main() {
  let output = [
    `/**
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
`,
  ]

  let names = await dbAll(
    db,
    "SELECT name FROM sqlite_master WHERE type ='table' AND name NOT LIKE 'sqlite_%'"
  ).then((tables) => tables.map((x) => x.name))

  console.log("Generating TypeScript interfaces for the following tables:")
  console.log(JSON.stringify(names))

  let promises = names.map((name) =>
    dbAll(db, "PRAGMA table_info('" + name + "')")
  )
  let results = await Promise.all(promises)
  names.forEach((name, index) => {
    // console.log(`TABLE: ${name}`)
    // console.log(`${JSON.stringify(results[index])}`)
    output.push(`export interface Db${_.upperFirst(_.camelCase(name))}Type {`)
    results[index].forEach((r) => {
      output.push(`  ${_.camelCase(r.name)}: ${sqlToTypescriptTypes[r.type]},`)
    })
    output.push(`}\n`)
  })

  fs.writeFile(outputFile, output.join('\n'), (err) => {
    if (err) {
      console.error(err)
      return
    }

    console.log(`Generated TypeScrip interfaces to file: ${outputFile}`)
  })
}

async function dbAll(db, query, args) {
  return new Promise((resolve, reject) => {
    db.all(query, args, (err, rows) => {
      if (err) {
        console.log(`Failed all: ${query}: ${args} : ${err}`)
        reject(err)
      } else {
        // console.log(`Executed all: ${query}: ${args}`)
        resolve(rows)
      }
    })
  })
}

main()

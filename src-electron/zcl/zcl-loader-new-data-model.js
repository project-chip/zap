/**
 *
 *    Copyright (c) 2023 Silicon Labs
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
const _ = require('lodash')
const util = require('../util/util')
const fs = require('fs')
const fsp = fs.promises
const types = require('../util/types')
const env = require('../util/env')
const queryLoader = require('../db/query-loader')

/**
 * Parses the new XML files. Returns an object containing
 * loaded data:
 *    clusterIdsLoaded: array of cluster ids that were loaded
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} files
 * @param {*} context
 * @returns Promise that resolves when all the new XML data is loaded.
 */
async function parseNewXmlFiles(db, packageId, files, context) {
  let ret = {
    clusterIdsLoaded: [],
    errorFiles: [],
  }
  if (files == null || files.length == 0) {
    return ret
  }
  let clusters = []
  for (let f of files) {
    // First parse the XML file into a normalized object.
    let cluster = await parseSingleNewXmlFile(f)
    if (cluster == null) {
      env.logWarning(
        `Invalid XML file: ${f}, missing toplevel 'cluster' element.`,
      )
      ret.errorFiles.push({ file: f, error: 'missing cluster element' })
    } else if (Number.isNaN(cluster.code)) {
      env.logWarning(
        `Invalid XML file: ${f}, missing or invalid 'id' attribute in 'cluster' element.`,
      )
      ret.errorFiles.push({ file: f, error: 'missing id attribute' })
    } else {
      clusters.push(cluster)
    }
  }

  // We collected the data back. Now we have to write it into the database.
  await queryLoader.insertClusters(db, packageId, clusters)

  ret.clusterIdsLoaded.push(...clusters.map((cluster) => cluster.code))
  return ret
}

function prepXmlFeature(f) {
  let feature = {}
  feature.bit = parseInt(f.$.bit)
  feature.code = f.$.code
  feature.name = f.$.name
  feature.summary = f.$.summary
  return feature
}
function prepXmlAttribute(a) {
  let attribute = {}
  attribute.id = types.hexStringToInt(a.$.id)
  attribute.name = a.$.name
  attribute.type = a.$.type
  attribute.default = a.$.default
  return attribute
}
function prepXmlCommand(c) {
  let command = {}
  command.id = types.hexStringToInt(c.$.id)
  command.name = c.$.name
  return command
}
function prepXmlEvent(e) {
  let event = {}
  event.id = types.hexStringToInt(e.$.id)
  event.name = e.$.name
  return event
}

async function parseSingleNewXmlFile(f) {
  let content = await fsp.readFile(f)
  let xmlObject = await util.parseXml(content)
  if (xmlObject.cluster == null) {
    return null
  }

  // Ok, now we need to parse the thing properly....
  let data = { features: [], attributes: [], commands: [], events: [] }

  data.code = types.hexStringToInt(xmlObject.cluster.$.id)
  data.name = xmlObject.cluster.$.name
  data.revision = xmlObject.cluster.$.revision

  if (
    xmlObject.cluster.features &&
    _.isArray(xmlObject.cluster.features[0].feature)
  ) {
    for (let feature of xmlObject.cluster.features[0].feature) {
      data.features.push(prepXmlFeature(feature))
    }
  }
  if (
    xmlObject.cluster.attributes &&
    _.isArray(xmlObject.cluster.attributes[0].attribute)
  ) {
    for (let attribute of xmlObject.cluster.attributes[0].attribute) {
      data.attributes.push(prepXmlAttribute(attribute))
    }
  }
  if (
    xmlObject.cluster.commands &&
    _.isArray(xmlObject.cluster.commands[0].command)
  ) {
    for (let command of xmlObject.cluster.commands[0].command) {
      data.commands.push(prepXmlCommand(command))
    }
  }
  if (
    xmlObject.cluster.events &&
    _.isArray(xmlObject.cluster.events[0].event)
  ) {
    for (let event of xmlObject.cluster.events[0].event) {
      data.events.push(prepXmlEvent(event))
    }
  }

  return data
}

exports.parseNewXmlFiles = parseNewXmlFiles

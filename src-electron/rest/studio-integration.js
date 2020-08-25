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
 *    distributed under the Licen
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

/**
 * This module provides the API to Studio's Jetty server.
 *
 */

const axios = require('axios')
const args = require('../util/args.js')
const env = require('../util/env.js')

const url = `http://localhost:` + args.studioHttpPort
const op_tree = '/rest/clic/components/all/project/'
const op_add = '/rest/clic/component/add/project/'
const op_remove = '/rest/clic/component/remove/project/'

function getProjectInfo(project) {
  let name = projectName(project)
  let path = url + op_tree + project
  env.logInfo(`StudioUC(${name}): GET: ${path}`)
  return axios.get(path)
}

function addComponent(project, componentId) {
  return component(project, componentId, op_add)
}

function removeComponent(project, componentId) {
  return component(project, componentId, op_remove)
}

function component(project, componentId, operation) {
  return axios.post(url + operation + project, {
    componentId: componentId,
  })
}

function projectName(studioProject) {
  if (studioProject) {
    return studioProject.substr(studioProject.lastIndexOf('_2F') + 3)
  } else {
    return ''
  }
}

exports.getProjectInfo = getProjectInfo
exports.addComponent = addComponent
exports.removeComponent = removeComponent
exports.projectName = projectName

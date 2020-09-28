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

const axios = require('axios')
const restApi = require('../../src-shared/rest-api.js')

function open(zap_file) {
  // Make a request for a user with a given ID
  if (zap_file) {
    axios
      .get(`${restApi.ide.open}?project=${zap_file}`)
      .then((res) => window.openCallback(res))
      .catch((err) => window.openCallback(err))
  }
}

exports.open = open

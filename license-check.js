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

//Usage 'node ./license-check.js --production'

var fs = require('fs')
var checker = require('./node_modules/license-checker/lib/index')
var args = require('./node_modules/license-checker/lib/args').parse()
var whiteList = fs.readFileSync('license-whitelist.txt').toString().split('\n')
var fail = false
checker.init(args, function (err, json) {
  for (x in json) {
    var license = json[x].licenses
    if (!x.includes('zap@') && !whiteList.includes(license.toString())) {
      console.log(
        'New License Found for module: ' +
          x +
          ' license:"' +
          json[x].licenses +
          '"'
      )
      fail = true
    }
  }
  if (fail) {
    console.log('License check FAILED')
  } else {
    console.log('License check SUCCESS')
  }
})

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

//Usage 'node ./license-add.js

var fs = require('fs')
var path = require('path')

const license = `/**
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
`

// Directories that we will scan
const directories = ['src', 'src-electron', 'test']

async function processSingleFile(path) {
  if (path.endsWith('.js') || path.endsWith('.vue')) {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) throw err
      if (data.startsWith(license)) {
        console.log(`    -  valid: ${path}: `)
      } else {
        if (data.startsWith('// Copyright')) {
          var pos = data.indexOf('\n')
          data = data.substr(pos + 1)
          console.log(`    - update: ${path}`)
        } else {
          console.log(`    - add: ${path}: `)
        }
        // Now we write license and then data
        var output = license
        output = output.concat(data)
        fs.writeFile(path, output, (err) => {
          if (err) throw err
        })
      }
    })
  }
}

async function readDirent(level, currentDir, dirent) {
  if (dirent == null) return
  var fullName = path.join(currentDir.path, dirent.name)
  if (dirent.isFile()) {
    processSingleFile(fullName)
  } else if (dirent.isDirectory()) {
    fs.promises.opendir(fullName).then((dir) => recursiveScan(level + 1, dir))
  }
  return currentDir
    .read()
    .then((dirent) => readDirent(level, currentDir, dirent))
}

async function recursiveScan(level, currentDir) {
  currentDir.read().then((dirent) => readDirent(level, currentDir, dirent))
  return currentDir
}

directories.forEach((path) => {
  fs.promises.opendir(path).then((dir) => recursiveScan(0, dir))
})

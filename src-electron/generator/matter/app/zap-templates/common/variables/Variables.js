/*
 *
 *    Copyright (c) 2021 Project CHIP Authors
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

/*
 * This file contains code for supporting variables into the YAML tests suites.
 */

// Import helpers from zap core
const zapPath = '../../../../../../'
const zclHelper = require(zapPath + 'generator/helper-zcl.js')
const templateUtil = require(zapPath + 'generator/template-util.js')

const {
  getCommands,
  getAttributes,
} = require('../simulated-clusters/SimulatedClusters.js')

const knownVariables = {
  nodeId: { type: 'NODE_ID', defaultValue: 0x12345, isNullable: false },
  endpoint: { type: 'ENDPOINT_NO', defaultValue: '', isNullable: false },
  cluster: { type: 'CHAR_STRING', defaultValue: '', isNullable: false },
  timeout: {
    type: 'INT16U',
    defaultValue: 'kTimeoutInSeconds',
    isNullable: false,
  },
}

function throwError(test, errorStr) {
  console.error(
    'Error in: ' +
      test.filename +
      '.yaml for test with label: "' +
      test.label +
      '"\n'
  )
  console.error(errorStr)
  throw new Error()
}

async function getItems(test, promise, itemName) {
  return promise.then((items) => {
    const item = items.find(
      (item) => item.name.toLowerCase() == itemName.toLowerCase()
    )
    if (!item) {
      const names = items.map((item) => item.name)
      throwError(
        test,
        'Missing ' + itemName + '" in: \n\t* ' + names.join('\n\t* ')
      )
    }

    return item
  })
}

async function getCommandInformationsFor(context, test, argumentName) {
  const command = await getItems(
    test,
    getCommands(context, test.cluster),
    test.command
  )
  const argument = command.response.arguments.find(
    (item) => item.name.toLowerCase() == argumentName.toLowerCase()
  )
  return {
    type: argument.type,
    chipType: argument.chipType,
    isNullable: argument.isNullable,
  }
}

async function getAttributeInformationsFor(context, test, attributeName) {
  const attribute = await getItems(
    test,
    getAttributes(context, test.cluster),
    attributeName
  )
  return {
    type: attribute.type,
    chipType: attribute.chipType,
    isNullable: attribute.isNullable,
  }
}

async function extractVariablesFromConfig(context, suite) {
  let variables = []

  // Ensure that timeout is always set in the config, to enable command-line
  // control over it.
  if (!('timeout' in suite.config)) {
    // Set to the defaultValue, because below for the isKnownVariable case we will use
    // the actual value as the default value...
    suite.config.timeout = knownVariables.timeout.defaultValue
  }

  for (const key of Object.keys(suite.config)) {
    let value = {}

    const isKnownVariable = key in knownVariables

    const target = isKnownVariable ? knownVariables[key] : suite.config[key]
    for (const prop of Object.keys(target)) {
      value[prop] = target[prop]
    }

    if (!isKnownVariable && !('defaultValue' in target)) {
      throw new Error(
        `${suite.filename}: No default value defined for config '${key}'`
      )
    }

    value.defaultValue = isKnownVariable
      ? suite.config[key]
      : suite.config[key].defaultValue
    if (
      Number.isInteger(value.defaultValue) &&
      !Number.isSafeInteger(value.defaultValue)
    ) {
      throw new Error(
        `${suite.filename}: Default value defined for config '${key}' is too large to represent exactly as an integer in YAML.  Put quotes around it to treat it as a string.`
      )
    }
    value.chipType = await zclHelper.asUnderlyingZclType.call(
      context,
      value.type,
      { hash: {} }
    )
    value.name = key
    variables.push(value)
  }

  return variables
}

async function extractVariablesFromTests(context, suite) {
  let variables = {}
  suite.tests.forEach((test) => {
    test.response.forEach((response) => {
      response.values
        .filter((value) => value.saveAs)
        .forEach((saveAsValue) => {
          const key = saveAsValue.saveAs
          if (key in variables) {
            throwError(
              test,
              `Variable with name: ${key} is already registered.`
            )
          }

          if (!test.isCommand && !test.isAttribute) {
            throwError(
              test,
              `Variable support for step ${test} is not supported. Only commands and attributes are supported.`
            )
          }

          variables[key] = { test, name: saveAsValue.name }
        })
    })
  })

  const rv = []
  for (const [key, { test, name }] of Object.entries(variables)) {
    let variable = await (test.isCommand
      ? getCommandInformationsFor(context, test, name)
      : getAttributeInformationsFor(context, test, name))
    variable.name = key
    rv.push(variable)
  }

  return rv
}

async function Variables(context, suite) {
  return {
    config: await extractVariablesFromConfig(context, suite),
    tests: await extractVariablesFromTests(context, suite),
  }
}

//
// Module exports
//
exports.Variables = Variables

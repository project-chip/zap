/*
 *    Copyright (c) 2023 Project CHIP Authors
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
 * This file declares test suite utility methods for equality commands.
 *
 * Each method declared in this file needs to be implemented on a per-language
 * basis and allows exposing  methods to the test suites that are not part
 * of the regular cluster set of APIs.
 */

const kEqualityResponse = {
  arguments: [{ name: 'Equals', type: 'BOOLEAN' }],
};

const BooleanEquals = {
  name: 'BooleanEquals',
  arguments: [
    { name: 'Value1', type: 'BOOLEAN' },
    { name: 'Value2', type: 'BOOLEAN' },
  ],
  responseName: 'EqualityResponse',
  response: kEqualityResponse,
};

const SignedNumberEquals = {
  name: 'SignedNumberEquals',
  arguments: [
    { name: 'Value1', type: 'INT64S' },
    { name: 'Value2', type: 'INT64S' },
  ],
  responseName: 'EqualityResponse',
  response: kEqualityResponse,
};

const UnsignedNumberEquals = {
  name: 'UnsignedNumberEquals',
  arguments: [
    { name: 'Value1', type: 'INT64U' },
    { name: 'Value2', type: 'INT64U' },
  ],
  responseName: 'EqualityResponse',
  response: kEqualityResponse,
};

const EqualityCommands = {
  name: 'EqualityCommands',
  commands: [BooleanEquals, SignedNumberEquals, UnsignedNumberEquals],
};

//
// Module exports
//
exports.cluster = EqualityCommands;

/**
 *
 *    Copyright (c) 2021 Silicon Labs
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
// This is an example of an addon helper for templates.

function test_external_addon_helper(api, context) {
  return 'This is example of test external addon helper.'
}
function initialize_helpers(api, context) {
  api.registerHelpers(
    'test_external_addon_helper',
    test_external_addon_helper.bind(null, api, context),
    context
  )
}

exports.initialize_helpers = initialize_helpers

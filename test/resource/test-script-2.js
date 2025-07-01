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
// Example file for the post load functionality.

async function postLoad(api, context) {
  let epts = await api.endpoints(context)
  await api.deleteEndpoint(context, epts[0])
  return { message: 'Endpoint Deleted', status: 'automatic' } // Status can be 'nothing', 'automatic', 'user_verification', 'impossible'.
}

exports.postLoad = postLoad

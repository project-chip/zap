/**
 *
 *    Copyright (c) 2025 Silicon Labs
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

// Example upgrade rule to update default value of Level Control cluster attribute in Matter.
async function postLoad(api, context) {
  let resMsg = ''
  let epts = await api.endpoints(context)
  for (let i = 0; i < epts.length; i++) {
    let clusters = await api.clusters(context, epts[i])
    for (let j = 0; j < clusters.length; j++) {
      if (clusters[j].code == '0x0008') {
        let attributes = await api.attributes(context, epts[i], clusters[j])
        for (let k = 0; k < attributes.length; k++) {
          let attributeCode = parseInt(attributes[k].code)
          let attributeValue = parseInt(attributes[k].defaultValue)
          if (
            attributeCode == 0 &&
            (attributeValue == 0 || !attributeValue || attributeValue == 'null')
          ) {
            let params = [
              {
                key: context.updateKey.attributeDefault,
                value: 10
              }
            ]
            await api.updateAttribute(
              context,
              epts[i],
              clusters[j],
              attributes[k],
              params
            )
            resMsg += `Current Value attribute's default value updated to 10 for Level Control cluster on endpoint ${epts[i].endpointIdentifier} ${epts[i].category}\n`
          }
        }
      }
    }
  }
  return { message: resMsg, status: 'automatic' } // Status can be 'nothing', 'automatic', 'user_verification', 'impossible'.
}

exports.postLoad = postLoad

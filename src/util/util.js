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

// Implements the pairing function here as a perfect hash.
// https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
// We don't implement the inverse at this time.
// This function takes in 2 non-negative natural numbers, and returns a natural number
export function cantorPair(x, y) {
  return ((x + y) * (x + y + 1)) / 2 + y
}

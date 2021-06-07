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
const peggy = require('peggy')

// Syntax of matter idl files.
// interactively develop/test at https://peggyjs.org/online
const GRAMMAR = `
Enum
  = "enum" id:Identifier _ ":" _ enumType:EnumType _ "{" values:EnumValueList "}" {
     return {
     	type: "enum",
        dataType: enumType,
        id: id,
        values: values,
     };
  }
  
EnumValueList
  = _ head:EnumValue tail:(_ "," _ EnumValue)* {
    const result = [head];
    for (const element of tail) {
      result.push(element[3]);
    }
    return result;
  }
  
EnumValue "enumeration value"
  = _ i:Identifier _ "=" _ v:Number _ { return {id: i, value: v}; }
  
Number
  = HexInteger 
  / Integer
  
HexInteger
  = "0x" [a-fA-F0-9]+ { return parseInt(text(), 16); }
  
Integer
  = [0-9]+ { return parseInt(text(), 10); }
    

Identifier
  = _ ([a-zA-Z_][a-zA-Z0-9_]*) {return text().trim(); }
  
EnumType
  = "ENUM8"i { return "ENUM8"; }

_ "whitespace"
  = [ \\t\\n\\r]*
`

/**
 * Function that actually loads the data out of a state object.
 *
 * Session at this point is blank and has no packages.
 *
 * @param {*} db
 * @param {*} state
 * @param {*} sessionId
 */
async function matterDataLoader(db, state, sessionId) {
  console.log('NOT YET IMEPLEMENTED: %o', state.data)
}

/**
 * Top level parser that reads matter IDL data
 *
 * Returns a "state" object whose only mandatory member is "loader"
 * which is capable of placing data from within the state into a database
 * (see matterDataLoader)
 *
 * @param {string} filePath - the path from where the data is read
 * @param {string} data - content that is being read
 *
 */
async function readMatterIdl(filePath, data) {
  try {
    return {
      // required state properties
      loader: matterDataLoader,

      // state specific to Matter
      data: peggy.generate(GRAMMAR).parse(data),
    }
  } catch (e) {
    throw new Error(e.message)
  }
}

exports.readMatterIdl = readMatterIdl

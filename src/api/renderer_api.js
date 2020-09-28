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

const ide = require('./ide-api-request.js')

// The purpose of this file is to provide the API for jxbrowser
export default function createApi() {
  return {
    prefix: 'zap',
    description: 'Zap Renderer API',
    functions: [
      {
        id: 'open',
        description: 'Open file...',
        function: (path) => {
          ide.open(path)
        },
      },
      {
        id: 'save',
        description: 'Save file...',
        function: () => alert('save!'),
      },
      {
        id: 'saveAs',
        description: 'Save As file...',
        function: () => alert('save!'),
      },
      {
        id: 'refresh',
        description: 'Refresh file...',
        function: () => alert('refresh!'),
      },
      {
        id: 'rename',
        description: 'Rename file...',
        function: () => alert('rename!'),
      },
      {
        id: 'isDirty',
        description:
          'Returns whether editor content should be saved when the editor is closed...',
        function: () => alert('rename!'),
      },

      // Misc operation that might not be supported.
      {
        id: 'move',
        description: 'Move file...',
        function: () => alert('Move!'),
      },
      {
        id: 'import',
        description: 'Import file...',
        function: () => alert('import!'),
      },
      {
        id: 'export',
        description: 'Export file...',
        function: () => alert('export!'),
      },
    ],
  }
}

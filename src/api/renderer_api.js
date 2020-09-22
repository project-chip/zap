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
    callbacks: [
      {
        id: 'open',
        description: 'Open file...',
        callback: (path) => {
          ide.open(path)
        },
      },
      {
        id: 'save',
        description: 'Save file...',
        callback: () => alert('save!'),
      },
      {
        id: 'saveAs',
        description: 'Save As file...',
        callback: () => alert('save!'),
      },
      {
        id: 'refresh',
        description: 'Refresh file...',
        callback: () => alert('refresh!'),
      },
      {
        id: 'rename',
        description: 'Rename file...',
        callback: () => alert('rename!'),
      },
      {
        id: 'isDirty',
        description:
          'Returns whether editor content should be saved when the editor is closed...',
        callback: () => alert('rename!'),
      },

      // Misc operation that might not be supported.
      {
        id: 'move',
        description: 'Move file...',
        callback: () => alert('Move!'),
      },
      {
        id: 'import',
        description: 'Import file...',
        callback: () => alert('import!'),
      },
      {
        id: 'export',
        description: 'Export file...',
        callback: () => alert('export!'),
      },
    ],
  }
}

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

exports.renderer_api_info = [
  { id: 'debugNavBarOff', description: 'Hide debug navigation bar...' },
  { id: 'debugNavBarOn', description: 'Show debug navigation bar...' },
  { id: 'getFileLocation' },
  { id: 'getItem', description: 'Get item...' },
  { id: 'getStorageItem' },
  { id: 'open', description: 'Open file...' },
  { id: 'progressEnd', description: 'End progress indicator.' },
  { id: 'progressStart', description: 'Start progress indicator.' },
  { id: 'removeItem', description: 'Remove item...' },
  { id: 'removeStorageItem' },
  { id: 'reportFiles', description: 'Reports files selected by the renderer.' },
  { id: 'save', description: 'Save file...' },
  { id: 'saveFileLocation' },
  { id: 'setItem', description: 'Set item...' },
  { id: 'setStorageItem' },
  { id: 'setTheme', description: 'Set theme...' },
]

exports.id = {
  debugNavBarOff: 'debugNavBarOff',
  debugNavBarOn: 'debugNavBarOn',
  getFileLocation: 'getFileLocation',
  getItem: 'getItem',
  getStorageItem: 'getStorageItem',
  open: 'open',
  progressEnd: 'progressEnd',
  progressStart: 'progressStart',
  removeItem: 'removeItem',
  removeStorageItem: 'removeStorageItem',
  reportFiles: 'reportFiles',
  save: 'save',
  saveFileLocation: 'saveFileLocation',
  setItem: 'setItem',
  setStorageItem: 'setStorageItem',
  setTheme: 'setTheme',
}

exports.notifyKey = { dirtyFlag: 'dirtyFlag', fileBrowse: 'fileBrowse' }

exports.jsonPrefix = 'rendererApiJson:'

exports.observable = {
  debugNavBar: 'debugNavBar',
  progress_attribute: 'progress-message',
  reported_files: 'reported-files',
  themeData: 'data-theme',
}

exports.storageKey = {
  fileSave: 'lastFileLocation_openFileSave',
  theme: 'ui_theme',
}

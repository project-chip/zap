// Copyright (c) 2019 Silicon Labs. All rights reserved.

import { Dark } from 'quasar'

// The purpose of this file is to provide the API for jxbrowser
export default function createApi () {
  return {
    prefix: 'zap',
    description: 'Zap Renderer API',
    callbacks: [
      {
        id: 'save',
        description: 'Save file...',
        callback: () => alert('save!')
      },
      {
        id: 'load',
        description: 'Load file...',
        callback: () => alert('load!')
      },
      {
        id: 'setTheme',
        description: 'Set theme...',
        callback: (isDarkTheme) => Dark.set(isDarkTheme)
      }
    ]
  }
}

// Copyright (c) 2019 Silicon Labs. All rights reserved.

// The purpose of this file is to provide the API for jxbrowser
export default function createApi() {
  return {
    prefix: 'zap',
    description: 'Zap Renderer API',
    callbacks: [
      {
        id: 'save',
        description: 'Save file...',
        callback: () => alert('save!'),
      },
      {
        id: 'load',
        description: 'Load file...',
        callback: () => alert('load!'),
      },
    ],
  }
}

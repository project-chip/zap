import { defineConfig } from 'cypress'

export default defineConfig({
  viewportWidth: 1080,
  viewportHeight: 920,
  video: false,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    testIsolation: false,
    excludeSpecPattern: [
      '**/file_open.spec.js',
      '**/*.test.js',
      '**/*.xml',
      '**/*.zap',
      '**/custom_xml.spec.js',
      '**/check-cluster-attributes-singleton-in-zigbee-mode.spec.js'
    ]
  }
})

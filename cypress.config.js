import { defineConfig } from 'cypress'

export default defineConfig({
  viewportWidth: 1080,
  viewportHeight: 920,
  video: false,
  e2e: {
    baseUrl: 'http://localhost:9070',
    setupNodeEvents(on, config) {
      // Only load coverage plugin when CYPRESS_COVERAGE is set
      if (process.env.CYPRESS_COVERAGE) {
        require('@cypress/code-coverage/task')(on, config)
      }

      const mode = config.env.mode || 'zigbee'

      // Use glob patterns for each mode - Cypress handles file discovery
      if (mode === 'zigbee') {
        config.specPattern = 'cypress/e2e/**/*.cy.js'
        config.excludeSpecPattern = [
          ...(config.excludeSpecPattern || []),
          '**/matter/**',
          '**/multiprotocol/**'
        ]
      } else if (mode === 'matter') {
        config.specPattern = 'cypress/e2e/**/*.cy.js'
        config.excludeSpecPattern = [
          ...(config.excludeSpecPattern || []),
          '**/zigbee/**',
          '**/multiprotocol/**'
        ]
      } else if (mode === 'multiprotocol') {
        config.specPattern = 'cypress/e2e/**/*.cy.js'
        config.excludeSpecPattern = [
          ...(config.excludeSpecPattern || []),
          '**/zigbee/**',
          '**/matter/**'
        ]
      }

      return config
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

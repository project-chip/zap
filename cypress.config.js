import { defineConfig } from 'cypress'

export default defineConfig({
  viewportWidth: 1080,
  viewportHeight: 920,
  video: false,
  e2e: {
    baseUrl: 'http://localhost:9070',
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config)

      // Optional: Add coverage configuration
      on('task', {
        coverage(coverage) {
          // Custom coverage processing if needed
          return null
        }
      })

      // Dynamically set specPattern based on mode environment variable
      const mode = config.env.mode || 'zigbee'

      // Define test patterns for each mode
      // Includes both organized folders and root e2e for backward compatibility
      const specPatterns = {
        zigbee: [
          'cypress/e2e/common/**/*.cy.js',
          'cypress/e2e/zigbee/**/*.cy.js',
          // Include root tests but exclude organized folders to avoid duplicates
          'cypress/e2e/**/*.cy.js'
        ],
        matter: [
          'cypress/e2e/common/**/*.cy.js',
          'cypress/e2e/matter/**/*.cy.js',
          // Include root tests but exclude organized folders to avoid duplicates
          'cypress/e2e/**/*.cy.js'
        ],
        multiprotocol: [
          'cypress/e2e/common/**/*.cy.js',
          'cypress/e2e/multiprotocol/**/*.cy.js',
          // Include root tests but exclude organized folders to avoid duplicates
          'cypress/e2e/**/*.cy.js'
        ]
      }

      // Set specPattern based on mode
      if (specPatterns[mode]) {
        config.specPattern = specPatterns[mode]

        // Exclude other mode-specific folders to avoid running tests multiple times
        const excludeFolders = {
          zigbee: ['**/matter/**', '**/multiprotocol/**'],
          matter: ['**/zigbee/**', '**/multiprotocol/**'],
          multiprotocol: ['**/zigbee/**', '**/matter/**']
        }

        if (excludeFolders[mode]) {
          // Add mode-specific exclusions to existing excludeSpecPattern
          config.excludeSpecPattern = [
            ...(config.excludeSpecPattern || []),
            ...excludeFolders[mode]
          ]
        }
      } else {
        // Fallback: if mode is not recognized, run all tests (backward compatibility)
        config.specPattern = ['cypress/e2e/**/*.cy.js']
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

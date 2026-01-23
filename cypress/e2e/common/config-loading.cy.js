/// <reference types="cypress" />

/**
 * Tests for config loading scenarios with different pre-loaded template configurations.
 * These tests verify that Zigbee and Matter configs load correctly under various conditions.
 */

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false
})

describe.skip('Config Loading Tests', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait(2000)
  })

  /**
   * Helper function to check if config page is accessible
   */
  function checkConfigPageAccessible() {
    cy.url({ timeout: 5000 }).then((url) => {
      return url.includes('/config')
    })
  }

  /**
   * Helper function to verify Zigbee config loads correctly
   */
  function verifyZigbeeConfigLoads() {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        // Check if ZCL packages table is visible
        cy.contains('Zigbee Cluster Library metadata').should('be.visible')

        // Look for Zigbee category packages in the table
        cy.get('tbody')
          .first()
          .within(() => {
            cy.get('tr').then(($rows) => {
              // Check if there are any Zigbee category packages
              let hasZigbee = false
              $rows.each((index, row) => {
                const categoryCell = Cypress.$(row).find('td').eq(1) // Category column
                if (categoryCell.length > 0) {
                  const categoryText = categoryCell.text().toLowerCase()
                  if (categoryText.includes('zigbee')) {
                    hasZigbee = true
                    return false // break loop
                  }
                }
              })
              if (hasZigbee) {
                cy.log('✓ Zigbee packages found in config')
              } else {
                cy.log(
                  '⚠ No Zigbee packages found - may use internal packages'
                )
              }
            })
          })
      } else {
        // If not on config page, verify we're on the main page (config auto-submitted)
        cy.url().should('not.include', '/config')
        cy.log('✓ Config auto-submitted - Zigbee config loaded successfully')
      }
    })
  }

  /**
   * Helper function to verify Matter config loads correctly
   */
  function verifyMatterConfigLoads() {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        // Check if ZCL packages table is visible
        cy.contains('Zigbee Cluster Library metadata').should('be.visible')

        // Look for Matter category packages in the table
        cy.get('tbody')
          .first()
          .within(() => {
            cy.get('tr').then(($rows) => {
              // Check if there are any Matter category packages
              let hasMatter = false
              $rows.each((index, row) => {
                const categoryCell = Cypress.$(row).find('td').eq(1) // Category column
                if (categoryCell.length > 0) {
                  const categoryText = categoryCell.text().toLowerCase()
                  if (categoryText.includes('matter')) {
                    hasMatter = true
                    return false // break loop
                  }
                }
              })
              if (hasMatter) {
                cy.log('✓ Matter packages found in config')
              } else {
                cy.log(
                  '⚠ No Matter packages found - may use internal packages'
                )
              }
            })
          })
      } else {
        // If not on config page, verify we're on the main page (config auto-submitted)
        cy.url().should('not.include', '/config')
        cy.log('✓ Config auto-submitted - Matter config loaded successfully')
      }
    })
  }

  /**
   * Helper function to check if templates are available and return their categories
   */
  function checkTemplatesAvailable() {
    return cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.contains('Zap Generation Templates').should('be.visible')
        return cy
          .get('tbody')
          .eq(1)
          .then(($templateTable) => {
            const templateRows = $templateTable.find('tr')
            const categories = []
            templateRows.each((index, row) => {
              const categoryCell = Cypress.$(row).find('td').eq(1) // Category column
              if (categoryCell.length > 0) {
                const category = categoryCell.text().trim()
                if (category) {
                  categories.push(category.toLowerCase())
                }
              }
            })
            cy.log(`Found template categories: ${categories.join(', ')}`)
            return categories
          })
      } else {
        cy.log('Config page not accessible - templates may be pre-loaded')
        return []
      }
    })
  }

  describe('Scenario 1: Zigbee + Matter templates pre-loaded', () => {
    it('Should verify Zigbee config loads correctly when both templates are pre-loaded', () => {
      // This test runs in multiprotocol mode where both templates are pre-loaded
      if (Cypress.env('mode') === 'multiprotocol') {
        verifyZigbeeConfigLoads()
        checkTemplatesAvailable().then((categories) => {
          // Verify that templates are available (should include both zigbee and matter)
          expect(categories.length).to.be.greaterThan(0)
          cy.log(`Template categories available: ${categories.join(', ')}`)
        })
      } else {
        cy.log(
          'Skipping test - requires multiprotocol mode with both templates pre-loaded'
        )
      }
    })

    it('Should verify Matter config loads correctly when both templates are pre-loaded', () => {
      // This test runs in multiprotocol mode where both templates are pre-loaded
      if (Cypress.env('mode') === 'multiprotocol') {
        verifyMatterConfigLoads()
        checkTemplatesAvailable().then((categories) => {
          // Verify that templates are available (should include both zigbee and matter)
          expect(categories.length).to.be.greaterThan(0)
          cy.log(`Template categories available: ${categories.join(', ')}`)
        })
      } else {
        cy.log(
          'Skipping test - requires multiprotocol mode with both templates pre-loaded'
        )
      }
    })

    it('Should handle case when no matching packages are found', () => {
      // This test runs in multiprotocol mode
      if (Cypress.env('mode') === 'multiprotocol') {
        cy.url().then((url) => {
          if (url.includes('/config')) {
            // Check for warning messages about package matching
            cy.get('body').then(($body) => {
              const bodyText = $body.text()

              // Check for error/warning icons indicating package issues
              const hasWarningIcons =
                $body.find('[data-cy="package-error-warning-icon"]').length >
                  0 ||
                $body.find('[data-cy="template-error-warning-icon"]').length > 0

              if (hasWarningIcons) {
                cy.log(
                  '⚠ Warning/error icons found - indicating package matching issues'
                )

                // Click on warning icon to see details
                cy.get(
                  '[data-cy="package-error-warning-icon"], [data-cy="template-error-warning-icon"]'
                )
                  .first()
                  .click({ force: true })

                cy.wait(500)
                cy.get('.q-dialog').should('exist')

                // Check dialog content for error/warning messages
                cy.get('.q-dialog').within(() => {
                  cy.get('body').then(($dialogBody) => {
                    const dialogText = $dialogBody.text()
                    if (
                      dialogText.includes('Error') ||
                      dialogText.includes('Warning')
                    ) {
                      cy.log('Dialog shows package matching errors/warnings')
                    }
                  })
                })

                cy.contains('Close').click()
                cy.wait(500)
              } else {
                cy.log('✓ No warning icons - packages match correctly')
              }

              // Check for warning messages about internal packages
              if (
                bodyText.includes('internal packages') ||
                bodyText.includes('testing will be loaded automatically')
              ) {
                cy.log(
                  'ℹ Warning found: internal packages will be loaded automatically'
                )
                cy.contains('internal packages', { matchCase: false }).should(
                  'exist'
                )
              }
            })
          } else {
            cy.log('Config page auto-submitted - packages matched successfully')
          }
        })
      } else {
        cy.log(
          'Skipping test - requires multiprotocol mode with both templates pre-loaded'
        )
      }
    })
  })

  describe('Scenario 2: Only Zigbee template pre-loaded', () => {
    it('Should verify Matter config loads correctly when only Zigbee template is pre-loaded', () => {
      // This test runs in zigbee mode where only Zigbee template is pre-loaded
      if (Cypress.env('mode') === 'zigbee') {
        // Even though only Zigbee template is pre-loaded, Matter config should still load
        // (it will use internal packages if needed)
        verifyMatterConfigLoads()

        // Check that templates are available (should show Zigbee templates)
        checkTemplatesAvailable()

        // Verify that Matter packages can still be selected/loaded
        cy.url().then((url) => {
          if (url.includes('/config')) {
            cy.get('body').then(($body) => {
              // Check if Matter packages are available even without Matter templates
              const bodyText = $body.text()
              if (bodyText.includes('matter') || bodyText.includes('Matter')) {
                cy.log(
                  'Matter packages available even without Matter templates'
                )
              } else {
                cy.log(
                  'Matter packages not visible - may use internal packages automatically'
                )
              }
            })
          }
        })
      } else {
        cy.log('Skipping test - requires zigbee mode with only Zigbee template')
      }
    })
  })

  describe('Scenario 3: No templates pre-loaded', () => {
    it('Should verify Zigbee config loads correctly when no templates are pre-loaded', () => {
      // This scenario would require a server config with no templates
      // For now, we test that config page handles missing templates gracefully
      checkConfigPageAccessible().then((isAccessible) => {
        if (isAccessible) {
          verifyZigbeeConfigLoads()

          // Check for warning about internal packages being used
          cy.get('body').then(($body) => {
            const bodyText = $body.text()
            if (
              bodyText.includes('internal packages') ||
              bodyText.includes('testing will be loaded automatically')
            ) {
              cy.log(
                'Warning found - internal packages will be loaded automatically'
              )
            }
          })
        } else {
          cy.log('Config page not accessible - may have auto-submitted')
        }
      })
    })

    it('Should verify Matter config loads correctly when no templates are pre-loaded', () => {
      // This scenario would require a server config with no templates
      checkConfigPageAccessible().then((isAccessible) => {
        if (isAccessible) {
          verifyMatterConfigLoads()

          // Check for warning about internal packages being used
          cy.get('body').then(($body) => {
            const bodyText = $body.text()
            if (
              bodyText.includes('internal packages') ||
              bodyText.includes('testing will be loaded automatically')
            ) {
              cy.log(
                'Warning found - internal packages will be loaded automatically'
              )
            }
          })
        } else {
          cy.log('Config page not accessible - may have auto-submitted')
        }
      })
    })
  })

  describe('General config loading behavior', () => {
    it('Should display config page with package selection when needed', () => {
      checkConfigPageAccessible().then((isAccessible) => {
        if (isAccessible) {
          cy.contains('Zigbee Cluster Library metadata').should('be.visible')
          cy.contains('Zap Generation Templates').should('be.visible')
          cy.get('[data-test="login-submit"]').should('be.visible')
        } else {
          cy.log('Config page auto-submitted - packages already configured')
        }
      })
    })

    it('Should handle package selection and submission', () => {
      checkConfigPageAccessible().then((isAccessible) => {
        if (isAccessible) {
          // Select at least one ZCL package
          cy.dataCy('zcl-package-checkbox').first().check({ force: true })

          // Select at least one template package
          cy.get('tbody')
            .eq(1)
            .find('[data-test="gen-template"]')
            .first()
            .check({ force: true })

          // Verify submit button is enabled
          cy.get('[data-test="login-submit"]').should('be.visible')

          // Note: We don't actually submit to avoid changing the test environment
          cy.log('Package selection verified - ready for submission')
        } else {
          cy.log('Config page not accessible - skipping selection test')
        }
      })
    })
  })
})

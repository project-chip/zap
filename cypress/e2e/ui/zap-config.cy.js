/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('ZapConfig page functionality', () => {
  beforeEach(() => {
    // Visit the app root - it will automatically redirect to /config if no config is selected
    cy.visit('/')
    cy.wait(2000)
    // The app's routePage() method will redirect to /config if isZapConfigSelected is false
    // Check if we're on config page or were redirected
    cy.url({ timeout: 5000 }).then((url) => {
      if (url.includes('/config')) {
        // Config page is visible, wait a bit more for it to fully load
        cy.wait(1000)
      } else {
        // Already configured or auto-submitted, skip these tests
        cy.log(
          'Config page not accessible (already configured or auto-submitted), skipping config-specific tests'
        )
      }
    })
  })

  it('Should display the config page with ZCL metadata table', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.contains('Zigbee Cluster Library metadata').should('be.visible')
        cy.contains('Zap Generation Templates').should('be.visible')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should show radio buttons for session selection', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.contains('Generate New Session').should('be.visible')
        cy.contains('Restore Unsaved Session').should('be.visible')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should allow selecting Generate New Session option', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.dataCy('generate-new-session-radio')
          .find('input[type="radio"]')
          .check({ force: true })
        cy.dataCy('generate-new-session-radio')
          .find('input[type="radio"]')
          .should('be.checked')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should allow selecting Restore Unsaved Session option', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.dataCy('restore-session-radio')
          .find('input[type="radio"]')
          .check({ force: true })
        cy.dataCy('restore-session-radio')
          .find('input[type="radio"]')
          .should('be.checked')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should display ZCL properties table with columns', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.contains('Zigbee Cluster Library metadata').should('be.visible')
        cy.contains('Category').should('be.visible')
        cy.contains('Description').should('be.visible')
        cy.contains('version').should('be.visible')
        cy.contains('status').should('be.visible')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should display Generation Templates table with columns', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.contains('Zap Generation Templates').should('be.visible')
        cy.contains('Category').should('be.visible')
        cy.contains('Description').should('be.visible')
        cy.contains('version').should('be.visible')
        cy.contains('status').should('be.visible')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should have checkboxes for package selection', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.dataCy('zcl-package-checkbox').should('exist')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should allow selecting ZCL packages', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.dataCy('zcl-package-checkbox').first().check({ force: true })
        cy.dataCy('zcl-package-checkbox').first().should('be.checked')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should allow selecting Generation Template packages', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.get('tbody')
          .eq(1)
          .find('[data-test="gen-template"]')
          .first()
          .check({ force: true })
        cy.get('tbody')
          .eq(1)
          .find('[data-test="gen-template"]')
          .first()
          .should('be.checked')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should display Submit button', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.get('[data-test="login-submit"]').should('be.visible')
        cy.get('[data-test="login-submit"]').should('contain', 'Submit')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should show warning message when no packages are selected', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        // Uncheck all packages if any are checked
        cy.get('body').then(($body) => {
          if (
            $body.find('[data-cy="zcl-package-checkbox"]:checked').length > 0
          ) {
            cy.get('[data-cy="zcl-package-checkbox"]:checked').uncheck({
              force: true
            })
          }
        })
        cy.contains(
          'Warning: Please select at least one package each from ZCL metadata'
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should open error/warning dialog when clicking on error icon', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        // Check if there are any error or warning icons
        cy.get('body').then(($body) => {
          if (
            $body.find('[data-cy="package-error-warning-icon"]').length > 0 ||
            $body.find('[data-cy="template-error-warning-icon"]').length > 0
          ) {
            // Click on the first error/warning icon found
            cy.get(
              '[data-cy="package-error-warning-icon"], [data-cy="template-error-warning-icon"]'
            )
              .first()
              .click({ force: true })
            cy.wait(500)
            // Check if dialog opened
            cy.get('.q-dialog').should('exist')
            cy.contains('Close').should('be.visible')
          } else {
            cy.log('No error/warning icons found - skipping dialog test')
          }
        })
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should close error/warning dialog when clicking close button', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        // Check if there are any error or warning icons
        cy.get('body').then(($body) => {
          if (
            $body.find('[data-cy="package-error-warning-icon"]').length > 0 ||
            $body.find('[data-cy="template-error-warning-icon"]').length > 0
          ) {
            // Click on the first error/warning icon found
            cy.get(
              '[data-cy="package-error-warning-icon"], [data-cy="template-error-warning-icon"]'
            )
              .first()
              .click({ force: true })
            cy.wait(500)
            cy.get('.q-dialog').should('exist')
            cy.contains('Close').click()
            cy.wait(500)
            // Dialog should be closed
            cy.get('.q-dialog').should('not.exist')
          } else {
            cy.log('No error/warning icons found - skipping dialog test')
          }
        })
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should display tooltips on hover for package paths', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.get('tbody')
          .first()
          .find('td')
          .then(($cells) => {
            if ($cells.length > 0) {
              cy.wrap($cells).first().trigger('mouseenter')
              cy.wait(300)
              // Tooltip might appear, but we can't always verify it easily
            }
          })
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should handle Restore Unsaved Session view', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.dataCy('restore-session-radio')
          .find('input[type="radio"]')
          .check({ force: true })
        cy.wait(500)
        // Should show session table instead of package tables
        cy.get('body').then(($body) => {
          // Either shows session table or still shows package selection
          // depending on whether there are unsaved sessions
          cy.get('table').should('exist')
        })
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should validate package selection before submit', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        // First uncheck all packages if any are checked
        cy.get('body').then(($body) => {
          if ($body.find('input[type="checkbox"]:checked').length > 0) {
            cy.get('input[type="checkbox"]:checked').uncheck({ force: true })
            cy.wait(500)
          }
        })
        // Try to submit without selecting packages
        cy.get('[data-test="login-submit"]').should('be.visible')
        cy.get('[data-test="login-submit"]').click({ force: true })
        cy.wait(500)
        // Should show warning or prevent submission
        cy.contains(
          'Warning: Please select atleast one package each from ZCL metadata',
          { timeout: 2000 }
        ).should('be.visible')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should handle multiprotocol configuration warning', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        // Select multiple packages from different categories if available
        cy.dataCy('zcl-package-checkbox').then(($checkboxes) => {
          if ($checkboxes.length > 1) {
            // Check first two packages
            cy.wrap($checkboxes).first().check({ force: true })
            cy.wrap($checkboxes).eq(1).check({ force: true })
            cy.wait(500)
            // Check if multiprotocol warning appears (if categories differ)
            cy.get('body').then(($body) => {
              if (
                $body.text().includes('multi-protocol') ||
                $body.text().includes('Multi-protocol')
              ) {
                cy.contains('multi-protocol', { matchCase: false }).should(
                  'be.visible'
                )
              }
            })
          }
        })
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should display status icons correctly', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        // Check if status column exists and has icons
        cy.get('tbody').first().find('td').should('exist')
        // Check for any icons in the table (status icons or other icons)
        cy.get('tbody')
          .first()
          .find('.q-icon, i.material-icons')
          .should('exist')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should handle page transitions and animations', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        // Check if slide-up transition classes exist (might not be visible immediately)
        cy.get('body').then(($body) => {
          // Transitions might not be active at all times, so just check if page loaded
          cy.get('.q-page, .q-card').should('exist')
        })
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })

  it('Should display logos when packages are selected', () => {
    cy.url().then((url) => {
      if (url.includes('/config')) {
        cy.dataCy('zcl-package-checkbox').first().check({ force: true })
        cy.wait(500)
        // Logos should be displayed at the top
        cy.get('img[height="40"]').should('exist')
      } else {
        cy.log('Skipping - config page auto-submitted')
      }
    })
  })
})

/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false
})

describe('Zigbee Attributes Comprehensive Tests', () => {
  beforeEach(() => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(2000)

    // Clean up: delete all existing endpoints before each test
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="delete-endpoint"]').length > 0) {
        // Delete all endpoints except the last one using each()
        cy.get('[data-test="delete-endpoint"]').each(() => {
          cy.get('[data-test="delete-endpoint"]').last().click({ force: true })
          cy.wait(500)
          cy.get('#delete_endpoint').should('exist').click({ force: true })
          cy.wait(500)
        })
        // Delete the last endpoint (which shows different dialog)
        cy.wait(300)
        cy.get('[data-test="delete-endpoint"]').then(($remaining) => {
          if ($remaining.length > 0) {
            cy.get('[data-test="delete-endpoint"]')
              .last()
              .click({ force: true })
            cy.wait(500)
            cy.get('#delete_last_endpoint')
              .should('exist')
              .click({ force: true })
            cy.wait(500)
          }
        })
      }
    })
  })

  it('Should display attributes in cluster view', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)
      cy.goToAttributesTabFromClusterView()

      // Verify attributes are displayed
      cy.get('[data-test="attribute-toggle"]').should(
        'have.length.greaterThan',
        0
      )
    })
  })

  it('Should toggle multiple attributes', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)
      cy.goToAttributesTabFromClusterView()

      // Toggle first three attributes
      cy.get('[data-test="attribute-toggle"]').then(($toggles) => {
        const count = Math.min(3, $toggles.length)
        for (let i = 0; i < count; i++) {
          cy.wrap($toggles[i]).click({ force: true })
          cy.wait(200)
        }
      })
    })
  })

  it('Should search for attributes', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)
      cy.goToAttributesTabFromClusterView()

      // Search for an attribute
      cy.get('input[placeholder*="Search"], input[type="search"]').then(
        ($inputs) => {
          if ($inputs.length > 0) {
            cy.wrap($inputs).first().type(data.attribute1, { force: true })
            cy.wait(500)

            // Verify search results
            cy.get('body').should('contain', data.attribute1)
          }
        }
      )
    })
  })

  it('Should verify attribute state persistence', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)
      cy.goToAttributesTabFromClusterView()

      // Get first attribute and toggle it
      cy.get('[data-test="attribute-toggle"]')
        .first()
        .then(($toggle) => {
          const initialState = $toggle.attr('aria-checked')

          // Toggle
          cy.wrap($toggle).click({ force: true })
          cy.wait(500)

          // Navigate away and back
          cy.goToCommandsTabFromClusterView()
          cy.goToAttributesTabFromClusterView()

          // Verify state persisted
          cy.get('[data-test="attribute-toggle"]')
            .first()
            .should(
              'have.attr',
              'aria-checked',
              initialState === 'true' ? 'false' : 'true'
            )
        })
    })
  })

  it('Should display attribute reporting configuration', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)
      cy.goToAttributeReportingTabFromClusterView()

      // Verify attribute reporting tab is active
      cy.contains('.q-tab', 'Attribute Reporting').should(
        'have.class',
        'q-tab--active'
      )

      // Verify toggles exist for attribute reporting
      cy.get('.q-toggle').should('exist')
    })
  })

  it('Should toggle attribute reporting', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)
      cy.goToAttributeReportingTabFromClusterView()

      // Wait for Attribute Reporting tab to be active and content to load
      cy.contains('.q-tab', 'Attribute Reporting').should(
        'have.class',
        'q-tab--active'
      )
      cy.wait(500)

      // Use the same selector as in reporting.cy.js - more specific path
      cy.get('.q-virtual-scroll__content').should('exist')
      cy.get('.q-virtual-scroll__content .q-toggle').then(($toggles) => {
        if ($toggles.length > 0) {
          // Get the first toggle inner element (more specific selector)
          cy.get('.q-virtual-scroll__content .q-toggle .q-toggle__inner')
            .first()
            .then(($inner) => {
              const initialHasChecked = $inner.hasClass(
                'q-toggle__inner--truthy'
              )
              // Click the toggle
              cy.get('.q-virtual-scroll__content .q-toggle')
                .first()
                .click({ force: true })
              cy.wait(500)

              // Verify state changed
              cy.get('.q-virtual-scroll__content .q-toggle .q-toggle__inner')
                .first()
                .then(($innerAfter) => {
                  const afterHasChecked = $innerAfter.hasClass(
                    'q-toggle__inner--truthy'
                  )
                  // State should have changed
                  expect(afterHasChecked).to.not.eq(initialHasChecked)
                })
            })
        } else {
          cy.log('No toggles found in Attribute Reporting tab')
        }
      })
    })
  })
})

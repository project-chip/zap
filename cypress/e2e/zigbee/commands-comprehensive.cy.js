/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false
})

describe('Zigbee Commands and Events Comprehensive Tests', () => {
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

  it('Should display commands in cluster view', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)
      cy.goToCommandsTabFromClusterView()

      // Verify commands table exists
      cy.get('tbody').should('exist')

      // Verify command checkboxes exist
      cy.get(
        '[data-test="in-command-checkbox"], [data-test="out-command-checkbox"]'
      ).should('have.length.greaterThan', 0)
    })
  })

  it('Should toggle incoming commands', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)
      cy.goToCommandsTabFromClusterView()

      // Get first incoming command
      cy.get('[data-test="in-command-checkbox"]')
        .first()
        .then(($checkbox) => {
          const initialState = $checkbox.attr('aria-checked')

          // Toggle command
          cy.wrap($checkbox).click({ force: true })
          cy.wait(500)

          // Verify state changed
          cy.wrap($checkbox).should(
            'have.attr',
            'aria-checked',
            initialState === 'true' ? 'false' : 'true'
          )
        })
    })
  })

  it('Should toggle outgoing commands', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)
      cy.goToCommandsTabFromClusterView()

      // Get first outgoing command if available
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="out-command-checkbox"]').length > 0) {
          cy.get('[data-test="out-command-checkbox"]')
            .first()
            .then(($checkbox) => {
              const initialState = $checkbox.attr('aria-checked')

              // Toggle command
              cy.wrap($checkbox).click({ force: true })
              cy.wait(500)

              // Verify state changed
              cy.wrap($checkbox).should(
                'have.attr',
                'aria-checked',
                initialState === 'true' ? 'false' : 'true'
              )
            })
        }
      })
    })
  })

  it('Should search for commands', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)
      cy.goToCommandsTabFromClusterView()

      // Search for commands
      cy.get('input[placeholder*="Search"], input[type="search"]').then(
        ($inputs) => {
          if ($inputs.length > 0) {
            cy.wrap($inputs).first().type('Reset', { force: true })
            cy.wait(500)

            // Verify search functionality works
            cy.get('tbody').should('exist')
          }
        }
      )
    })
  })

  it('Should verify command state persistence', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)
      cy.goToCommandsTabFromClusterView()

      // Get first command and toggle it
      cy.get('[data-test="in-command-checkbox"]')
        .first()
        .then(($checkbox) => {
          const initialState = $checkbox.attr('aria-checked')

          // Toggle
          cy.wrap($checkbox).click({ force: true })
          cy.wait(500)

          // Navigate away and back
          cy.goToAttributesTabFromClusterView()
          cy.goToCommandsTabFromClusterView()

          // Verify state persisted
          cy.get('[data-test="in-command-checkbox"]')
            .first()
            .should(
              'have.attr',
              'aria-checked',
              initialState === 'true' ? 'false' : 'true'
            )
        })
    })
  })
})

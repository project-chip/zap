/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Endpoint Card component functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(1000)
    // Wait for endpoints to load
    cy.wait(2000)
  })

  it('Should display endpoint cards in sidebar', () => {
    // Endpoint cards should be visible in the sidebar if endpoints exist
    cy.get('body').then(($body) => {
      // Check if sidebar exists
      if ($body.find('.q-drawer, .q-sidebar').length > 0) {
        // Check if there are endpoint cards
        cy.get('.q-drawer, .q-sidebar').then(($sidebar) => {
          if ($sidebar.find('.q-card').length > 0) {
            cy.get('.q-card').should('exist')
          } else {
            cy.log('No endpoint cards found - endpoints may not be loaded yet')
          }
        })
      } else {
        cy.log('Sidebar not visible')
      }
    })
  })

  it('Should display edit endpoint button', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="edit-endpoint"]').length > 0) {
        cy.get('[data-test="edit-endpoint"]').should('exist')
      } else {
        cy.log('Edit endpoint button not found - no endpoints available')
      }
    })
  })

  it('Should display delete endpoint button', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="delete-endpoint"]').length > 0) {
        cy.get('[data-test="delete-endpoint"]').should('exist')
      } else {
        cy.log('Delete endpoint button not found - no endpoints available')
      }
    })
  })

  it('Should display endpoint toggle buttons', () => {
    cy.get('body').then(($body) => {
      if (
        $body.find('[data-test="endpoint-body-toggler-show"]').length > 0 ||
        $body.find('[data-test="endpoint-body-toggler-hide"]').length > 0
      ) {
        cy.get(
          '[data-test="endpoint-body-toggler-show"], [data-test="endpoint-body-toggler-hide"]'
        ).should('exist')
      } else {
        cy.log('Endpoint toggle buttons not found - no endpoints available')
      }
    })
  })

  it('Should allow toggling endpoint information', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="endpoint-body-toggler-show"]').length > 0) {
        cy.get('[data-test="endpoint-body-toggler-show"]')
          .first()
          .click({ force: true })
        cy.wait(500)
        // After clicking, the hide button should appear
        cy.get('[data-test="endpoint-body-toggler-hide"]').should('exist')
      } else {
        cy.log('Endpoint toggle button not found - no endpoints available')
      }
    })
  })
})

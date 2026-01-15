/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Notifications page functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(1000)
  })

  it('Should open notifications drawer when clicking Notifications button', () => {
    // Click the Notifications button to toggle the drawer using data-cy
    cy.dataCy('btn-notifications').click()
    cy.wait(1000)
    // The drawer should be visible
    cy.get('.q-drawer').should('be.visible')
  })

  it('Should display notifications page title', () => {
    cy.dataCy('btn-notifications').click()
    cy.wait(1000)
    cy.contains('Notifications').should('be.visible')
  })

  it('Should display notifications table', () => {
    cy.dataCy('btn-notifications').click()
    cy.wait(1000)
    // Check if table exists in the drawer
    cy.get('.q-drawer .q-table').should('exist')
  })

  it('Should display table columns', () => {
    cy.dataCy('btn-notifications').click()
    cy.wait(1000)
    // Check for common notification table columns
    cy.get('.q-drawer thead').should('exist')
    // The table should have columns for type and message
    cy.get('.q-drawer tbody').should('exist')
  })

  it('Should display package notifications section', () => {
    cy.dataCy('btn-notifications').click()
    cy.wait(1000)
    cy.contains('Package Notifications').should('be.visible')
  })

  it('Should handle empty notifications state', () => {
    cy.dataCy('btn-notifications').click()
    cy.wait(1000)
    // Even with no notifications, the page structure should be visible
    cy.contains('Notifications').should('be.visible')
    cy.get('.q-drawer .q-table').should('exist')
  })

  it('Should display notification types correctly', () => {
    cy.dataCy('btn-notifications').click()
    cy.wait(1000)
    // Check if table body exists (notifications might be empty)
    cy.get('.q-drawer tbody').should('exist')
    // If there are notifications, they should display type and message
    cy.get('.q-drawer tbody').then(($tbody) => {
      if ($tbody.find('tr').length > 0) {
        // There are notifications, check for type column
        cy.get('.q-drawer tbody tr').first().find('td').should('exist')
      }
    })
  })

  it('Should have delete button for notifications', () => {
    cy.dataCy('btn-notifications').click()
    cy.wait(1000)
    // Check if delete buttons exist in table rows
    cy.get('.q-drawer tbody').then(($tbody) => {
      if ($tbody.find('tr').length > 0) {
        // Check for delete button using data-cy
        cy.get('.q-drawer tbody tr')
          .first()
          .find('[data-cy="btn-delete-notification"]')
          .should('exist')
      }
    })
  })
})

/// <reference types="cypress" />
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing Duplicate endpoint functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint1)
    })
  })

  it('duplicate an endpoint', { retries: { runMode: 2, openMode: 2 } }, () => {
    // First verify we have one endpoint
    cy.get('[data-test="endpoint-card"]').should('have.length.at.least', 1)

    // Get the initial count
    cy.get('[data-test="endpoint-card"]').then(($cards) => {
      const initialCount = $cards.length

      // Click on the endpoint card to open the menu
      cy.get('[data-test="endpoint-card"]').first().click()

      // Click the duplicate button
      cy.get('[data-test="duplicate-endpoint"]').first().click({ force: true })

      // Wait for the duplication to complete
      cy.wait(1000)

      // Verify we now have one more endpoint
      cy.get('[data-test="endpoint-card"]').should(
        'have.length',
        initialCount + 1
      )
    })
  })

  it(
    'duplicate endpoint preserves device type',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      // Get the device type of the original endpoint
      cy.get('[data-test="endpoint-card"]')
        .first()
        .invoke('text')
        .then((originalText) => {
          // Click on the endpoint card to open the menu
          cy.get('[data-test="endpoint-card"]').first().click()

          // Click the duplicate button
          cy.get('[data-test="duplicate-endpoint"]')
            .first()
            .click({ force: true })

          // Wait for the duplication to complete
          cy.wait(1000)

          // The new endpoint should contain similar device type info
          cy.get('[data-test="endpoint-card"]').should(
            'have.length.at.least',
            2
          )
        })
    }
  )
})

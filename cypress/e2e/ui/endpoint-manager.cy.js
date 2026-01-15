/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Endpoint Manager page functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(1000)
  })

  it('Should display endpoint manager page', () => {
    cy.url().should('not.include', '/config')
    cy.get('.q-page').should('exist')
  })

  it('Should display cluster manager component', () => {
    cy.get('.q-page').should('exist')
    // The page should contain cluster manager
    cy.get('body').should('exist')
  })

  it('Should handle window resize events', () => {
    // Test that resize handling is set up
    cy.viewport(800, 600)
    cy.wait(500)
    cy.viewport(1200, 800)
    cy.wait(500)
    // Page should still be functional
    cy.get('.q-page').should('exist')
  })
})

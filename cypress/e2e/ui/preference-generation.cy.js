/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Preference Generation page functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(1000)
  })

  it('Should navigate to preference generation page', () => {
    cy.get('#Settings').click()
    cy.wait(500)
    // Navigate to Generation preferences - it's in the sidebar as "Generation"
    cy.get('.q-item').contains('Generation').click({ force: true })
    cy.wait(1000)
    cy.url().should('include', '/preferences/generation')
  })

  it('Should display generation preferences page', () => {
    cy.get('#Settings').click()
    cy.wait(500)
    cy.get('.q-item').contains('Generation').click({ force: true })
    cy.wait(1000)
    cy.url().should('include', '/preferences/generation')
    cy.contains('Generation').should('be.visible')
  })

  it('Should display generation settings', () => {
    cy.get('#Settings').click()
    cy.wait(500)
    cy.get('.q-item').contains('Generation').click({ force: true })
    cy.wait(1000)
    // Check if page content is visible
    cy.get('.q-card-section, .q-page').should('exist')
  })

  it('Should display generation templates table', () => {
    cy.get('#Settings').click()
    cy.wait(500)
    cy.get('.q-item').contains('Generation').click({ force: true })
    cy.wait(1000)
    cy.dataCy('Attributes').should('exist')
    cy.get('.q-table').should('exist')
  })

  it('Should display table columns', () => {
    cy.get('#Settings').click()
    cy.wait(500)
    cy.get('.q-item').contains('Generation').click({ force: true })
    cy.wait(1000)
    // Check table exists
    cy.dataCy('Attributes').should('exist')
    // Check table header exists - wait a bit more for table to render
    cy.dataCy('Attributes').find('thead').should('exist')
    // Wait for table to fully render
    cy.wait(500)
    // Check for column headers - verify th elements exist
    cy.dataCy('Attributes').find('thead th').should('have.length.at.least', 1)
    // Check if column headers contain expected text (using should('exist') to avoid visibility issues)
    cy.dataCy('Attributes').find('thead').should('contain', 'ID')
    cy.dataCy('Attributes').find('thead').should('contain', 'Version')
    cy.dataCy('Attributes').find('thead').should('contain', 'Path')
  })

  it('Should display generation template rows', () => {
    cy.get('#Settings').click()
    cy.wait(500)
    cy.get('.q-item').contains('Generation').click({ force: true })
    cy.wait(1000)
    cy.get('tbody').should('exist')
  })
})

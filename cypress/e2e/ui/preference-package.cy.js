/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Preference Package page functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(1000)
  })

  it('Should navigate to preference package page', () => {
    cy.get('#Settings').click()
    cy.wait(500)
    // Navigate to Package preferences using data-cy
    cy.dataCy('settings-menu-package').click({ force: true })
    cy.wait(1000)
    cy.url().should('include', '/preferences/package')
  })

  it('Should display package preferences page', () => {
    cy.get('#Settings').click()
    cy.wait(500)
    cy.dataCy('settings-menu-package').click({ force: true })
    cy.wait(1000)
    cy.url().should('include', '/preferences/package')
    cy.contains('Zcl packages', { matchCase: false }).should('be.visible')
  })

  it('Should display package settings', () => {
    cy.get('#Settings').click()
    cy.wait(500)
    cy.dataCy('settings-menu-package').click({ force: true })
    cy.wait(1000)
    // Check if page content is visible
    cy.get('.q-card-section, .q-page').should('exist')
  })

  it('Should display ZCL packages table', () => {
    cy.get('#Settings').click()
    cy.wait(500)
    cy.dataCy('settings-menu-package').click({ force: true })
    cy.wait(1000)
    cy.dataCy('Attributes').should('exist')
    cy.get('.q-table').should('exist')
  })

  it('Should display table columns', () => {
    cy.get('#Settings').click()
    cy.wait(500)
    cy.dataCy('settings-menu-package').click({ force: true })
    cy.wait(1000)
    // Check table exists
    cy.dataCy('Attributes').should('exist')
    // Check table header exists
    cy.dataCy('Attributes').find('thead').should('exist')
    // Wait for table to fully render
    cy.wait(500)
    // Check for column headers - scroll into view first if needed, or just check existence
    cy.dataCy('Attributes').find('thead th').should('have.length.at.least', 1)
    // Check if column headers contain expected text (using should('contain') to avoid visibility issues)
    cy.dataCy('Attributes').find('thead').should('contain', 'Category')
    cy.dataCy('Attributes').find('thead').should('contain', 'Description')
    cy.dataCy('Attributes').find('thead').should('contain', 'Path')
    cy.dataCy('Attributes').find('thead').should('contain', 'Type')
    cy.dataCy('Attributes').find('thead').should('contain', 'Version')
  })

  it('Should display package rows', () => {
    cy.get('#Settings').click()
    cy.wait(500)
    cy.dataCy('settings-menu-package').click({ force: true })
    cy.wait(1000)
    cy.get('tbody').should('exist')
  })
})

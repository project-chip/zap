/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Extensions page functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(1000)
  })

  it('Should navigate to extensions page', () => {
    // Navigate via toolbar button using data-cy
    cy.dataCy('btn-extensions').click({ force: true })
    cy.wait(1000)
    cy.url().should('include', '/extensions')
  })

  it('Should display extensions page title', () => {
    cy.dataCy('btn-extensions').click({ force: true })
    cy.wait(1000)
    cy.contains('Extensions').should('be.visible')
  })

  it('Should display Add Custom ZCL section', () => {
    cy.dataCy('btn-extensions').click({ force: true })
    cy.wait(1000)
    cy.contains('Add Custom ZCL').should('be.visible')
  })

  it('Should display description text', () => {
    cy.dataCy('btn-extensions').click({ force: true })
    cy.wait(1000)
    cy.contains(
      'You can use this functionality to add custom ZCL clusters to the ZCL Advanced Platform (ZAP). Click the button below to browse for an XML file containing only cluster definitions. JSON files are not currently supported for loading.'
    ).should('be.visible')
  })

  it('Should display Browse file button', () => {
    cy.dataCy('btn-extensions').click({ force: true })
    cy.wait(1000)
    cy.contains('Browse for XML file').should('be.visible')
    cy.get('button').contains('Browse for XML file').should('exist')
  })

  it('Should display Added files section', () => {
    cy.dataCy('btn-extensions').click({ force: true })
    cy.wait(1000)
    cy.contains('Built-in ZCL packages').should('be.visible')
  })

  it('Should handle empty extensions list', () => {
    cy.dataCy('btn-extensions').click({ force: true })
    cy.wait(1000)
    // Even with no extensions, the page structure should be visible
    cy.contains('Custom XML extensions').should('be.visible')
    cy.get('.cluster-list').should('exist')
  })

  it('Should display warning for multi-protocol if applicable', () => {
    cy.dataCy('btn-extensions').click({ force: true })
    cy.wait(1000)
    // Check if warning appears (depends on configuration)
    cy.get('body').then(($body) => {
      if (
        $body.text().includes('multi-protocol') ||
        $body.text().includes('Multi-protocol')
      ) {
        cy.contains('multi-protocol', { matchCase: false }).should('be.visible')
      }
    })
  })

  it('Should have file browser functionality', () => {
    cy.dataCy('btn-extensions').click({ force: true })
    cy.wait(1000)
    // The browse button should exist and be clickable
    cy.get('button').contains('Browse for XML file').should('be.visible')
    // Note: Actual file browser can't be tested in Cypress without mocking
    cy.get('button').contains('Browse for XML file').should('exist')
  })
})

/// <reference types="cypress" />

const { contains } = require('underscore')

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})
describe('Testing visibility of devtools option', () => {
  beforeEach(() => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
  })

  it('check if devtools option gets visible', () => {
    cy.setZclProperties()
    cy.get('#Settings').click()
    cy.get('[aria-label="Enable development tools"] > .q-toggle__label').click()
    cy.get('.q-drawer-container').should('contain', 'Developer Tools')
  })
})

/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing disabling enabled attributes', () => {
  it('create a new endpoint and click on configure to open attributes of endpoint', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      cy.gotoAttributePage(data.endpoint1, data.cluster1)
    })
  })
})

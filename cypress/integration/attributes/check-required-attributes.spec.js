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
    cy.fixture('data').then((data) => {
      cy.gotoAttributePage(data.endpoint1, data.cluster1)
    })
  })
  it(
    'getting an enabled attribute and disable it',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.fixture('data').then((data) => {
        cy.get(
          `[data-test="attribute-status-toggle-${data.attribute1}"]`
        ).click()
        cy.get(
          `[data-test="attribute-warning-${data.attribute1}"]`
        ).should('be.visible')
        cy.get(
          `[data-test="attribute-status-toggle-${data.attribute1}"]`
        ).click()
        cy.contains(
          `[data-test="attribute-warning-${data.attribute1}"]`
        ).should('not.exist')
      })
    }
  )
})

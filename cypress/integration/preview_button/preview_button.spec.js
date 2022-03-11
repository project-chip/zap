/// <reference types="cypress" />
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})
describe('Check preview buttton', () => {
  it('adding a new endpoint', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.addEndpoint('Billing Unit (0x0203)')
  })
  it(
    'Checking preview button',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('button').contains('Preview').click()
      cy.get('.q-pa-md > .q-btn > .q-btn__wrapper')
        .contains('Select File')
        .click()
      cy.get('.q-list > div').should('contain', 'sdk-extension.out')
    }
  )
})

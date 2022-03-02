/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing attribute search', () => {
  it('create a new endpoint and click on configure to open attributes of endpoint', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.gotoAttributePage('Billing Unit (0x0203)', 'General')
    cy.wait(1000)
  })
  it('check existance of ZCL version and application version', () => {
    cy.get('tbody')
      .children()
      .should('contain', 'ZCL version')
      .and('contain', 'application version')
  })
  it('Search for application', () => {
    cy.get(
      '.q-py-none > .q-field > .q-field__inner > .q-field__control > .q-field__control-container > input'
    )
      .clear({ force: true })
      .type('application', { force: true })
  })
  it('check if search result is correct', () => {
    cy.get('tbody').children().contains('ZCL version').should('not.exist')
    cy.get('tbody').children().should('contain', 'application version')
  })
})

/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing cluster search', () => {
  it('create a new endpoint and check existance of Basic and Power Configuration clusters', () => {
    cy.visit('http://localhost:8080/?restPort=9070#/')
    cy.addEndpoint('Billing Unit (0x0203)', 'General')
    cy.get('#General > .q-expansion-item__container > .q-item').click()
    cy.get('tbody')
      .children()
      .should('contain', 'Basic')
      .and('contain', 'Power Configuration')
  })
  it('Search for power', () => {
    cy.get(
      '.col-4 > .q-field__inner > .q-field__control > .q-field__control-container > input'
    )
      .clear({ force: true })
      .type('power', { force: true })
  })
  it('check if search result is correct', () => {
    cy.get('tbody').children().contains('Basic').should('not.exist')
    cy.get('tbody').children().should('contain', 'Power Configuration')
  })
})

/// <reference types="cypress" />
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})
describe('Check preview buttton', () => {

  it('adding a new endpoint', () => {
    cy.visit('http://localhost:8080/?restPort=9070#/')
    cy.get('button').contains('Add New Endpoint').click()
    cy.wait(1000)
    cy.get(
      '.q-form > .q-select > .q-field__inner > .q-field__control > .q-field__control-container'
    ).click()
    cy.wait(1000)
    cy.get('div').contains('Billing Unit (0x0203)').click()
    cy.wait(1000)
    cy.get('button').contains('Create').click()
    cy.wait(1000)
  })
  it('Checking preview button', () => {
    cy.get('button').contains('Preview').click()
    cy.wait(1000)
    cy.get('.q-pa-md > .q-btn > .q-btn__wrapper')
      .contains('Select File')
      .click()
    cy.get('.q-list > div').should('contain', 'sdk-extension.out')
  })
})

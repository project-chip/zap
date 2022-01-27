/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing BITMAP8 type validation', () => {
  it('create a new endpoint and click on configure to open attributes of endpoint', () => {
    cy.visit('http://localhost:8080/?restPort=9070#/')
    cy.gotoAttributePage('Billing Unit (0x0203)', 'General')
    cy.wait(1000)
  })
  it('getting an attribute with BITMAP8 type and change defualt amount', () => {
    cy.get(
      ':nth-child(16) > [style="min-width: 180px;"] > .q-field > .q-field__inner > .q-field__control > .q-field__control-container > input'
    )
      .clear({ force: true })
      .type('test', { force: true })
  })
  it('check if validation works properly', () => {
    cy.get(
      ':nth-child(16) > [style="min-width: 180px;"] > .q-field > .q-field__inner > .q-field__bottom > .q-field__messages > div'
    ).should('exist')
  })
})

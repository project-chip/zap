/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing attribute validation', () => {
  it('create a new endpoint and click on configure to open attributes of endpoint', () => {
    cy.visit('http://localhost:8080/?restPort=9070#/')
    cy.gotoAttributePage('Billing Unit (0x0203)', 'General')
    cy.wait(1000)
  })
  it('change default input to a wrong amount', () => {
    cy.get(
      ':nth-child(1) > [style="min-width: 180px;"] > .q-field > .q-field__inner > .q-field__control > .q-field__control-container > input'
    )
      .clear({ force: true })
      .type('99999', { force: true })
      .then(() => {
        cy.get('#qvs_116 > :nth-child(1) > [style="min-width: 180px;"]').should(
          'contain',
          'Out of range'
        )
      })
  })
  it('change default input to a correct amount', () => {
    cy.get(
      ':nth-child(1) > [style="min-width: 180px;"] > .q-field > .q-field__inner > .q-field__control > .q-field__control-container > input'
    )
      .clear({ force: true })
      .type('111', { force: true })
    cy.get(
      '[style="min-width: 180px;"] > .q-field > .q-field__inner > .q-field__bottom > .q-field__messages > div'
    ).should('not.exist')
  })
})

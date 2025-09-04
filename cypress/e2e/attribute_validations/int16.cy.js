/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing INT16U type validation', () => {
  it('create a new endpoint and click on configure to open attributes of endpoint', () => {
    cy.visit('/')
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      cy.createEndpointAndGoToClusterByIndex(data.endpoint1)
    })
  })
  it(
    'getting an attribute with INT16U type and change default amount',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.fixture('data').then((data) => {
        cy.get(
          `:nth-child(${data.int16inputpath}) > [style="min-width: 180px;"] > .q-field > .q-field__inner > .q-field__control > .q-field__control-container > input`
        )
          .clear({ force: true })
          .type('test', { force: true })
      })
    }
  )
  it(
    'check if validation works properly',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.fixture('data').then((data) => {
        cy.get(
          `:nth-child(${data.int16inputpath}) > [style="min-width: 180px;"] > .q-field > .q-field__inner > .q-field__bottom > .q-field__messages > div`
        ).should('exist')
      })
    }
  )
})

/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing INT8U type validation', () => {
  it('create a new endpoint and click on configure to open attributes of endpoint', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      cy.gotoAttributePage(data.endpoint7, data.cluster9, data.int8clusterpath)
    })
  })
  it(
    'getting an attribute with INT8U type and change default amount',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.fixture('data').then((data) => {
        cy.get(
          `[data-test="attribute-input-${data.attribute1}"] > .q-field > .q-field__inner > .q-field__control > .q-field__control-container > input`
        )
          .clear({ force: true })
          .type('test', { force: true })
      })
    }
  )
  it('check if validation works properly', () => {
    cy.fixture('data').then((data) => {
      cy.get(
        `[data-test="attribute-input-${data.attribute1}"] > .q-field > .q-field__inner > .q-field__bottom > .q-field__messages > div`
      ).should('exist')
    })
  })
})

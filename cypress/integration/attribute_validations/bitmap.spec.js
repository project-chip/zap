/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing BITMAP type validation', () => {
  it('create a new endpoint and click on configure to open attributes of endpoint', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.fixture('data').then((data) => {
      cy.gotoAttributePage(data.endpoint1, data.cluster1)
    })
  })
  it(
    'getting an attribute with BITMAP type and change default amount',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.fixture('data').then((data) => {
        // if (data.endpoint1 === 'Matter Bridge (0x000E)') {
        cy.get(
          `[data-test="attribute-status-toggle-${data.attribute4}"]`
        ).click()
        // }
        cy.get(
          `[data-test="attribute-input-${data.attribute4}"] > .q-field > .q-field__inner > .q-field__control > .q-field__control-container > input`
        )
          .clear({force: true})
          .type('test')
      })
    }
  )
  it('check if validation works properly', () => {
    cy.fixture('data').then((data) => {
      cy.get(
        `[data-test="attribute-input-${data.attribute4}"] > .q-field > .q-field__inner > .q-field__bottom > .q-field__messages > div`
      ).should('exist')
    })
  })
})

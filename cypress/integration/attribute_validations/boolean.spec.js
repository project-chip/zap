/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing BOOLEAN type validation', () => {
  it(
    'create a new endpoint and click on configure to open attributes of endpoint',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.fixture('baseurl').then((data) => {
        cy.visit(data.baseurl)
      })
      cy.gotoAttributePage('Billing Unit (0x0203)', 'General')
    }
  )
  it('getting an attribute with BOOLEAN type and change defualt amount', () => {
    cy.get(
      ':nth-child(15) > [style="min-width: 180px;"] > .q-field > .q-field__inner > .q-field__control > .q-field__control-container > input'
    )
      .clear({ force: true })
      .type('test', { force: true })
  })
  it('check if validation works properly', () => {
    cy.get(
      ':nth-child(15) > [style="min-width: 180px;"] > .q-field > .q-field__inner > .q-field__bottom > .q-field__messages > div'
    ).should('exist')
  })
})

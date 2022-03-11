/// <reference types="cypress" />
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing Editing endpoints', () => {
  it('create a new endpoint', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.addEndpoint('Billing Unit (0x0203)')
  })
  it('edit endpoint', { retries: { runMode: 2, openMode: 2 } }, () => {
    cy.get('button').contains('Edit').click()
    cy.get(
      '.q-form > .q-select > .q-field__inner > .q-field__control > .q-field__control-container'
    ).click()
    cy.get('div').contains('CBA Config Tool (0x0005)').click()
    cy.get('button').contains('Save').click()
  })
  it(
    'Check if edit is successfull',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('aside').children().should('contain', 'CBA Config Tool (0x0005)')
    }
  )
})

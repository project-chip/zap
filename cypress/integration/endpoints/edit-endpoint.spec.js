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
    cy.wait(1000)
  })
  it('edit endpoint', () => {
    cy.get('button').contains('Edit').click()
    cy.get(
      '.q-form > .q-select > .q-field__inner > .q-field__control > .q-field__control-container'
    ).click()
    cy.wait(1000)
    cy.get('div').contains('CBA Config Tool (0x0005)').click()
    cy.wait(1000)
    cy.get('button').contains('Save').click()
    cy.wait(1000)
  })
  it('Check if edit is successfull', () => {
    cy.get('aside').children().should('contain', 'CBA Config Tool (0x0005)')
  })
})

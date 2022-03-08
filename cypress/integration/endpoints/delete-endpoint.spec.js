/// <reference types="cypress" />
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing Deleting Endpoints', () => {
  it('create a new endpoint', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.addEndpoint('Billing Unit (0x0203)')
    cy.wait(1000)
  })
  it('delete endpoint', () => {
    cy.get('button').contains('Delete').click()
    cy.get('.bg-primary > .q-btn__wrapper').click()
    cy.get('#delete_last_endpoint').click()
  })
  it('Check if delete is successfull', () => {
    cy.get('aside')
      .children()
      .contains('Billing Unit (0x0203)')
      .should('not.exist')
  })
})

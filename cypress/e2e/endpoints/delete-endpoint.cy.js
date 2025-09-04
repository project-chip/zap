/// <reference types="cypress" />
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing Deleting Endpoints', () => {
  it('create a new endpoint', () => {
    cy.visit('/')
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint1)
    })
  })
  it('delete endpoint', { retries: { runMode: 2, openMode: 2 } }, () => {
    cy.get('[data-test="delete-endpoint"]').each(() => {
      cy.get('[data-test="delete-endpoint"]').last().click()
      cy.wait(300)
      cy.get('#delete_endpoint').click()
    })
    cy.wait(300)
    cy.get('#delete_last_endpoint').click()
  })
  it('Check if delete is successfull', () => {
    cy.fixture('data').then((data) => {
      cy.get('aside').children().contains(data.endpoint1).should('not.exist')
    })
  })
})

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
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint1)
    })
  })
  it('edit endpoint', { retries: { runMode: 2, openMode: 2 } }, () => {
    cy.get('[data-test="edit-endpoint"]').last().click()

    cy.fixture('data').then((data) => {
      cy.get('[data-test="select-endpoint-input"]')
        .click()
        .type(data.endpoint2.substring(0, 5), { force: true })
      cy.wait(500)
      cy.get('div').contains(data.endpoint2).click({ force: true })
    })
    cy.get('[data-test="endpoint-title"]').click() // it makes sure that the previous input field has been unselected
    cy.get('button').contains('Save').click()
  })
  it(
    'Check if edit is successfull',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.fixture('data').then((data) => {
        cy.get('aside').children().should('contain', data.endpoint2)
      })
    }
  )
})

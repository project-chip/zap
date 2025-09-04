/// <reference types="cypress" />
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing Editing endpoints', () => {
  beforeEach(() => {
    // Set up the base URL and create an endpoint before each test
    cy.visit('/')
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint1)
    })
  })

  it('create a new endpoint', () => {
    // Verify the endpoint was created successfully
    cy.fixture('data').then((data) => {
      cy.get('aside').children().should('contain', data.endpoint1)
    })
  })
  it(
    'edit endpoint -> Overwrite',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
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
      cy.wait(500)
      // Test overwrite option
      cy.get('button').contains('Overwrite').click()
      // Verify the endpoint was updated successfully
      cy.fixture('data').then((data) => {
        cy.get('aside').children().should('contain', data.endpoint2)
      })
    }
  )
  it(
    'edit endpoint -> delete and add',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('[data-test="edit-endpoint"]').last().click()

      cy.fixture('data').then((data) => {
        cy.get('[data-test="select-endpoint-input"]')
          .click()
          .type(data.endpoint3.substring(0, 5), { force: true })
        cy.wait(500)
        cy.get('div').contains(data.endpoint3).click({ force: true })
      })
      cy.get('[data-test="endpoint-title"]').click() // it makes sure that the previous input field has been unselected
      cy.get('button').contains('Save').click()
      cy.wait(500)
      // Test delete and add option
      cy.get('button').contains('Delete and Add').click()
      // Verify the endpoint was updated successfully
      cy.fixture('data').then((data) => {
        cy.get('aside').children().should('contain', data.endpoint3)
      })
    }
  )
})

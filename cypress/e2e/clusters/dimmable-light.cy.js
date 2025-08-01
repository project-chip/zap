/// <reference types="cypress" />
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe(
  'Testing Dimmable Light workflow',
  { defaultCommandTimeout: 6000, retries: { runMode: 2, openMode: 2 } },
  () => {
    it('create a Dimmable Light endpoint', () => {
      cy.visit('/')
      cy.setZclProperties()
      cy.fixture('data').then((data) => {
        cy.addEndpoint(data.endpoint6)
      })
    })
    it('Search for the cluster', () => {
      cy.fixture('data').then((data) => {
        cy.get('[data-test="search-clusters"]')
          .clear({ force: true })
          .type(data.cluster4)
      })
    })
  }
)

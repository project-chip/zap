/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing cluster filters', () => {
  it('create a new endpoint', { retries: { runMode: 2, openMode: 2 } }, () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint1, data.cluster1)
    })
  })
  it(
    'filter enabled clusters and check clusters',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('[data-test="filter-input"]').click()
      cy.get('.q-virtual-scroll__content > :nth-child(3)').click({
        force: true
      })
      cy.fixture('data').then((data) => {
        cy.get('tbody').children().contains(data.cluster2).should('not.exist')
      })
    }
  )
})

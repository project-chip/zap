/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Add multiple clusters and search', () => {
  it('create two endpoints and validate basic information', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4, data.cluster1)
    })
    cy.get('.flex  > strong').should('contain', '#1')
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint3, data.cluster1)
    })
    cy.get('.flex > strong').should('contain', '#2')
    cy.fixture('data').then((data) => {
      cy.get('tbody')
        .children()
        .should('contain', data.cluster5)
        .and('contain', data.cluster6)
      cy.addEndpoint(data.endpoint5, data.cluster1)
    })
    cy.get('.flex > strong').should('contain', '#3')
    cy.fixture('data').then((data) => {
      cy.get('#General > .q-expansion-item__container > .q-item').click({
        force: true
      })
      cy.get('tbody')
        .children()
        .should('contain', data.cluster7)
        .and('contain', data.cluster8)
    })
  })
  it('Search action', () => {
    cy.fixture('data').then((data) => {
      cy.get('[data-test="search-clusters"]')
        .clear({ force: true })
        .type(data.searchString2)
    })
  })
  it('check if search result is correct', () => {
    cy.fixture('data').then((data) => {
      cy.get('tbody').children().contains(data.cluster3).should('not.exist')
      cy.get('tbody').children().should('contain', data.cluster2)
    })
  })
  it('Close all the clusters', () => {
    cy.dataCy('cluster-btn-closeall').click()
    cy.get('[data-test=Cluster').each(($row) => {
      cy.wrap($row).should('have.class', 'q-expansion-item--collapsed')
    })
  })
})

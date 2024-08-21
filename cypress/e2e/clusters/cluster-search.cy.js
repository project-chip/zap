/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing cluster search', () => {
  it('create a new endpoint and check existance of Basic and Power Configuration clusters', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint1, data.cluster1)
    })
    cy.get('#General > .q-expansion-item__container > .q-item').click({
      force: true
    })
    cy.fixture('data').then((data) => {
      cy.get('tbody')
        .children()
        .should('contain', data.cluster3)
        .and('contain', data.cluster2)
    })
  })
  it('Search for power', () => {
    cy.fixture('data').then((data) => {
      cy.get('[data-test="search-clusters"]')
        .clear({ force: true })
        .type(data.searchString2)
    })
  })
  it('check if search result is correct', () => {
    cy.fixture('data').then((data) => {
      cy.get('tbody').children().contains(data.cluster3).should('not.exist')
    })

    cy.fixture('data').then((data) => {
      cy.get('tbody').children().should('contain', data.cluster2)
    })
  })
  it('check individual cluster closing and opening', () => {
    cy.get('[data-test=Cluster').each(($row) => {
      cy.wrap($row).should('have.class', 'q-expansion-item--expanded')
    })
    cy.dataCy('cluster-general').children().children().eq(0).click()
    cy.dataCy('cluster-general').should(
      'have.class',
      'q-expansion-item--collapsed'
    )
    cy.dataCy('cluster-general').children().children().eq(0).click()
    cy.dataCy('cluster-general').should(
      'have.class',
      'q-expansion-item--expanded'
    )
    cy.dataCy('cluster-btn-closeall').click()
    cy.get('[data-test=Cluster').each(($row) => {
      cy.wrap($row).should('have.class', 'q-expansion-item--collapsed')
    })
  })
})

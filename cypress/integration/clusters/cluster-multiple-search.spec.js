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
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4, data.cluster1)
    })
    cy.get('.vertical-align\\:middle > strong').should(
      'contain',
      'Endpoint - 1'
    )
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint3, data.cluster1)
    })
    cy.get('.vertical-align\\:middle > strong').should(
      'contain',
      'Endpoint - 2'
    )
    cy.get(
      '#Telecommunication > .q-expansion-item__container > .q-item'
    ).click()
    cy.get('tbody')
      .children()
      .should('contain', 'Information')
      .and('contain', 'Data Sharing')
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint5, data.cluster1)
    })
    cy.get('.vertical-align\\:middle > strong').should(
      'contain',
      'Endpoint - 3'
    )
    cy.get('#General > .q-expansion-item__container > .q-item').click()
    cy.get('tbody')
      .children()
      .should('contain', 'Identify')
      .and('contain', 'Groups')
  })
  it('Search for power', () => {
    cy.get(
      '.col-4 > .q-field__inner > .q-field__control > .q-field__control-container > input'
    )
      .clear({ force: true })
      .type('power', { force: true })
  })
  it('check if search result is correct', () => {
    cy.get('tbody').children().contains('Basic').should('not.exist')
    cy.get('tbody').children().should('contain', 'Power Configuration')
  })
})

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

    cy.addEndpoint('CBA Thermostat (0x0301)', 'General')
    cy.addEndpoint('Chatting Station (0x0601)', 'General')
    cy.get(
      '#Telecommunication > .q-expansion-item__container > .q-item'
    ).click()
    cy.get('tbody')
      .children()
      .should('contain', 'Information')
      .and('contain', 'Data Sharing')
    cy.addEndpoint('Charging Unit (0x0204)', 'General')
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

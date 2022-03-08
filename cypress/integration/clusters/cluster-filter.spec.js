/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing cluster filters', () => {
  it('create a new endpoint', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.addEndpoint('Billing Unit (0x0203)', 'General')
  })
  it('filter enabled clusters and check clusters', () => {
    cy.get(
      '.bar > :nth-child(1) > :nth-child(2) > .q-field > .q-field__inner > .q-field__control'
    ).click({ force: true })
    cy.get('#qvs_3 > :nth-child(3)').click()
    cy.get('tbody')
      .children()
      .contains('Power Configuration')
      .should('not.exist')
  })
  it('enable power configuration cluster and check if it exists this time', () => {
    cy.get(
      '.bar > :nth-child(1) > :nth-child(2) > .q-field > .q-field__inner > .q-field__control'
    ).click({ force: true })
    cy.get('#qvs_3 > :nth-child(1)').click()
    cy.get('tbody').children().should('contain', 'Power Configuration')
    cy.get(
      '#General > .q-expansion-item__container > .q-expansion-item__content > :nth-child(1) > .q-table__container > .q-table__middle > .q-table > tbody > :nth-child(2) > :nth-child(6) > .q-field > .q-field__inner > .q-field__control'
    ).click()
    cy.get('.q-virtual-scroll__content > :nth-child(3)')
      .contains('Server')
      .click()
    cy.get(
      '.bar > :nth-child(1) > :nth-child(2) > .q-field > .q-field__inner > .q-field__control'
    ).click({ force: true })
    cy.get('#qvs_3 > :nth-child(3)').click()
    cy.get('tbody').children().should('contain', 'Power Configuration')
  })
})

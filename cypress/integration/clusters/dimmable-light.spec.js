/// <reference types="cypress" />
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing LO Dimmable Light workflow', () => {
  it('create a LO Dimmable Light endpoint', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.get('button').contains('Add New Endpoint').click()
    cy.fixture('data').then((data) => {
      cy.get(
        '.q-form > .q-select > .q-field__inner > .q-field__control >  .q-field__control-container > .q-field__native > input'
      )
        .click()
        .clear({ force: true })
        .type(data.endpoitSearch1, { force: true })
      cy.get('div').contains(data.endpoit6).click()
    })

    cy.get('button').contains('Create').click()
  })
  it('Search for Over the Air Bootloading', () => {
    cy.fixture('data').then((data) => {
      cy.get(
        '.col-4 > .q-field__inner > .q-field__control > .q-field__control-container > input'
      )
        .clear({ force: true })
        .type(data.cluster4, { force: true })
    })
  })
  it('Enabling Client & Server', () => {
    cy.get(
      ':nth-child(6) > .q-field > .q-field__inner > .q-field__control'
    ).click()
    cy.fixture('data').then((data) => {
      cy.get('.q-item__section > .q-item__label').contains(data.server2).click()
    })
  })
  it('Check Configuration page', () => {
    cy.get(
      ':nth-child(7) > .q-btn > .q-btn__wrapper > .q-btn__content > .notranslate'
    ).click()
    cy.fixture('data').then((data) => {
      cy.get('tr.table_body').contains(data.attribute3).should('be.visible')
    })
  })
})

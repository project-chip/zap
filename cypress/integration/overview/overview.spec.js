/// <reference types="cypress" />
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})
describe('Testing endpoints, clusters and attributes', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080/?restPort=9070#/')
  })

  it('creating 3 new endpoints', () => {
    // adding three new endpoints
    cy.get('button').contains('Add New Endpoint').click()
    cy.wait(1000)
    cy.get(
      '.q-form > .q-select > .q-field__inner > .q-field__control > .q-field__control-container'
    ).click()
    cy.wait(1000)
    cy.get('div').contains('Billing Unit (0x0203)').click()
    cy.wait(1000)
    cy.get('button').contains('Create').click()
    cy.wait(1000)

    cy.get('button').contains('Add New Endpoint').click()
    cy.wait(1000)
    cy.get(
      '.q-form > .q-select > .q-field__inner > .q-field__control > .q-field__control-container'
    ).click()
    cy.wait(1000)
    cy.get('div').contains('CBA BACnet Tunneled Device (0x000A)').click()
    cy.wait(1000)
    cy.get('button').contains('Create').click()
    cy.wait(1000)

    cy.get('button').contains('Add New Endpoint').click()
    cy.wait(1000)
    cy.get(
      '.q-form > .q-select > .q-field__inner > .q-field__control > .q-field__control-container'
    ).click()
    cy.wait(1000)
    cy.get('div').contains('CBA Config Tool (0x0005)').click()
    cy.wait(1000)
    cy.get('button').contains('Create').click()
    cy.wait(1000)
  })
  it('check if three added endpoints exist', () => {
    cy.get('aside')
      .children()
      .should('contain', 'Billing Unit (0x0203)')
      .and('contain', 'CBA BACnet Tunneled Device (0x000A)')
      .and('contain', 'CBA Config Tool (0x0005)')
  })
  it('checking clusters of one of the endpoints', () => {
    //click on one of the endpoints
    cy.get('aside').contains('Billing Unit (0x0203)').click()

    //check if the selected endpont has General cluster and click on it
    cy.get('.q-page-container > div').children().should('contain', 'General')
    cy.get('div').contains('General').click()
  })
  it('check attributes and commands', () => {
    cy.get('aside').contains('Billing Unit (0x0203)').click()
    cy.get('div').contains('General').click()
    //check if configure button works fine
    cy.get(
      '#General > .q-expansion-item__container > .q-expansion-item__content > :nth-child(1) > .q-table__container > .q-table__middle > .q-table > tbody > :nth-child(1) > :nth-child(7) > .q-btn > .q-btn__wrapper > .q-btn__content > .material-icons'
    ).click()
    cy.wait(1000)

    //check if attributes are loaded
    cy.get('tbody').children().its('length').should('be.gte', 1)
    cy.get('a[href*="#"]').click()
    cy.wait(1000)
    cy.get('.q-page-container > div').children().should('contain', 'Financial')

    cy.get('div').contains('Financial').click()
    cy.get(
      '#Financial > .q-expansion-item__container > .q-expansion-item__content > :nth-child(1) > .q-table__container > .q-table__middle > .q-table > tbody > .text-weight-bolder > :nth-child(7)'
    ).click()
    cy.wait(1000)
    cy.get('tbody').children().its('length').should('be.gte', 1)
    cy.get('a[href*="#"]').click()
  })
})

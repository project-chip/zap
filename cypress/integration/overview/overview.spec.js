/// <reference types="cypress" />
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})
describe('Testing endpoints, clusters and attributes', () => {
  beforeEach(() => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
  })

  it('creating 3 new endpoints', () => {
    cy.addEndpoint('Billing Unit (0x0203)')
    cy.addEndpoint('CBA BACnet Tunneled Device (0x000A)')
    cy.addEndpoint('CBA Config Tool (0x0005)')
  })
  it(
    'check if three added endpoints exist',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('aside')
        .children()
        .should('contain', 'Billing Unit (0x0203)')
        .and('contain', 'CBA BACnet Tunneled Device (0x000A)')
        .and('contain', 'CBA Config Tool (0x0005)')
    }
  )
  it(
    'checking clusters of one of the endpoints',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      //click on one of the endpoints
      cy.get('aside').contains('Billing Unit (0x0203)').click()

      //check if the selected endpont has General cluster and click on it
      cy.get('.q-page-container > div').children().should('contain', 'General')
      cy.get('div').contains('General').click()
    }
  )
  it(
    'check attributes and commands',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('aside').contains('Billing Unit (0x0203)').click()
      cy.get('div').contains('General').click()
      //check if configure button works fine
      cy.get(
        '#General > .q-expansion-item__container > .q-expansion-item__content > :nth-child(1) > .q-table__container > .q-table__middle > .q-table > tbody > .text-weight-bolder > :nth-child(7) > .q-btn > .q-btn__wrapper > .q-btn__content > .notranslate'
      ).click({ force: true })

      //check if attributes are loaded
      cy.get('tbody').children().its('length').should('be.gte', 1)
    }
  )
})

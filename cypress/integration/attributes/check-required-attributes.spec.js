/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing disabling enabled attributes', () => {
  it('create a new endpoint and click on configure to open attributes of endpoint', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.gotoAttributePage('Billing Unit (0x0203)', 'General')
    cy.wait(1000)
  })
  it('getting enabled attribute and disable it', () => {
    cy.get(
      '#qvs_116 > :nth-child(1) > :nth-child(2) > .q-mt-xs > .q-toggle__inner'
    ).click()
    cy.get(
      '#qvs_116 > :nth-child(1) > :nth-child(2) > .q-mt-xs > .q-toggle__inner'
    ).should('be.visible')
    cy.get(
      '#qvs_116 > :nth-child(1) > :nth-child(2) > .q-mt-xs > .q-toggle__inner'
    ).click()
    cy.contains(
      '#qvs_116 > :nth-child(1) > :nth-child(2) > .q-mt-xs > .q-toggle__inner'
    ).should('not.exist')
  })
})

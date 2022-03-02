/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing enabled attributes amount', () => {
  it('create a new endpoint and get amount of enabled attributes', () => {
    cy.visit('http://localhost:8080/?restPort=9070#/')
    cy.addEndpoint('Billing Unit (0x0203)', 'General')
    cy.wait(2000)
    cy.get(':nth-child(7) > .text-right').then(($div) => {
      const num1 = parseFloat($div.text())
      cy.gotoAttributePage('', 'General')
      cy.get(
        '#qvs_116 > :nth-child(2) > :nth-child(2) > .q-mt-xs > .q-toggle__inner'
      ).click()
      cy.get('.router-link-active')
        .contains('Back')
        .click()
        .then(() => {})
      cy.wait(2000)
      cy.get(':nth-child(7) > .text-right').then(($div2) => {
        const num2 = parseFloat($div2.text())
        expect(num2).to.eq(17)
      })
    })
  })
})

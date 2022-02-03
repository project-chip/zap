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
    cy.get(':nth-child(6) > .text-right').then(($div) => {
      const num1 = parseFloat($div.text())
      cy.get('.q-page-container > div').children().should('contain', 'General')
      cy.get('div').contains('General').click()
      cy.get('div').children().contains('Not Enabled').first().click()
      cy.get('.q-virtual-scroll__content > :nth-child(3)').contains('Server').click()
      cy.wait(1000)
      cy.get(':nth-child(6) > .text-right').then(($div2) => {
        const num2 = parseFloat($div2.text())
        expect(num2).to.eq(num1 + 1)
      })
    })
  })
})

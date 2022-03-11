/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing enabled attributes amount', () => {
  it(
    'create a new endpoint and get amount of enabled attributes',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.fixture('baseurl').then((data) => {
        cy.visit(data.baseurl)
      })
      cy.addEndpoint('Billing Unit (0x0203)', 'General')
      cy.get(':nth-child(6) > .text-right').then(($div) => {
        const num1 = parseFloat($div.text())
        cy.get('.q-page-container > div')
          .children()
          .should('contain', 'General')
        cy.get('div').contains('General').click()
        cy.get('div').children().contains('Not Enabled').first().click()
        cy.get('.q-virtual-scroll__content > :nth-child(3)')
          .contains('Server')
          .click()
      })
    }
  )
  it(
    'checks if number is updated',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get(':nth-child(6) > .text-right').then(($div2) => {
        const num2 = parseFloat($div2.text())
        expect(num2).to.eq(6)
      })
    }
  )
})

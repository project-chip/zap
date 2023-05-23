/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing enabled attributes amount', () => {
  it('create a new endpoint and enable an attribute', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint1, data.cluster1)
      cy.gotoAttributePage('', data.cluster1)
    })
    cy.wait(1000)
    cy.get('[data-test="endpoint-enabled-attributes-amount"]').then(($div) => {
      const num1 = parseFloat($div.text())
      cy.fixture('data').then((data) => {
        cy.get(
          `:nth-child(2) > .toggle-box > .q-toggle > .q-toggle__inner`
        ).click()
      })
      cy.contains('close').click()
    })
  })
  it(
    'checks if number is updated',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('#Settings').click()
      cy.wait(300)
      cy.get('[data-test="go-back-button"').click()
      cy.wait(300)
      cy.fixture('data').then((data) => {
        cy.wait(700)
        cy.get('[data-test="endpoint-enabled-attributes-amount"]').then(
          ($div2) => {
            const num2 = parseFloat($div2.text())
            expect(num2).to.eq(Number(data.availableAttributes1))
          }
        )
      })
    }
  )
})

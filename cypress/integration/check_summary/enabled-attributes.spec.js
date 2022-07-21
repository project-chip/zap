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
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint1, data.cluster1)
    })
    cy.get(':nth-child(7) > .text-right').then(($div) => {
      const num1 = parseFloat($div.text())
      cy.fixture('data').then((data) => {
        cy.gotoAttributePage('', data.cluster1)
      })
      cy.get(
        '.table_body:eq(2) > :nth-child(2) > .q-mt-xs > .q-toggle__inner'
      ).click()
      cy.get('.router-link-active').contains('Back').click()
    })
  })
  it(
    'checks if number is updated',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.fixture('data').then((data) => {
        cy.get(':nth-child(7) > .text-right').then(($div2) => {
          const num2 = parseFloat($div2.text())
          expect(num2).to.eq(Number(data.availableAttributes1))
        })
      })
    }
  )
})

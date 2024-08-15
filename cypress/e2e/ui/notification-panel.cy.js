/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Check notification panel functionality', () => {
  it('Set Data', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.setZclProperties()
  })
  it(
    'Open notification panel',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('#Notifications').click()
      cy.wait(500)
      cy.get('#NotificationPanel')
        .parent()
        .should('not.have.class', '  q-layout--prevent-focus')
    },
  )
  it('Check active status on navbar', () => {
    cy.get('#Notifications').should('have.class', 'navmenu-item--active')
  })
  it(
    'Close notification panel',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('#Notifications').click()
      cy.wait(500)
      cy.get('#NotificationPanel')
        .parent()
        .should('have.class', 'q-layout--prevent-focus')
    },
  )
  it(
    'Open notification panel and open preview panel',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('#Notifications').click()
      cy.wait(500)
      cy.get('#NotificationPanel')
        .parent()
        .should('not.have.class', 'q-layout--prevent-focus')
      cy.get('#Preview').click()
      cy.get('#NotificationPanel')
        .parent()
        .should('have.class', 'q-layout--prevent-focus')
    },
  )
})

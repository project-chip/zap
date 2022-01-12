/// <reference types="cypress" />

const { find } = require('underscore')

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})
// describe('Check theme functionality', () => {
//   beforeEach(() => {
//     cy.visit('http://localhost:8080/?restPort=9070#/')
//   })

//   it('Setting dark theme via Preference', () => {
//     cy.get('#preference').click()
//     cy.wait(1000)
//     cy.get('#darkTheme')
//       // .parent()
//       // .get('[type="checkbox"]')
//       .find('input')
//       .check()

//     cy.get('#footer').should('colored', '#f2e47d').and('be.colored', '#f2e47d')
//   })
// })

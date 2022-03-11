/// <reference types="cypress" />

const { find } = require('underscore')
const rendApi = require('../../../src-shared/rend-api.js')

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})
describe('Check theme functionality', () => {
  beforeEach(() => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
  })

  it(
    'Setting light theme via Preference / calling rendereApi with boolean arg',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('#preference').click()
      cy.get('#darkTheme')
        // .parent()
        // .get('[type="checkbox"]')
        .find('input')
        .uncheck({ force: true })

      cy.get('body').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    }
  )

  it(
    'Setting dark theme via Preference / calling rendereApi with boolean arg',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('#preference').click()
      cy.get('#darkTheme')
        // .parent()
        // .get('[type="checkbox"]')
        .find('input')
        .check({ force: true })

      cy.get('body').should('have.css', 'background-color', 'rgb(39, 40, 33)')
    }
  )

  it('Setting light theme via rendererApi with string arg', () => {
    cy.window().then(function (window) {
      window[rendApi.GLOBAL_SYMBOL_EXECUTE](rendApi.id.setDarkTheme, 'false')
    })

    cy.get('body').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
  })

  it('Setting dark theme via rendererApi with string arg', () => {
    cy.window().then(function (window) {
      window[rendApi.GLOBAL_SYMBOL_EXECUTE](rendApi.id.setDarkTheme, 'true')
    })

    cy.get('body').should('have.css', 'background-color', 'rgb(39, 40, 33)')
  })
})

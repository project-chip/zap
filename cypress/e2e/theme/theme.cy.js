/// <reference types="cypress" />

const rendApi = require('../../../src-shared/rend-api.js')

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})
describe('Check theme functionality', () => {
  it('Set Data', () => {
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.setZclProperties()
  })
  it(
    'Preference: set light theme',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('#Settings').click()
      cy.wait(500)
      cy.get('#darkTheme').find('input').uncheck({ force: true })
      cy.get('body').should('have.class', 'body--light')
    }
  )

  it(
    'Preference: set dark theme',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('#Settings').click()
      cy.wait(500)
      cy.get('#darkTheme').find('input').check({ force: true })
      cy.get('body').should('have.class', 'body--dark')
    }
  )

  it('RendererApi: set light theme', () => {
    cy.rendererApi(rendApi.id.setDarkTheme, 'false')
    cy.get('body').should('have.class', 'body--light')
  })
  it('Zigbee mode', () => {
    cy.fixture('data').then((data) => {
      cy.get('#Back').click()
      cy.wait(500)
      cy.get('#zcl-advanced-platform').contains(data.mode)
    })
  })
})

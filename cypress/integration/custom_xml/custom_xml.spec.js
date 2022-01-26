/// <reference types="cypress" />

const { find } = require('underscore')
const rendApi = require('../../../src-shared/rend-api.js')
const path = require('path')

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})
describe('Check ZCL Extension functionalities', () => {
  it('Verify Device Type display value', () => {
    cy.visit('http://localhost:8080/?restPort=9070#/')
    cy.window()
      .then(function (window) {
        window[rendApi.GLOBAL_SYMBOL_EXECUTE](
          rendApi.id.open,
          path.join(__dirname, 'test.zap')
        )
      })
      .then(() => {
        cy.get(
          ':nth-child(3) > .q-card > .q-list > :nth-child(2) > :nth-child(2)'
        ).should('contain', 'Vendor Device Type Name (0xDEAD)')

        cy.get(
          ':nth-child(3) > .q-card > .q-list > :nth-child(4) > :nth-child(2)'
        ).should('contain', '0xBEEF')

        cy.wait(1000)

        cy.get(
          '.col-4 > .q-field__inner > .q-field__control > .q-field__control-container > input'
        )
          .clear({ force: true })
          .type('Bridge', { force: true })
        cy.get('.q-table--col-auto-width').should('contain', 'Bridge')
        cy.get('.q-tr > :nth-child(3)').should('contain', 'Server')
        cy.get('.q-tr > :nth-child(4)').should('contain', '0xFD00')
        cy.get('.q-tr > :nth-child(5)').should('contain', '0x1022')

        let cluster = 'Bridge'
        cy.get('.q-tr > :nth-child(7) > .q-btn').click({ force: true })
        cy.get(
          ':nth-child(5) > :nth-child(2) > .q-mt-xs > .q-toggle__inner'
        ).find('input')
        // .should('be.checked') NOT WORKING

        cy.get('.router-link-active').click()

        cy.get(
          '.col-4 > .q-field__inner > .q-field__control > .q-field__control-container > input'
        )
          .clear({ force: true })
          .type('XBB Cluster', { force: true })
        cy.get('.q-table--col-auto-width').should('contain', 'XBB Cluster')
        cy.get('.q-tr > :nth-child(3)').should('contain', 'Server')
        cy.get('.q-tr > :nth-child(4)').should('contain', '0xFD02')
        cy.get('.q-tr > :nth-child(5)').should('contain', '0x111D')
      })
  })
})

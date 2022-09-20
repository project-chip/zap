/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test
    return false
  })
  
  describe('Testing adding new zcl extension file', () => {
    it('opening zcl extensions dialog', () => {
      cy.fixture('baseurl').then((data) => {
        cy.visit(data.baseurl)
      })
      cy.get('[data-test="zcl-extensions-btn"]').click()
    })
    it('adding a new extension file', { retries: { runMode: 2, openMode: 2 } }, () => {
      cy.get('[data-test="add-file-input"]').attachFile({ filePath: '/files/ami-devices.xml', encoding: 'utf-8' });
    })
  })
  
/// <reference types="cypress" />

/**
 * Application on Application Basic is struct-typed (ApplicationStruct) and is
 * not listed in attributeAccessInterfaceAttributes. With
 * structsUseAttributeAccessInterface, Matter shows it as External storage.
 */

Cypress.on('uncaught:exception', () => false)

describe('Matter struct-typed attribute storage', () => {
  if (Cypress.env('mode') !== Cypress.Mode.matter) {
    it('skips struct storage checks outside Matter mode', () => {
      return
    })
  } else {
    it('shows External storage for the Application struct attribute', () => {
      cy.visit('/')
      cy.setZclProperties()
      // Matter Content App enables the Application Basic server cluster.
      cy.addEndpoint('Matter Content App (0x0024)')
      cy.goToClusterByName('Application Basic', 'Media')

      cy.get('#ZclAttributeManager .q-table__bottom .q-select').click()
      cy.get('.q-menu').contains('All').click()

      cy.get('[data-test="attribute-toggle"][attribute-name="Application"]')
        .should('have.attr', 'aria-checked', 'true')
        .closest('tr')
        .contains('td', 'APPLICATIONSTRUCT')
        .should('exist')

      cy.get('[data-test="attribute-storage"][attribute-name="Application"]')
        .find('.q-select')
        .should('contain.text', 'External')
        .and('have.class', 'q-field--disabled')

      // A scalar attribute on the same cluster keeps RAM and stays editable.
      cy.get(
        '[data-test="attribute-storage"][attribute-name="ApplicationName"]'
      )
        .find('.q-select')
        .should('contain.text', 'RAM')
        .and('not.have.class', 'q-field--disabled')
    })
  }
})

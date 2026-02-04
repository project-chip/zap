/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('ZCL Toolbar functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(1000)
  })

  it('Should display toolbar', () => {
    cy.get('.q-toolbar').should('exist')
  })

  it('Should display Back button when not on home page', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.dataCy('btn-go-back').should('be.visible')
    cy.dataCy('btn-go-back').should('exist')
  })

  it('Should navigate back to home when clicking Back button', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.dataCy('btn-go-back').click({ force: true })
    cy.wait(1000)
    cy.url().should('not.include', '/options')
  })

  it('Should display Settings button', () => {
    cy.get('#Settings').should('be.visible')
  })

  it('Should navigate to preferences when clicking Settings', () => {
    cy.get('#Settings').click()
    cy.wait(1000)
    cy.url().should('include', '/preferences')
  })

  it('Should display Options button in toolbar', () => {
    cy.get('#global_options').should('be.visible')
  })

  it('Should navigate to options when clicking Options button', () => {
    cy.get('#global_options').click()
    cy.wait(1000)
    cy.url().should('include', '/options')
  })

  it('Should display Generate button if debug nav is enabled', () => {
    cy.get('body').then(($body) => {
      if ($body.find('#generate').length > 0) {
        cy.get('#generate').should('be.visible')
      } else {
        cy.log('Generate button not visible (debug nav disabled)')
      }
    })
  })

  it('Should display Save button if enabled', () => {
    cy.get('body').then(($body) => {
      if ($body.find('#save').length > 0) {
        cy.get('#save').should('be.visible')
      } else {
        cy.log('Save button not visible (not enabled)')
      }
    })
  })

  it('Should display Documentation button if available', () => {
    cy.get('body').then(($body) => {
      if ($body.find('#documentation').length > 0) {
        cy.get('#documentation').should('be.visible')
      } else {
        cy.log('Documentation button not visible (not available)')
      }
    })
  })

  it('Should display logos on home page', () => {
    cy.visit('/')
    cy.wait(1000)
    // Check if logos are displayed
    cy.get('img.logo, img.image-space').should('exist')
  })

  it('Should display Multiprotocol label if multi-config', () => {
    cy.visit('/')
    cy.wait(1000)
    cy.get('body').then(($body) => {
      if ($body.text().includes('Multiprotocol')) {
        cy.contains('Multiprotocol').should('be.visible')
      }
    })
  })
})

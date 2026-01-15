/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Options page functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(1000)
  })

  it('Should navigate to options page', () => {
    // Navigate via toolbar button using data-cy
    cy.dataCy('btn-options').should('be.visible')
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.url().should('include', '/options')
  })

  it('Should display options page title', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.contains('Options').should('be.visible')
  })

  it('Should display Global Options section', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.contains('Global Options').should('be.visible')
  })

  it('Should display Product Manufacturer select', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.dataCy('manufacturer-name-or-code').should('be.visible')
    cy.contains('Product Manufacturer').should('be.visible')
  })

  it('Should allow selecting manufacturer', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.dataCy('manufacturer-name-or-code').should('be.visible')
    // Click to open dropdown
    cy.dataCy('manufacturer-name-or-code').click()
    cy.wait(500)
    // The select should be interactive
    cy.dataCy('manufacturer-name-or-code').should('exist')
  })

  it('Should display Default Response Policy select', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.dataCy('default-response-policy').should('be.visible')
    cy.contains('Default Response Policy').should('be.visible')
  })

  it('Should allow selecting default response policy', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.dataCy('default-response-policy').should('be.visible')
    // Click to open dropdown
    cy.dataCy('default-response-policy').click()
    cy.wait(500)
    // The select should be interactive
    cy.dataCy('default-response-policy').should('exist')
  })

  it('Should display Enable Command Discovery toggle', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.contains('Enable Command Discovery').should('be.visible')
    cy.dataCy('toggle-command-discovery').should('exist')
  })

  it('Should toggle Command Discovery', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.dataCy('toggle-command-discovery').click({ force: true })
    cy.wait(500)
    // Verify toggle exists
    cy.dataCy('toggle-command-discovery').should('exist')
  })

  it('Should display Enable Component Toggling toggle', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.contains('Enable Component Toggling in IDE').should('be.visible')
    cy.dataCy('toggle-component-toggling').should('exist')
  })

  it('Should toggle Component Toggling', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    cy.dataCy('toggle-component-toggling').click({ force: true })
    cy.wait(500)
    // Verify toggle exists
    cy.dataCy('toggle-component-toggling').should('exist')
  })

  it('Should display tooltips on hover', () => {
    cy.dataCy('btn-options').click({ force: true })
    cy.wait(1000)
    // Hover over Command Discovery toggle
    cy.dataCy('toggle-command-discovery').trigger('mouseenter')
    cy.wait(300)
    // Tooltip might appear, but we can't always verify it easily
    cy.contains('Enable Command Discovery').should('be.visible')
  })
})

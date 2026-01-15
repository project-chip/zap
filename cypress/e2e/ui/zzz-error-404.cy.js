/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

// NOTE: This test suite should run LAST as it navigates to invalid routes
// which may affect application state. Run other tests first.
describe('Error 404 page functionality (run last)', () => {
  beforeEach(() => {
    // Always start from home to ensure clean state
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(2000) // Longer wait to ensure app is fully initialized
  })

  afterEach(() => {
    // Navigate back to home after each test to reset state
    // This prevents the 404 page from affecting subsequent tests
    cy.visit('/', { failOnStatusCode: false })
    cy.wait(2000) // Longer wait to ensure app resets properly
  })

  it('Should display 404 page for invalid route', () => {
    cy.visit('/invalid-route-that-does-not-exist', { failOnStatusCode: false })
    cy.wait(1000)
    // Check if 404 page is displayed
    cy.contains('404').should('be.visible')
  })

  it('Should display error message', () => {
    cy.visit('/invalid-route-that-does-not-exist', { failOnStatusCode: false })
    cy.wait(1000)
    cy.contains('Sorry, nothing here').should('be.visible')
  })

  it('Should display error image', () => {
    cy.visit('/invalid-route-that-does-not-exist', { failOnStatusCode: false })
    cy.wait(1000)
    cy.get('img[alt="Error 404"]').should('exist')
  })

  it('Should display Go back button', () => {
    cy.visit('/invalid-route-that-does-not-exist', { failOnStatusCode: false })
    cy.wait(1000)
    cy.contains('Go back').should('be.visible')
    cy.get('button:contains("Go back"), a:contains("Go back")').should('exist')
  })

  it('Should navigate to home when clicking Go back', () => {
    cy.visit('/invalid-route-that-does-not-exist', { failOnStatusCode: false })
    cy.wait(1000)
    cy.contains('Go back').click()
    cy.wait(1000)
    // Should navigate to home page
    cy.url().should('not.include', 'invalid-route')
  })
})

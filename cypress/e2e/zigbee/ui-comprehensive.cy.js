/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false
})

describe('Zigbee UI Comprehensive Tests', () => {
  beforeEach(() => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(2000)

    // Clean up: delete all existing endpoints before each test
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="delete-endpoint"]').length > 0) {
        // Delete all endpoints except the last one using each()
        cy.get('[data-test="delete-endpoint"]').each(() => {
          cy.get('[data-test="delete-endpoint"]').last().click({ force: true })
          cy.wait(500)
          cy.get('#delete_endpoint').should('exist').click({ force: true })
          cy.wait(500)
        })
        // Delete the last endpoint (which shows different dialog)
        cy.wait(300)
        cy.get('[data-test="delete-endpoint"]').then(($remaining) => {
          if ($remaining.length > 0) {
            cy.get('[data-test="delete-endpoint"]')
              .last()
              .click({ force: true })
            cy.wait(500)
            cy.get('#delete_last_endpoint')
              .should('exist')
              .click({ force: true })
            cy.wait(500)
          }
        })
      }
    })
  })

  it('Should handle domain expansion and collapse', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)

      // Expand General domain
      cy.contains('div', data.cluster1).click({ force: true })
      cy.wait(500)

      // Verify clusters are visible
      cy.contains('tr', data.cluster3).should('be.visible')

      // Collapse domain
      cy.contains('div', data.cluster1).click({ force: true })
      cy.wait(500)
    })
  })

  it('Should handle tab navigation in cluster view', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)

      // Navigate through tabs
      const tabs = ['Attributes', 'Commands', 'Events', 'Attribute Reporting']
      tabs.forEach((tab) => {
        cy.contains('.q-tab', tab).click({ force: true })
        cy.wait(300)
        cy.contains('.q-tab', tab).should('have.class', 'q-tab--active')
      })
    })
  })

  it('Should display toolbar elements', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.get('.q-toolbar').should('exist')
    cy.get('#Settings').should('be.visible')
    cy.get('#global_options').should('be.visible')
  })

  it('Should navigate using toolbar buttons', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    // Navigate to options
    cy.get('#global_options').click()
    cy.wait(1000)
    cy.url().should('include', '/options')

    // Navigate back
    cy.dataCy('btn-go-back').click({ force: true })
    cy.wait(1000)
    cy.url().should('not.include', '/options')
  })

  it('Should handle cluster configuration flow', () => {
    if (Cypress.env('mode') !== 'zigbee') {
      return
    }
    cy.fixture('data').then((data) => {
      // Create endpoint
      cy.addEndpoint(data.endpoint4)

      // Navigate to cluster
      cy.goToClusterByName(data.cluster3, data.cluster1)

      // Configure attributes
      cy.goToAttributesTabFromClusterView()
      cy.get('[data-test="attribute-toggle"]').first().click({ force: true })
      cy.wait(500)

      // Configure commands
      cy.goToCommandsTabFromClusterView()
      cy.get('[data-test="in-command-checkbox"]').first().click({ force: true })
      cy.wait(500)

      // Configure attribute reporting
      cy.goToAttributeReportingTabFromClusterView()
      cy.get('.q-toggle').first().click({ force: true })
      cy.wait(500)
    })
  })
})

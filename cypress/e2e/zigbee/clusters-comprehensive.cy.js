/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false
})

describe('Zigbee Cluster Comprehensive Tests', () => {
  beforeEach(() => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
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

  it('Should navigate to multiple clusters', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)

      // Navigate to Basic cluster
      cy.goToClusterByName(data.cluster3, data.cluster1)
      cy.contains(data.cluster3).should('be.visible')
      cy.goBackButton()
      // Navigate to Identify cluster
      cy.goToClusterByName(data.cluster7, data.cluster1)
      cy.contains(data.cluster7).should('be.visible')
      cy.goBackButton()
      // Navigate to Power Configuration cluster
      cy.goToClusterByName(data.cluster2, data.cluster1)
      cy.contains(data.cluster2).should('be.visible')
    })
  })

  it('Should display all cluster tabs', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)

      // Verify all tabs are present
      cy.contains('.q-tab', 'Attributes').should('be.visible')
      cy.contains('.q-tab', 'Commands').should('be.visible')
      cy.contains('.q-tab', 'Attribute Reporting').should('be.visible')
    })
  })

  it('Should navigate between cluster tabs', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.goToClusterByName(data.cluster3, data.cluster1)

      // Navigate through all tabs
      cy.goToAttributesTabFromClusterView()
      cy.dataCy('attributes-tab').should('have.class', 'q-tab--active')

      cy.goToCommandsTabFromClusterView()
      cy.dataCy('commands-tab').should('have.class', 'q-tab--active')

      cy.goToAttributeReportingTabFromClusterView()
      cy.dataCy('attribute-reporting-tab').should('have.class', 'q-tab--active')
    })
  })

  it('Should search for clusters', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)

      // Use search functionality
      cy.get('input[placeholder*="Search"], input[type="search"]').then(
        ($inputs) => {
          if ($inputs.length > 0) {
            cy.wrap($inputs).first().type(data.cluster3, { force: true })
            cy.wait(500)

            // Verify search results
            cy.get('body').should('contain', data.cluster3)
          }
        }
      )
    })
  })

  it('Should filter clusters by domain', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)

      // Expand General domain
      cy.contains('div', data.cluster1).click({ force: true })
      cy.wait(500)

      // Verify clusters under General domain are visible
      cy.contains('tr', data.cluster3).should('be.visible')
      cy.contains('tr', data.cluster7).should('be.visible')
    })
  })

  it('Should expand and collapse domains', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)

      // Expand General domain
      cy.contains('div', data.cluster1).click({ force: true })
      cy.wait(500)
      cy.contains('tr', data.cluster3).should('be.visible')

      // Collapse domain
      cy.contains('div', data.cluster1).click({ force: true })
      cy.wait(500)
    })
  })

  it('Should access cluster by index', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.fixture('data').then((data) => {
      cy.createEndpointAndGoToClusterByIndex(data.endpoint4, 0, data.cluster1)

      // Verify cluster view is displayed
      cy.contains('.q-tab', 'Attributes').should('be.visible')
    })
  })
})

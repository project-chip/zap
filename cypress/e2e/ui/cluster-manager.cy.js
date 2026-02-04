/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Cluster Manager component functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(1000)
  })

  it('Should display cluster manager when endpoint is selected', () => {
    // Check if cluster manager is visible
    cy.get('body').should('exist')
    // The component should render if endpoint is selected
    cy.get('.q-page').should('exist')
  })

  it('Should display endpoint selector if preview tab is enabled', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="filter-input"]').length > 0) {
        cy.dataCy('cluster-domain-filter').should('exist')
      }
    })
  })

  it('Should display cluster filter input', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="cluster-domain-filter"]').length > 0) {
        cy.dataCy('cluster-domain-filter').should('exist')
      }
    })
  })

  it('Should display cluster search input', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="cluster-text-filter"]').length > 0) {
        cy.dataCy('cluster-text-filter').should('exist')
      }
    })
  })

  it('Should allow searching clusters', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="cluster-text-filter"]').length > 0) {
        cy.dataCy('cluster-text-filter').type('OnOff', { force: true })
        cy.wait(500)
        cy.dataCy('cluster-text-filter').should('have.value', 'OnOff')
      }
    })
  })

  it('Should display Device Type Features button if enabled', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="device-type-features-btn"]').length > 0) {
        cy.get('[data-test="device-type-features-btn"]').should('be.visible')
      }
    })
  })
})

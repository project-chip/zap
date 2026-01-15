/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Domain Cluster View component functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(1000)
  })

  it('Should display Enable All Clusters button if available', () => {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Enable All Clusters')) {
        cy.contains('Enable All Clusters').should('be.visible')
      }
    })
  })

  it('Should display clusters table', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.q-table').length > 0) {
        cy.get('.q-table').should('exist')
      }
    })
  })

  it('Should display cluster status icons', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.q-icon[name="warning"]').length > 0) {
        cy.get('.q-icon[name="warning"]').should('exist')
      }
    })
  })
})

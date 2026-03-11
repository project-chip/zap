/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing cluster filters', () => {
  it('create a new endpoint', { retries: { runMode: 2, openMode: 2 } }, () => {
    cy.visit('/')
    cy.setZclProperties()
    cy.fixture('data').then((data) => {
      // Selecting SE Range Extender for Zigbee
      // Selecting Matter Dimmable Light (0x0101) for Matter
      cy.addEndpoint(data.endpoint9)
    })
  })
  it(
    'filter enabled clusters and check clusters and check close all and open all buttons',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('[data-test="filter-input"]').click()
      // Selecting Enabled clusters
      cy.get('.q-virtual-scroll__content > :nth-child(3)').click({
        force: true
      })
      cy.fixture('data').then((data) => {
        // Power Configurator for Zigbee is disabled and should not show up
        // Occupancy Sensing for Matter is disabled and should not exist
        cy.get('tbody').children().contains(data.cluster9).should('not.exist')
        // Basic for Zigbee is enabled and should show up
        // Identify for Matter is enabled and should show up
        cy.get('tbody').children().contains(data.cluster10).should('be.visible')
      })

      cy.dataCy('cluster-btn-closeall').click()
      cy.fixture('data').then((data) => {
        cy.get('tbody')
          .children()
          .contains(data.cluster10)
          .should('not.be.visible')
      })

      cy.dataCy('cluster-btn-openall').click()

      cy.fixture('data').then((data) => {
        // Power Configurator for Zigbee is disabled and should not show up
        // Occupancy Sensing for Matter is disabled and should not exist
        cy.get('tbody').children().contains(data.cluster9).should('not.exist')
        // Basic for Zigbee is enabled and should show up
        // Identify for Matter is enabled and should show up
        cy.get('tbody').children().contains(data.cluster10).should('be.visible')
      })
    }
  )
  it(
    'filter all clusters and check close all and open all buttons',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('[data-test="filter-input"]').click()
      // Selecting All clusters
      cy.get('.q-virtual-scroll__content > :nth-child(2)').click({
        force: true
      })
      cy.fixture('data').then((data) => {
        cy.get('tbody').children().contains(data.cluster9).should('be.visible')
        cy.get('tbody').children().contains(data.cluster10).should('be.visible')
      })

      // Close All: doActionFilter sets allDomainsCollapsed = true,
      // hiding domains and swapping to Open All button
      cy.dataCy('cluster-btn-closeall').click()
      cy.dataCy('cluster-btn-closeall').should('not.exist')
      cy.dataCy('cluster-btn-openall').should('exist')

      cy.fixture('data').then((data) => {
        cy.get('tbody')
          .children()
          .contains(data.cluster9)
          .should('not.be.visible')
        cy.get('tbody')
          .children()
          .contains(data.cluster10)
          .should('not.be.visible')
      })

      // Open All: doActionFilter sets allDomainsCollapsed = false,
      // restoring domains and swapping back to Close All button
      cy.dataCy('cluster-btn-openall').click()
      cy.dataCy('cluster-btn-openall').should('not.exist')
      cy.dataCy('cluster-btn-closeall').should('exist')

      cy.fixture('data').then((data) => {
        cy.get('tbody').children().contains(data.cluster9).should('be.visible')
        cy.get('tbody').children().contains(data.cluster10).should('be.visible')
      })
    }
  )
  it(
    'filter legal clusters and check clusters',
    { retries: { runMode: 2, openMode: 2 } },
    () => {
      cy.get('[data-test="filter-input"]').click()
      // Selecting Legal Clusters
      cy.get('.q-virtual-scroll__content > :nth-child(4)').click({
        force: true
      })
      cy.fixture('data').then((data) => {
        // Power Configurator for Zigbee is legal and should show up
        // Occupancy Sensing for Matter is legal and should show up
        if (data.cluster9 == 'Power Configuration') {
          cy.get('tbody')
            .children()
            .contains(data.cluster9)
            .should('exist')
            .parents('tr')
            .within(() => {
              cy.get('div[role="checkbox"][aria-label="Client"]')
                .should('have.attr', 'aria-checked', 'false')
                .click({ force: true })
                .should('have.attr', 'aria-checked', 'false') // Even when clicking on the client checkbox it should not be enabled because of legal cluster filter setting does not allow non Device type clusters to be enabled.
            })
          cy.get('tbody')
            .children()
            .contains(data.cluster9)
            .should('exist')
            .parents('tr')
            .within(() => {
              cy.get('div[role="checkbox"][aria-label="Server"]')
                .should('have.attr', 'aria-checked', 'false')
                .click({ force: true })
                .should('have.attr', 'aria-checked', 'true') // when clicking on the server checkbox it should be enabled because of legal cluster filter setting allows it to be selected
            })
        } else {
          // Occupancy Sensing
          cy.get('tbody')
            .children()
            .contains(data.cluster9)
            .should('exist')
            .parents('tr')
            .within(() => {
              cy.get('div[role="checkbox"][aria-label="Client"]')
                .should('have.attr', 'aria-checked', 'false')
                .click({ force: true })
                .should('have.attr', 'aria-checked', 'true') // when clicking on the server checkbox it should be enabled because of legal cluster filter setting allows it to be selected
            })
          cy.get('tbody')
            .children()
            .contains(data.cluster9)
            .should('exist')
            .parents('tr')
            .within(() => {
              cy.get('div[role="checkbox"][aria-label="Server"]')
                .should('have.attr', 'aria-checked', 'false')
                .click({ force: true })
                .should('have.attr', 'aria-checked', 'false') // Even when clicking on the client checkbox it should not be enabled because of legal cluster filter setting does not allow non Device type clusters to be enabled.
            })
        }

        // Basic for Zigbee is legal and should show up
        // Identify for Matter is legal and should show up
        cy.get('tbody').children().contains(data.cluster10).should('exist')
      })
    }
  )
})

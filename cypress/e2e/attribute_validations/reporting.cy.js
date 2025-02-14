/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false
})

describe('Add multiple clusters and search', () => {
  // This will hold the fixture data and the flag for skipping the tests
  let skipTest = false

  before(function () {
    // Load the fixture data before running any tests
    cy.fixture('data').then((data) => {
      this.data = data
      // If mode is "matter", set skipTest flag to true
      if (this.data.mode !== 'zigbee') {
        skipTest = true
      }
    })
  })

  it('create two endpoints and validate basic information', function () {
    // Skip the test if the flag is true (mode is "matter")
    if (skipTest) {
      cy.log('Skipping test because mode is not "zigbee"')
      return // Skip the test if mode is 'matter'
    }

    // Continue with the test if the mode is not "matter"
    cy.fixture('baseurl').then((data) => {
      cy.visit(data.baseurl)
    })
    cy.setZclProperties()

    // Create and validate the first endpoint
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4, data.cluster1)
    })
    cy.get('.flex  > strong').should('contain', '#1')

    // Select the "Power Configuration" cluster for the second endpoint
    cy.fixture('data').then((data) => {
      cy.gotoAttributePage(data.endpoint1, data.cluster1)
      cy.contains('.q-item__section .q-item__label', 'General', {
        timeout: 10000
      })
        .should('be.visible')
        .click()
    })

    // Check the "Attribute Reporting" tab for the second endpoint
    cy.fixture('data').then((data) => {
      cy.contains('.q-tab__content .q-tab__label', 'Attribute Reporting', {
        timeout: 10000
      })
        .should('be.visible')
        .click()
    })
    cy.get(
      '.q-virtual-scroll__content > :nth-child(1) > :nth-child(2) > .q-toggle > .q-toggle__inner > .q-toggle__thumb'
    ).click()
    // Check to make sure the button is still visible after clicking
    cy.get(
      '.q-virtual-scroll__content > :nth-child(1) > :nth-child(2) > .q-toggle > .q-toggle__inner > .q-toggle__thumb'
    ).should('be.visible')
  })
})

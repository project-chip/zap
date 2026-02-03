/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing Matter Device Type Feature Page', () => {
  if (Cypress.env('mode') !== Cypress.Mode.matter) {
    it('skipping feature page related tests since mode is not Matter', () => {
      return
    })
  } else {
    it('Test opening device type feature page and enable a feature.', () => {
      cy.fixture('data').then((data) => {
        cy.visit('/')
        cy.addEndpoint(data.extendedColorLightEndpoint)

        // navigate to the device type feature page
        cy.get('[data-test="device-type-features-btn"]').should('exist').click()

        // check if the feature table has non-empty rows
        cy.get('[data-test="feature-row"]').should('have.length.greaterThan', 0)

        // check if HS feature has correct information rendered and enable it
        cy.checkAndEnableFeature(data.HSFeature)

        let updatedElements = data.HSFeature.updatedElements
        cy.checkElementsToUpdateDialog(updatedElements)

        cy.get('[data-test="confirm-feature-update"]').click()
        cy.get('[data-test="go-back-button"]').click()

        // After go back to endpoint view, wait for the cluster to be loaded
        cy.get('[data-test="Cluster"]').should('exist')

        // Go to Color Control cluster and check if elements and feature map attribute are correctly updated
        cy.goToClusterByName(data.colorControlCluster, data.lightingDomain)

        cy.checkEnabledStateOfElements(updatedElements)

        cy.goToFeaturesTabFromClusterView()
        let updatedFeatureMapAttribute = {
          value: '25',
          binary: '11001'
        }
        cy.checkFeatureMapValue(updatedFeatureMapAttribute)
      })
    })
  }
})

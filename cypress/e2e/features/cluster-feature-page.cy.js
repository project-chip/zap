/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Testing Matter Cluster Feature Page', () => {
  if (Cypress.env('mode') !== 'matter') {
    it('skipping feature page related tests since mode is not Matter', () => {
      return
    })
  } else {
    it('Test opening cluster feature page and enabling a feature.', () => {
      cy.fixture('data').then((data) => {
        cy.visit('/')
        // create a new endpoint on Extended Color Light device type and go to the Color Control cluster
        cy.addEndpoint(data.extendedColorLightEndpoint)
        cy.goToClusterByName(
          data.colorControlCluster,
          data.lightingDomain // under Lighting domain
        )

        cy.goToFeaturesTabFromClusterView()

        // check if the feature map attribute has correct value
        // by default, bit 3 and 4 are enabled in Color Control cluster
        let featureMapAttribute = {
          value: '24',
          binary: '11000'
        }
        cy.checkFeatureMapValue(featureMapAttribute)

        // check if the feature table has non-empty rows
        cy.get('[data-test="feature-row"]').should('have.length.greaterThan', 0)

        // check if HS feature has correct information rendered and enable it
        cy.checkAndEnableFeature(data.HSFeature)

        // check elements to be updated in the dialog
        let updatedElements = data.HSFeature.updatedElements
        cy.checkElementsToUpdateDialog(updatedElements)

        cy.get('[data-test="confirm-feature-update"]').click()

        // after feature toggle, check if elements and feature map attribute are correctly updated
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

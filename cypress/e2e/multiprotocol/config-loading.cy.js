/// <reference types="cypress" />

/**
 * Scenario 1 – Zigbee + Matter templates are pre-loaded (multiprotocol mode).
 *
 * Runs only in multiprotocol mode because the file lives under
 * cypress/e2e/multiprotocol/.
 */

import {
  zigbeeZclPkg,
  matterZclPkg,
  zigbeeTemplatePkg,
  matterTemplatePkg,
  buildSessionAttemptResponse,
  stubConfigApis
} from '../../support/config-loading-helpers'

Cypress.on('uncaught:exception', () => false)

describe('Config loading – both Zigbee + Matter pre-loaded', () => {
  it('should show both Zigbee and Matter ZCL packages', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: [zigbeeTemplatePkg, matterTemplatePkg]
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    cy.contains('Zigbee Cluster Library metadata').should('be.visible')
    cy.dataCy('zcl-package-checkbox').should('have.length', 2)
    cy.contains('td', 'zigbee').should('exist')
    cy.contains('td', 'matter').should('exist')
  })

  it('should show both Zigbee and Matter generation templates', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: [zigbeeTemplatePkg, matterTemplatePkg]
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    cy.contains('Zap Generation Templates').should('be.visible')
    cy.get('[data-test="gen-template"]').should('have.length', 2)
  })

  it('should show multiprotocol warning when both ZCL categories are selected', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: [zigbeeTemplatePkg, matterTemplatePkg]
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    // Ensure both ZCL packages are checked
    cy.dataCy('zcl-package-checkbox').each(($el) => {
      if ($el.attr('aria-checked') !== 'true') {
        cy.wrap($el).click({ force: true })
      }
    })

    cy.contains('multi-protocol').should('be.visible')
  })

  it('should warn about internal packages when nothing is selected', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: [zigbeeTemplatePkg, matterTemplatePkg]
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    // Uncheck every ZCL package
    cy.dataCy('zcl-package-checkbox').each(($el) => {
      if ($el.attr('aria-checked') === 'true') {
        cy.wrap($el).click({ force: true })
      }
    })
    // Uncheck every template package
    cy.get('[data-test="gen-template"]').each(($el) => {
      if ($el.attr('aria-checked') === 'true') {
        cy.wrap($el).click({ force: true })
      }
    })

    cy.contains(
      'internal packages used for testing will be loaded automatically'
    ).should('be.visible')
  })

  it('should warn about misaligned categories when ZCL and template selections differ', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: [zigbeeTemplatePkg, matterTemplatePkg]
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    // Select both ZCL packages
    cy.dataCy('zcl-package-checkbox').each(($el) => {
      if ($el.attr('aria-checked') !== 'true') {
        cy.wrap($el).click({ force: true })
      }
    })
    // Select only the Zigbee template (first one)
    cy.get('[data-test="gen-template"]').each(($el, index) => {
      const checked = $el.attr('aria-checked') === 'true'
      if (index === 0 && !checked) {
        cy.wrap($el).click({ force: true })
      } else if (index !== 0 && checked) {
        cy.wrap($el).click({ force: true })
      }
    })

    cy.contains(
      'Corresponding ZCL and Template packages are not enabled based on the same category'
    ).should('be.visible')
  })
})

// ---------------------------------------------------------------------------
// Only Zigbee template pre-loaded (multiprotocol context)
// ---------------------------------------------------------------------------
describe('Config loading – only Zigbee template pre-loaded (multiprotocol)', () => {
  it('should show config page with both ZCL packages but only Zigbee template', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: [zigbeeTemplatePkg]
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    cy.contains('Zigbee Cluster Library metadata').should('be.visible')
    cy.dataCy('zcl-package-checkbox').should('have.length', 2)

    cy.contains('Zap Generation Templates').should('be.visible')
    cy.get('[data-test="gen-template"]').should('have.length', 1)
  })

  it('should warn about misaligned categories when both ZCL selected but only Zigbee template exists', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: [zigbeeTemplatePkg]
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    // Select both ZCL packages
    cy.dataCy('zcl-package-checkbox').each(($el) => {
      if ($el.attr('aria-checked') !== 'true') {
        cy.wrap($el).click({ force: true })
      }
    })
    // Select the only available template (zigbee)
    cy.get('[data-test="gen-template"]').each(($el) => {
      if ($el.attr('aria-checked') !== 'true') {
        cy.wrap($el).click({ force: true })
      }
    })

    cy.contains(
      'Corresponding ZCL and Template packages are not enabled based on the same category'
    ).should('be.visible')
  })

  it('should not show multiprotocol warning when only Zigbee ZCL is selected', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: [zigbeeTemplatePkg]
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    // Select only the Zigbee ZCL package (first one)
    cy.dataCy('zcl-package-checkbox').each(($el, index) => {
      const checked = $el.attr('aria-checked') === 'true'
      if (index === 0 && !checked) {
        cy.wrap($el).click({ force: true })
      } else if (index !== 0 && checked) {
        cy.wrap($el).click({ force: true })
      }
    })

    cy.contains('multi-protocol').should('not.exist')
  })
})

// ---------------------------------------------------------------------------
// No templates pre-loaded (multiprotocol context)
// ---------------------------------------------------------------------------
describe('Config loading – no templates pre-loaded (multiprotocol)', () => {
  it('should show config page with both ZCL packages but empty template table', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: []
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    cy.contains('Zigbee Cluster Library metadata').should('be.visible')
    cy.dataCy('zcl-package-checkbox').should('have.length', 2)
    cy.contains('td', 'zigbee').should('exist')
    cy.contains('td', 'matter').should('exist')

    cy.contains('Zap Generation Templates').should('be.visible')
    cy.get('[data-test="gen-template"]').should('have.length', 0)
  })

  it('should display warning about internal fallback packages', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: []
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    cy.dataCy('zcl-package-checkbox').first().click({ force: true })

    cy.contains(
      'internal packages used for testing will be loaded automatically'
    ).should('be.visible')
  })

  it('should still show the submit button so user can proceed without templates', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: []
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    cy.get('[data-test="login-submit"]').should('be.visible')
  })
})

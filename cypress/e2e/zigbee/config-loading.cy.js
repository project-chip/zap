/// <reference types="cypress" />

/**
 * Config-loading tests that run in Zigbee mode.
 *
 * Scenario 2 – Only Zigbee template is pre-loaded.
 * Scenario 3 (zigbee part) – No templates are pre-loaded, verify Zigbee
 *   config still loads correctly.
 *
 * Lives under cypress/e2e/zigbee/ so it is included only when mode=zigbee.
 *
 * Auto-submit rules (ZapConfig.vue created()):
 *   The config page auto-submits when BOTH conditions are true:
 *     - zclPropertiesRow.length == 1  OR  matches zapFilePackages ZCL count
 *     - zclGenRow.length       == 1  OR  matches zapFilePackages template count
 *   To keep the config page open we must supply 2+ ZCL packages (and no
 *   zapFilePackages in the response).
 */

import {
  zigbeeZclPkg,
  matterZclPkg,
  zigbeeTemplatePkg,
  buildSessionAttemptResponse,
  stubConfigApis
} from '../../support/config-loading-helpers'

Cypress.on('uncaught:exception', () => false)

// ---------------------------------------------------------------------------
// Scenario 2 – Only Zigbee template pre-loaded
// ---------------------------------------------------------------------------
describe('Config loading – only Zigbee template pre-loaded', () => {
  it('should auto-submit when exactly one ZCL and one template are available', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg],
      zclGenTemplates: [zigbeeTemplatePkg]
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    // Single ZCL + single template → auto-submit → lands on main page
    cy.url().should('not.include', '/config')
  })

  it('should show config page with only Zigbee template when Matter ZCL is also loaded', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: [zigbeeTemplatePkg]
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    // Two ZCL packages but only one template → page stays open
    cy.contains('Zigbee Cluster Library metadata').should('be.visible')
    cy.contains('Zap Generation Templates').should('be.visible')

    // Only the zigbee template should be listed
    cy.get('[data-test="gen-template"]').should('have.length', 1)
  })

  it('should warn about misaligned categories when Matter ZCL is selected without a Matter template', () => {
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
})

// ---------------------------------------------------------------------------
// Scenario 3 (zigbee part) – No templates pre-loaded
// ---------------------------------------------------------------------------
describe('Config loading – no templates pre-loaded (zigbee)', () => {
  it('should auto-submit and bypass config page when single ZCL and no templates are available', () => {
    // 1 ZCL + 0 templates → auto-submit (length==1 passes first condition,
    // 0==0 passes second condition) → internal fallback packages are used
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg],
      zclGenTemplates: []
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    cy.url().should('not.include', '/config')
  })

  it('should show config page with no templates when multiple ZCL packages are loaded', () => {
    // 2 ZCL + 0 templates → config page stays open (length!=1 and no
    // zapFilePackages match)
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

    cy.contains('Zap Generation Templates').should('be.visible')
    cy.get('[data-test="gen-template"]').should('have.length', 0)
  })

  it('should display warning about internal fallback packages when no templates exist', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [zigbeeZclPkg, matterZclPkg],
      zclGenTemplates: []
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    // Select one ZCL but no templates are available → warning is shown
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

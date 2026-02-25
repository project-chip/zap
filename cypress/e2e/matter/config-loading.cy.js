/// <reference types="cypress" />

/**
 * Config-loading tests that run in Matter mode.
 *
 * Scenario 3 (matter part) – No templates are pre-loaded, verify Matter
 *   config still loads correctly.
 *
 * Lives under cypress/e2e/matter/ so it is included only when mode=matter.
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
  matterTemplatePkg,
  buildSessionAttemptResponse,
  stubConfigApis
} from '../../support/config-loading-helpers'

Cypress.on('uncaught:exception', () => false)

// ---------------------------------------------------------------------------
// Scenario 3 (matter part) – No templates pre-loaded
// ---------------------------------------------------------------------------
describe('Config loading – no templates pre-loaded (matter)', () => {
  it('should auto-submit and bypass config page when single ZCL and no templates are available', () => {
    // 1 ZCL + 0 templates → auto-submit (length==1 passes first condition,
    // 0==0 passes second condition) → internal fallback packages are used
    const body = buildSessionAttemptResponse({
      zclProperties: [matterZclPkg],
      zclGenTemplates: []
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    cy.url().should('not.include', '/config')
  })

  it('should show config page with no templates when multiple ZCL packages are loaded', () => {
    // 2 ZCL + 0 templates → config page stays open
    const body = buildSessionAttemptResponse({
      zclProperties: [matterZclPkg, zigbeeZclPkg],
      zclGenTemplates: []
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    cy.contains('Zigbee Cluster Library metadata').should('be.visible')
    cy.dataCy('zcl-package-checkbox').should('have.length', 2)
    cy.contains('td', 'matter').should('exist')

    cy.contains('Zap Generation Templates').should('be.visible')
    cy.get('[data-test="gen-template"]').should('have.length', 0)
  })

  it('should display warning about internal fallback packages when no templates exist', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [matterZclPkg, zigbeeZclPkg],
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
      zclProperties: [matterZclPkg, zigbeeZclPkg],
      zclGenTemplates: []
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    cy.get('[data-test="login-submit"]').should('be.visible')
  })

  it('should auto-submit when both ZCL and templates are completely empty', () => {
    // 0 ZCL + 0 templates → auto-submit (0==0 matches zapFilePackages
    // counts for both conditions)
    const body = buildSessionAttemptResponse({
      zclProperties: [],
      zclGenTemplates: []
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    cy.url().should('not.include', '/config')
  })
})

// ---------------------------------------------------------------------------
// Matter auto-submit – single package shortcut
// ---------------------------------------------------------------------------
describe('Config loading – Matter auto-submit', () => {
  it('should auto-submit when exactly one Matter ZCL and one template are available', () => {
    const body = buildSessionAttemptResponse({
      zclProperties: [matterZclPkg],
      zclGenTemplates: [matterTemplatePkg]
    })
    stubConfigApis(body)

    cy.visit('/')
    cy.wait('@sessionAttempt')

    // Single ZCL + single template → auto-submit → main page
    cy.url().should('not.include', '/config')
  })
})

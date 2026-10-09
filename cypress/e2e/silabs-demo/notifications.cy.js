/// <reference types="cypress" />

/**
 *
 *    Copyright (c) 2026 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

/**
 * Notifications tests for the silabs-demo ZCL package.
 *
 * This spec runs against the `silabsdemo-devserver` which mirrors exactly what
 * `npm run zap` does: a fresh ZAP server loaded with only the silabs-demo ZCL
 * and the standard Zigbee gen-template. The intent is to prove that a clean
 * standalone ZAP launch produces zero session and package notifications.
 *
 * Run with: npm run test:e2e-silabsdemo
 */

Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on unhandled app exceptions
  return false
})

describe('Silabs-demo ZCL: clean launch produces zero notifications', () => {
  before(() => {
    // Open a fresh session exactly as `npm run zap` would — the server was
    // started with --zcl ./zcl-builtin/silabs-demo/zcl.json so visiting '/'
    // creates a session backed by that ZCL package only.
    cy.visit('/')
    // Wait for the app to finish loading the ZCL packages before we open the
    // notifications drawer.
    cy.get('[data-cy="main-layout"]', { timeout: 15000 }).should('exist')
  })

  it('Session and package notifications are both empty on a fresh silabs-demo session', () => {
    // Spy-only intercepts (no stubbed response) so the real API results flow
    // through — this verifies the server genuinely returned zero notifications,
    // not merely that the UI renders correctly with mocked data.
    cy.intercept('GET', '/sessionNotification').as('getSessionNotifications')
    cy.intercept('GET', '/packageNotificationById/*').as(
      'getPackageNotifications'
    )

    cy.dataCy('btn-notifications').click()

    cy.wait('@getSessionNotifications')
    cy.wait('@getPackageNotifications')

    // Session table: Quasar renders "No data available" when the row list is empty.
    cy.contains('No data available').should('be.visible')

    // Package section heading must be present, but no expandable items
    // (each item is data-cy="package-notification-expansion").
    cy.contains('Package Notifications').should('be.visible')
    cy.dataCy('package-notification-expansion').should('not.exist')
  })
})

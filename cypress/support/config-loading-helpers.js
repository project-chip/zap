/**
 * Shared mock data and helpers for config-loading tests across all modes.
 */

// Mock ZCL property packages
export const zigbeeZclPkg = {
  id: 100,
  path: '/mock/zcl-zigbee.json',
  type: 'zcl-properties',
  category: 'zigbee',
  description: 'ZigbeePro test data',
  version: '1.0.0'
}

export const matterZclPkg = {
  id: 200,
  path: '/mock/zcl-matter.json',
  type: 'zcl-properties',
  category: 'matter',
  description: 'Matter test data',
  version: '1.0.0'
}

// Mock generation template packages
export const zigbeeTemplatePkg = {
  id: 101,
  path: '/mock/gen-templates-zigbee.json',
  type: 'gen-templates-json',
  category: 'zigbee',
  description: 'Zigbee gen templates',
  version: 'zigbee-test'
}

export const matterTemplatePkg = {
  id: 201,
  path: '/mock/gen-templates-matter.json',
  type: 'gen-templates-json',
  category: 'matter',
  description: 'Matter gen templates',
  version: 'matter-test'
}

/**
 * Build the response body that the sessionAttempt endpoint returns.
 */
export function buildSessionAttemptResponse({
  zclProperties = [],
  zclGenTemplates = [],
  filePath = '',
  open = false,
  sessions = []
} = {}) {
  return { zclProperties, zclGenTemplates, sessions, filePath, open }
}

/**
 * Stubs the POST /zcl/sessionAttempt endpoint (and follow-up calls) so
 * ZapConfig.vue receives exactly the packages we specify.
 */
export function stubConfigApis(sessionAttemptBody) {
  cy.intercept('POST', '**/zcl/sessionAttempt*', {
    statusCode: 200,
    body: sessionAttemptBody
  }).as('sessionAttempt')

  cy.intercept('POST', '**/sessionCreate*', {
    statusCode: 200,
    body: { message: 'Session created successfully' }
  }).as('sessionCreate')

  cy.intercept('GET', '**/packageNotification*', {
    statusCode: 200,
    body: []
  }).as('packageNotification')

  cy.intercept('POST', '**/ide/open*', {
    statusCode: 200,
    body: { message: 'ok' }
  }).as('ideOpen')
}

const rendApi = require('../../src-shared/rend-api.js')
const _ = require('lodash')

Cypress.Commands.add('addEndpoint', (name) => {
  cy.get('[data-test="add-new-endpoint"]').click()
  cy.get('[data-test="select-endpoint-input"]')
    .click()
    .type(name.substring(0, 5), { force: true })
  cy.wait(1000)
  cy.get('.q-menu').contains(name).click({ force: true })
  cy.get('[data-test="endpoint-title"]').click() // it makes sure that the previous input field has been unselected
  cy.get('button').contains('Create').click()
})

// create an endpoint on given name and go to its cluster view
// if no extra parameters are given, it will go to the first cluster under the 'General' domain
Cypress.Commands.add(
  'createEndpointAndGoToClusterByIndex',
  (endpoint, nth = 0, domain = 'General') => {
    if (endpoint) cy.addEndpoint(endpoint)

    // Find the domain and expand it
    cy.contains('div', domain).should('exist').click({ force: true })

    // Find the nth cluster row and click its configure button to go to the cluster view
    cy.get('[data-test="configure-cluster-button"]')
      .eq(nth)
      .should('exist')
      .click({ force: true })
  }
)

// go to a specific cluster under a domain by given name
Cypress.Commands.add('goToClusterByName', (clusterName, domain = 'General') => {
  // Find the domain and expand it
  cy.contains('div', domain).should('exist').click({ force: true })

  // Find the cluster row by name, then click its configure button to go to the cluster view
  cy.contains('tr', clusterName)
    .find('[data-test="configure-cluster-button"]')
    .should('exist')
    .click({ force: true })
})

// only use the following commands while in the cluster view
Cypress.Commands.add('goToAttributesTabFromClusterView', () => {
  cy.contains('.q-tab', 'Attributes').click()
})

Cypress.Commands.add('goToAttributeReportingTabFromClusterView', () => {
  cy.contains('.q-tab', 'Attribute Reporting').click()
})

Cypress.Commands.add('goToCommandsTabFromClusterView', () => {
  cy.contains('.q-tab', 'Commands').click()
})

Cypress.Commands.add('goToEventsTabFromClusterView', () => {
  cy.contains('.q-tab', 'Events').click()
})

Cypress.Commands.add('goToFeaturesTabFromClusterView', () => {
  cy.contains('.q-tab', 'Features').click()
})

Cypress.Commands.add('rendererApi', (...args) => {
  cy.window().then(function (window) {
    const log = Cypress.log({
      name: 'rendererApi',
      displayName: 'RendererApi',
      message: [`🚀 ${args[0]}(${args.slice(1)})`]
    })

    log.snapshot('before')
    window[rendApi.GLOBAL_SYMBOL_EXECUTE].apply(null, args)
    log.snapshot('after')
  })
})

Cypress.Commands.add('setZclProperties', () => {
  cy.get('body').then(($body) => {
    // The above doesn't work. It does find the buttons, even
    // if they are hidden, obviously....
    /*if ($body.find('[data-test="gen-template"]').length) {
      // These should happen if the selection page is shown
      cy.get('[data-test="gen-template"]').click()
      cy.get('[data-test="login-submit"]').click()
    } else {
      // These happen if selection page is not shown
      cy.get('[data-test="gen-template"]').should('not.exist')
      cy.get('[data-test="login-submit"]').should('not.exist')
    }*/
  })
})

Cypress.Commands.add('dataCy', (selector) => {
  cy.get(`[data-cy=${selector}]`)
})

// Check the value of feature map attribute on top of the cluster feature table
Cypress.Commands.add('checkFeatureMapValue', (featureMapAttribute) => {
  cy.get('[data-test="feature-map-value"]').should(
    'have.text',
    featureMapAttribute.value
  )
  cy.get('[data-test="feature-map-binary"]').should(
    'have.text',
    featureMapAttribute.binary
  )
})

// Find a feature by name, check its information, and toggle it
Cypress.Commands.add('checkAndEnableFeature', (feature) => {
  cy.contains('[data-test="feature-row"]', feature.name).within(() => {
    cy.get('[data-test="feature-name"]').should('have.text', feature.name)
    cy.get('[data-test="feature-code"]').should('have.text', feature.code)
    cy.get('[data-test="feature-conformance"]').should(
      'have.text',
      feature.conformance
    )
    cy.get('[data-test="feature-bit"]').should('have.text', feature.bit)
    cy.get('[data-test="feature-toggle"]')
      .should('exist')
      .click({ force: true })
  })
})

// Check a list of attributes, commands, or events in the feature update dialog
Cypress.Commands.add('checkElementsToUpdate', (elements, type, action) => {
  let expected = elements.map((el) => `${action} ${el}`)
  if (elements && elements.length > 0) {
    cy.get(`[data-test="${type}-to-update"]`)
      .find('li')
      .should('have.length', elements.length)
      .each(($li) => {
        expect(expected).to.include($li.text().trim())
      })
  }
})

// Check all elements to update in the feature update dialog
Cypress.Commands.add(
  'checkElementsToUpdateDialog',
  ({ attributes = [], commands = [], events = [], action }) => {
    cy.get('[data-test="feature-update-dialog"]').should('be.visible')

    cy.checkElementsToUpdate(attributes, 'attributes', action)
    cy.checkElementsToUpdate(commands, 'commands', action)
    cy.checkElementsToUpdate(events, 'events', action)
  }
)

// Check the enabled state of given attributes, commands, and events in the cluster view
Cypress.Commands.add(
  'checkEnabledStateOfElements',
  ({ attributes = [], commands = [], events = [], action }) => {
    let enabled = action === 'enable' ? 'true' : 'false'

    cy.goToAttributesTabFromClusterView()
    if (attributes && attributes.length > 0) {
      attributes.forEach((attr) => {
        cy.get(
          `[data-test="attribute-toggle"][attribute-name="${attr}"]`
        ).should('have.attr', 'aria-checked', enabled)
      })
    }
    cy.goToCommandsTabFromClusterView()
    if (commands && commands.length > 0) {
      commands.forEach((cmd) => {
        // for ease of testing, only cover inward commands
        cy.get(
          `[data-test="in-command-checkbox"][command-name="${cmd}"]`
        ).should('have.attr', 'aria-checked', enabled)
      })
    }
    cy.goToEventsTabFromClusterView()
    if (events && events.length > 0) {
      events.forEach((evt) => {
        cy.get(`[data-test="event-toggle"][event-name="${evt}"]`).should(
          'have.attr',
          'aria-checked',
          enabled
        )
      })
    }
  }
)

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

Cypress.Commands.add('gotoAttributePage', (endpoint, cluster, nth = 0) => {
  if (endpoint) cy.addEndpoint(endpoint)
  cy.get('[data-test="Cluster"]').should('contain', cluster)
  cy.get('div').contains(cluster).click({ force: true })
  cy.wait(1000)
  cy.get(
    `#${cluster} > .q-expansion-item__container > .q-expansion-item__content  >  .q-card > .q-card__section > .row > .q-table__container > .q-table__middle > .q-table > tbody > :nth-child(1) > :nth-child(7)  >  .q-btn `
  )
    .eq(nth)
    .click({ force: true })
})

Cypress.Commands.add('gotoAttributesTab', () => {
  cy.get(':nth-child(1) > .q-tab__content').click()
})

Cypress.Commands.add('gotoAttributeReportingTab', () => {
  cy.get(':nth-child(2) > .q-tab__content').click()
})

Cypress.Commands.add('gotoCommandsTab', () => {
  cy.get(':nth-child(3) > .q-tab__content').click()
})

Cypress.Commands.add('rendererApi', (...args) => {
  cy.window().then(function (window) {
    const log = Cypress.log({
      name: 'rendererApi',
      displayName: 'RendererApi',
      message: [`🚀 ${args[0]}(${args.slice(1)})`],
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

Cypress.Commands.add('addEndpoint', (name) => {
  cy.get('button').contains('Add New Endpoint').click()
  cy.get(
    '.q-form > .q-select > .q-field__inner > .q-field__control > .q-field__control-container'
  ).click()
  cy.get('div').contains(name).click()
  cy.get('button').contains('Create').click()
})

Cypress.Commands.add('gotoAttributePage', (endpoint, cluster) => {
  if (endpoint) cy.addEndpoint(endpoint)
  cy.get('.q-page-container > div').children().should('contain', cluster)
  cy.get('div').contains(cluster).click()
  cy.get(`#${cluster} > .q-expansion-item__container > .q-expansion-item__content > :nth-child(1) > .q-table__container > .q-table__middle > .q-table > tbody > .text-weight-bolder > :nth-child(7) > .q-btn > .q-btn__wrapper > .q-btn__content > .notranslate`).click({force: true})
})

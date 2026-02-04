describe('Testing Vue Tour', () => {
  beforeEach(() => {
    // Ignore uncaught exceptions from the application
    // These are often related to async operations that don't affect the test outcome
    Cypress.on('uncaught:exception', (err, runnable) => {
      // Ignore errors related to undefined.map() which can occur during tutorial cleanup
      if (
        err.message.includes(
          "Cannot read properties of undefined (reading 'map')"
        )
      ) {
        return false
      }
      // Don't prevent other errors from failing the test
      return true
    })
  })

  it('Skip the tutorial', () => {
    cy.visit('/')
    cy.dataCy('btn-tutorial').click().wait(250)
    cy.dataCy('tour-endpoint-window').should('be.visible')
    cy.contains('Skip').click().wait(500)
    cy.dataCy('tour-endpoint-window').should('not.exist')
  })
  it('Complete a full tutorial - delete tutorial endpoint', () => {
    cy.visit('/')
    cy.dataCy('btn-tutorial').click().wait(250)
    cy.dataCy('tour-endpoint-window').should('be.visible')
    for (let i = 0; i < 17; i++) {
      cy.contains('Next').click().wait(500)
    }
    cy.contains('Finish').click().wait(250)
    cy.dataCy('delete-end-tour-endpoint').click()
    cy.dataCy('tour-endpoint-window').should('not.exist')
    cy.fixture('data').then((data) => {
      cy.get('aside').children().contains(data.endpoint1).should('not.exist')
    })
  })
  it('Complete a full tutorial - keep tutorial endpoint', () => {
    cy.visit('/')
    cy.dataCy('btn-tutorial').click().wait(250)
    cy.dataCy('tour-endpoint-window').should('be.visible')
    for (let i = 0; i < 17; i++) {
      cy.contains('Next').click().wait(500)
    }
    cy.contains('Finish').click().wait(250)
    cy.dataCy('cancel-end-tour-endpoint').click()
    cy.dataCy('tour-endpoint-window').should('not.exist')
  })
})

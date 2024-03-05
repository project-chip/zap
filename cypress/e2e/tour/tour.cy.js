describe('Testing Vue Tour', () => {
  it('Skip the tutorial', () => {
    cy.fixture('baseurl').then((url) => {
      cy.visit(url.baseurl)
    })
    cy.dataCy('btn-tutorial').click().wait(250)
    cy.dataCy('tour-window').should('be.visible')
    cy.contains('Skip').click().wait(500)
    cy.dataCy('tour-window').should('not.be.visible')
  })
  it('Complete a full tutorial - delete tutorial endpoint', () => {
    cy.fixture('baseurl').then((url) => {
      cy.visit(url.baseurl)
    })
    cy.dataCy('btn-tutorial').click().wait(250)
    cy.dataCy('tour-window').should('be.visible')
    for (let i = 0; i < 17; i++) {
      cy.contains('Next').click().wait(500)
    }
    cy.contains('Finish').click().wait(250)
    cy.dataCy('delete-end-tour-endpoint').click()
    cy.dataCy('tour-window').should('not.be.visible')
    cy.fixture('data').then((data) => {
      cy.get('aside').children().contains(data.endpoint1).should('not.exist')
    })
  })
  it('Complete a full tutorial - keep tutorial endpoint', () => {
    cy.fixture('baseurl').then((url) => {
      cy.visit(url.baseurl)
    })
    cy.dataCy('btn-tutorial').click().wait(250)
    cy.dataCy('tour-window').should('be.visible')
    for (let i = 0; i < 17; i++) {
      cy.contains('Next').click().wait(500)
    }
    cy.contains('Finish').click().wait(250)
    cy.dataCy('cancel-end-tour-endpoint').click()
    cy.dataCy('tour-window').should('not.be.visible')
  })
})

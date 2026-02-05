/// <reference types="cypress" />

describe('CMP Tutorial (multiprotocol)', () => {
  let cmpTutorialNextClicks = 0

  before(() => {
    // Derive "Next" click count from tutorial configuration
    cy.readFile('src/tutorials/cmpTutorialConfig.json').then((cfg) => {
      const steps = Array.isArray(cfg?.tutorialSteps) ? cfg.tutorialSteps : []
      cmpTutorialNextClicks = Math.max(0, steps.length - 1)
    })
  })

  beforeEach(() => {
    // Ignore uncaught exceptions from the application
    Cypress.on('uncaught:exception', (err) => {
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
    if (Cypress.env('mode') !== Cypress.Mode.multiprotocol) {
      return
    }
  })

  // eslint-disable-next-line require-jsdoc
  function openCmpTutorial() {
    cy.visit('/')
    cy.setMultiprotocolZclProperties()
    cy.wait(2000)
    // In multiprotocol mode, tutorial is a dropdown (Endpoint + CMP)
    cy.dataCy('btn-tutorial-dropdown')
      .should('be.visible')
      .click({ force: true })
    cy.dataCy('btn-tutorial-cmp').should('be.visible').click({ force: true })

    cy.dataCy('tour-cmp-window').should('be.visible')
  }

  it('Skip the CMP tutorial', () => {
    openCmpTutorial()

    cy.contains('Skip').click().wait(500)
    cy.dataCy('tour-cmp-window').should('not.exist')
  })

  it('Complete a full CMP tutorial', () => {
    openCmpTutorial()

    for (let i = 0; i < cmpTutorialNextClicks; i++) {
      cy.contains('Next').click()
    }

    cy.contains('Finish').click().wait(500)
    cy.dataCy('tour-cmp-window').should('not.exist')
  })
})

/// <reference types="cypress" />

// Keep this in sync with `src/tutorials/cmpTutorialConfig.json` tutorialSteps length.
// The CMP tutorial currently has 16 steps, so we need 15 "Next" clicks before "Finish".
const CMP_TUTORIAL_NEXT_CLICKS = 15

describe('CMP Tutorial (multiprotocol)', () => {
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
    if (Cypress.env('mode') !== 'multiprotocol') {
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

    for (let i = 0; i < CMP_TUTORIAL_NEXT_CLICKS; i++) {
      cy.contains('Next').click()
    }

    cy.contains('Finish').click().wait(500)
    cy.dataCy('tour-cmp-window').should('not.exist')
  })
})

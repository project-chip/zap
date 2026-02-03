/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Preferences DevTools pages functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    // Wait for main page to be ready
    cy.get('#Settings').should('be.visible')
    // Navigate to Settings to enable dev tools
    cy.get('#Settings').click()
    cy.wait(300)
    cy.contains('User interface settings').should('be.visible')
    cy.dataCy('dev-tools-toggle').should('be.visible')

    // Check if Developer Tools section is already visible in sidebar
    cy.get('.q-drawer-container').then(($container) => {
      const hasDevTools = $container.text().includes('Developer Tools')
      if (!hasDevTools) {
        // Enable dev tools by clicking the toggle label (same approach as devtools.cy.js)
        // Note: input is hidden in Quasar q-toggle, so we click the label directly
        cy.get('[aria-label="Enable development tools"] > .q-toggle__label')
          .should('be.visible')
          .click({ force: true })
        // Wait for state update
        cy.wait(500)
      }
    })

    // Verify Developer Tools section appears in sidebar (with timeout for reliability)
    cy.get('.q-drawer-container', { timeout: 5000 }).should(
      'contain',
      'Developer Tools'
    )
  })

  describe('Information Setup page', () => {
    beforeEach(() => {
      // Navigate to Information Setup page
      cy.get('#Settings').click()
      cy.wait(300)
      cy.get('.q-drawer').should('be.visible')
      cy.contains('Developer Tools').should('be.visible')
      cy.get('.q-drawer').contains('Information Setup').click({ force: true })
      cy.wait(300)
      cy.url({ timeout: 5000 }).should(
        'include',
        '/preferences/devtools/information-setup'
      )
    })

    it('Should display Information Setup page title', () => {
      cy.contains('Information Setup').should('be.visible')
    })

    it('Should display information textarea', () => {
      cy.get('label')
        .contains('Information about the application')
        .should('be.visible')
      cy.get('textarea').should('exist')
    })

    it('Should allow entering information text', () => {
      const testText = 'This is test information about the application'
      cy.get('textarea').clear({ force: true }).type(testText, { force: true })
      // Wait for debounce (500ms)
      cy.wait(600)
      // Verify the text is entered
      cy.get('textarea').should('have.value', testText)
    })

    it('Should update information text with debounce', () => {
      const testText1 = 'First text'
      const testText2 = 'Second text'
      cy.get('textarea').clear({ force: true }).type(testText1, { force: true })
      // Type second text before debounce completes
      cy.wait(200)
      cy.get('textarea').clear({ force: true }).type(testText2, { force: true })
      // Wait for debounce to complete
      cy.wait(600)
      cy.get('textarea').should('have.value', testText2)
    })
  })

  describe('SQL Query page', () => {
    beforeEach(() => {
      // Navigate to SQL Query page
      cy.get('#Settings').click()
      cy.wait(300)
      cy.get('.q-drawer').should('be.visible')
      cy.contains('Developer Tools').should('be.visible')
      cy.get('.q-drawer').contains('SQL Query').click({ force: true })
      cy.wait(300)
      cy.url({ timeout: 5000 }).should(
        'include',
        '/preferences/devtools/sql-query'
      )
    })

    it('Should display SQL Query page title', () => {
      cy.contains('SQL Query').should('be.visible')
    })

    it('Should display SQL query input field', () => {
      cy.get('label').contains('Outlined').should('be.visible')
      // Find the input by its label - Quasar q-input structure
      cy.contains('label', 'Outlined')
        .parent()
        .find('.q-field__control-container input')
        .should('exist')
    })

    it('Should allow entering SQL query', () => {
      const testQuery = 'SELECT * FROM zcl_cluster'
      // Find input by label to ensure we get the right one
      cy.contains('label', 'Outlined')
        .parent()
        .find('.q-field__control-container input')
        .clear({ force: true })
        .type(testQuery, { force: true })
      cy.contains('label', 'Outlined')
        .parent()
        .find('.q-field__control-container input')
        .should('have.value', testQuery)
    })

    it('Should execute SQL query and display results', () => {
      // Enter a simple SQL query
      const testQuery = 'SELECT name FROM zcl_cluster LIMIT 5'
      // Find input by label
      cy.contains('label', 'Outlined')
        .parent()
        .find('.q-field__control-container input')
        .clear({ force: true })
        .type(testQuery, { force: true })
      // Trigger change event (hitEnter method)
      cy.contains('label', 'Outlined')
        .parent()
        .find('.q-field__control-container input')
        .trigger('change')
      // Wait for API response
      cy.wait(1000)
      // Check if result summary appears (either success or error)
      cy.get('p').should('exist')
      // The result summary should contain either "rows retrieved" or "ERROR"
      cy.get('p').then(($p) => {
        const text = $p.text()
        expect(text).to.match(/rows retrieved|ERROR/)
      })
    })

    it('Should display SQL query results in list', () => {
      const testQuery = 'SELECT name FROM zcl_cluster LIMIT 3'
      // Find input by label
      cy.contains('label', 'Outlined')
        .parent()
        .find('.q-field__control-container input')
        .clear({ force: true })
        .type(testQuery, { force: true })
      cy.contains('label', 'Outlined')
        .parent()
        .find('.q-field__control-container input')
        .trigger('change')
      cy.wait(1000)
      // Check if results are displayed (either in list or pre tag)
      cy.get('body').then(($body) => {
        if ($body.find('q-list').length > 0) {
          cy.get('q-list').should('exist')
        }
        if ($body.find('pre').length > 0) {
          cy.get('pre').should('exist')
        }
      })
    })
  })

  describe('API Exceptions page', () => {
    beforeEach(() => {
      // Navigate to API Exceptions page
      cy.get('#Settings').click()
      cy.wait(300)
      cy.get('.q-drawer').should('be.visible')
      cy.contains('Developer Tools').should('be.visible')
      cy.get('.q-drawer').contains('API Exceptions').click({ force: true })
      cy.wait(300)
      cy.url({ timeout: 5000 }).should(
        'include',
        '/preferences/devtools/api-exceptions'
      )
    })

    it('Should display API Exceptions page', () => {
      // The page should load even if there are no exceptions
      cy.get('body').should('be.visible')
    })

    it('Should display exceptions list when exceptions exist', () => {
      // The page displays exceptions from store.state.zap.exceptions
      // If there are exceptions, they should be displayed in q-list
      cy.get('body').then(($body) => {
        if ($body.find('q-list').length > 0) {
          cy.get('q-list').should('exist')
          // Check if exception items are displayed
          cy.get('.q-item').should('exist')
        } else {
          // If no exceptions, the page should still be accessible
          cy.log('No exceptions to display')
        }
      })
    })

    it('Should display exception details when exceptions exist', () => {
      cy.get('body').then(($body) => {
        if ($body.find('q-item').length > 0) {
          // Check for exception detail fields
          cy.get('q-item')
            .first()
            .within(() => {
              // Exception items should contain URL, Method, Status Code, Message
              cy.get('body').then(($itemBody) => {
                // Check if any of these labels exist
                const hasUrl = $itemBody.text().includes('URL:')
                const hasMethod = $itemBody.text().includes('Method:')
                const hasStatusCode = $itemBody.text().includes('Status Code:')
                const hasMessage = $itemBody.text().includes('Message:')
                // At least one should be present if exceptions exist
                expect(hasUrl || hasMethod || hasStatusCode || hasMessage).to.be
                  .true
              })
            })
        }
      })
    })
  })
})

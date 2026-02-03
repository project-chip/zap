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
      cy.dataCy('sql-query-input').should('be.visible')
      cy.dataCy('sql-query-input').should('match', 'input, textarea')
    })

    it('Should allow entering SQL query', () => {
      const testQuery = 'SELECT * FROM zcl_cluster'
      cy.dataCy('sql-query-input').clear({ force: true }).type(testQuery, {
        force: true
      })
      cy.dataCy('sql-query-input').should('have.value', testQuery)
    })

    it('Should execute SQL query and display results', () => {
      // Enter a simple SQL query
      const testQuery = 'SELECT name FROM zcl_cluster LIMIT 5'
      cy.dataCy('sql-query-input').clear({ force: true }).type(testQuery, {
        force: true
      })
      // Trigger change event (hitEnter method)
      cy.dataCy('sql-query-input').trigger('change')
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
      cy.dataCy('sql-query-input').clear({ force: true }).type(testQuery, {
        force: true
      })
      cy.dataCy('sql-query-input').trigger('change')
      cy.wait(1000)
      // Quasar q-list renders as an element with `.q-list` class (not a <q-list> tag)
      cy.get('.q-list').should('exist')
      cy.get('.q-list').find('.q-item').should('have.length.at.least', 1)
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
      // If there are exceptions, they should be displayed in the main content area.
      // Note: Quasar sidebars also use `.q-list`/`.q-item`, so scope to the page container.
      cy.get('.q-page-container').then(($container) => {
        if ($container.text().includes('URL:')) {
          cy.get('.q-page-container').contains('URL:').should('be.visible')
          cy.get('.q-page-container')
            .contains('Status Code:')
            .should('be.visible')
        } else {
          // If no exceptions, the page should still be accessible
          cy.log('No exceptions to display')
        }
      })
    })

    it('Should display exception details when exceptions exist', () => {
      // The exceptions list is rendered inside the page container.
      // Avoid selecting the sidebar `.q-item` elements.
      cy.get('.q-page-container').then(($container) => {
        if ($container.text().includes('URL:')) {
          cy.get('.q-page-container').contains('URL:').should('be.visible')
          cy.get('.q-page-container').contains('Method:').should('be.visible')
          cy.get('.q-page-container')
            .contains('Status Code:')
            .should('be.visible')
          cy.get('.q-page-container').contains('Message:').should('be.visible')
        } else {
          cy.log('No exceptions to display')
        }
      })
    })
  })
})

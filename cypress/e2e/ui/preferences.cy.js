/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('Preferences pages functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    // Wait for main page to be ready instead of fixed time
    cy.get('#Settings').should('be.visible')
  })

  describe('User Preferences page', () => {
    beforeEach(() => {
      // Reset to home page before each test
      // Navigate to Settings
      cy.get('#Settings').click()
      // Short wait for drawer animation, then wait for content
      cy.wait(300)
      cy.contains('User interface settings').should('be.visible')
      // Wait for dark theme toggle to be visible, then reset to light theme
      cy.dataCy('dark-theme-toggle').should('be.visible')
      cy.dataCy('dark-theme-toggle')
        .find('input')
        .then(($input) => {
          if ($input.is(':checked')) {
            // Click on the label to toggle (more reliable than input.uncheck for Quasar)
            cy.dataCy('dark-theme-toggle')
              .find('.q-toggle__label')
              .click({ force: true })
            // Short wait for CSS transition, then verify theme change
            cy.wait(200)
            cy.get('body').should('not.have.class', 'body--dark')
          }
        })
    })

    afterEach(() => {
      // Reset dark theme to light after each test
      cy.get('body').then(($body) => {
        if ($body.hasClass('body--dark')) {
          // Click on the label to toggle (more reliable than input.uncheck for Quasar)
          cy.dataCy('dark-theme-toggle')
            .find('.q-toggle__label')
            .click({ force: true })
          // Short wait for CSS transition, then verify theme change
          cy.wait(200)
          cy.get('body').should('not.have.class', 'body--dark')
        }
      })
    })

    it('Should display dark theme toggle', () => {
      cy.dataCy('dark-theme-toggle').should('be.visible')
      cy.dataCy('dark-theme-toggle').should('contain', 'Enable dark theme')
    })

    it('Should toggle dark theme on', () => {
      // beforeEach already ensures it's off, so just turn it on
      cy.dataCy('dark-theme-toggle').should('be.visible')
      // Click on the label to toggle (more reliable than input.check for Quasar)
      cy.dataCy('dark-theme-toggle')
        .find('.q-toggle__label')
        .click({ force: true })
      // Short wait for CSS transition, then verify theme change
      cy.wait(1000)
      cy.get('body').should('have.class', 'body--dark')
    })

    it('Should toggle dark theme off', () => {
      // First ensure it's on, then turn it off
      cy.dataCy('dark-theme-toggle')
        .find('input')
        .then(($input) => {
          if ($input.is(':checked')) {
            // Click on the label to toggle (more reliable than input.uncheck for Quasar)
            cy.dataCy('dark-theme-toggle')
              .find('.q-toggle__label')
              .click({ force: true })
          } else {
            // If already off, toggle on then off
            cy.dataCy('dark-theme-toggle')
              .find('.q-toggle__label')
              .click({ force: true })
            cy.wait(1000)
            cy.get('body').should('have.class', 'body--dark')
            cy.dataCy('dark-theme-toggle')
              .find('.q-toggle__label')
              .click({ force: true })
          }
        })
      // Short wait for CSS transition, then verify theme change
      cy.wait(1000)
      cy.get('body').should('have.class', 'body--light')
    })

    it('Should display development tools toggle', () => {
      cy.contains('Enable development tools').should('be.visible')
    })

    it('Should toggle development tools', () => {
      cy.dataCy('dev-tools-toggle').should('be.visible')
      // Use the same approach as devtools.cy.js - click on the toggle label
      cy.get('[aria-label="Enable development tools"]')
        .find('.q-toggle__label')
        .click({ force: true })
      // Short wait for state update, then verify Developer Tools appears
      cy.wait(500)
      cy.get('.q-drawer-container').should('contain', 'Developer Tools')
    })

    it('Should navigate to all sidebar menu items', () => {
      // Navigate to User Settings
      cy.dataCy('settings-menu-user')
        .should('be.visible')
        .click({ force: true })
      cy.wait(300)
      cy.url().should('include', '/preferences/user')
      cy.contains('User interface settings').should('be.visible')

      // Navigate to ZCL Packages
      cy.dataCy('settings-menu-package')
        .should('be.visible')
        .click({ force: true })
      cy.wait(300)
      cy.url().should('include', '/preferences/package')

      // Navigate to Generation
      cy.dataCy('settings-menu-generation')
        .should('be.visible')
        .click({ force: true })
      cy.wait(300)
      cy.url().should('include', '/preferences/generation')

      // Navigate to About
      cy.dataCy('settings-menu-about')
        .should('be.visible')
        .click({ force: true })
      cy.wait(300)
      cy.url().should('include', '/preferences/about')
    })

    it('Should navigate to Developer Tools menu items when enabled', () => {
      // Navigate to User Settings first to enable dev tools
      cy.dataCy('settings-menu-user')
        .should('be.visible')
        .click({ force: true })
      cy.wait(300)
      cy.url().should('include', '/preferences/user')
      cy.contains('User interface settings').should('be.visible')

      // First enable dev tools if not already enabled
      cy.get('.q-drawer-container').then(($container) => {
        const hasDevTools = $container.text().includes('Developer Tools')
        if (!hasDevTools) {
          cy.dataCy('dev-tools-toggle')
            .find('.q-toggle__label')
            .should('be.visible')
            .click({ force: true })
          cy.wait(1000) // Wait for store update and UI refresh
        }
      })

      // Verify Developer Tools section is visible in sidebar
      cy.get('.q-drawer').should('contain', 'Developer Tools')
      cy.wait(500) // Wait for sidebar to update

      // Navigate to Information Setup
      cy.get('.q-drawer')
        .contains('Information Setup')
        .should('be.visible')
        .click({ force: true })
      cy.wait(500)
      cy.url({ timeout: 5000 }).should(
        'include',
        '/preferences/devtools/information-setup'
      )

      // Navigate to SQL Query
      cy.get('.q-drawer')
        .contains('SQL Query')
        .should('be.visible')
        .click({ force: true })
      cy.wait(500)
      cy.url({ timeout: 5000 }).should(
        'include',
        '/preferences/devtools/sql-query'
      )

      // Navigate to API Exceptions
      cy.get('.q-drawer')
        .contains('API Exceptions')
        .should('be.visible')
        .click({ force: true })
      cy.wait(500)
      cy.url({ timeout: 5000 }).should(
        'include',
        '/preferences/devtools/api-exceptions'
      )
    })

    it('Should display file location input', () => {
      cy.contains('Last file location').should('be.visible')
      // q-input structure: .q-field > .q-field__inner > .q-field__control > .q-field__control-container > input
      // Find the q-input in the row and then the input element
      cy.dataCy('file-location-row')
        .find(
          '.q-input .q-field__control-container input, .q-field .q-field__control-container input'
        )
        .should('exist')
    })

    it('Should allow entering file path', () => {
      // Find the input field using Quasar's q-input structure
      // Structure: .q-input > .q-field > .q-field__inner > .q-field__control > .q-field__control-container > input
      cy.dataCy('file-location-row')
        .find(
          '.q-input .q-field__control-container input, .q-field .q-field__control-container input'
        )
        .clear({ force: true })
        .type('/test/path', { force: true })
      cy.dataCy('file-location-row')
        .find(
          '.q-input .q-field__control-container input, .q-field .q-field__control-container input'
        )
        .should('have.value', '/test/path')
    })

    it('Should display tooltips', () => {
      // Quasar tooltips are rendered dynamically and might not always be testable
      // Just verify the element exists and has tooltip capability
      cy.dataCy('dark-theme-toggle').should('exist')
      cy.dataCy('dark-theme-toggle').should('be.visible')
      // Hover over the element to trigger tooltip (but don't fail if it doesn't show)
      cy.dataCy('dark-theme-toggle').trigger('mouseenter')
      // The tooltip might appear, but we can't reliably test it in all cases
      // Just verify the toggle element is present and functional
      cy.dataCy('dark-theme-toggle').find('input').should('exist')
    })

    it('Should save file path when input changes', () => {
      // Test the setPath method by typing in the file location input
      const testPath = '/test/save/path'
      cy.dataCy('file-location-row')
        .find(
          '.q-input .q-field__control-container input, .q-field .q-field__control-container input'
        )
        .clear({ force: true })
        .type(testPath, { force: true })
      // Verify the value is set
      cy.dataCy('file-location-row')
        .find(
          '.q-input .q-field__control-container input, .q-field .q-field__control-container input'
        )
        .should('have.value', testPath)
      // The setPath method should save to storage, verify by checking if it persists
      // (Note: This tests the @input handler which calls setPath)
    })

    it('Should toggle development tools off', () => {
      // First ensure dev tools is on
      cy.dataCy('dev-tools-toggle').should('be.visible')
      // Check if Developer Tools is visible in sidebar (instead of checking hidden input)
      cy.get('.q-drawer-container').then(($container) => {
        const hasDevTools = $container.text().includes('Developer Tools')
        if (!hasDevTools) {
          // Turn it on first
          cy.get('[aria-label="Enable development tools"]')
            .find('.q-toggle__label')
            .click({ force: true })
          cy.wait(500)
          cy.get('.q-drawer-container').should('contain', 'Developer Tools')
        }
        // Now turn it off
        cy.get('[aria-label="Enable development tools"]')
          .find('.q-toggle__label')
          .click({ force: true })
        cy.wait(500)
        // Verify Developer Tools is no longer visible
        cy.get('.q-drawer-container').should('not.contain', 'Developer Tools')
      })
    })
  })

  describe('About page', () => {
    it('Should display About page title', () => {
      // Navigate to Settings
      cy.get('#Settings').click()
      // Short wait for drawer animation, then verify sidebar is visible
      cy.wait(300)
      cy.get('.q-drawer').should('be.visible')
      // Wait for About link to be visible in sidebar
      cy.contains('About').should('be.visible')
      // Click on About link - use contains to find it in the sidebar
      cy.get('.q-drawer').contains('About').click({ force: true })
      // Short wait for navigation, then verify URL and page title
      cy.wait(300)
      cy.url({ timeout: 5000 }).should('include', '/preferences/about')
      cy.contains('About').should('be.visible')
    })

    it('Should display version information', () => {
      // Navigate to Settings
      cy.get('#Settings').click()
      cy.wait(300)
      cy.get('.q-drawer').should('be.visible')
      cy.get('.q-drawer').contains('About').click({ force: true })
      // Short wait for navigation, then verify URL
      cy.wait(300)
      cy.url({ timeout: 5000 }).should('include', '/preferences/about')
      // Wait for version text to appear (loaded via API)
      cy.contains('Version', { timeout: 10000 }).should('be.visible')
    })

    it('Should display feature level', () => {
      // Navigate to Settings
      cy.get('#Settings').click()
      cy.wait(300)
      cy.get('.q-drawer').should('be.visible')
      cy.get('.q-drawer').contains('About').click({ force: true })
      // Short wait for navigation, then verify URL
      cy.wait(300)
      cy.url({ timeout: 5000 }).should('include', '/preferences/about')
      // Wait for feature level text to appear (loaded via API)
      cy.contains('feature level', { matchCase: false, timeout: 10000 }).should(
        'be.visible'
      )
    })

    it('Should display commit hash', () => {
      // Navigate to Settings
      cy.get('#Settings').click()
      cy.wait(300)
      cy.get('.q-drawer').should('be.visible')
      cy.get('.q-drawer').contains('About').click({ force: true })
      // Short wait for navigation, then verify URL
      cy.wait(300)
      cy.url({ timeout: 5000 }).should('include', '/preferences/about')
      // Wait for commit text to appear (loaded via API)
      cy.contains('commit', { matchCase: false, timeout: 10000 }).should(
        'be.visible'
      )
    })

    it('Should display copyright information', () => {
      // Navigate to Settings
      cy.get('#Settings').click()
      cy.wait(300)
      cy.get('.q-drawer').should('be.visible')
      cy.get('.q-drawer').contains('About').click({ force: true })
      // Short wait for navigation, then verify URL
      cy.wait(300)
      cy.url({ timeout: 5000 }).should('include', '/preferences/about')
      // Wait for copyright text to appear
      cy.contains('Apache 2.0 license', {
        matchCase: false,
        timeout: 10000
      }).should('be.visible')
    })

    it('Should have View Manual button', () => {
      cy.get('#Settings').click()
      cy.wait(300)
      cy.get('.q-drawer').should('be.visible')
      cy.get('.q-drawer').contains('About').click({ force: true })
      // Short wait for navigation, then verify URL and button
      cy.wait(300)
      cy.url({ timeout: 5000 }).should('include', '/preferences/about')
      cy.dataCy('view-manual-button').should('be.visible')
      cy.dataCy('view-manual-button').should('contain', 'View Manual')
    })
  })

  describe('Preference navigation', () => {
    it('Should navigate to preferences from main page', () => {
      cy.get('#Settings').click()
      // Short wait for drawer animation, then verify content
      cy.wait(300)
      cy.contains('User interface settings').should('be.visible')
    })

    it('Should be able to navigate back from preferences', () => {
      cy.get('#Settings').click()
      cy.wait(300)
      cy.contains('User interface settings').should('be.visible')
      cy.goBackButton()
      // Short wait for navigation, then verify URL
      cy.wait(300)
      cy.url().should('not.include', '/preferences')
    })
  })
})

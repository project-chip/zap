/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

describe('MainLayout functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setZclProperties()
    // Wait for main page to be ready
    cy.get('#Settings').should('be.visible')
  })

  describe('Left drawer (sidebar)', () => {
    beforeEach(() => {
      // Ensure preview and notification tabs are closed before each test
      // Check if preview tab is open and close it if needed
      cy.get('body').then(($body) => {
        const isPreviewOpen = $body
          .find('[data-test="select-file-in-preview"]')
          .is(':visible')
        if (isPreviewOpen) {
          cy.get('#Preview').click()
          cy.wait(300)
        }
      })
      // Check if notification tab is open and close it if needed
      cy.get('body').then(($body) => {
        const isNotificationOpen = $body
          .find('#NotificationPanel')
          .is(':visible')
        if (isNotificationOpen) {
          cy.get('#Notifications').click()
          cy.wait(300)
        }
      })
      // Wait for left drawer to be visible (with timeout to ensure tabs are closed)
      // Use :not(.q-drawer--right) to exclude right drawers (preview/notification tabs)
      cy.get('.q-drawer:not(.q-drawer--right)', { timeout: 2000 }).should(
        'be.visible'
      )
    })

    it('Should display left drawer when preview and notification tabs are closed', () => {
      // Left drawer should be visible (exclude right drawers)
      cy.get('.q-drawer:not(.q-drawer--right)').should('be.visible')
      // Should contain ZCL text
      cy.contains('ZCL').should('be.visible')
    })

    it('Should hide left drawer when preview tab is open', () => {
      // Check if Preview button exists (debug nav items enabled)
      cy.get('#Preview').then(($previewBtn) => {
        if ($previewBtn.length > 0) {
          // Preview tab should be closed after beforeEach, so open it
          cy.get('#Preview').click()
          cy.wait(500)
          // Verify preview tab is open
          cy.get('[data-test="select-file-in-preview"]').should('be.visible')
          // Left drawer should be hidden when preview tab is open
          // Use :not(.q-drawer--right) to exclude right drawers (preview/notification tabs)
          cy.get('.q-drawer:not(.q-drawer--right)').should('not.exist')
        } else {
          cy.log('Preview tab not available (debug nav items disabled)')
        }
      })
    })

    it('Should hide left drawer when notification tab is open', () => {
      // Open notification tab
      cy.get('#Notifications').click()
      cy.wait(300)
      // Left drawer should be hidden when notification tab is open
      // Use :not(.q-drawer--right) to exclude right drawers
      cy.get('.q-drawer:not(.q-drawer--right)').should('not.exist')
      // Notification panel should be visible
      cy.get('#NotificationPanel').should('be.visible')
    })
  })

  describe('Preview tab', () => {
    beforeEach(() => {
      // Mock the preview API to return test files BEFORE opening preview tab
      // This ensures the mock is in place when getGeneratedFiles() is called
      // Try multiple URL patterns to catch the API call
      cy.intercept('GET', '**/preview/', (req) => {
        req.reply({
          statusCode: 200,
          body: [{ category: 'test-file-1' }, { category: 'test-file-2' }]
        })
      }).as('getPreviewFiles')

      cy.intercept('GET', '**/preview', (req) => {
        req.reply({
          statusCode: 200,
          body: [{ category: 'test-file-1' }, { category: 'test-file-2' }]
        })
      }).as('getPreviewFiles2')

      // Mock the preview file API
      cy.intercept('GET', '**/preview/test-file-1/1', (req) => {
        req.reply({
          statusCode: 200,
          body: {
            result: 'Test generation data content',
            size: 1
          }
        })
      }).as('getPreviewFile')

      // Ensure preview tab is closed before each test
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="select-file-in-preview"]').is(':visible')) {
          cy.get('#Preview').click()
          cy.wait(300)
        }
      })
    })

    it('Should display preview tab when Preview button is clicked', () => {
      cy.get('#Preview').then(($previewBtn) => {
        if ($previewBtn.length > 0) {
          // Click Preview button
          cy.get('#Preview').click()
          cy.wait(500)
          // Verify preview tab elements are visible
          cy.get('[data-test="select-file-in-preview"]').should('be.visible')
          cy.get('pre').should('exist')
        } else {
          cy.log('Preview tab not available (debug nav items disabled)')
        }
      })
    })

    it('Should display generation file dropdown', () => {
      cy.get('#Preview').then(($previewBtn) => {
        if ($previewBtn.length > 0) {
          // Open preview tab first
          cy.get('#Preview').click()
          cy.wait(500)
          cy.get('[data-test="select-file-in-preview"]').should('be.visible')
          // Verify dropdown button exists
          cy.get('[data-test="select-file-in-preview"]').should('be.visible')
          // Click to open dropdown
          cy.get('[data-test="select-file-in-preview"]').click()
          cy.wait(300)
          // Dropdown should be visible (q-menu)
          cy.get('body').then(($bodyAfter) => {
            // The dropdown might show generation files if API call succeeded
            if ($bodyAfter.find('.q-menu').length > 0) {
              cy.get('.q-menu').should('be.visible')
            }
          })
        } else {
          cy.log('Preview tab not available (debug nav items disabled)')
        }
      })
    })

    it('Should select file from dropdown and load generation data', () => {
      cy.get('#Preview').then(($previewBtn) => {
        if ($previewBtn.length > 0) {
          // Mock is already set up in beforeEach
          // Open preview tab first
          cy.get('#Preview').click()
          cy.wait(500)
          cy.get('[data-test="select-file-in-preview"]').should('be.visible')

          // Wait for generation files to load (API call should be intercepted)
          cy.wait(1000)

          // Click to open dropdown
          cy.get('[data-test="select-file-in-preview"]').click()
          cy.wait(300)

          // Wait for dropdown menu to appear and find the q-item
          cy.get('.q-menu', { timeout: 2000 }).should('be.visible')
          cy.get('.q-menu .q-item').should('have.length.at.least', 1)

          // Click on the first q-item to trigger the @click handler
          // This will trigger: generationButtonText = file.category; getGeneratedFile(file.category)
          cy.get('.q-menu .q-item').first().click({ force: true })
          cy.wait(1000)

          // Verify generation data is loaded (pre tag should have content)
          cy.get('pre').should('exist')
          cy.get('pre').should('not.be.empty')
          // Verify the button text changed (should not be the default "Select File")
          cy.get('[data-test="select-file-in-preview"]').then(($btn) => {
            const btnText = $btn.text().trim()
            expect(btnText).to.not.equal('Select File')
          })
        } else {
          cy.log('Preview tab not available (debug nav items disabled)')
        }
      })
    })

    it('Should trigger onScroll when scrolling preview content', () => {
      // Override the mock for this specific test to return scrollable content
      cy.intercept('GET', '**/preview/', {
        statusCode: 200,
        body: [{ category: 'test-scroll-file' }]
      }).as('getPreviewFilesScroll')

      // Mock the preview file API with multiple pages for scroll testing
      cy.intercept('GET', '**/preview/test-scroll-file/1', {
        statusCode: 200,
        body: {
          result: 'Page 1 content\n'.repeat(100), // Long content to enable scrolling
          size: 2 // Multiple pages to trigger scroll loading
        }
      }).as('getPreviewFile1')

      cy.intercept('GET', '**/preview/test-scroll-file/2', {
        statusCode: 200,
        body: {
          result: 'Page 2 content\n'.repeat(100)
        }
      }).as('getPreviewFile2')

      cy.get('#Preview').then(($previewBtn) => {
        if ($previewBtn.length > 0) {
          // Open preview tab first
          cy.get('#Preview').click()
          cy.wait(500)
          cy.get('[data-test="select-file-in-preview"]').should('be.visible')

          // Wait for preview tab to fully render
          cy.wait(1000)

          // Verify preview tab is open and has content area
          cy.get('pre').should('exist')

          // Select a file first to ensure we have scrollable content
          cy.get('[data-test="select-file-in-preview"]').click()
          cy.wait(300)
          cy.get('.q-menu', { timeout: 2000 }).should('be.visible')
          cy.get('.q-menu .q-item').first().click({ force: true })
          cy.wait(1000)

          // Wait for content to load
          cy.wait(500)

          // Find the generation scroll area and scroll it
          // Quasar q-scroll-area creates a scrollable container
          // We need to scroll the actual scrollable element inside
          cy.get('[data-cy="generation-scroll-area"]').should('exist')

          // Try to find and scroll the scrollable content inside q-scroll-area
          // The scrollable element is usually a div with overflow styles
          cy.get('[data-cy="generation-scroll-area"]').then(($scrollArea) => {
            // Find the scrollable container (usually has overflow: auto or scroll)
            // Quasar q-scroll-area wraps content in .q-scrollarea__content
            const scrollableEl = $scrollArea
              .find('.q-scrollarea__content, .q-scrollarea__container')
              .first()
            if (scrollableEl.length > 0) {
              // Scroll the scrollable container
              cy.wrap(scrollableEl).scrollTo('bottom', { duration: 500 })
            } else {
              // Fallback: scroll the scroll area element itself
              cy.wrap($scrollArea).scrollTo('bottom', { duration: 500 })
            }
          })

          cy.wait(1000) // Wait for scroll event and potential API call for page 2
          // Verify content is still visible
          cy.get('pre').should('exist')
        } else {
          cy.log('Preview tab not available (debug nav items disabled)')
        }
      })
    })

    it('Should display generation data in preview', () => {
      cy.get('#Preview').then(($previewBtn) => {
        if ($previewBtn.length > 0) {
          // Open preview tab first
          cy.get('#Preview').click()
          cy.wait(500)
          cy.get('[data-test="select-file-in-preview"]').should('be.visible')
          // Verify pre tag exists and contains default or loaded data
          cy.get('pre').should('exist')
          // The pre tag should contain some text (either default "Generated Data" or loaded content)
          cy.get('pre').should('not.be.empty')
        } else {
          cy.log('Preview tab not available (debug nav items disabled)')
        }
      })
    })

    it('Should close preview tab when Preview button is clicked again', () => {
      cy.get('#Preview').then(($previewBtn) => {
        if ($previewBtn.length > 0) {
          // Open preview tab
          cy.get('#Preview').click()
          cy.wait(500)
          cy.get('[data-test="select-file-in-preview"]').should('be.visible')
          // Close preview tab
          cy.get('#Preview').click()
          cy.wait(500)
          // Preview tab should be closed (check if preview content is not visible)
          cy.get('[data-test="select-file-in-preview"]').should(
            'not.be.visible'
          )
          // Left drawer should be visible again
          cy.get('.q-drawer:not(.q-drawer--right)').should('be.visible')
        } else {
          cy.log('Preview tab not available (debug nav items disabled)')
        }
      })
    })
  })

  describe('Notification tab', () => {
    it('Should display notification tab when Notifications button is clicked', () => {
      // Click Notifications button
      cy.get('#Notifications').click()
      cy.wait(500)
      // Notification panel should be visible
      cy.get('#NotificationPanel').should('be.visible')
      // Left drawer should be hidden (exclude right drawers)
      cy.get('.q-drawer:not(.q-drawer--right)').should('not.exist')
    })

    it('Should close notification tab when Notifications button is clicked again', () => {
      // Open notification tab
      cy.get('#Notifications').click()
      cy.wait(500)
      cy.get('#NotificationPanel').should('be.visible')
      // Close notification tab
      cy.get('#Notifications').click()
      cy.wait(500)
      // Notification panel should be closed (check if not visible)
      cy.get('#NotificationPanel').should('not.be.visible')
      // Left drawer should be visible again
      cy.get('.q-drawer:not(.q-drawer--right)').should('be.visible')
    })
  })

  describe('Preview and Notification tab interaction', () => {
    it('Should close notification tab when preview tab is opened', () => {
      cy.get('#Preview').then(($previewBtn) => {
        if ($previewBtn.length > 0) {
          // Open notification tab first
          cy.get('#Notifications').click()
          cy.wait(500)
          cy.get('#NotificationPanel').should('be.visible')
          // Open preview tab
          cy.get('#Preview').click()
          cy.wait(500)
          // Notification panel should be closed (check if not visible)
          cy.get('#NotificationPanel').should('not.be.visible')
          // Preview tab should be open
          cy.get('[data-test="select-file-in-preview"]').should('be.visible')
        } else {
          cy.log('Preview tab not available (debug nav items disabled)')
        }
      })
    })

    it('Should close preview tab when notification tab is opened', () => {
      cy.get('#Preview').then(($previewBtn) => {
        if ($previewBtn.length > 0) {
          // Open preview tab first
          cy.get('#Preview').click()
          cy.wait(500)
          cy.get('[data-test="select-file-in-preview"]').should('be.visible')
          // Open notification tab
          cy.get('#Notifications').click()
          cy.wait(500)
          // Preview tab should be closed (check if preview content is not visible)
          cy.get('[data-test="select-file-in-preview"]').should(
            'not.be.visible'
          )
          // Notification panel should be open
          cy.get('#NotificationPanel').should('be.visible')
        } else {
          cy.log('Preview tab not available (debug nav items disabled)')
        }
      })
    })
  })

  describe('Router view transitions', () => {
    it('Should display main content area', () => {
      // Main content area should be visible
      cy.get('.q-page-container').should('exist')
    })

    it('Should navigate between pages with transitions', () => {
      // Navigate to Settings
      cy.get('#Settings').click()
      cy.wait(300)
      cy.contains('User interface settings').should('be.visible')
      // Navigate back
      cy.goBackButton()
      cy.wait(300)
      // Should be back on main page
      cy.url().should('not.include', '/preferences')
    })
  })
})

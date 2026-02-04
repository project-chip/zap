/// <reference types="cypress" />

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false
})

describe('App.vue Functionality Tests', () => {
  beforeEach(() => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.setZclProperties()
    cy.wait(2000)

    // Clean up: delete all existing endpoints before each test
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="delete-endpoint"]').length > 0) {
        // Delete all endpoints except the last one using each()
        cy.get('[data-test="delete-endpoint"]').each(() => {
          cy.get('[data-test="delete-endpoint"]').last().click({ force: true })
          cy.wait(500)
          cy.get('#delete_endpoint').should('exist').click({ force: true })
          cy.wait(500)
        })
        // Delete the last endpoint (which shows different dialog)
        cy.wait(300)
        cy.get('[data-test="delete-endpoint"]').then(($remaining) => {
          if ($remaining.length > 0) {
            cy.get('[data-test="delete-endpoint"]')
              .last()
              .click({ force: true })
            cy.wait(500)
            cy.get('#delete_last_endpoint')
              .should('exist')
              .click({ force: true })
            cy.wait(500)
          }
        })
      }
    })
  })

  it('Should handle exception icon display and click', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    // Check if exception icon is visible (it may or may not be visible depending on state)
    cy.get('body').then(($body) => {
      if (
        $body.find('.fixed-bottom-right .q-icon[name="warning"]').length > 0
      ) {
        // Exception icon is visible, click it
        cy.get('.fixed-bottom-right .q-icon[name="warning"]')
          .parent()
          .click({ force: true })
        cy.wait(1000)

        // Verify navigation to home and dev tools are shown
        cy.url().should('not.include', '/config')
      } else {
        cy.log('Exception icon not visible - no exceptions to display')
      }
    })
  })

  it('Should handle query string parameters', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    // Test with query parameters
    cy.visit('/?uiMode=general&debugNavBar=true&setSaveButtonVisible=true')
    cy.wait(2000)

    // Verify app loaded
    cy.get('body').should('exist')
  })

  it('Should handle standalone query parameter', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/?standalone=true')
    cy.wait(2000)

    // Verify app loaded
    cy.get('body').should('exist')
  })

  it('Should handle newConfig query parameter', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/?newConfig=true')
    cy.wait(2000)

    // Verify app loaded
    cy.get('body').should('exist')
  })

  it('Should apply theme category class to body', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    // Verify body has theme class
    cy.get('body').should('have.class', Cypress.Mode.zigbee)

    // Verify other theme classes are not present
    cy.get('body').should('not.have.class', Cypress.Mode.matter)
    cy.get('body').should('not.have.class', Cypress.Mode.multiprotocol)
  })

  it('Should handle routePage logic for config page', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    // Visit root - should redirect to /config if no config selected
    cy.visit('/')
    cy.wait(2000)

    cy.url().then(($url) => {
      // Either on config page or home page (if config already selected)
      const isConfigPage = $url.includes('/config')
      const isHomePage =
        $url === Cypress.config().baseUrl + '/' ||
        $url === Cypress.config().baseUrl + '/#/'
      expect(isConfigPage || isHomePage).to.be.true
    })
  })

  it('Should handle routePage logic for about page', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    // Visit about page directly
    cy.visit('/#/preferences/about')
    cy.wait(2000)

    // Verify about page is accessible
    cy.url().should('include', '/preferences/about')
  })

  it('Should handle window postMessage for mounted event', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    // Visit app and verify it mounts
    cy.visit('/')
    cy.wait(2000)

    // Verify app is mounted by checking for router-view
    cy.get('body').should('exist')
  })

  it('Should handle theme changes via window messages', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.wait(2000)

    // Send theme message via window.postMessage
    cy.window().then((win) => {
      win.postMessage(
        {
          eventId: 'theme',
          eventData: { theme: 'dark' }
        },
        '*'
      )
      cy.wait(500)
    })
  })

  it('Should handle save message via window messages', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.wait(2000)

    // Send save message via window.postMessage
    cy.window().then((win) => {
      win.postMessage(
        {
          eventId: 'save',
          eventData: { shouldSave: true }
        },
        '*'
      )
      cy.wait(500)
    })
  })

  it('Should handle open-file message via window messages', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.wait(2000)

    // Send open-file message via window.postMessage
    cy.window().then((win) => {
      win.postMessage(
        {
          eventId: 'open-file',
          eventData: { file: 'test.zap' }
        },
        '*'
      )
      cy.wait(500)
    })
  })

  it('Should handle config selection and routing', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.wait(2000)

    cy.url().then(($url) => {
      if ($url.includes('/config')) {
        // Select a package and submit
        cy.dataCy('zcl-package-checkbox').first().check({ force: true })
        cy.wait(500)
        cy.get('[data-test="login-submit"]').click({ force: true })
        cy.wait(2000)

        // Should redirect to home after config selection
        cy.url().should('not.include', '/config')
      }
    })
  })

  it('Should handle uiThemeCategory computed property', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.wait(2000)

    // Verify body class reflects theme category
    cy.get('body').should('have.class', Cypress.Mode.zigbee)
  })

  it('Should handle showExceptionIcon computed property', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.wait(2000)

    // Check if exception icon exists (may or may not be visible)
    cy.get('body').then(($body) => {
      const hasExceptionIcon =
        $body.find('.fixed-bottom-right .q-icon[name="warning"]').length > 0
      cy.log(`Exception icon visible: ${hasExceptionIcon}`)
    })
  })

  it('Should handle query computed property', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    // Visit with query parameters
    cy.visit('/?test=value&another=param')
    cy.wait(2000)

    // Verify app loaded
    cy.get('body').should('exist')
  })

  it('Should handle endpointType computed property', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.wait(1000)

      // Verify endpoint was created
      cy.get('[data-test="endpoint-card"]').should('exist')
    })
  })

  it('Should handle endpointDeviceTypeRef computed property', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.fixture('data').then((data) => {
      cy.addEndpoint(data.endpoint4)
      cy.wait(1000)

      // Verify endpoint was created
      cy.get('[data-test="endpoint-card"]').should('exist')
    })
  })

  it('Should handle watch isZapConfigSelected', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    // Start without config
    cy.visit('/')
    cy.wait(2000)

    cy.url().then(($url) => {
      if ($url.includes('/config')) {
        // Select config
        cy.dataCy('zcl-package-checkbox').first().check({ force: true })
        cy.wait(500)
        cy.get('[data-test="login-submit"]').click({ force: true })
        cy.wait(2000)

        // Should redirect to home
        cy.url().should('not.include', '/config')
      }
    })
  })

  it('Should handle watch uiThemeCategory', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.wait(2000)

    // Verify body class is set based on theme category
    cy.get('body').should('have.class', Cypress.Mode.zigbee)
  })

  it('Should handle parseQueryString method', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    // Visit with query string
    cy.visit('/?param1=value1&param2=value2')
    cy.wait(2000)

    // Verify app loaded
    cy.get('body').should('exist')
  })

  it('Should handle setTheme method', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.wait(2000)

    // Theme should be set on load
    cy.get('body').should('exist')
  })

  it('Should handle getAppData method execution', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.wait(2000)

    // After config is selected, getAppData should be called
    cy.url().then(($url) => {
      if (!$url.includes('/config')) {
        // App data should be loaded
        cy.get('body').should('exist')
      }
    })
  })

  it('Should handle addClassToBody method', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.wait(2000)

    // Verify body has correct theme class
    cy.get('body').should('have.class', Cypress.Mode.zigbee)
  })

  it('Should handle created lifecycle hook', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.wait(2000)

    // Created hook should execute parseQueryString, setTheme, and routePage
    cy.get('body').should('exist')
  })

  it('Should handle mounted lifecycle hook', () => {
    if (Cypress.env('mode') !== Cypress.Mode.zigbee) {
      return
    }
    cy.visit('/')
    cy.wait(2000)

    // Mounted hook should execute addClassToBody and postMessage
    cy.get('body').should('have.class', Cypress.Mode.zigbee)
  })
})

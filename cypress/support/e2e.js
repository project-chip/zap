// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')
import '@cypress/code-coverage/support'

// Collect coverage from window object
Cypress.on('window:before:load', (win) => {
  if (win.__coverage__) {
    // Coverage data is available
    console.log('Coverage data found on window object')
  }
})

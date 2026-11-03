/**
 * Internal application API. Transport adapters should depend on these domain
 * services rather than dispatching configuration operations themselves.
 */

exports.configuration = require('./configuration.js')

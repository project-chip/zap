/**
 * Adapts GUI REST requests to the same configuration operations used by the
 * CLI. The REST handlers keep their existing HTTP payloads; only the mutation
 * implementation is shared.
 */

const operationRunner = require('../util/operation-runner.js')

/**
 * Runs one configuration operation for the active GUI session.
 *
 * @param {*} db
 * @param {*} request
 * @param {string} name
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
function execute(db, request, name, params) {
  return operationRunner.execute(
    {
      db: db,
      sessionId: request.zapSessionId,
      category: null,
      studioIntegration: false,
      logger: () => {}
    },
    name,
    params
  )
}

exports.execute = execute

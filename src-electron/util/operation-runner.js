/**
 * Applies shared post-edit reconciliation after each operation. The CLI and
 * post-load scripts use this runner so a sequence of edits has the same
 * intermediate and final state across both callers.
 *
 * @module Configuration API: operation runner
 */

const operations = require('../operations.js')

/** Applies shared-state reconciliation and notifies an optional caller. */
async function reconcile(ctx, outcome, onSharedState) {
  if (outcome.changed) {
    let shared = await operations.unifySharedClusterStates(ctx)
    if (shared.applied && typeof onSharedState === 'function') {
      onSharedState(shared)
    }
  }
  return outcome
}

/**
 * Runs one named configuration operation and applies shared-state policy.
 *
 * @param {*} ctx
 * @param {string} name
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function execute(ctx, name, params, onSharedState) {
  return reconcile(
    ctx,
    await operations.execute(ctx, name, params),
    onSharedState
  )
}

/**
 * Creates the standard root node endpoint and applies shared-state policy.
 *
 * @param {*} ctx
 * @returns {Promise<*>} operation result
 */
async function createRootNode(ctx, onSharedState) {
  return reconcile(ctx, await operations.createRootNode(ctx), onSharedState)
}

exports.execute = execute
exports.createRootNode = createRootNode

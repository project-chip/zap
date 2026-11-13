/**
 * Applies shared post-edit reconciliation after each operation. The CLI uses
 * this runner, where every operation is a complete edit. Post-load scripts
 * apply a batch and reconcile once at the end, and the user interface writes
 * to every shared endpoint type itself; both go through
 * `configuration.executeOperation` instead.
 *
 * @module Configuration API: operation runner
 */

const operations = require('./operations/index.js')
const endpointOps = require('./operations/endpoint.js')
const sharedClusterState = require('./shared-cluster-state.js')

/** Applies shared-state reconciliation and notifies an optional caller. */
async function reconcile(ctx, outcome, onSharedState) {
  if (outcome.changed) {
    let shared = await sharedClusterState.unifySharedClusterStates(ctx)
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
  return reconcile(ctx, await endpointOps.createRootNode(ctx), onSharedState)
}

exports.execute = execute
exports.createRootNode = createRootNode

/**
 * This is an example of an external addon helper for templates.
 */
async function test_external_addon_helper() {
  return 'This is example of test external addon helper.'
}

/**
 * Helper function to get the total number of available events.
 * @param {object} api - The API object.
 * @returns {number} - The total number of events.
 */
async function test_external_addon_all_events_helper(context, api) {
  let events = await api.availableEvents(context)
  let totalEvents = events.length
  return totalEvents
}

/**
 * Helper function to get the total number of available attributes.
 * @param {object} api - The API object.
 * @returns {number} - The total number of attributes.
 */
async function test_external_addon_all_attributes_helper(context, api) {
  let attributes = await api.availableAttributes(context)
  let totalAttributes = attributes.length
  return totalAttributes
}

/**
 * Helper function to get the total number of available commands.
 * @param {object} api - The API object.
 * @returns {number} - The total number of commands.
 */
async function test_external_addon_all_commands_helper(context, api) {
  let commands = await api.availableCommands(context)
  let totalCommands = commands.length
  return totalCommands
}

/**
 * Helper function to get the total number of available clusters.
 * @param {object} api - The API object.
 * @returns {number} - The total number of clusters.
 */
async function test_external_addon_all_clusters_helper(context, api) {
  let clusters = await api.availableClusters(context)
  let totalClusters = clusters.length
  return totalClusters
}

/**
 * This function initializes helper functions by registering them with the helperRegister.
 * @param {Object} helperRegister - The object responsible for registering helper functions.
 * @param {Object} context - The context object that will be passed to each helper function.
 */
function initialize_helpers(helperRegister, context) {
  // Register the 'test_external_addon_helper' function
  helperRegister.registerHelpers(
    'test_external_addon_helper',
    test_external_addon_helper,
    context,
  )

  // Register the 'test_external_addon_all_events_helper' function
  helperRegister.registerHelpers(
    'test_external_addon_all_events_helper',
    test_external_addon_all_events_helper,
    context,
  )

  // Register the 'test_external_addon_all_attributes_helper' function
  helperRegister.registerHelpers(
    'test_external_addon_all_attributes_helper',
    test_external_addon_all_attributes_helper,
    context,
  )

  // Register the 'test_external_addon_all_commands_helper' function
  helperRegister.registerHelpers(
    'test_external_addon_all_commands_helper',
    test_external_addon_all_commands_helper,
    context,
  )

  // Register the 'test_external_addon_all_clusters_helper' function
  helperRegister.registerHelpers(
    'test_external_addon_all_clusters_helper',
    test_external_addon_all_clusters_helper,
    context,
  )
}

exports.initialize_helpers = initialize_helpers

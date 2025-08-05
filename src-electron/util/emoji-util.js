/**
 * Simple emoji utility that works without module system changes
 * Uses environment variable to control emoji output
 */

// Check for NO_EMOJI environment variable or command line flag
const shouldDisableEmoji =
  process.env.NO_EMOJI === '1' ||
  process.argv.includes('--no-emoji') ||
  process.argv.includes('--noEmoji')

/**
 * Format a message with emoji if enabled, without if disabled.
 * @param {string} emoji - the emoji character
 * @param {string} message - the text message
 * @returns {string} formatted message
 */
function formatMessage(emoji, message) {
  if (shouldDisableEmoji) {
    return message
  }
  return `${emoji} ${message}`
}

module.exports = {
  formatMessage,
  isEmojiDisabled: () => shouldDisableEmoji
}

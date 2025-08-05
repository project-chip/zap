/**
 * Simple emoji utility that works without module system changes
 * Uses environment variable to control emoji output
 */

// State for emoji control - can be overridden for testing
let emojiDisabled = null

/**
 * Check if emojis should be disabled
 * @returns {boolean} true if emojis should be disabled
 */
function isEmojiDisabled() {
  // If explicitly set (for testing), use that value
  if (emojiDisabled !== null) {
    return emojiDisabled
  }

  // Otherwise check environment and command line
  return (
    process.env.NO_EMOJI === '1' ||
    process.argv.includes('--no-emoji') ||
    process.argv.includes('--noEmoji')
  )
}

/**
 * Set emoji disabled state (mainly for testing)
 * @param {boolean} disabled - whether to disable emojis
 */
function setEmojiDisabled(disabled) {
  emojiDisabled = disabled
}

/**
 * Reset emoji state to use environment/command line detection
 */
function resetEmojiState() {
  emojiDisabled = null
}

module.exports = {
  isEmojiDisabled,
  setEmojiDisabled,
  resetEmojiState
}

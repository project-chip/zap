#!/usr/bin/env node

// Simple demonstration of --no-emoji functionality
// This shows how the feature would work in ZAP

let noEmoji = false

// Set emoji preference
function setNoEmoji(disabled) {
  noEmoji = disabled
}

// Format a message with emoji if enabled, without if disabled
function formatMessage(emoji, message) {
  if (noEmoji) {
    return message
  }
  return `${emoji} ${message}`
}

// Parse command line arguments
const args = process.argv.slice(2)
const hasNoEmoji = args.includes('--no-emoji')

if (hasNoEmoji) {
  setNoEmoji(true)
}

// Demo output
console.log('ZAP Demo: Emoji Output Control')
console.log('=================================')
console.log(formatMessage('🚀', 'Starting ZAP application'))
console.log(formatMessage('🔍', 'Loading ZCL metadata'))
console.log(formatMessage('✅', 'Templates loaded successfully'))
console.log(formatMessage('⚠️', 'Warning: Development mode detected'))
console.log(formatMessage('👍', 'Generation completed'))
console.log('=================================')

if (hasNoEmoji) {
  console.log('✓ --no-emoji option was used - emojis disabled')
} else {
  console.log('Run with --no-emoji to disable emoji output')
}

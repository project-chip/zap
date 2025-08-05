#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Read the file
const filePath = process.argv[2] || 'src-electron/main-process/startup.js'
let content = fs.readFileSync(filePath, 'utf8')

// Define emoji patterns and their replacements
const patterns = [
  // Fix broken syntax first
  {
    regex: /logger\(env\.formatMessage\('([^']+)', `([^`]+)`\)\s*$/gm,
    replacement: "logger(env.formatMessage('$1', `$2`))"
  },
  {
    regex: /logger\(env\.formatMessage\('([^']+)', '([^']+)'\)\s*$/gm,
    replacement: "logger(env.formatMessage('$1', '$2'))"
  },
  // Handle remaining hardcoded emojis
  {
    regex: /logger\('([^']*[🐝🤖😎⚠️👎🔍👉][^']*)'\)/g,
    replacement: (match, content) => {
      // Extract emoji and text
      const emojiMatch = content.match(/([🐝🤖😎⚠️👎🔍👉])/)
      if (emojiMatch) {
        const emoji = emojiMatch[1]
        const text = content.replace(emoji, '').trim()
        return `logger(env.formatMessage('${emoji}', '${text}'))`
      }
      return match
    }
  },
  {
    regex: /logger\(`([^`]*[🐝🤖😎⚠️👎🔍👉][^`]*)`\)/g,
    replacement: (match, content) => {
      // Extract emoji and text
      const emojiMatch = content.match(/([🐝🤖😎⚠️👎🔍👉])/)
      if (emojiMatch) {
        const emoji = emojiMatch[1]
        const text = content.replace(emoji, '').trim()
        return `logger(env.formatMessage('${emoji}', \`${text}\`))`
      }
      return match
    }
  }
]

// Apply each pattern
patterns.forEach((pattern) => {
  if (typeof pattern.replacement === 'string') {
    content = content.replace(pattern.regex, pattern.replacement)
  } else {
    content = content.replace(pattern.regex, pattern.replacement)
  }
})

// Write back
fs.writeFileSync(filePath, content)
console.log(`Fixed emojis in ${filePath}`)

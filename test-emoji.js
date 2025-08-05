const emojiUtil = require('./src-electron/util/emoji-util')

console.log('Testing emoji functionality:')
console.log('1. With emoji (default):')
console.log(emojiUtil.formatMessage('🚀', 'Starting application'))
console.log(emojiUtil.formatMessage('✅', 'Success'))
console.log(emojiUtil.formatMessage('⚠️', 'Warning message'))

console.log('\n2. Without emoji (--no-emoji):')
emojiUtil.setEmojiDisabled(true)
console.log(emojiUtil.formatMessage('🚀', 'Starting application'))
console.log(emojiUtil.formatMessage('✅', 'Success'))
console.log(emojiUtil.formatMessage('⚠️', 'Warning message'))

console.log('\n3. Back to emoji:')
emojiUtil.setEmojiDisabled(false)
console.log(emojiUtil.formatMessage('🚀', 'Starting application'))

console.log('\n4. Reset to environment detection:')
emojiUtil.resetEmojiState()
console.log(emojiUtil.formatMessage('🔄', 'Reset complete'))

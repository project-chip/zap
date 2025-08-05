const env = require('./src-electron/util/env')

console.log('Testing emoji functionality:')
console.log('1. With emoji (default):')
console.log(env.formatMessage('🚀', 'Starting application'))
console.log(env.formatMessage('✅', 'Success'))
console.log(env.formatMessage('⚠️', 'Warning message'))

console.log('\n2. Without emoji (--no-emoji):')
env.setNoEmoji(true)
console.log(env.formatMessage('🚀', 'Starting application'))
console.log(env.formatMessage('✅', 'Success'))
console.log(env.formatMessage('⚠️', 'Warning message'))

console.log('\n3. Back to emoji:')
env.setNoEmoji(false)
console.log(env.formatMessage('🚀', 'Starting application'))

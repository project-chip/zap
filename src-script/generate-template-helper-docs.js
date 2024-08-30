const { execSync } = require('child_process')

try {
  // Run jsdoc2md directly
  execSync('npx jsdoc2md src-electron/generator/helper*.js > docs/helpers.md', {
    stdio: 'inherit'
  })
  console.log('Handlebar template API documentation generated successfully.')
} catch (error) {
  console.error(
    'Failed to generate Handlebar template API documentation:',
    error.message
  )
  throw error
}

const { execSync } = require('child_process')

try {
  // Run jsdoc2md directly
  execSync(
    'npx jsdoc2md src-shared/**/*.js src-electron/**/*.js > docs/api.md',
    { stdio: 'inherit' }
  )
  console.log('API documentation generated successfully.')
} catch (error) {
  console.error('Failed to generate API documentation:', error.message)
  throw error
}

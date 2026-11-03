/* eslint-disable */
module.exports = (api) => {
  const envOptions = {}

  // Options scaffolded by Quasar out of the box
  if (api.caller((caller) => caller && caller.target === 'node')) {
    envOptions.targets = { node: 'current' }
  }

  // Only used in test environment in JS codebases
  if (api.env() === 'test') {
    envOptions.modules = 'commonjs'
    envOptions.targets = { node: 'current' }
  }

  return {
    presets: [
      ['@quasar/babel-preset-app', envOptions],
      '@babel/preset-typescript'
    ],
    plugins: [
      // Cypress CI sets both NODE_ENV=test and CYPRESS_COVERAGE. Add the
      // instrumentation plugin once when either coverage mode is active.
      (process.env.NODE_ENV === 'test' || process.env.CYPRESS_COVERAGE) &&
        'istanbul'
    ].filter(Boolean)
  }
}

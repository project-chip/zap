/**
 * Central definition of test "mode" strings.
 *
 * Cypress runs these in a bundled browser environment, so keep it lightweight
 * and colocated under `cypress/support/`.
 */
export const Mode = Object.freeze({
  zigbee: 'zigbee',
  matter: 'matter',
  multiprotocol: 'multiprotocol'
})

export const ModeValues = Object.freeze(Object.values(Mode))

// eslint-disable-next-line require-jsdoc
export function isValidMode(mode) {
  return ModeValues.includes(mode)
}

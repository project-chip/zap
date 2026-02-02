# Cypress Test Organization

This directory contains end-to-end tests for ZAP, organized by test mode (zigbee, matter, multiprotocol).

## Directory Structure

```
cypress/
├── e2e/
│   ├── common/          # Tests that work across all modes
│   ├── zigbee/          # Zigbee-specific tests
│   ├── matter/          # Matter-specific tests
├── multiprotocolFixtures/         # Test fixtures for Muliprotocol mode
│   └── [other folders]  # Legacy tests (still supported for backward compatibility)
├── fixtures/            # Test fixtures for Zigbee mode
├── matterFixtures/      # Test fixtures for Matter mode
├── mmultiprotocolFixtures/         # Test fixtures for Muliprotocol mode
└── support/             # Cypress support files (commands, etc.)
```

## Running Tests

Tests are automatically filtered based on the mode specified when running:

- **Zigbee tests**: `npm run test:e2e` or `npm run test:e2e-ci`
- **Matter tests**: `npm run test:e2e-matter` or `npm run test:e2e-matter-ci`
- **Multiprotocol tests**: `npm run test:e2e-multiprotocol` or `npm run test:e2e-multiprotocol-ci`

## Test Organization

### Mode-Specific Tests

Tests that are specific to a particular mode should be placed in the corresponding folder:

- `cypress/e2e/zigbee/` - Zigbee-only tests
- `cypress/e2e/matter/` - Matter-only tests
- `cypress/e2e/multiprotocol/` - Multiprotocol-only tests

### Common Tests

Tests that work across all modes should be placed in:

- `cypress/e2e/common/` - Shared tests for all modes

### Legacy Tests

Tests in the root `cypress/e2e/` folder (outside of organized folders) are still supported for backward compatibility. These tests will run for all modes unless they have explicit mode checks.

## Fixtures

Each mode has its own fixture folder:

- `cypress/fixtures/data.json` - Zigbee test data
- `cypress/matterFixtures/data.json` - Matter test data
- `cypress/multiprotocolFixtures/data.json` - Multiprotocol test data

The appropriate fixture folder is automatically selected based on the test mode.

## Writing Mode-Specific Tests

If you need to write a test that only runs in a specific mode, you can:

1. **Place it in the mode-specific folder** (recommended):

   - Put Matter tests in `cypress/e2e/matter/`
   - Put Zigbee tests in `cypress/e2e/zigbee/`
   - Put Multiprotocol tests in `cypress/e2e/multiprotocol/`

2. **Use mode checks in the test** (for legacy tests):
   ```javascript
   if (Cypress.env('mode') !== 'matter') {
     return // Skip test
   }
   ```

## Configuration

The test filtering is configured in `cypress.config.js` using the `mode` environment variable, which is set by `src-script/zap-uitest.js` when running tests.

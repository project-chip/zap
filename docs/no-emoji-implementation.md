# No Emoji Option Implementation

## Overview

Added `--no-emoji` command line option and `NO_EMOJI` environment variable to ZAP to disable emoji characters in console output. This resolves issues with stdout when piping output to systems that don't support the character set.

## Problem

- Emojis in stdout output were causing issues when piping to systems without proper character set support
- The emojis resulted in python choking on output parsing
- Need for clean text-only output for automation and scripting

## Solution

- Added `--no-emoji` command line option and `NO_EMOJI` environment variable
- Implemented `formatMessage()` utility function that conditionally includes emojis
- Updated all major ZAP scripts to use the new formatting function

## Implementation Details

### Control Methods

**Command Line Option:**
```bash
--no-emoji    Disable emoji characters in console output.
```

**Environment Variable:**
```bash
NO_EMOJI=1    Disable emoji characters via environment variable.
```

### Core Functions (emoji-util.js)

- `formatMessage(emoji, message)` - Formats output with or without emoji based on current settings
- `isEmojiDisabled()` - Returns true if emojis should be disabled
- `setEmojiDisabled(disabled)` - Sets emoji state (mainly for testing)
- `resetEmojiState()` - Resets to environment/command line detection

### Detection Logic

The emoji utility checks in this order:
1. **Explicit test state** (if set via `setEmojiDisabled()`)
2. **Environment variable** (`NO_EMOJI=1`)
3. **Command line flags** (`--no-emoji` or `--noEmoji`)
4. **Default**: Emojis enabled

### Usage Examples

```bash
# With emojis (default)
node src-script/zap-start.js --version

# Without emojis - command line flag
node src-script/zap-start.js --version --no-emoji

# Without emojis - environment variable
NO_EMOJI=1 node src-script/zap-start.js --version

# For CI/CD pipelines
export NO_EMOJI=1
./run-zap-automation.sh
```

## Files Modified

- `src-electron/util/emoji-util.js` - Core emoji control utility (NEW)
- `src-electron/util/env.js` - Added emoji wrapper functions for ES6 compatibility
- `src-electron/main-process/args.js` - Added command line option
- `src-electron/main-process/startup.js` - Updated all emoji output messages
- `src-script/script-util.js` - Updated script execution messages
- `src-script/gsdk-public-regen.js` - Updated GSDK generation messages
- `src-script/zap-package-metadata.js` - Updated package metadata messages
- `src-script/zap-start.js` - Updated launcher messages
- `src-script/zap-uitest.js` - Updated test execution messages

## Testing

- Created test script `test-emoji.js` to demonstrate functionality
- Verified that `--no-emoji` flag properly disables all emoji output
- Verified that `NO_EMOJI=1` environment variable properly disables all emoji output
- Confirmed backward compatibility (emojis enabled by default)
- Tested stateful behavior for unit testing scenarios

## Expected Result

- Clean stdout output without emoji characters when `--no-emoji` is used or `NO_EMOJI=1` is set
- Improved compatibility with automation tools and character-set-limited environments
- Maintaining existing emoji output for enhanced user experience by default
- Comprehensive coverage across all ZAP console output

# No Emoji Option Implementation

## Overview

Added `--no-emoji` command line option to ZAP to disable emoji characters in console output. This resolves issues with stdout when piping output to systems that don't support the character set.

## Problem

- Emojis in stdout output were causing issues when piping to systems without proper character set support
- The emojis resulted in python choking on output parsing
- Need for clean text-only output for automation and scripting

## Solution

- Added `--no-emoji` command line option
- Implemented `formatMessage()` utility function that conditionally includes emojis
- Updated key output locations to use the new formatting function

## Implementation Details

### Command Line Option

```bash
--no-emoji    Disable emoji characters in console output.
```

### Core Functions

- `setNoEmoji(disabled)` - Sets global emoji preference
- `getNoEmoji()` - Gets current emoji preference
- `formatMessage(emoji, message)` - Formats output with or without emoji

### Usage Examples

```bash
# With emojis (default)
zap generate input.zap --output ./generated

# Without emojis
zap generate input.zap --output ./generated --no-emoji
```

## Files Modified

- `src-electron/util/args.js` - Added command line option
- `src-electron/util/env.js` - Added emoji control functions
- `src-electron/main-process/startup.js` - Updated key output messages
- `src-script/script-util.js` - Updated script execution messages

## Testing

- Created demo script `demo-no-emoji.js` to demonstrate functionality
- Verified that `--no-emoji` flag properly disables all emoji output
- Confirmed backward compatibility (emojis enabled by default)

## Expected Result

- Clean stdout output without emoji characters when `--no-emoji` is used
- Improved compatibility with automation tools and character-set-limited environments
- Maintaining existing emoji output for enhanced user experience by default

const emojiUtil = require('../src-electron/util/emoji-util')
const env = require('../src-electron/util/env')

describe('Emoji Utility Tests', () => {
  beforeEach(() => {
    // Reset emoji state before each test
    emojiUtil.resetEmojiState()
  })

  test('formatMessage with emoji enabled (default)', () => {
    const result1 = env.formatEmojiMessage('🚀', 'Starting application')
    const result2 = env.formatEmojiMessage('✅', 'Success')
    const result3 = env.formatEmojiMessage('⚠️', 'Warning message')

    expect(result1).toBe('🚀 Starting application')
    expect(result2).toBe('✅ Success')
    expect(result3).toBe('⚠️ Warning message')
  })

  test('formatMessage with emoji disabled', () => {
    emojiUtil.setEmojiDisabled(true)

    const result1 = env.formatEmojiMessage('🚀', 'Starting application')
    const result2 = env.formatEmojiMessage('✅', 'Success')
    const result3 = env.formatEmojiMessage('⚠️', 'Warning message')

    expect(result1).toBe('Starting application')
    expect(result2).toBe('Success')
    expect(result3).toBe('Warning message')
  })

  test('formatMessage with emoji re-enabled', () => {
    emojiUtil.setEmojiDisabled(true)
    emojiUtil.setEmojiDisabled(false)

    const result = env.formatEmojiMessage('🚀', 'Starting application')
    expect(result).toBe('🚀 Starting application')
  })

  test('emoji state reset functionality', () => {
    emojiUtil.setEmojiDisabled(true)
    emojiUtil.resetEmojiState()

    const result = env.formatEmojiMessage('🔄', 'Reset complete')
    expect(result).toBe('🔄 Reset complete')
  })

  test('isEmojiDisabled function states', () => {
    // Default state (should be false unless NO_EMOJI env var is set)
    expect(emojiUtil.isEmojiDisabled()).toBe(false)

    // Explicitly disabled
    emojiUtil.setEmojiDisabled(true)
    expect(emojiUtil.isEmojiDisabled()).toBe(true)

    // Explicitly enabled
    emojiUtil.setEmojiDisabled(false)
    expect(emojiUtil.isEmojiDisabled()).toBe(false)

    // Reset to environment detection
    emojiUtil.resetEmojiState()
    expect(emojiUtil.isEmojiDisabled()).toBe(false)
  })

  test('NO_EMOJI environment variable detection', () => {
    const originalEnv = process.env.NO_EMOJI
    const originalArgv = process.argv

    try {
      // Set NO_EMOJI environment variable
      process.env.NO_EMOJI = '1'
      emojiUtil.resetEmojiState()

      expect(emojiUtil.isEmojiDisabled()).toBe(true)
      expect(env.formatEmojiMessage('🚀', 'Test message')).toBe('Test message')

      // Unset NO_EMOJI
      delete process.env.NO_EMOJI
      emojiUtil.resetEmojiState()

      expect(emojiUtil.isEmojiDisabled()).toBe(false)
      expect(env.formatEmojiMessage('🚀', 'Test message')).toBe(
        '🚀 Test message'
      )
    } finally {
      // Restore original state
      if (originalEnv) {
        process.env.NO_EMOJI = originalEnv
      } else {
        delete process.env.NO_EMOJI
      }
      process.argv = originalArgv
      emojiUtil.resetEmojiState()
    }
  })

  test('--no-emoji command line argument detection', () => {
    const originalArgv = process.argv
    const originalEnv = process.env.NO_EMOJI

    try {
      // Remove NO_EMOJI env var if it exists
      delete process.env.NO_EMOJI

      // Test with --no-emoji flag
      process.argv = ['node', 'script.js', '--no-emoji']
      emojiUtil.resetEmojiState()

      expect(emojiUtil.isEmojiDisabled()).toBe(true)
      expect(env.formatEmojiMessage('✅', 'Success')).toBe('Success')

      // Test without flag
      process.argv = ['node', 'script.js']
      emojiUtil.resetEmojiState()

      expect(emojiUtil.isEmojiDisabled()).toBe(false)
      expect(env.formatEmojiMessage('✅', 'Success')).toBe('✅ Success')
    } finally {
      // Restore original state
      process.argv = originalArgv
      if (originalEnv) {
        process.env.NO_EMOJI = originalEnv
      } else {
        delete process.env.NO_EMOJI
      }
      emojiUtil.resetEmojiState()
    }
  })

  test('--noEmoji command line argument detection', () => {
    const originalArgv = process.argv
    const originalEnv = process.env.NO_EMOJI

    try {
      // Remove NO_EMOJI env var if it exists
      delete process.env.NO_EMOJI

      // Test with --noEmoji flag
      process.argv = ['node', 'script.js', '--noEmoji']
      emojiUtil.resetEmojiState()

      expect(emojiUtil.isEmojiDisabled()).toBe(true)
      expect(env.formatEmojiMessage('⚠️', 'Warning')).toBe('Warning')

      // Test without flag
      process.argv = ['node', 'script.js']
      emojiUtil.resetEmojiState()

      expect(emojiUtil.isEmojiDisabled()).toBe(false)
      expect(env.formatEmojiMessage('⚠️', 'Warning')).toBe('⚠️ Warning')
    } finally {
      // Restore original state
      process.argv = originalArgv
      if (originalEnv) {
        process.env.NO_EMOJI = originalEnv
      } else {
        delete process.env.NO_EMOJI
      }
      emojiUtil.resetEmojiState()
    }
  })

  test('formatEmojiMessage with various emojis', () => {
    emojiUtil.setEmojiDisabled(false)

    expect(env.formatEmojiMessage('🚀', 'Starting')).toBe('🚀 Starting')
    expect(env.formatEmojiMessage('✅', 'Success')).toBe('✅ Success')
    expect(env.formatEmojiMessage('⚠️', 'Warning')).toBe('⚠️ Warning')
    expect(env.formatEmojiMessage('⛔', 'Error')).toBe('⛔ Error')
    expect(env.formatEmojiMessage('🔧', 'Config')).toBe('🔧 Config')
    expect(env.formatEmojiMessage('😎', 'Done')).toBe('😎 Done')
    expect(env.formatEmojiMessage('🤖', 'Robot')).toBe('🤖 Robot')
    expect(env.formatEmojiMessage('🐝', 'Bee')).toBe('🐝 Bee')
    expect(env.formatEmojiMessage('👈', 'Left')).toBe('👈 Left')
    expect(env.formatEmojiMessage('👉', 'Right')).toBe('👉 Right')
    expect(env.formatEmojiMessage('🔍', 'Search')).toBe('🔍 Search')
    expect(env.formatEmojiMessage('🎉', 'Celebrate')).toBe('🎉 Celebrate')
    expect(env.formatEmojiMessage('👍', 'Thumbs up')).toBe('👍 Thumbs up')
    expect(env.formatEmojiMessage('🔄', 'Reset')).toBe('🔄 Reset')
    expect(env.formatEmojiMessage('✍', 'Write')).toBe('✍ Write')
    expect(env.formatEmojiMessage('👎', 'Thumbs down')).toBe('👎 Thumbs down')
    expect(env.formatEmojiMessage('🕐', 'Time')).toBe('🕐 Time')

    emojiUtil.setEmojiDisabled(true)

    expect(env.formatEmojiMessage('🚀', 'Starting')).toBe('Starting')
    expect(env.formatEmojiMessage('✅', 'Success')).toBe('Success')
    expect(env.formatEmojiMessage('⚠️', 'Warning')).toBe('Warning')
    expect(env.formatEmojiMessage('⛔', 'Error')).toBe('Error')
  })

  test('formatEmojiMessage with empty message', () => {
    emojiUtil.setEmojiDisabled(false)
    expect(env.formatEmojiMessage('🚀', '')).toBe('🚀 ')

    emojiUtil.setEmojiDisabled(true)
    expect(env.formatEmojiMessage('🚀', '')).toBe('')
  })

  test('formatEmojiMessage with multiline message', () => {
    emojiUtil.setEmojiDisabled(false)
    const multiline = 'Line 1\nLine 2\nLine 3'
    expect(env.formatEmojiMessage('🚀', multiline)).toBe(`🚀 ${multiline}`)

    emojiUtil.setEmojiDisabled(true)
    expect(env.formatEmojiMessage('🚀', multiline)).toBe(multiline)
  })

  test('explicit setEmojiDisabled overrides environment', () => {
    const originalEnv = process.env.NO_EMOJI
    const originalArgv = process.argv

    try {
      // Set environment to disable emojis
      process.env.NO_EMOJI = '1'
      process.argv = ['node', 'script.js', '--no-emoji']
      emojiUtil.resetEmojiState()

      expect(emojiUtil.isEmojiDisabled()).toBe(true)

      // Explicitly enable should override
      emojiUtil.setEmojiDisabled(false)
      expect(emojiUtil.isEmojiDisabled()).toBe(false)
      expect(env.formatEmojiMessage('🚀', 'Test')).toBe('🚀 Test')

      // Explicitly disable should override
      emojiUtil.setEmojiDisabled(true)
      expect(emojiUtil.isEmojiDisabled()).toBe(true)
      expect(env.formatEmojiMessage('🚀', 'Test')).toBe('Test')
    } finally {
      if (originalEnv) {
        process.env.NO_EMOJI = originalEnv
      } else {
        delete process.env.NO_EMOJI
      }
      process.argv = originalArgv
      emojiUtil.resetEmojiState()
    }
  })

  test('log function alert property respects no-emoji setting', () => {
    try {
      // Test with emojis enabled
      emojiUtil.setEmojiDisabled(false)
      const testError1 = new Error('Test error 1')
      env.logError('Test message', testError1)
      expect(testError1.alert).toBe('⛔')

      // Test with emojis disabled
      emojiUtil.setEmojiDisabled(true)
      const testError2 = new Error('Test error 2')
      env.logError('Test message', testError2)
      expect(testError2.alert).toBe('')
    } finally {
      emojiUtil.resetEmojiState()
    }
  })
})

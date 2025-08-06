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
})
